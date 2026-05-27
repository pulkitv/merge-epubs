const MODULE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = 'https://pcyjafpopnjtjqaelycy.supabase.co';
const BUCKET = 'article-content';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Byte-identical port of the extension's simpleHash (background.js:393-400).
// Used here as the source of truth — the client's content_hash is ignored.
function simpleHash(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
        hash |= 0;
    }
    return (hash >>> 0).toString(16);
}

async function readJsonBody(req) {
    if (req.body && typeof req.body === 'object') return req.body;
    if (typeof req.body === 'string') {
        try { return JSON.parse(req.body); } catch { return null; }
    }
    return new Promise((resolve) => {
        let raw = '';
        req.on('data', (c) => { raw += c; });
        req.on('end', () => {
            if (!raw) return resolve({});
            try { resolve(JSON.parse(raw)); } catch { resolve(null); }
        });
        req.on('error', () => resolve(null));
    });
}

async function verifyGoogleIdToken(idToken) {
    const resp = await fetch(
        'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken)
    );
    if (!resp.ok) return null;
    const info = await resp.json();
    return info.sub || null;
}

function authHeaders(secret, extra) {
    return {
        apikey: secret,
        Authorization: 'Bearer ' + secret,
        ...(extra || {})
    };
}

function encodePath(p) {
    return p.split('/').map(encodeURIComponent).join('/');
}

async function uploadToStorage(secret, path, html) {
    const url = SUPABASE_URL + '/storage/v1/object/' + BUCKET + '/' + encodePath(path);
    return fetch(url, {
        method: 'POST',
        headers: authHeaders(secret, {
            'Content-Type': 'text/html',
            'x-upsert': 'true'
        }),
        body: html
    });
}

async function hasVersionOneRow(secret, articleId, googleUid) {
    const url = SUPABASE_URL + '/rest/v1/article_versions'
        + '?article_id=eq.' + encodeURIComponent(articleId)
        + '&google_uid=eq.' + encodeURIComponent(googleUid)
        + '&version_number=eq.1&select=id&limit=1';
    const r = await fetch(url, { headers: authHeaders(secret) });
    if (!r.ok) return false;
    const rows = await r.json();
    return rows.length > 0;
}

export default async function handler(req, res) {
    const supabaseSecret = process.env.SUPABASE_SERVICE_ROLE_KEY || MODULE_KEY;

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const authHeader = req.headers.authorization || '';
    const idToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!idToken) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const googleUid = await verifyGoogleIdToken(idToken);
    if (!googleUid) {
        res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
        return;
    }

    if (!supabaseSecret) {
        res.status(500).json({ error: 'Server not configured' });
        return;
    }

    const body = await readJsonBody(req);
    if (!body) {
        res.status(400).json({ error: 'Invalid JSON body' });
        return;
    }
    const { article_id, title, site_name, html } = body;
    if (!article_id || !UUID_RE.test(article_id)) {
        res.status(400).json({ error: 'Invalid article_id' });
        return;
    }
    if (typeof html !== 'string' || !html) {
        res.status(400).json({ error: 'html required' });
        return;
    }

    // Look up the article row (must be owned by caller; web app never creates rows)
    const lookupUrl = SUPABASE_URL + '/rest/v1/articles'
        + '?id=eq.' + encodeURIComponent(article_id)
        + '&google_uid=eq.' + encodeURIComponent(googleUid)
        + '&select=id,content_path,content_hash,version_count,title,site_name,synced_at,added_date&limit=1';
    const lookupResp = await fetch(lookupUrl, { headers: authHeaders(supabaseSecret) });
    if (!lookupResp.ok) {
        res.status(502).json({ error: 'Failed to look up article' });
        return;
    }
    const rows = await lookupResp.json();
    if (!rows.length) {
        res.status(404).json({ error: 'Article not found' });
        return;
    }
    const row = rows[0];
    const now = Date.now();

    const newTitle = (typeof title === 'string' && title.trim()) ? title.trim() : row.title;
    const newSiteName = (typeof site_name === 'string' && site_name.trim()) ? site_name.trim() : row.site_name;
    const newHash = simpleHash(html);

    // Title-only change short-circuit: content_hash unchanged
    if (newHash === row.content_hash) {
        const metaChanged = newTitle !== row.title || newSiteName !== row.site_name;
        if (!metaChanged) {
            res.status(200).json({
                unchanged: true,
                version: row.version_count ?? 1,
                synced_at: row.synced_at,
                content_path: row.content_path
            });
            return;
        }
        const patchUrl = SUPABASE_URL + '/rest/v1/articles'
            + '?id=eq.' + encodeURIComponent(article_id)
            + '&google_uid=eq.' + encodeURIComponent(googleUid);
        const patchResp = await fetch(patchUrl, {
            method: 'PATCH',
            headers: authHeaders(supabaseSecret, {
                'Content-Type': 'application/json',
                Prefer: 'return=minimal'
            }),
            body: JSON.stringify({ title: newTitle, site_name: newSiteName, synced_at: now })
        });
        if (!patchResp.ok) {
            res.status(502).json({ error: 'Failed to update title' });
            return;
        }
        res.status(200).json({
            unchanged: true,
            titleUpdated: true,
            version: row.version_count ?? 1,
            synced_at: now,
            content_path: row.content_path
        });
        return;
    }

    // Content actually changed.

    // Legacy backfill: if no version_count or no v1 row, insert a v1 record pointing at
    // the existing storage path so version history starts from the original capture.
    let baseVersion = row.version_count ?? 0;
    const needsBackfill = (row.version_count == null)
        || !(await hasVersionOneRow(supabaseSecret, article_id, googleUid));
    if (needsBackfill) {
        const backfillResp = await fetch(SUPABASE_URL + '/rest/v1/article_versions', {
            method: 'POST',
            headers: authHeaders(supabaseSecret, {
                'Content-Type': 'application/json',
                Prefer: 'return=minimal'
            }),
            body: JSON.stringify({
                article_id,
                google_uid: googleUid,
                version_number: 1,
                title: row.title,
                content_path: row.content_path,
                content_hash: row.content_hash,
                saved_from: 'chrome_extension',
                is_original_capture: true,
                created_at: row.synced_at ?? row.added_date ?? now
            })
        });
        if (!backfillResp.ok) {
            res.status(502).json({ error: 'Failed to backfill original version' });
            return;
        }
        baseVersion = 1;
    }

    const nextVersion = baseVersion + 1;
    const prefix = 'articles/' + googleUid + '/' + article_id;
    const versionPath = prefix + '/v' + nextVersion;
    const latestPath = prefix + '/latest';

    const uploadV = await uploadToStorage(supabaseSecret, versionPath, html);
    if (!uploadV.ok) {
        res.status(502).json({ error: 'Failed to upload version content' });
        return;
    }
    const uploadL = await uploadToStorage(supabaseSecret, latestPath, html);
    if (!uploadL.ok) {
        res.status(502).json({ error: 'Failed to update latest content' });
        return;
    }

    const patchUrl = SUPABASE_URL + '/rest/v1/articles'
        + '?id=eq.' + encodeURIComponent(article_id)
        + '&google_uid=eq.' + encodeURIComponent(googleUid);
    const patchResp = await fetch(patchUrl, {
        method: 'PATCH',
        headers: authHeaders(supabaseSecret, {
            'Content-Type': 'application/json',
            Prefer: 'return=minimal'
        }),
        body: JSON.stringify({
            title: newTitle,
            site_name: newSiteName,
            content_path: latestPath,
            content_hash: newHash,
            version_count: nextVersion,
            synced_at: now
        })
    });
    if (!patchResp.ok) {
        res.status(502).json({ error: 'Failed to update article row' });
        return;
    }

    const versionInsertResp = await fetch(SUPABASE_URL + '/rest/v1/article_versions', {
        method: 'POST',
        headers: authHeaders(supabaseSecret, {
            'Content-Type': 'application/json',
            Prefer: 'return=minimal'
        }),
        body: JSON.stringify({
            article_id,
            google_uid: googleUid,
            version_number: nextVersion,
            title: newTitle,
            content_path: versionPath,
            content_hash: newHash,
            saved_from: 'web_app',
            is_original_capture: false,
            created_at: now
        })
    });
    if (!versionInsertResp.ok) {
        res.status(502).json({ error: 'Article saved but version history insert failed' });
        return;
    }

    res.status(200).json({
        version: nextVersion,
        synced_at: now,
        content_path: latestPath
    });
}

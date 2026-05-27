const MODULE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = 'https://pcyjafpopnjtjqaelycy.supabase.co';
const BUCKET = 'article-content';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

async function downloadFromStorage(secret, path) {
    const url = SUPABASE_URL + '/storage/v1/object/' + BUCKET + '/' + encodePath(path);
    const resp = await fetch(url, { headers: authHeaders(secret) });
    if (!resp.ok) return null;
    return await resp.text();
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
    const { article_id, version_id } = body;
    if (!article_id || !UUID_RE.test(article_id)) {
        res.status(400).json({ error: 'Invalid article_id' });
        return;
    }
    if (!version_id || !UUID_RE.test(version_id)) {
        res.status(400).json({ error: 'Invalid version_id' });
        return;
    }

    // Confirm caller owns the article
    const articleUrl = SUPABASE_URL + '/rest/v1/articles'
        + '?id=eq.' + encodeURIComponent(article_id)
        + '&google_uid=eq.' + encodeURIComponent(googleUid)
        + '&select=id,content_path,content_hash,version_count,title,site_name&limit=1';
    const articleResp = await fetch(articleUrl, { headers: authHeaders(supabaseSecret) });
    if (!articleResp.ok) {
        res.status(502).json({ error: 'Failed to look up article' });
        return;
    }
    const articleRows = await articleResp.json();
    if (!articleRows.length) {
        res.status(404).json({ error: 'Article not found' });
        return;
    }
    const article = articleRows[0];

    // Look up the version to restore (must belong to this article and user)
    const versionUrl = SUPABASE_URL + '/rest/v1/article_versions'
        + '?id=eq.' + encodeURIComponent(version_id)
        + '&article_id=eq.' + encodeURIComponent(article_id)
        + '&google_uid=eq.' + encodeURIComponent(googleUid)
        + '&select=id,version_number,content_path,title&limit=1';
    const versionResp = await fetch(versionUrl, { headers: authHeaders(supabaseSecret) });
    if (!versionResp.ok) {
        res.status(502).json({ error: 'Failed to look up version' });
        return;
    }
    const versionRows = await versionResp.json();
    if (!versionRows.length) {
        res.status(404).json({ error: 'Version not found' });
        return;
    }
    const versionRow = versionRows[0];

    // Download the version's content from Storage
    const restoredHtml = await downloadFromStorage(supabaseSecret, versionRow.content_path);
    if (restoredHtml == null) {
        res.status(502).json({ error: 'Failed to download version content' });
        return;
    }

    const now = Date.now();
    const newHash = simpleHash(restoredHtml);

    // Short-circuit: restoring a version whose content already matches latest is a no-op
    if (newHash === article.content_hash) {
        res.status(200).json({
            unchanged: true,
            version: article.version_count ?? 1,
            synced_at: now,
            content_path: article.content_path
        });
        return;
    }

    // Restore = append a new version with this content
    const baseVersion = article.version_count ?? versionRow.version_number ?? 1;
    const nextVersion = baseVersion + 1;
    const prefix = 'articles/' + googleUid + '/' + article_id;
    const versionPath = prefix + '/v' + nextVersion;
    const latestPath = prefix + '/latest';
    const restoredTitle = versionRow.title || article.title;

    const uploadV = await uploadToStorage(supabaseSecret, versionPath, restoredHtml);
    if (!uploadV.ok) {
        res.status(502).json({ error: 'Failed to upload restored version' });
        return;
    }
    const uploadL = await uploadToStorage(supabaseSecret, latestPath, restoredHtml);
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
            title: restoredTitle,
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

    const insertResp = await fetch(SUPABASE_URL + '/rest/v1/article_versions', {
        method: 'POST',
        headers: authHeaders(supabaseSecret, {
            'Content-Type': 'application/json',
            Prefer: 'return=minimal'
        }),
        body: JSON.stringify({
            article_id,
            google_uid: googleUid,
            version_number: nextVersion,
            title: restoredTitle,
            content_path: versionPath,
            content_hash: newHash,
            saved_from: 'web_app',
            is_original_capture: false,
            created_at: now
        })
    });
    if (!insertResp.ok) {
        res.status(502).json({ error: 'Article restored but version history insert failed' });
        return;
    }

    res.status(200).json({
        version: nextVersion,
        synced_at: now,
        content_path: latestPath,
        restored_from_version: versionRow.version_number
    });
}

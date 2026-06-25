const MODULE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = 'https://pcyjafpopnjtjqaelycy.supabase.co';
const BUCKET = 'article-content';

// Same djb2-xor as the extension and saved-save (background.js:393-400).
function simpleHash(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
        hash |= 0;
    }
    return (hash >>> 0).toString(16);
}

// RFC4122 v4. Uses crypto.randomUUID when available (Node 14.17+), falls back
// otherwise. Vercel's Node.js runtime is Node 20+, so the native path is taken.
function newUuid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    const bytes = new Uint8Array(16);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(bytes);
    else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' + hex.slice(12, 16) + '-' + hex.slice(16, 20) + '-' + hex.slice(20);
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

    const body = (await readJsonBody(req)) || {};
    const title = (typeof body.title === 'string' && body.title.trim()) ? body.title.trim() : 'Untitled';
    // Empty editable paragraph — gives contenteditable somewhere for the cursor to land.
    const html = '<p><br></p>';

    const articleId = newUuid();
    const now = Date.now();
    const url = 'webapp://draft/' + articleId; // synthetic URL satisfies (google_uid, url) uniqueness
    const prefix = 'articles/' + googleUid + '/' + articleId;
    const versionPath = prefix + '/v1';
    const latestPath = prefix + '/latest';
    const contentHash = simpleHash(html);

    // Upload the empty body to both v1 and latest before inserting the row, so
    // any UI that reads from content_path right after creation finds a real file.
    const upV = await uploadToStorage(supabaseSecret, versionPath, html);
    if (!upV.ok) {
        res.status(502).json({ error: 'Failed to write initial version' });
        return;
    }
    const upL = await uploadToStorage(supabaseSecret, latestPath, html);
    if (!upL.ok) {
        res.status(502).json({ error: 'Failed to write latest file' });
        return;
    }

    // INSERT articles row. Note: this is the one place the web app creates a row
    // in `articles` — by design, for user-initiated draft notes. Capture from
    // source pages stays the extension's responsibility.
    const articleInsertResp = await fetch(SUPABASE_URL + '/rest/v1/articles', {
        method: 'POST',
        headers: authHeaders(supabaseSecret, {
            'Content-Type': 'application/json',
            Prefer: 'return=representation'
        }),
        body: JSON.stringify({
            id: articleId,
            google_uid: googleUid,
            title,
            url,
            site_name: 'Web App',
            added_date: now,
            synced_at: now,
            content_path: latestPath,
            content_hash: contentHash,
            version_count: 1
        })
    });
    if (!articleInsertResp.ok) {
        res.status(502).json({ error: 'Failed to create article row' });
        return;
    }
    const inserted = await articleInsertResp.json();
    const row = Array.isArray(inserted) ? inserted[0] : inserted;

    // INSERT v1 article_versions row. is_original_capture=true since this IS the
    // first version of this article (web-app-originated rather than scraped).
    const versionInsertResp = await fetch(SUPABASE_URL + '/rest/v1/article_versions', {
        method: 'POST',
        headers: authHeaders(supabaseSecret, {
            'Content-Type': 'application/json',
            Prefer: 'return=minimal'
        }),
        body: JSON.stringify({
            article_id: articleId,
            google_uid: googleUid,
            version_number: 1,
            title,
            content_path: versionPath,
            content_hash: contentHash,
            saved_from: 'web_app',
            is_original_capture: true,
            created_at: now
        })
    });
    if (!versionInsertResp.ok) {
        res.status(502).json({ error: 'Article created but version row insert failed' });
        return;
    }

    res.status(200).json({
        id: articleId,
        title,
        url,
        site_name: 'Web App',
        added_date: now,
        synced_at: now,
        content_path: latestPath,
        version_count: 1
    });
}

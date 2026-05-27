const MODULE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = 'https://pcyjafpopnjtjqaelycy.supabase.co';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function verifyGoogleIdToken(idToken) {
    const resp = await fetch(
        'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken)
    );
    if (!resp.ok) return null;
    const info = await resp.json();
    return info.sub || null;
}

function authHeaders(secret) {
    return { apikey: secret, Authorization: 'Bearer ' + secret };
}

export default async function handler(req, res) {
    const supabaseSecret = process.env.SUPABASE_SERVICE_ROLE_KEY || MODULE_KEY;

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

    const articleId = (req.query && req.query.article_id) || '';
    if (!articleId || !UUID_RE.test(articleId)) {
        res.status(400).json({ error: 'Invalid article_id' });
        return;
    }

    // Confirm caller owns the article before exposing its version list
    const ownerUrl = SUPABASE_URL + '/rest/v1/articles'
        + '?id=eq.' + encodeURIComponent(articleId)
        + '&google_uid=eq.' + encodeURIComponent(googleUid)
        + '&select=id&limit=1';
    const ownerResp = await fetch(ownerUrl, { headers: authHeaders(supabaseSecret) });
    if (!ownerResp.ok) {
        res.status(502).json({ error: 'Failed to look up article' });
        return;
    }
    const ownerRows = await ownerResp.json();
    if (!ownerRows.length) {
        res.status(404).json({ error: 'Article not found' });
        return;
    }

    const versionsUrl = SUPABASE_URL + '/rest/v1/article_versions'
        + '?article_id=eq.' + encodeURIComponent(articleId)
        + '&google_uid=eq.' + encodeURIComponent(googleUid)
        + '&order=version_number.desc'
        + '&select=id,version_number,title,content_path,saved_from,is_original_capture,created_at';
    const resp = await fetch(versionsUrl, { headers: authHeaders(supabaseSecret) });
    if (!resp.ok) {
        res.status(502).json({ error: 'Failed to fetch versions' });
        return;
    }
    const data = await resp.json();
    res.status(200).json(data);
}

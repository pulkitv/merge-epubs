const MODULE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = 'https://pcyjafpopnjtjqaelycy.supabase.co';

export default async function handler(req, res) {
    const supabaseSecret = process.env.SUPABASE_SERVICE_ROLE_KEY || MODULE_KEY;

    if (req.method !== 'DELETE') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const authHeader = req.headers.authorization || '';
    const idToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!idToken) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const verifyResp = await fetch(
        'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken)
    );
    if (!verifyResp.ok) {
        res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
        return;
    }
    const info = await verifyResp.json();
    const googleUid = info.sub;
    if (!googleUid) {
        res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
        return;
    }

    const articleId = (req.query && req.query.article_id) || '';
    if (!articleId || !/^[0-9a-f-]+$/i.test(articleId)) {
        res.status(400).json({ error: 'Invalid article_id' });
        return;
    }

    if (!supabaseSecret) {
        res.status(500).json({ error: 'Server not configured' });
        return;
    }

    const lookupUrl = SUPABASE_URL
        + '/rest/v1/articles'
        + '?id=eq.' + encodeURIComponent(articleId)
        + '&google_uid=eq.' + encodeURIComponent(googleUid)
        + '&select=id,content_path';

    const lookupResp = await fetch(lookupUrl, {
        headers: {
            apikey: supabaseSecret,
            Authorization: 'Bearer ' + supabaseSecret
        }
    });
    if (!lookupResp.ok) {
        res.status(502).json({ error: 'Failed to look up article' });
        return;
    }
    const rows = await lookupResp.json();
    if (!rows.length) {
        res.status(404).json({ error: 'Article not found' });
        return;
    }

    const contentPath = rows[0].content_path;

    if (contentPath && contentPath.startsWith(googleUid + '/') && !contentPath.includes('..')) {
        const encodedPath = contentPath.split('/').map(encodeURIComponent).join('/');
        const storageUrl = SUPABASE_URL + '/storage/v1/object/article-content/' + encodedPath;
        await fetch(storageUrl, {
            method: 'DELETE',
            headers: {
                apikey: supabaseSecret,
                Authorization: 'Bearer ' + supabaseSecret
            }
        }).catch(() => { /* best-effort; row delete is the source of truth */ });
    }

    const deleteUrl = SUPABASE_URL
        + '/rest/v1/articles'
        + '?id=eq.' + encodeURIComponent(articleId)
        + '&google_uid=eq.' + encodeURIComponent(googleUid);

    const deleteResp = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
            apikey: supabaseSecret,
            Authorization: 'Bearer ' + supabaseSecret,
            Prefer: 'return=minimal'
        }
    });
    if (!deleteResp.ok) {
        res.status(502).json({ error: 'Failed to delete article' });
        return;
    }

    res.status(200).json({ deleted: true });
}

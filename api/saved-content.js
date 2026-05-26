const MODULE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = 'https://pcyjafpopnjtjqaelycy.supabase.co';

export default async function handler(req, res) {
    const supabaseSecret = process.env.SUPABASE_SERVICE_ROLE_KEY || MODULE_KEY;

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

    const contentPath = (req.query && req.query.content_path) || '';

    if (!contentPath || contentPath.includes('..') || contentPath.startsWith('/')) {
        res.status(400).json({ error: 'Invalid content path' });
        return;
    }
    if (!contentPath.startsWith(googleUid + '/')) {
        res.status(403).json({ error: 'Access denied' });
        return;
    }

    if (!supabaseSecret) {
        res.status(500).json({ error: 'Server not configured' });
        return;
    }

    const encodedPath = contentPath.split('/').map(encodeURIComponent).join('/');
    const signUrl = SUPABASE_URL + '/storage/v1/object/sign/article-content/' + encodedPath;

    const signResp = await fetch(signUrl, {
        method: 'POST',
        headers: {
            apikey: supabaseSecret,
            Authorization: 'Bearer ' + supabaseSecret,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ expiresIn: 3600 })
    });

    if (!signResp.ok) {
        res.status(502).json({ error: 'Failed to generate download URL' });
        return;
    }

    const signData = await signResp.json();
    const relativeSignedUrl = signData.signedURL || signData.signedUrl;
    if (!relativeSignedUrl) {
        res.status(502).json({ error: 'No signed URL in storage response' });
        return;
    }

    const absoluteSignedUrl = SUPABASE_URL + '/storage/v1' + relativeSignedUrl;
    res.status(200).json({ signedUrl: absoluteSignedUrl });
}

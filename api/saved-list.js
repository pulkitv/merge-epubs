const MODULE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = 'https://pcyjafpopnjtjqaelycy.supabase.co';

export default async function handler(req, res) {
    const inlineKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

    if (!inlineKey) {
        const envObj = process.env || {};
        const envKeys = Object.keys(envObj).sort();
        const supabaseKeys = envKeys.filter((k) => k.toUpperCase().includes('SUPABASE'));
        res.status(500).json({
            error: 'Server not configured',
            build: 'saved-list-fresh-path',
            moduleKeyType: typeof MODULE_KEY,
            inlineKeyType: typeof inlineKey,
            supabaseEnvVarNames: supabaseKeys,
            totalEnvVars: envKeys.length
        });
        return;
    }

    const url = SUPABASE_URL
        + '/rest/v1/articles'
        + '?google_uid=eq.' + encodeURIComponent(googleUid)
        + '&order=added_date.desc'
        + '&select=id,title,url,site_name,added_date,content_path';

    const resp = await fetch(url, {
        headers: {
            apikey: inlineKey,
            Authorization: 'Bearer ' + inlineKey
        }
    });

    if (!resp.ok) {
        res.status(502).json({ error: 'Failed to fetch articles' });
        return;
    }
    const data = await resp.json();
    res.status(200).json(data);
}

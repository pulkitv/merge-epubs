export const config = { runtime: 'edge' };

// build-bust: 2026-05-26
const SUPABASE_URL = 'https://pcyjafpopnjtjqaelycy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
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

export default async function handler(request) {
    const authHeader = request.headers.get('Authorization') || '';
    const idToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!idToken) return json({ error: 'Unauthorized' }, 401);

    const googleUid = await verifyGoogleIdToken(idToken);
    if (!googleUid) return json({ error: 'Invalid or expired session. Please sign in again.' }, 401);

    if (!SUPABASE_SERVICE_ROLE_KEY) return json({ error: 'Server not configured' }, 500);

    const url = SUPABASE_URL
        + '/rest/v1/articles'
        + '?google_uid=eq.' + encodeURIComponent(googleUid)
        + '&order=added_date.desc'
        + '&select=id,title,url,site_name,added_date,content_path';

    const resp = await fetch(url, {
        headers: {
            apikey: SUPABASE_SERVICE_ROLE_KEY,
            Authorization: 'Bearer ' + SUPABASE_SERVICE_ROLE_KEY
        }
    });

    if (!resp.ok) return json({ error: 'Failed to fetch articles' }, 502);
    return new Response(await resp.text(), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}

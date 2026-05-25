export const config = { runtime: 'edge' };

const SUPABASE_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = 'https://pcyjafpopnjtjqaelycy.supabase.co';

export default async function handler(request) {
    const inlineKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const authHeader = request.headers.get('Authorization') || '';
    const idToken = authHeader.replace(/^Bearer\s+/i, '').trim();

    let verifiedSub = null;
    if (idToken) {
        const verifyResp = await fetch(
            'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken)
        );
        if (verifyResp.ok) {
            const info = await verifyResp.json();
            verifiedSub = info.sub || null;
        }
    }

    if (!verifiedSub) {
        return new Response(JSON.stringify({ error: 'Invalid or expired session. Please sign in again.' }), {
            status: 401, headers: { 'Content-Type': 'application/json' }
        });
    }

    if (!inlineKey) {
        return new Response(JSON.stringify({ error: 'Server not configured' }), {
            status: 500, headers: { 'Content-Type': 'application/json' }
        });
    }

    const url = SUPABASE_URL
        + '/rest/v1/articles'
        + '?google_uid=eq.' + encodeURIComponent(verifiedSub)
        + '&order=added_date.desc'
        + '&select=id,title,url,site_name,added_date,content_path';

    const resp = await fetch(url, {
        headers: {
            apikey: inlineKey,
            Authorization: 'Bearer ' + inlineKey
        }
    });

    if (!resp.ok) {
        return new Response(JSON.stringify({ error: 'Failed to fetch articles' }), {
            status: 502, headers: { 'Content-Type': 'application/json' }
        });
    }
    return new Response(await resp.text(), {
        status: 200, headers: { 'Content-Type': 'application/json' }
    });
}

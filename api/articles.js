export const config = { runtime: 'edge' };

const SUPABASE_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = 'https://pcyjafpopnjtjqaelycy.supabase.co';

export default async function handler(request) {
    const inlineKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const envObj = process.env || {};
    const envKeys = Object.keys(envObj).sort();
    const supabaseKeys = envKeys.filter((k) => k.toUpperCase().includes('SUPABASE'));

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

    let supabaseStatus = null;
    let supabaseLen = null;
    if (verifiedSub && inlineKey) {
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
        supabaseStatus = resp.status;
        const txt = await resp.text();
        supabaseLen = txt.length;
    }

    return new Response(JSON.stringify({
        build: 'v11-with-supabase-fetch',
        verifiedSub,
        supabaseStatus,
        supabaseLen,
        moduleSecretType: typeof SUPABASE_SECRET,
        inlineKeyType: typeof inlineKey,
        directReadType: typeof process.env.SUPABASE_SERVICE_ROLE_KEY,
        supabaseEnvVarNames: supabaseKeys,
        totalEnvVars: envKeys.length
    }, null, 2), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

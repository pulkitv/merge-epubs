export const config = { runtime: 'edge' };

const BUILD_MARKER = 'v6-module-ref';
const SUPABASE_URL = 'https://pcyjafpopnjtjqaelycy.supabase.co';
// Module-level reference required by Vercel Edge static analysis to inject the env var
const SUPABASE_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
    const supabaseSecret = SUPABASE_SECRET;

    const authHeader = request.headers.get('Authorization') || '';
    const idToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!idToken) return json({ error: 'Unauthorized' }, 401);

    const googleUid = await verifyGoogleIdToken(idToken);
    if (!googleUid) return json({ error: 'Invalid or expired session. Please sign in again.' }, 401);

    if (!supabaseSecret) {
        const envObj = process.env || {};
        const envKeys = Object.keys(envObj).sort();
        const supabaseKeys = envKeys.filter((k) => k.toUpperCase().includes('SUPABASE'));
        return json({
            error: 'Server not configured',
            build: BUILD_MARKER,
            keyType: typeof supabaseSecret,
            keyLen: supabaseSecret ? supabaseSecret.length : 0,
            totalEnvVars: envKeys.length,
            supabaseEnvVarNames: supabaseKeys,
            processEnvType: typeof process.env
        }, 500);
    }

    const url = SUPABASE_URL
        + '/rest/v1/articles'
        + '?google_uid=eq.' + encodeURIComponent(googleUid)
        + '&order=added_date.desc'
        + '&select=id,title,url,site_name,added_date,content_path';

    const resp = await fetch(url, {
        headers: {
            apikey: supabaseSecret,
            Authorization: 'Bearer ' + supabaseSecret
        }
    });

    if (!resp.ok) return json({ error: 'Failed to fetch articles' }, 502);
    return new Response(await resp.text(), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}

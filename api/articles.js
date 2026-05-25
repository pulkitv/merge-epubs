export const config = { runtime: 'edge' };

const SUPABASE_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(request) {
    const inlineKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const envObj = process.env || {};
    const envKeys = Object.keys(envObj).sort();
    const supabaseKeys = envKeys.filter((k) => k.toUpperCase().includes('SUPABASE'));

    const authHeader = request.headers.get('Authorization') || '';
    const idToken = authHeader.replace(/^Bearer\s+/i, '').trim();

    let verifiedSub = null;
    let fetchErr = null;
    if (idToken) {
        try {
            const verifyResp = await fetch(
                'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken)
            );
            if (verifyResp.ok) {
                const info = await verifyResp.json();
                verifiedSub = info.sub || null;
            }
        } catch (e) {
            fetchErr = String(e);
        }
    }

    return new Response(JSON.stringify({
        build: 'v10-with-google-fetch',
        verifiedSub,
        fetchErr,
        moduleSecretType: typeof SUPABASE_SECRET,
        inlineKeyType: typeof inlineKey,
        directReadType: typeof process.env.SUPABASE_SERVICE_ROLE_KEY,
        supabaseEnvVarNames: supabaseKeys,
        totalEnvVars: envKeys.length
    }, null, 2), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

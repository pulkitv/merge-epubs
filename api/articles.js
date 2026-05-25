export const config = { runtime: 'edge' };

const SUPABASE_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(request) {
    const inlineKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const envObj = process.env || {};
    const envKeys = Object.keys(envObj).sort();
    const supabaseKeys = envKeys.filter((k) => k.toUpperCase().includes('SUPABASE'));

    const authHeader = request.headers.get('Authorization') || '';
    const hasAuth = !!authHeader;

    return new Response(JSON.stringify({
        build: 'v9-with-auth-header-read',
        hasAuth,
        moduleSecretType: typeof SUPABASE_SECRET,
        inlineKeyType: typeof inlineKey,
        directReadType: typeof process.env.SUPABASE_SERVICE_ROLE_KEY,
        supabaseEnvVarNames: supabaseKeys,
        totalEnvVars: envKeys.length
    }, null, 2), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

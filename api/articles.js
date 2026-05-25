export const config = { runtime: 'edge' };

const MODULE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler() {
    const inlineKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const envObj = process.env || {};
    const envKeys = Object.keys(envObj).sort();
    const supabaseKeys = envKeys.filter((k) => k.toUpperCase().includes('SUPABASE'));

    return new Response(JSON.stringify({
        build: 'v8-minimal-articles',
        moduleKey: {
            hasKey: !!MODULE_KEY,
            type: typeof MODULE_KEY,
            len: MODULE_KEY ? MODULE_KEY.length : 0
        },
        inlineKey: {
            hasKey: !!inlineKey,
            type: typeof inlineKey,
            len: inlineKey ? inlineKey.length : 0
        },
        supabaseEnvVarNames: supabaseKeys,
        totalEnvVars: envKeys.length
    }, null, 2), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

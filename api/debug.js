export const config = { runtime: 'edge' };

const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler() {
    const envKeys = Object.keys(process.env || {}).sort();
    const supabaseKeys = envKeys.filter((k) => k.toUpperCase().includes('SUPABASE'));

    return new Response(
        JSON.stringify({
            runtime: 'edge',
            hasKey: !!KEY,
            keyType: typeof KEY,
            keyLength: KEY ? KEY.length : 0,
            keyStartsWith: KEY ? KEY.slice(0, 4) : null,
            keyEndsWith: KEY ? KEY.slice(-4) : null,
            keyHasLeadingSpace: KEY ? /^\s/.test(KEY) : null,
            keyHasTrailingSpace: KEY ? /\s$/.test(KEY) : null,
            supabaseEnvVarNames: supabaseKeys,
            totalEnvVars: envKeys.length
        }, null, 2),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
}

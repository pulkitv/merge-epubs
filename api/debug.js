export const config = { runtime: 'edge' };

const MODULE_LEVEL_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler() {
    const handlerLevelKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const envObj = process.env || {};
    const envKeys = Object.keys(envObj).sort();
    const supabaseKeys = envKeys.filter((k) => k.toUpperCase().includes('SUPABASE'));

    return new Response(
        JSON.stringify({
            build: 'debug-v2',
            moduleLevel: {
                hasKey: !!MODULE_LEVEL_KEY,
                keyType: typeof MODULE_LEVEL_KEY,
                keyLength: MODULE_LEVEL_KEY ? MODULE_LEVEL_KEY.length : 0,
                keyStartsWith: MODULE_LEVEL_KEY ? MODULE_LEVEL_KEY.slice(0, 4) : null
            },
            handlerLevel: {
                hasKey: !!handlerLevelKey,
                keyType: typeof handlerLevelKey,
                keyLength: handlerLevelKey ? handlerLevelKey.length : 0,
                keyStartsWith: handlerLevelKey ? handlerLevelKey.slice(0, 4) : null
            },
            supabaseEnvVarNames: supabaseKeys,
            totalEnvVars: envKeys.length,
            processEnvType: typeof process.env
        }, null, 2),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
}

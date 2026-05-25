const MODULE_LEVEL_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
    const handlerLevelKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const envObj = process.env || {};
    const envKeys = Object.keys(envObj).sort();
    const supabaseKeys = envKeys.filter((k) => k.toUpperCase().includes('SUPABASE'));

    res.status(200).json({
        runtime: 'nodejs',
        moduleLevel: {
            hasKey: !!MODULE_LEVEL_KEY,
            keyLength: MODULE_LEVEL_KEY ? MODULE_LEVEL_KEY.length : 0
        },
        handlerLevel: {
            hasKey: !!handlerLevelKey,
            keyLength: handlerLevelKey ? handlerLevelKey.length : 0
        },
        supabaseEnvVarNames: supabaseKeys,
        totalEnvVars: envKeys.length
    });
}

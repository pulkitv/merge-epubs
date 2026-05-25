const MODULE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = 'https://pcyjafpopnjtjqaelycy.supabase.co';

export default async function handler(req, res) {
    const inlineKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bracketKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];
    const ownerKey = Object.getOwnPropertyDescriptor(process.env, 'SUPABASE_SERVICE_ROLE_KEY');
    const hasOwn = Object.prototype.hasOwnProperty.call(process.env, 'SUPABASE_SERVICE_ROLE_KEY');
    const envObj = process.env || {};
    const envKeys = Object.keys(envObj).sort();
    const supabaseKeys = envKeys.filter((k) => k.toUpperCase().includes('SUPABASE'));

    const authHeader = req.headers.authorization || '';
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

    res.status(200).json({
        build: 'diag-bracket-vs-dot',
        verifiedSub,
        moduleKeyType: typeof MODULE_KEY,
        inlineKeyType: typeof inlineKey,
        bracketKeyType: typeof bracketKey,
        hasOwn,
        ownerKey,
        supabaseEnvVarNames: supabaseKeys,
        totalEnvVars: envKeys.length,
        nodeVersion: process.version,
        platform: process.platform
    });
}

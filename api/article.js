export const config = { runtime: 'edge' };

// build-bust: 2026-05-26
const SUPABASE_URL = 'https://pcyjafpopnjtjqaelycy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
    const authHeader = request.headers.get('Authorization') || '';
    const idToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!idToken) return json({ error: 'Unauthorized' }, 401);

    const googleUid = await verifyGoogleIdToken(idToken);
    if (!googleUid) return json({ error: 'Invalid or expired session. Please sign in again.' }, 401);

    const { searchParams } = new URL(request.url);
    const contentPath = searchParams.get('content_path') || '';

    if (!contentPath || contentPath.includes('..') || contentPath.startsWith('/')) {
        return json({ error: 'Invalid content path' }, 400);
    }
    // Ensure the path belongs to this user — format is {google_uid}/{hash}.html
    if (!contentPath.startsWith(googleUid + '/')) {
        return json({ error: 'Access denied' }, 403);
    }

    if (!SUPABASE_SERVICE_ROLE_KEY) return json({ error: 'Server not configured' }, 500);

    // Encode each path segment, preserving the slash separator
    const encodedPath = contentPath.split('/').map(encodeURIComponent).join('/');
    const signUrl = SUPABASE_URL + '/storage/v1/object/sign/article-content/' + encodedPath;

    const signResp = await fetch(signUrl, {
        method: 'POST',
        headers: {
            apikey: SUPABASE_SERVICE_ROLE_KEY,
            Authorization: 'Bearer ' + SUPABASE_SERVICE_ROLE_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ expiresIn: 3600 })
    });

    if (!signResp.ok) return json({ error: 'Failed to generate download URL' }, 502);

    const signData = await signResp.json();
    const signedUrl = signData.signedURL || signData.signedUrl;
    if (!signedUrl) return json({ error: 'No signed URL in storage response' }, 502);

    return json({ signedUrl });
}

export const config = { runtime: 'edge' };

const SUPABASE_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = 'https://pcyjafpopnjtjqaelycy.supabase.co';

export default async function handler(request) {
    const supabaseSecret = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SECRET;

    const authHeader = request.headers.get('Authorization') || '';
    const idToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!idToken) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401, headers: { 'Content-Type': 'application/json' }
        });
    }

    const verifyResp = await fetch(
        'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken)
    );
    if (!verifyResp.ok) {
        return new Response(JSON.stringify({ error: 'Invalid or expired session. Please sign in again.' }), {
            status: 401, headers: { 'Content-Type': 'application/json' }
        });
    }
    const info = await verifyResp.json();
    const googleUid = info.sub;
    if (!googleUid) {
        return new Response(JSON.stringify({ error: 'Invalid or expired session. Please sign in again.' }), {
            status: 401, headers: { 'Content-Type': 'application/json' }
        });
    }

    const { searchParams } = new URL(request.url);
    const contentPath = searchParams.get('content_path') || '';

    if (!contentPath || contentPath.includes('..') || contentPath.startsWith('/')) {
        return new Response(JSON.stringify({ error: 'Invalid content path' }), {
            status: 400, headers: { 'Content-Type': 'application/json' }
        });
    }
    if (!contentPath.startsWith(googleUid + '/')) {
        return new Response(JSON.stringify({ error: 'Access denied' }), {
            status: 403, headers: { 'Content-Type': 'application/json' }
        });
    }

    if (!supabaseSecret) {
        return new Response(JSON.stringify({ error: 'Server not configured' }), {
            status: 500, headers: { 'Content-Type': 'application/json' }
        });
    }

    const encodedPath = contentPath.split('/').map(encodeURIComponent).join('/');
    const signUrl = SUPABASE_URL + '/storage/v1/object/sign/article-content/' + encodedPath;

    const signResp = await fetch(signUrl, {
        method: 'POST',
        headers: {
            apikey: supabaseSecret,
            Authorization: 'Bearer ' + supabaseSecret,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ expiresIn: 3600 })
    });

    if (!signResp.ok) {
        return new Response(JSON.stringify({ error: 'Failed to generate download URL' }), {
            status: 502, headers: { 'Content-Type': 'application/json' }
        });
    }

    const signData = await signResp.json();
    const signedUrl = signData.signedURL || signData.signedUrl;
    if (!signedUrl) {
        return new Response(JSON.stringify({ error: 'No signed URL in storage response' }), {
            status: 502, headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({ signedUrl }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
    });
}

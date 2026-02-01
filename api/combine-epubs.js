const API_BASE_URL = process.env.API_BASE_URL || 'https://epub-combiner-api.onrender.com';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Forward the request directly to upstream API
    const response = await fetch(`${API_BASE_URL}/combine-epubs`, {
      method: 'POST',
      headers: {
        'Content-Type': req.headers['content-type'] || 'multipart/form-data'
      },
      body: req
    });

    // Set response headers
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/epub+zip');
    res.setHeader('Content-Disposition', response.headers.get('content-disposition') || 'attachment; filename="combined.epub"');

    // Stream the response
    res.status(response.status);
    return res.send(await response.buffer());
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(502).json({ error: error.message });
  }
}

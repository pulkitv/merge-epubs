const API_BASE_URL = process.env.API_BASE_URL || 'https://epub-combiner-api.onrender.com';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const response = await fetch(`${API_BASE_URL}/config`);
    const data = await response.json();

    res.status(response.status);
    res.setHeader('Content-Type', 'application/json');
    return res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(502).json({ error: error.message });
  }
}

const API_BASE_URL = process.env.API_BASE_URL || 'https://epub-combiner-api.onrender.com';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  if (req.method !== 'GET') {
    res.statusCode = 405;
    return res.end('Method Not Allowed');
  }

  try {
    const upstream = await fetch(`${API_BASE_URL}/config`);
    const data = await upstream.arrayBuffer();

    res.statusCode = upstream.status;
    upstream.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    return res.end(Buffer.from(data));
  } catch (error) {
    res.statusCode = 502;
    return res.end(`Upstream error: ${error.message}`);
  }
};

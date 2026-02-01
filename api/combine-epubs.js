const API_BASE_URL = process.env.API_BASE_URL || 'https://combine-epubs.vercel.app';

async function readRequestBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end('Method Not Allowed');
  }

  try {
    const body = await readRequestBody(req);
    const headers = { ...req.headers };

    delete headers.host;

    const upstream = await fetch(`${API_BASE_URL}/combine-epubs`, {
      method: 'POST',
      headers,
      body
    });

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

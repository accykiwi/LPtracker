export const config = {
  runtime: 'nodejs'
};

import https from 'https';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const bodyChunks = [];
  for await (const chunk of req) bodyChunks.push(chunk);
  const rawBody = Buffer.concat(bodyChunks).toString();

  const options = {
    hostname: 'api.raydium.io',
    path: '/v2/clmm/user-position',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; KiwiBot/1.0)',
      'Accept': 'application/json',
      'Content-Length': Buffer.byteLength(rawBody),
    }
  };

  const rayReq = https.request(options, (rayRes) => {
    let data = '';

    rayRes.on('data', (chunk) => data += chunk);
    rayRes.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        res.status(200).json(parsed);
      } catch (e) {
        res.status(500).json({ error: 'Invalid JSON from Raydium', data });
      }
    });
  });

  rayReq.on('error', (err) => {
    res.status(500).json({ error: 'Raydium request failed', details: err.message });
  });

  rayReq.write(rawBody);
  rayReq.end();
}

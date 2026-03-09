/**
 * Vercel Serverless Function — /api/admin-auth.js
 */

const crypto = require('crypto');

// Vercel doesn't always auto-parse req.body — do it explicitly
async function parseBody(req) {
  // Already parsed (Vercel does this in some configurations)
  if (req.body && typeof req.body === 'object') return req.body;
  // Raw string body
  if (req.body && typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch(_) { return {}; }
  }
  // Stream — read and parse manually
  return new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data)); } catch(_) { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body     = await parseBody(req);
  const password = body.password;

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ ok: false, reason: 'missing password' });
  }

  const secret = process.env.ADMIN_PASSWORD;

  if (!secret) {
    console.error('ADMIN_PASSWORD env var is not set.');
    return res.status(500).json({ ok: false, reason: 'server misconfiguration' });
  }

  if (password !== secret) {
    await new Promise(resolve => setTimeout(resolve, 400));
    return res.status(401).json({ ok: false, reason: 'wrong password' });
  }

  const ts    = Date.now();
  const token = crypto
    .createHmac('sha256', secret)
    .update(String(ts))
    .digest('hex');

  return res.status(200).json({ ok: true, token, ts });
};

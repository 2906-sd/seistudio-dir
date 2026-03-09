/**
 * Vercel Serverless Function — /api/admin-auth.js
 * Written in CommonJS so it works without any package.json config.
 *
 * SETUP (once, in Vercel dashboard):
 *   Project → Settings → Environment Variables
 *   Name: ADMIN_PASSWORD  |  Value: your password
 */

const crypto = require('crypto');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body ?? {};

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ ok: false });
  }

  const secret = process.env.ADMIN_PASSWORD;

  if (!secret) {
    console.error('ADMIN_PASSWORD env var is not set.');
    return res.status(500).json({ ok: false });
  }

  if (password !== secret) {
    // Proper async delay — setTimeout doesn't work in serverless functions
    await new Promise(resolve => setTimeout(resolve, 400));
    return res.status(401).json({ ok: false });
  }

  const ts    = Date.now();
  const token = crypto
    .createHmac('sha256', secret)
    .update(String(ts))
    .digest('hex');

  return res.status(200).json({ ok: true, token, ts });
};

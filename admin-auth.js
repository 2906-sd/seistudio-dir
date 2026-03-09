/**
 * Vercel Serverless Function — /api/admin-auth
 *
 * SETUP (do this once in the Vercel dashboard):
 *   Project → Settings → Environment Variables
 *   Name:  ADMIN_PASSWORD
 *   Value: (whatever you want — never commit it)
 *
 * The function checks the posted password against the env var,
 * and on success returns a signed HMAC token the client stores
 * in sessionStorage. Nothing sensitive is ever in source code.
 */

import crypto from 'crypto';

export default function handler(req, res) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body ?? {};

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ ok: false });
  }

  const secret = process.env.ADMIN_PASSWORD;

  if (!secret) {
    // Env var not configured — fail loudly in dev, silently in prod
    console.error('ADMIN_PASSWORD env var is not set.');
    return res.status(500).json({ ok: false });
  }

  if (password !== secret) {
    // Small artificial delay to slow brute-force attempts
    return setTimeout(() => res.status(401).json({ ok: false }), 400);
  }

  // Sign a token: HMAC-SHA256(timestamp, ADMIN_PASSWORD)
  // The timestamp is embedded so tokens expire after 8 hours client-side.
  const ts    = Date.now();
  const token = crypto
    .createHmac('sha256', secret)
    .update(String(ts))
    .digest('hex');

  return res.status(200).json({ ok: true, token, ts });
}

/**
 * Vercel Serverless Function — /api/admin-auth.js
 * Handles admin authentication with proper CORS and body parsing
 */

const crypto = require('crypto');

module.exports = async function handler(req, res) {
  // CORS headers - allow all origins for development, restrict in production
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let password;
  
  try {
    // Vercel automatically parses JSON bodies in most cases
    // But we'll handle both parsed and unparsed scenarios
    if (typeof req.body === 'string') {
      const parsed = JSON.parse(req.body);
      password = parsed.password;
    } else if (req.body && typeof req.body === 'object') {
      password = req.body.password;
    } else {
      return res.status(400).json({ ok: false, reason: 'Invalid request body' });
    }
  } catch (e) {
    console.error('Body parsing error:', e);
    return res.status(400).json({ ok: false, reason: 'Invalid JSON' });
  }

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ ok: false, reason: 'Password required' });
  }

  const secret = process.env.ADMIN_PASSWORD;

  if (!secret) {
    console.error('ADMIN_PASSWORD environment variable is not set');
    return res.status(500).json({ ok: false, reason: 'Server misconfiguration' });
  }

  // Constant-time comparison to prevent timing attacks
  const isValid = crypto.timingSafeEqual(
    Buffer.from(password),
    Buffer.from(secret)
  );

  if (!isValid) {
    // Add small delay to prevent brute force
    await new Promise(resolve => setTimeout(resolve, 500));
    return res.status(401).json({ ok: false, reason: 'Invalid credentials' });
  }

  // Generate session token
  const ts = Date.now();
  const token = crypto
    .createHmac('sha256', secret)
    .update(String(ts))
    .digest('hex');

  return res.status(200).json({ 
    ok: true, 
    token, 
    ts 
  });
};

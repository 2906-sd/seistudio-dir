// /api/admin-write — Vercel serverless function
// Uses the modular firebase-admin v13+/v14 API (the legacy default-namespace
// `admin.apps` / `admin.initializeApp` was removed/altered in v14, which is
// why the previous version crashed with
//   TypeError: Cannot read properties of undefined (reading 'length')
// at module load time on Vercel).

const crypto = require('crypto');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');

// ── Parse service account ────────────────────────────────────────
const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountRaw) throw new Error('FIREBASE_SERVICE_ACCOUNT is missing');
const serviceAccount = JSON.parse(serviceAccountRaw);
// Normalize escaped newlines in the private key (common when the key is
// stored in a single-line env var).
if (typeof serviceAccount.private_key === 'string') {
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
}

// ── Idempotent initialization (cold-start safe) ──────────────────
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, reason: 'Method not allowed' });

  try {
    const db = getDatabase();
    let body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ ok: false, reason: 'Invalid body' });
    }
    const { token, ts, op, path, data, id } = body;

    const secret = process.env.ADMIN_PASSWORD;
    if (!secret) {
      console.error('ADMIN_PASSWORD env var missing');
      return res.status(500).json({ ok: false, reason: 'Server misconfiguration' });
    }
    if (token == null || ts == null) {
      return res.status(401).json({ ok: false, reason: 'Unauthorized' });
    }
    const expectedToken = crypto.createHmac('sha256', secret).update(String(ts)).digest('hex');
    // Use constant-time comparison to avoid timing oracles.
    const a = Buffer.from(String(token), 'hex');
    const b = Buffer.from(expectedToken, 'hex');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(401).json({ ok: false, reason: 'Unauthorized' });
    }

    if (!path || typeof path !== 'string') {
      return res.status(400).json({ ok: false, reason: 'Missing path' });
    }

    const ref = db.ref(path);
    if (op === 'push') {
      if (data === undefined) return res.status(400).json({ ok: false, reason: 'Missing data for push' });
      const newRef = await ref.push(data);
      return res.status(200).json({ ok: true, id: newRef.key });
    }
    if (op === 'update') {
      if (!id) return res.status(400).json({ ok: false, reason: 'Missing id for update' });
      if (data === undefined) return res.status(400).json({ ok: false, reason: 'Missing data for update' });
      await ref.child(id).update(data);
      return res.status(200).json({ ok: true });
    }
    if (op === 'remove') {
      if (!id) return res.status(400).json({ ok: false, reason: 'Missing id for remove' });
      await ref.child(id).remove();
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ ok: false, reason: 'Unknown operation' });
  } catch (error) {
    console.error('admin-write failed:', error);
    return res.status(500).json({ ok: false, reason: 'Internal Server Error' });
  }
};
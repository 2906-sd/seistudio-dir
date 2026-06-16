// Triggering a clean rebuild.
const crypto = require('crypto');
const admin = require('firebase-admin');

// 1 & 2: Parse config safely and use direct import
const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountRaw) throw new Error('FIREBASE_SERVICE_ACCOUNT is missing');
const serviceAccount = JSON.parse(serviceAccountRaw);
// Normalize newlines if needed
if (typeof serviceAccount.private_key === 'string') {
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
}

// 3: Idempotent initialization
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

// 4, 5, & 6: Handler with per-invocation database connection
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const db = admin.database(); // Initialized per-invocation
    let body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { token, ts, op, path, data, id } = body;

    const secret = process.env.ADMIN_PASSWORD;
    const expectedToken = crypto.createHmac('sha256', secret).update(String(ts)).digest('hex');

    if (token !== expectedToken) return res.status(401).json({ ok: false, reason: 'Unauthorized' });

    const ref = db.ref(path);
    if (op === 'push') { const newRef = await ref.push(data); return res.status(200).json({ ok: true, id: newRef.key }); }
    // Validate `id` is present before calling ref.child() — undefined id would write to a path named "undefined"
    if (op === 'update') {
      if (!id) return res.status(400).json({ ok: false, reason: 'Missing id for update' });
      await ref.child(id).update(data); return res.status(200).json({ ok: true });
    }
    if (op === 'remove') {
      if (!id) return res.status(400).json({ ok: false, reason: 'Missing id for remove' });
      await ref.child(id).remove(); return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ ok: false, reason: 'Unknown operation' });
  } catch (error) {
    console.error('Database write failed:', error); // Log full details to server
    return res.status(500).json({ ok: false, reason: 'Internal Server Error' }); // Generic message to client
  }
};

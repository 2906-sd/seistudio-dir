const crypto = require('crypto');
const admin = require('firebase-admin');

// Initialize Firebase Admin using your Vercel Master Credentials
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });
  } catch (e) {
    console.error('Firebase initialization error:', e);
  }
}

const db = admin.database();

module.exports = async function handler(req, res) {
  // CORS headers - mirroring your admin-auth layout
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse incoming packet from frontend
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    const { token, ts, op, path, data, id } = body;

    // Security Check: Re-verify the session token using your master password
    const secret = process.env.ADMIN_PASSWORD;
    const expectedToken = crypto
      .createHmac('sha256', secret)
      .update(String(ts))
      .digest('hex');

    if (token !== expectedToken) {
      return res.status(401).json({ ok: false, reason: 'Invalid credentials' });
    }

    // Direct Database Execution (Bypasses rules)
    const ref = db.ref(path);

    if (op === 'push') {
      const newRef = await ref.push(data);
      return res.status(200).json({ ok: true, id: newRef.key });
    } 
    
    if (op === 'update') {
      await ref.child(id).update(data);
      return res.status(200).json({ ok: true });
    } 
    
    if (op === 'remove') {
      await ref.child(id).remove();
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ ok: false, reason: 'Unknown operation' });

  } catch (error) {
    console.error('Database write failed:', error);
    return res.status(500).json({ ok: false, reason: error.message });
  }
};
/**
 * Vercel Serverless Function — /api/firebase-config
 * Serves the Firebase client config from environment variables
 * so nothing sensitive lives in source code or GitHub.
 */

module.exports = function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const config = {
    apiKey:            process.env.FIREBASE_API_KEY,
    authDomain:        process.env.FIREBASE_AUTH_DOMAIN,
    databaseURL:       process.env.FIREBASE_DATABASE_URL,
    projectId:         process.env.FIREBASE_PROJECT_ID,
    storageBucket:     process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId:             process.env.FIREBASE_APP_ID,
  };

  // Make sure every value loaded — if an env var is missing, fail loudly
  const missing = Object.entries(config).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) {
    console.error('Missing Firebase env vars:', missing);
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  // Cache for 5 minutes — config never changes at runtime
  res.setHeader('Cache-Control', 'public, max-age=300');
  return res.status(200).json(config);
};

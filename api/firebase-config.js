/**
 * Vercel Serverless Function — /api/firebase-config.js
 * Serves Firebase client config from environment variables
 * Keeps sensitive credentials out of source code
 */

module.exports = function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Build config from environment variables
  const config = {
    apiKey:            process.env.FIREBASE_API_KEY,
    authDomain:        process.env.FIREBASE_AUTH_DOMAIN,
    databaseURL:       process.env.FIREBASE_DATABASE_URL,
    projectId:         process.env.FIREBASE_PROJECT_ID,
    storageBucket:     process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId:             process.env.FIREBASE_APP_ID,
  };

  // Validate all required env vars are present
  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.error('Missing Firebase environment variables:', missing);
    return res.status(500).json({ 
      error: 'Server misconfiguration',
      missing: missing 
    });
  }

  // Cache for 5 minutes - config is static
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
  
  return res.status(200).json(config);
};

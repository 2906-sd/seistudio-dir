module.exports = function handler(req, res) {
  const country = req.headers['x-vercel-ip-country'] || null;
  res.status(200).json({ country });
};
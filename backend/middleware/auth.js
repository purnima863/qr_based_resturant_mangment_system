const jwt = require('jsonwebtoken');

/* Protects every /api/admin/* route (except login). Token comes from "Authorization: Bearer <token>". */
module.exports = function requireAdmin(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Login required' });
  try { req.admin = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch (e) { res.status(401).json({ error: 'Session expired — please log in again' }); }
};

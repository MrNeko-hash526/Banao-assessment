const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || 'dev-secret';

module.exports = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return next();
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, secret);
    req.user = payload;
  } catch (e) {
    // invalid token: ignore and continue as unauthenticated
    // Do not return 401 here because this middleware is intentionally optional.
    console.warn('optionalAuth: invalid token');
  }
  return next();
};

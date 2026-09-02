const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'yanaDIPLOM'; // не забудь заменить

function authMiddleware(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    req.user = null;
    return next(); // всё равно продолжаем, просто без user
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // тут будет { id, email, name, ... }
  } catch (err) {
    req.user = null; // токен недействителен
  }

  next();
}

module.exports = authMiddleware;

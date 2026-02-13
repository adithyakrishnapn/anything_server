const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const tokenFromHeader = header.startsWith("Bearer ") ? header.slice(7) : null;
  const token = tokenFromHeader || req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({ message: "Missing access token" });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid access token" });
  }
}

module.exports = { auth };

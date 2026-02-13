const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");

const User = require("../models/User");
const { redisClient } = require("../config/redis");
const {
  jwtSecret,
  jwtRefreshSecret,
  accessTokenTtl,
  refreshTokenTtl,
  nodeEnv,
  defaultAdminEmails,
} = require("../config/env");
const { asyncHandler } = require("../utils/asyncHandler");

const signupSchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().trim().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

function toSeconds(value) {
  if (!value) return 0;
  if (typeof value === "number") return value;
  const match = String(value).trim().match(/^(\d+)([smhd])?$/i);
  if (!match) return 0;
  const amount = Number(match[1]);
  const unit = (match[2] || "s").toLowerCase();
  const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
  return amount * (multipliers[unit] || 1);
}

function signAccessToken(user) {
  return jwt.sign(
    { role: user.role },
    jwtSecret,
    { subject: user._id.toString(), expiresIn: accessTokenTtl }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    {},
    jwtRefreshSecret,
    { subject: user._id.toString(), expiresIn: refreshTokenTtl }
  );
}

function setRefreshCookie(res, token) {
  const maxAge = toSeconds(refreshTokenTtl) * 1000;
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: nodeEnv === "production",
    sameSite: "lax",
    maxAge,
  });
}

function safeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

const signup = asyncHandler(async (req, res) => {
  const data = signupSchema.parse(req.body);
  const existing = await User.findOne({ email: data.email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: "Email already in use" });
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const emailLower = data.email.toLowerCase();
  const role = defaultAdminEmails.includes(emailLower) ? "admin" : "user";

  const user = await User.create({
    name: data.name,
    email: emailLower,
    passwordHash,
    role,
  });

  res.status(201).json({ user: safeUser(user) });
});

const login = asyncHandler(async (req, res) => {
  const data = loginSchema.parse(req.body);
  const user = await User.findOne({ email: data.email.toLowerCase() });

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const ok = await bcrypt.compare(data.password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await redisClient.setEx(
    `refresh:${user._id}`,
    toSeconds(refreshTokenTtl),
    refreshToken
  );

  setRefreshCookie(res, refreshToken);

  return res.json({ accessToken, user: safeUser(user) });
});

const logout = asyncHandler(async (req, res) => {
  if (req.user?.id) {
    await redisClient.del(`refresh:${req.user.id}`);
  }

  res.clearCookie("refreshToken");
  return res.json({ ok: true });
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) {
    return res.status(401).json({ message: "Missing refresh token" });
  }

  let payload;
  try {
    payload = jwt.verify(token, jwtRefreshSecret);
  } catch (err) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }

  const userId = payload.sub;
  const stored = await redisClient.get(`refresh:${userId}`);
  if (!stored || stored !== token) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }

  const accessToken = signAccessToken(user);
  const newRefreshToken = signRefreshToken(user);

  await redisClient.setEx(
    `refresh:${user._id}`,
    toSeconds(refreshTokenTtl),
    newRefreshToken
  );

  setRefreshCookie(res, newRefreshToken);

  return res.json({ accessToken });
});

const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  return res.json({ user: safeUser(user) });
});

module.exports = {
  signup,
  login,
  logout,
  refresh,
  me,
};

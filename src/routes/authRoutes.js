const express = require("express");
const { authLimiter } = require("../middlewares/rateLimiters");
const { auth } = require("../middlewares/auth");
const {
  signup,
  login,
  logout,
  refresh,
  me,
} = require("../controllers/authController");

const router = express.Router();

router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.post("/logout", auth, logout);
router.post("/refresh", refresh);
router.get("/me", auth, me);

module.exports = router;

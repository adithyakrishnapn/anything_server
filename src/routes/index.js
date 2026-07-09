const express = require("express");
const authRoutes = require("./authRoutes");
const blogRoutes = require("./blogRoutes");
const leadRoutes = require("./leadRoutes");
const analyticsRoutes = require("./analyticsRoutes");
const adminRoutes = require("./adminRoutes");
const sitemapRoutes = require("./sitemapRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/blogs", blogRoutes);
router.use("/leads", leadRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/admin", adminRoutes);
router.use("/", sitemapRoutes);

module.exports = router;

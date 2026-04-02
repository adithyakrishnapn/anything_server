const express = require("express");
const authRoutes = require("./authRoutes");
const blogRoutes = require("./blogRoutes");
const sitemapRoutes = require("./sitemapRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/blogs", blogRoutes);
router.use("/", sitemapRoutes);

module.exports = router;

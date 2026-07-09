const express = require("express");

const { analyticsLimiter } = require("../middlewares/rateLimiters");
const { recordPageView } = require("../controllers/analyticsController");

const router = express.Router();

router.post("/pageview", analyticsLimiter, recordPageView);

module.exports = router;
const express = require("express");

const { publicFormLimiter } = require("../middlewares/rateLimiters");
const { createLeadPublic } = require("../controllers/leadController");

const router = express.Router();

router.post("/", publicFormLimiter, createLeadPublic);

module.exports = router;
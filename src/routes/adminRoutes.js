const express = require("express");

const { auth } = require("../middlewares/auth");
const { requireAdmin } = require("../middlewares/requireAdmin");
const {
  createLead,
  deleteLead,
  listLeads,
  logFollowup,
  updateLead,
} = require("../controllers/leadController");
const { getDashboard } = require("../controllers/analyticsController");

const router = express.Router();

router.use(auth, requireAdmin);

router.get("/dashboard", getDashboard);
router.get("/leads", listLeads);
router.post("/leads", createLead);
router.put("/leads/:id", updateLead);
router.delete("/leads/:id", deleteLead);
router.post("/leads/:id/followup", logFollowup);

module.exports = router;
const { z } = require("zod");

const Blog = require("../models/Blog");
const Lead = require("../models/Lead");
const ViewMetric = require("../models/ViewMetric");
const { asyncHandler } = require("../utils/asyncHandler");

const pageViewSchema = z.object({
  path: z.string().trim().min(1),
  kind: z.enum(["page", "blog"]).optional(),
});

function normalizePath(pathname) {
  return pathname.split("?")[0].split("#")[0] || "/";
}

const recordPageView = asyncHandler(async (req, res) => {
  const data = pageViewSchema.parse(req.body);
  const path = normalizePath(data.path);
  const kind = data.kind || (path.startsWith("/blogs/") ? "blog" : "page");
  const key = kind === "blog" ? path.replace(/^\/blogs\//, "") : path;

  const metric = await ViewMetric.findOneAndUpdate(
    { kind, key },
    {
      $inc: { count: 1 },
      $set: {
        title: path,
        lastViewedAt: new Date(),
      },
      $setOnInsert: {
        firstSeenAt: new Date(),
      },
    },
    { new: true, upsert: true }
  );

  return res.status(201).json({ metric });
});

const getDashboard = asyncHandler(async (req, res) => {
  const [
    totalLeads,
    newLeads,
    contactedLeads,
    qualifiedLeads,
    wonLeads,
    lostLeads,
    pageViewTotals,
    blogViewTotals,
    publishedBlogs,
    topPages,
    topBlogs,
    recentLeads,
    recentViews,
  ] = await Promise.all([
    Lead.countDocuments(),
    Lead.countDocuments({ status: "new" }),
    Lead.countDocuments({ status: "contacted" }),
    Lead.countDocuments({ status: "qualified" }),
    Lead.countDocuments({ status: "won" }),
    Lead.countDocuments({ status: "lost" }),
    ViewMetric.aggregate([
      { $match: { kind: "page" } },
      { $group: { _id: null, total: { $sum: "$count" } } },
    ]),
    ViewMetric.aggregate([
      { $match: { kind: "blog" } },
      { $group: { _id: null, total: { $sum: "$count" } } },
    ]),
    Blog.countDocuments({ status: "published" }),
    ViewMetric.find({ kind: "page" }).sort({ count: -1 }).limit(5).lean(),
    ViewMetric.find({ kind: "blog" }).sort({ count: -1 }).limit(5).lean(),
    Lead.find().sort({ updatedAt: -1 }).limit(8).lean(),
    ViewMetric.find().sort({ lastViewedAt: -1 }).limit(8).lean(),
  ]);

  const leadStatusBreakdown = [
    { status: "new", total: newLeads },
    { status: "contacted", total: contactedLeads },
    { status: "qualified", total: qualifiedLeads },
    { status: "won", total: wonLeads },
    { status: "lost", total: lostLeads },
  ];

  return res.json({
    metrics: {
      totalLeads,
      newLeads,
      contactedLeads,
      qualifiedLeads,
      wonLeads,
      lostLeads,
      visits: pageViewTotals[0]?.total || 0,
      blogViews: blogViewTotals[0]?.total || 0,
      publishedBlogs,
    },
    leadStatusBreakdown,
    topPages,
    topBlogs,
    recentLeads,
    recentViews,
  });
});

module.exports = {
  recordPageView,
  getDashboard,
};
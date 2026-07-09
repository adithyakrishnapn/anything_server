const { z } = require("zod");

const Lead = require("../models/Lead");
const { asyncHandler } = require("../utils/asyncHandler");

const leadSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().optional(),
  company: z.string().trim().optional(),
  industry: z.string().trim().optional(),
  message: z.string().trim().optional(),
  source: z.string().trim().optional(),
  status: z.enum(["new", "contacted", "qualified", "won", "lost"]).optional(),
  notes: z.string().trim().optional(),
  nextFollowupAt: z.string().trim().optional(),
});

const updateLeadSchema = leadSchema.partial();

function normalizeLead(data, defaults = {}) {
  const nextFollowupAt = data.nextFollowupAt || defaults.nextFollowupAt;

  return {
    name: data.name ?? defaults.name,
    email: ((data.email ?? defaults.email) || "").toLowerCase(),
    phone: data.phone ?? defaults.phone,
    company: data.company ?? defaults.company,
    industry: data.industry ?? defaults.industry,
    message: data.message ?? defaults.message,
    source: data.source ?? defaults.source ?? "website",
    status: data.status ?? defaults.status ?? "new",
    notes: data.notes ?? defaults.notes,
    nextFollowupAt: nextFollowupAt ? new Date(nextFollowupAt) : undefined,
  };
}

function buildSearchQuery(search) {
  if (!search) return {};

  const pattern = String(search).trim();
  return {
    $or: [
      { name: { $regex: pattern, $options: "i" } },
      { email: { $regex: pattern, $options: "i" } },
      { company: { $regex: pattern, $options: "i" } },
      { industry: { $regex: pattern, $options: "i" } },
      { source: { $regex: pattern, $options: "i" } },
      { message: { $regex: pattern, $options: "i" } },
      { notes: { $regex: pattern, $options: "i" } },
    ],
  };
}

const createLeadPublic = asyncHandler(async (req, res) => {
  const data = leadSchema.parse(req.body);
  const lead = await Lead.create(normalizeLead(data, { source: data.source || "website" }));

  return res.status(201).json({ lead });
});

const listLeads = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit || 25), 1), 100);
  const status = String(req.query.status || "").trim();
  const search = String(req.query.search || "").trim();

  const query = buildSearchQuery(search);
  if (status) {
    query.status = status;
  }

  const [items, total] = await Promise.all([
    Lead.find(query)
      .sort({ updatedAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Lead.countDocuments(query),
  ]);

  return res.json({ items, page, limit, total });
});

const createLead = asyncHandler(async (req, res) => {
  const data = leadSchema.parse(req.body);
  const lead = await Lead.create(normalizeLead(data, { source: data.source || "manual" }));

  return res.status(201).json({ lead });
});

const updateLead = asyncHandler(async (req, res) => {
  const data = updateLeadSchema.parse(req.body);
  const lead = await Lead.findById(req.params.id);

  if (!lead) {
    return res.status(404).json({ message: "Lead not found" });
  }

  if (data.name !== undefined) lead.name = data.name;
  if (data.email !== undefined) lead.email = data.email.toLowerCase();
  if (data.phone !== undefined) lead.phone = data.phone;
  if (data.company !== undefined) lead.company = data.company;
  if (data.industry !== undefined) lead.industry = data.industry;
  if (data.message !== undefined) lead.message = data.message;
  if (data.source !== undefined) lead.source = data.source;
  if (data.status !== undefined) lead.status = data.status;
  if (data.notes !== undefined) lead.notes = data.notes;
  if (data.nextFollowupAt !== undefined) {
    lead.nextFollowupAt = data.nextFollowupAt ? new Date(data.nextFollowupAt) : undefined;
  }

  await lead.save();

  return res.json({ lead });
});

const deleteLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findByIdAndDelete(req.params.id);

  if (!lead) {
    return res.status(404).json({ message: "Lead not found" });
  }

  return res.json({ ok: true });
});

const logFollowup = asyncHandler(async (req, res) => {
  const followupSchema = z.object({
    subject: z.string().trim().optional(),
    message: z.string().trim().optional(),
  });

  const data = followupSchema.parse(req.body);
  const lead = await Lead.findById(req.params.id);

  if (!lead) {
    return res.status(404).json({ message: "Lead not found" });
  }

  lead.followupCount += 1;
  lead.lastFollowupAt = new Date();
  lead.lastContactedAt = new Date();
  if (data.subject !== undefined) {
    lead.lastFollowupSubject = data.subject;
  }
  if (data.message !== undefined) {
    lead.lastFollowupMessage = data.message;
  }

  await lead.save();

  return res.json({ lead });
});

module.exports = {
  createLeadPublic,
  listLeads,
  createLead,
  updateLead,
  deleteLead,
  logFollowup,
};
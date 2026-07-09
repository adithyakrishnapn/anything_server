const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    company: { type: String, trim: true },
    industry: { type: String, trim: true },
    source: { type: String, trim: true, default: "website" },
    message: { type: String, trim: true },
    status: {
      type: String,
      enum: ["new", "contacted", "qualified", "won", "lost"],
      default: "new",
    },
    notes: { type: String, trim: true },
    followupCount: { type: Number, default: 0 },
    lastFollowupAt: { type: Date },
    lastFollowupSubject: { type: String, trim: true },
    lastFollowupMessage: { type: String, trim: true },
    lastContactedAt: { type: Date },
    nextFollowupAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lead", leadSchema);
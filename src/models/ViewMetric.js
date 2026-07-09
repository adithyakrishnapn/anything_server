const mongoose = require("mongoose");

const viewMetricSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ["page", "blog"], required: true },
    key: { type: String, required: true, trim: true },
    title: { type: String, trim: true },
    count: { type: Number, default: 0 },
    firstSeenAt: { type: Date, default: Date.now },
    lastViewedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

viewMetricSchema.index({ kind: 1, key: 1 }, { unique: true });

module.exports = mongoose.model("ViewMetric", viewMetricSchema);
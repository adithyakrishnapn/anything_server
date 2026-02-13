const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    excerpt: { type: String, trim: true },
    content: { type: String, required: true },
    tags: [{ type: String, trim: true, lowercase: true }],
    coverImage: { type: String, trim: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    publishedAt: { type: Date },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    seoTitle: { type: String, trim: true },
    seoDescription: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Blog", blogSchema);

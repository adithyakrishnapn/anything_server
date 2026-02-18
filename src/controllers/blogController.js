const { z } = require("zod");

const Blog = require("../models/Blog");
const { asyncHandler } = require("../utils/asyncHandler");
const { toSlug } = require("../utils/slug");
const { invalidatePrefix } = require("../middlewares/cache");
const { generateSitemap } = require("../utils/sitemapHelper");

const createSchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.string().min(1),
  tags: z.union([z.array(z.string()), z.string()]).optional(),
  coverImage: z.string().url().optional(),
  status: z.enum(["draft", "published"]).optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

const updateSchema = createSchema.partial();

function normalizeTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map((t) => t.trim()).filter(Boolean);
  return String(tags)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

async function ensureUniqueSlug(base, blogId) {
  const baseSlug = toSlug(base);
  let slug = baseSlug;
  let counter = 2;

  while (await Blog.findOne({ slug, _id: { $ne: blogId } })) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return slug;
}

async function invalidateBlogCache() {
  await invalidatePrefix("cache:blogs:");
  await invalidatePrefix("cache:blog:");
}

const createBlog = asyncHandler(async (req, res) => {
  const data = createSchema.parse(req.body);
  const slugSource = data.slug || data.title;
  const slug = await ensureUniqueSlug(slugSource);

  const blog = await Blog.create({
    title: data.title,
    slug,
    excerpt: data.excerpt,
    content: data.content,
    tags: normalizeTags(data.tags),
    coverImage: data.coverImage,
    author: req.user.id,
    status: data.status || "draft",
    seoTitle: data.seoTitle,
    seoDescription: data.seoDescription,
    publishedAt: data.status === "published" ? new Date() : undefined,
  });

  await invalidateBlogCache();

  // Regenerate sitemap if blog is published
  if (blog.status === "published") {
    await generateSitemap();
  }

  res.status(201).json({ blog });
});

const listBlogs = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 50);
  const search = String(req.query.search || "").trim();
  const tags = normalizeTags(req.query.tags);
  const sortField = req.query.sort === "createdAt" ? "createdAt" : "publishedAt";

  const query = {};
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { excerpt: { $regex: search, $options: "i" } },
      { content: { $regex: search, $options: "i" } },
    ];
  }
  if (tags.length > 0) {
    query.tags = { $in: tags.map((tag) => tag.toLowerCase()) };
  }

  const [items, total] = await Promise.all([
    Blog.find(query)
      .sort({ [sortField]: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Blog.countDocuments(query),
  ]);

  res.json({ items, page, limit, total });
});

const getBlogBySlug = asyncHandler(async (req, res) => {
  const blog = await Blog.findOne({ slug: req.params.slug });
  if (!blog) {
    return res.status(404).json({ message: "Blog not found" });
  }
  return res.json({ blog });
});

const updateBlog = asyncHandler(async (req, res) => {
  const data = updateSchema.parse(req.body);
  const blog = await Blog.findById(req.params.id);
  if (!blog) {
    return res.status(404).json({ message: "Blog not found" });
  }

  const wasPublished = blog.status === "published";

  if (data.title !== undefined) blog.title = data.title;
  if (data.slug !== undefined || data.title !== undefined) {
    const slugSource = data.slug || blog.title;
    blog.slug = await ensureUniqueSlug(slugSource, blog._id);
  }

  if (data.excerpt !== undefined) blog.excerpt = data.excerpt;
  if (data.content !== undefined) blog.content = data.content;
  if (data.tags !== undefined) blog.tags = normalizeTags(data.tags);
  if (data.coverImage !== undefined) blog.coverImage = data.coverImage;
  if (data.status !== undefined) blog.status = data.status;
  if (data.seoTitle !== undefined) blog.seoTitle = data.seoTitle;
  if (data.seoDescription !== undefined) blog.seoDescription = data.seoDescription;

  if (blog.status === "published" && !blog.publishedAt) {
    blog.publishedAt = new Date();
  }

  await blog.save();
  await invalidateBlogCache();

  // Regenerate sitemap if blog is published or was published
  if (blog.status === "published" || wasPublished) {
    await generateSitemap();
  }

  return res.json({ blog });
});

const deleteBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findByIdAndDelete(req.params.id);
  if (!blog) {
    return res.status(404).json({ message: "Blog not found" });
  }
  await invalidateBlogCache();

  // Regenerate sitemap if deleted blog was published
  if (blog.status === "published") {
    await generateSitemap();
  }

  return res.json({ ok: true });
});

module.exports = {
  createBlog,
  listBlogs,
  getBlogBySlug,
  updateBlog,
  deleteBlog,
};

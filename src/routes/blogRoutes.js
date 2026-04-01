const express = require("express");
const { auth } = require("../middlewares/auth");
const { requireAdmin } = require("../middlewares/requireAdmin");
const { cache } = require("../middlewares/cache");
const {
  createBlog,
  listBlogs,
  getBlogById,
  getBlogBySlug,
  updateBlog,
  deleteBlog,
} = require("../controllers/blogController");

const router = express.Router();

router.post("/", auth, requireAdmin, createBlog);
router.get(
  "/",
  cache((req) => `cache:blogs:${JSON.stringify(req.query)}`, 60),
  listBlogs
);
router.get(
  "/id/:id",
  cache((req) => `cache:blog:id:${req.params.id}`, 120),
  getBlogById
);
router.get(
  "/:slug",
  cache((req) => `cache:blog:${req.params.slug}`, 120),
  getBlogBySlug
);
router.put("/:id", auth, requireAdmin, updateBlog);
router.delete("/:id", auth, requireAdmin, deleteBlog);

module.exports = router;

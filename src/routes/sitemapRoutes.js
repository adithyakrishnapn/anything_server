const express = require("express");
const { SitemapStream, streamToPromise } = require("sitemap");
const Blog = require("../models/Blog");

const router = express.Router();

const baseLinks = [
  { url: "/", changefreq: "weekly", priority: 1.0 },
  { url: "/about", changefreq: "monthly", priority: 0.8 },
  { url: "/services", changefreq: "weekly", priority: 0.9 },
  { url: "/templates", changefreq: "weekly", priority: 0.9 },
  { url: "/book-demo", changefreq: "monthly", priority: 0.7 },
  { url: "/blogs", changefreq: "weekly", priority: 0.85 },
];

router.get("/sitemap.xml", async (req, res) => {
  try {
    res.header("Content-Type", "application/xml");

    const blogs = await Blog.find({
      status: "published",
      slug: { $exists: true },
    }).lean();

    const blogLinks = blogs.map((blog) => ({
      url: `/blogs/${blog.slug}`,
      changefreq: "monthly",
      priority: 0.75,
    }));

    const links = [...baseLinks, ...blogLinks];

    const sitemap = new SitemapStream({
      hostname: "https://www.anythingventures.in",
    });

    links.forEach((link) => sitemap.write(link));
    sitemap.end();

    const xml = await streamToPromise(sitemap);
    res.send(xml);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;

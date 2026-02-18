const { SitemapStream, streamToPromise } = require('sitemap');
const { createWriteStream } = require('fs');
const path = require('path');
const fs = require('fs');
const Blog = require('../models/Blog');

const baseLinks = [
    { url: '/', changefreq: 'weekly', priority: 1.0 },
    { url: '/about', changefreq: 'monthly', priority: 0.8 },
    { url: '/services', changefreq: 'weekly', priority: 0.9 },
    { url: '/templates', changefreq: 'weekly', priority: 0.9 },
    { url: '/book-demo', changefreq: 'monthly', priority: 0.7 },
    { url: '/blogs', changefreq: 'weekly', priority: 0.85 },
];

async function generateSitemap() {
    try {
        // Fetch all published blogs from database
        const blogs = await Blog.find({ status: 'published', slug: { $exists: true } }).lean();
        
        const blogLinks = blogs.map(blog => ({
            url: `/blogs/${blog.slug}`,
            changefreq: 'monthly',
            priority: 0.75,
        }));

        const links = [...baseLinks, ...blogLinks];

        const sitemap = new SitemapStream({
            hostname: 'https://www.anythingventures.in',
        });

        // Write to backend's public directory (primary location)
        let sitemapPath = path.join(__dirname, '../../public/sitemap.xml');
        
        // Create directory if it doesn't exist
        const sitemapDir = path.dirname(sitemapPath);
        if (!fs.existsSync(sitemapDir)) {
            fs.mkdirSync(sitemapDir, { recursive: true });
        }

        const writeStream = createWriteStream(sitemapPath);
        
        sitemap.pipe(writeStream);

        links.forEach(link => sitemap.write(link));
        sitemap.end();

        await streamToPromise(sitemap);
        console.log(`✅ Sitemap generated with ${links.length} URLs (${blogLinks.length} blogs)`);
        console.log(`📁 Saved to: ${sitemapPath}`);
        return true;
    } catch (err) {
        console.error(`❌ Error generating sitemap: ${err.message}`);
        return false;
    }
}

module.exports = {
    generateSitemap,
};

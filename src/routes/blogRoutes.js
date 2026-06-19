/**
 * blogRoutes.js
 * Public-facing routes — no login required.
 *
 * GET /              →  landing page (all published posts)
 * GET /post/:slug    →  single post view
 */

const express      = require('express');
const router       = express.Router();
const db           = require('../config/database');
const { marked }   = require('marked');

// ─── GET / — Blog Home / Landing Page ────────────────────────────────────────
router.get('/', (req, res) => {
  const { category, search } = req.query;

  // Build query dynamically based on filter/search params
  let query  = `
    SELECT posts.*, users.username AS author_name
    FROM   posts
    JOIN   users ON posts.author_id = users.id
    WHERE  posts.status = 'published'
  `;
  const params = [];

  if (category) {
    query += ' AND posts.category = ?';
    params.push(category);
  }

  if (search) {
    query += ' AND (posts.title LIKE ? OR posts.excerpt LIKE ? OR posts.content LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY posts.created_at DESC';

  const posts = db.prepare(query).all(...params);

  // Get all unique categories for the sidebar/filter buttons
  const categories = db.prepare(`
    SELECT DISTINCT category
    FROM   posts
    WHERE  status = 'published'
    ORDER  BY category
  `).all();

  res.render('blog/home', {
    title           : 'TechBlog — Learn. Build. Deploy.',
    posts,
    categories,
    selectedCategory: category || '',
    searchQuery     : search   || ''
  });
});

// ─── GET /post/:slug — Single Blog Post ──────────────────────────────────────
router.get('/post/:slug', (req, res) => {
  const post = db.prepare(`
    SELECT posts.*, users.username AS author_name
    FROM   posts
    JOIN   users ON posts.author_id = users.id
    WHERE  posts.slug = ? AND posts.status = 'published'
  `).get(req.params.slug);

  if (!post) {
    return res.status(404).render('error', {
      title  : '404 — Post Not Found',
      message: 'The blog post you are looking for does not exist or has been removed.'
    });
  }

  // Grab up to 3 related posts from the same category
  const relatedPosts = db.prepare(`
    SELECT id, title, slug, excerpt, category, created_at
    FROM   posts
    WHERE  category = ? AND id != ? AND status = 'published'
    LIMIT  3
  `).all(post.category, post.id);

  res.render('blog/post', {
    title      : `${post.title} — TechBlog`,
    post,
    relatedPosts,
    markedContent: marked.parse(post.content)  // parse markdown server-side
  });
});

module.exports = router;

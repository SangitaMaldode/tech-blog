/**
 * userRoutes.js
 * Routes accessible by logged-in users (role = 'user' OR 'admin').
 *
 * GET /dashboard  →  personal reading dashboard
 */

const express            = require('express');
const router             = express.Router();
const db                 = require('../config/database');
const { isAuthenticated } = require('../middleware/authMiddleware');

// Protect all user routes — any logged-in user can access these
router.use(isAuthenticated);

// ─── GET /dashboard — User Reading Dashboard ─────────────────────────────────
router.get('/', (req, res) => {
  const { category, search } = req.query;

  // Build query with optional filters
  let query = `
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

  const posts      = db.prepare(query).all(...params);
  const categories = db.prepare(`
    SELECT DISTINCT category FROM posts WHERE status = 'published' ORDER BY category
  `).all();

  // Quick stats for the dashboard header
  const stats = {
    totalPosts     : db.prepare("SELECT COUNT(*) AS n FROM posts WHERE status = 'published'").get().n,
    totalCategories: db.prepare("SELECT COUNT(DISTINCT category) AS n FROM posts WHERE status = 'published'").get().n
  };

  res.render('user/dashboard', {
    title           : `Dashboard — ${req.session.user.username}`,
    posts,
    categories,
    stats,
    selectedCategory: category || '',
    searchQuery     : search   || ''
  });
});

module.exports = router;

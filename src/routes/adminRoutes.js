/**
 * adminRoutes.js
 * All /admin routes — protected by the isAuthenticated middleware.
 *
 * GET  /admin                  →  dashboard
 * GET  /admin/posts            →  list all posts
 * GET  /admin/posts/create     →  new post form
 * POST /admin/posts/create     →  save new post
 * GET  /admin/posts/edit/:id   →  edit post form
 * POST /admin/posts/edit/:id   →  update post
 * POST /admin/posts/delete/:id →  delete post
 */

const express        = require('express');
const router         = express.Router();
const db             = require('../config/database');
const { isAdmin } = require('../middleware/authMiddleware');

// Protect EVERY admin route — only 'admin' role gets through
router.use(isAdmin);

// ─── Helper: turn a title into a URL-safe slug ────────────────────────────────
function makeSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')   // remove special chars
    .replace(/\s+/g, '-')            // spaces → hyphens
    .replace(/-+/g, '-');            // collapse multiple hyphens
}

// ─── GET /admin — Dashboard ───────────────────────────────────────────────────
router.get('/', (req, res) => {
  const stats = {
    totalPosts    : db.prepare("SELECT COUNT(*) AS n FROM posts").get().n,
    publishedPosts: db.prepare("SELECT COUNT(*) AS n FROM posts WHERE status = 'published'").get().n,
    draftPosts    : db.prepare("SELECT COUNT(*) AS n FROM posts WHERE status = 'draft'").get().n,
    totalUsers    : db.prepare("SELECT COUNT(*) AS n FROM users").get().n
  };

  const recentPosts = db.prepare(`
    SELECT id, title, category, status, created_at
    FROM   posts
    ORDER  BY created_at DESC
    LIMIT  5
  `).all();

  res.render('admin/dashboard', {
    title      : 'Dashboard — TechBlog Admin',
    stats,
    recentPosts
  });
});

// ─── GET /admin/posts — List All Posts ───────────────────────────────────────
router.get('/posts', (req, res) => {
  const posts = db.prepare(`
    SELECT posts.*, users.username AS author_name
    FROM   posts
    JOIN   users ON posts.author_id = users.id
    ORDER  BY posts.created_at DESC
  `).all();

  res.render('admin/posts', {
    title: 'Manage Posts — TechBlog Admin',
    posts
  });
});

// ─── GET /admin/posts/create — New Post Form ─────────────────────────────────
router.get('/posts/create', (req, res) => {
  res.render('admin/post-form', {
    title: 'Create Post — TechBlog Admin',
    post : null   // null signals the template that this is a CREATE, not EDIT
  });
});

// ─── POST /admin/posts/create — Save New Post ────────────────────────────────
router.post('/posts/create', (req, res) => {
  const { title, content, excerpt, category, tags, status } = req.body;

  if (!title || !content) {
    req.flash('error', 'Title and content are required.');
    return res.redirect('/admin/posts/create');
  }

  // Ensure the slug is unique
  let slug = makeSlug(title);
  if (db.prepare('SELECT id FROM posts WHERE slug = ?').get(slug)) {
    slug = `${slug}-${Date.now()}`;   // append timestamp to guarantee uniqueness
  }

  db.prepare(`
    INSERT INTO posts (title, slug, excerpt, content, category, tags, status, author_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title,
    slug,
    excerpt  || '',
    content,
    category || 'General',
    tags     || '',
    status   || 'draft',
    req.session.user.id
  );

  req.flash('success', 'Post created successfully!');
  res.redirect('/admin/posts');
});

// ─── GET /admin/posts/edit/:id — Edit Form ───────────────────────────────────
router.get('/posts/edit/:id', (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);

  if (!post) {
    req.flash('error', 'Post not found.');
    return res.redirect('/admin/posts');
  }

  res.render('admin/post-form', {
    title: 'Edit Post — TechBlog Admin',
    post          // pass existing data so the form pre-fills
  });
});

// ─── POST /admin/posts/edit/:id — Save Changes ───────────────────────────────
router.post('/posts/edit/:id', (req, res) => {
  const { title, content, excerpt, category, tags, status } = req.body;

  if (!title || !content) {
    req.flash('error', 'Title and content are required.');
    return res.redirect(`/admin/posts/edit/${req.params.id}`);
  }

  db.prepare(`
    UPDATE posts
    SET title = ?, content = ?, excerpt = ?, category = ?,
        tags = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    title,
    content,
    excerpt  || '',
    category || 'General',
    tags     || '',
    status   || 'draft',
    req.params.id
  );

  req.flash('success', 'Post updated successfully!');
  res.redirect('/admin/posts');
});

// ─── POST /admin/posts/delete/:id — Delete Post ──────────────────────────────
router.post('/posts/delete/:id', (req, res) => {
  db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
  req.flash('success', 'Post deleted.');
  res.redirect('/admin/posts');
});

module.exports = router;

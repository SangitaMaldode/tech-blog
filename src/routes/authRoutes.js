/**
 * authRoutes.js
 * Handles: GET /auth/login  →  show login page
 *          POST /auth/login  →  verify credentials & create session
 *          GET /auth/logout  →  destroy session & redirect
 */

const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const db      = require('../config/database');

// ─── GET /auth/login — Show Login Page ───────────────────────────────────────
router.get('/login', (req, res) => {
  // Already logged in? Redirect based on role
  if (req.session.user) {
    return res.redirect(req.session.user.role === 'admin' ? '/admin' : '/dashboard');
  }
  res.render('auth/login', { title: 'Login — TechBlog' });
});

// ─── POST /auth/login — Handle Login Form ────────────────────────────────────
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // 1. Basic input check
  if (!username || !password) {
    req.flash('error', 'Please enter both username and password.');
    return res.redirect('/auth/login');
  }

  // 2. Look up user in the database
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim());

  // 3. User not found → same error message (don't reveal which field is wrong)
  if (!user) {
    req.flash('error', 'Invalid username or password.');
    return res.redirect('/auth/login');
  }

  // 4. Compare the submitted password with the stored hash
  const passwordMatches = bcrypt.compareSync(password, user.password);

  if (!passwordMatches) {
    req.flash('error', 'Invalid username or password.');
    return res.redirect('/auth/login');
  }

  // 5. Credentials are valid — store safe user info in session
  //    NEVER store the password in the session!
  req.session.user = {
    id      : user.id,
    username: user.username,
    email   : user.email,
    role    : user.role
  };

  req.flash('success', `Welcome back, ${user.username}!`);
  // Redirect based on role: admin → /admin, regular user → /dashboard
  res.redirect(user.role === 'admin' ? '/admin' : '/dashboard');
});

// ─── GET /auth/logout — Destroy Session ──────────────────────────────────────
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Session destroy error:', err);
    res.redirect('/auth/login');
  });
});

module.exports = router;

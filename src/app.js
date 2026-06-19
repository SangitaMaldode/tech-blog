/**
 * app.js  —  Main entry point
 * Loads config, registers middleware, mounts routes, starts the server.
 */

// Load .env variables FIRST so every other module can read them
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const flash   = require('connect-flash');
const path    = require('path');

// ─── Initialize Database (runs once on startup) ───────────────────────────────
// This creates tables and seeds the admin user + sample posts if missing.
require('./config/database');

// ─── Import Route Handlers ────────────────────────────────────────────────────
const authRoutes  = require('./routes/authRoutes');   // /auth/login, /auth/logout
const blogRoutes  = require('./routes/blogRoutes');   // /, /post/:slug
const userRoutes  = require('./routes/userRoutes');   // /dashboard  (any logged-in user)
const adminRoutes = require('./routes/adminRoutes');  // /admin/*    (admin only)

const app = express();

// ─── View Engine (EJS) ────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─── Middleware ───────────────────────────────────────────────────────────────
// Parse HTML form data  (req.body)
app.use(express.urlencoded({ extended: true }));
// Parse JSON body (for future API use)
app.use(express.json());
// Serve CSS / JS / images from /public
app.use(express.static(path.join(__dirname, '../public')));

// Session: stores login state between requests
app.use(session({
  secret           : process.env.SESSION_SECRET || 'changeme-in-production',
  resave           : false,
  saveUninitialized: false,
  cookie: {
    // Only send cookie over HTTPS in production
    secure  : process.env.NODE_ENV === 'production',
    maxAge  : 24 * 60 * 60 * 1000  // 1 day in milliseconds
  }
}));

// Flash messages (one-time notifications like "Login successful")
app.use(flash());

// Make user info and flash messages available in every EJS template
app.use((req, res, next) => {
  res.locals.user    = req.session.user || null;
  res.locals.success = req.flash('success');
  res.locals.error   = req.flash('error');
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/',          blogRoutes);   // public blog (no login needed)
app.use('/auth',      authRoutes);   // login / logout
app.use('/dashboard', userRoutes);   // user dashboard (any logged-in role)
app.use('/admin',     adminRoutes);  // admin area (admin role only)

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('error', {
    title  : '404 — Page Not Found',
    message: 'The page you are looking for does not exist.'
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('\n🚀 TechBlog is running!');
  console.log(`   Blog       →  http://localhost:${PORT}`);
  console.log(`   Login      →  http://localhost:${PORT}/auth/login`);
  console.log(`   User dash  →  http://localhost:${PORT}/dashboard`);
  console.log(`   Admin dash →  http://localhost:${PORT}/admin\n`);
});

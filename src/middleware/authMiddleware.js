/**
 * authMiddleware.js
 * Role-based middleware for route protection.
 *
 * Roles in this app:
 *   admin — full access: admin dashboard + CRUD posts
 *   user  — read access: personal dashboard + all published posts
 */

/**
 * isAuthenticated — any logged-in user (admin OR user).
 * Use this to protect routes that both roles can access (e.g. /dashboard).
 */
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  req.flash('error', 'Please log in to continue.');
  res.redirect('/auth/login');
}

/**
 * isAdmin — only users with role = 'admin'.
 * Use this to protect /admin routes.
 * Regular users are sent to their own dashboard with an error message.
 */
function isAdmin(req, res, next) {
  if (req.session && req.session.user) {
    if (req.session.user.role === 'admin') {
      return next();
    }
    // Logged in but not admin → send to user dashboard
    req.flash('error', 'You do not have permission to access the admin area.');
    return res.redirect('/dashboard');
  }
  // Not logged in at all
  req.flash('error', 'Please log in to continue.');
  res.redirect('/auth/login');
}

module.exports = { isAuthenticated, isAdmin };

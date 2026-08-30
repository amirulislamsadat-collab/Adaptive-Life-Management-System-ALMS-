// ============================================================
// Controller: Auth — handles login, register, logout
// ============================================================
const bcrypt   = require('bcryptjs');
const User     = require('../models/User');
const Role     = require('../models/Role');
const AuthHandoff = require('../models/AuthHandoff');

// Builds the { id, name, email, role, role_id, setup_completed } shape the
// rest of the app expects on req.session.user, from a full user row.
async function buildSessionUser(user) {
  let roleName = 'Member';
  if (user.role_id) {
    const role = await Role.findById(user.role_id);
    if (role) roleName = role.name;
  }
  return { id: user.id, name: user.name, email: user.email, role: roleName, role_id: user.role_id, setup_completed: user.setup_completed };
}

exports.getLogin = (req, res) => res.render('login');

exports.postLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findByEmail(email);
    if (!user) { req.session.error = 'Invalid email or password.'; return res.redirect('/login'); }
    const match = await bcrypt.compare(password, user.password);
    if (!match) { req.session.error = 'Invalid email or password.'; return res.redirect('/login'); }

    let roleName = 'Member';
    if (user.role_id) {
      const role = await Role.findById(user.role_id);
      if (role) roleName = role.name;
    }
    req.session.user = { id: user.id, name: user.name, email: user.email, role: roleName, role_id: user.role_id, setup_completed: user.setup_completed };
    return res.redirect(user.setup_completed ? '/dashboard' : '/setup');
  } catch (err) {
    console.error('!!! LOGIN CRASH !!!! ->', err);
    req.session.error = 'Login failed. Please try again.';
    res.redirect('/login');
  }
};

exports.getRegister = (req, res) => res.render('register');

exports.postRegister = async (req, res) => {
  const { full_name, email, password, confirm_password } = req.body;
  if (!full_name || !email || !password) { req.session.error = 'All fields are required.'; return res.redirect('/register'); }
  if (password !== confirm_password) { req.session.error = 'Passwords do not match.'; return res.redirect('/register'); }
  try {
    const existing = await User.findByEmail(email);
    if (existing) { req.session.error = 'An account with that email already exists.'; return res.redirect('/register'); }
    const hashed = await bcrypt.hash(password, 10);
    const result = await User.create(full_name, email, hashed);
    req.session.user = { id: result.insertId, name: full_name, email, role: 'Member', role_id: null, setup_completed: 0 };
    req.session.success = "Account created! Let's set up your workspace.";
    res.redirect('/setup');
  } catch (err) {
    console.error('!!! REGISTRATION CRASH ERROR LOG !!! ->', err);
    req.session.error = 'Registration failed: ' + err.message;
    res.redirect('/register');
  }
};

exports.googleCallback = async (req, res) => {
  const user = req.user;
  if (!user) { req.session.error = 'Google sign-in failed. Please try again.'; return res.redirect('/login'); }
  try {
    // Log the browser itself in too — a safe fallback in case the deep-link
    // handoff below doesn't fire, so the user isn't stuck with nothing.
    req.session.user = await buildSessionUser(user);

    const client = ['desktop', 'mobile'].includes(req.query.state) ? req.query.state : 'web';
    if (client !== 'web') {
      const code = await AuthHandoff.create(user.id);
      return res.render('auth-handoff', { code });
    }
    res.redirect(user.setup_completed ? '/dashboard' : '/setup');
  } catch (err) {
    console.error('!!! GOOGLE LOGIN CRASH !!!! ->', err);
    req.session.error = 'Google sign-in failed. Please try again.';
    res.redirect('/login');
  }
};

// Reached by the desktop/mobile app's own embedded webview after it
// receives the alms://auth-callback?code=... deep link — establishes the
// session there too, since that webview has a separate cookie jar from
// whatever system browser Google sign-in actually happened in.
exports.completeHandoff = async (req, res) => {
  const code = req.query.code;
  if (!code) { req.session.error = 'That sign-in link is invalid.'; return res.redirect('/login'); }
  try {
    const userId = await AuthHandoff.consume(code);
    if (!userId) { req.session.error = 'That sign-in link expired. Please try signing in again.'; return res.redirect('/login'); }
    const user = await User.findById(userId);
    if (!user) { req.session.error = 'Account not found.'; return res.redirect('/login'); }
    req.session.user = await buildSessionUser(user);
    res.redirect(user.setup_completed ? '/dashboard' : '/setup');
  } catch (err) {
    console.error('Auth handoff error:', err);
    req.session.error = 'Sign-in failed. Please try again.';
    res.redirect('/login');
  }
};

exports.logout = (req, res) => { req.session.destroy(); res.redirect('/login'); };

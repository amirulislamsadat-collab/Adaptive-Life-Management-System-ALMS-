// ============================================================
// Controller: Dashboard — renders the main dashboard
// ============================================================
const Module = require('../models/Module');
const Task   = require('../models/Task');

exports.getDashboard = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  if (req.session.user.setup_completed != 1) return res.redirect('/setup');
  const userId = req.session.user.id;
  try {
    const modules = await Module.findEnabledForUser(userId);
    const stats   = await Task.getStats(userId);
    res.render('dashboard', { user: req.session.user, modules, stats });
  } catch (err) {
    console.error('Dashboard error:', err);
    req.session.error = 'Dashboard error: ' + err.message;
    res.redirect('/login');
  }
};

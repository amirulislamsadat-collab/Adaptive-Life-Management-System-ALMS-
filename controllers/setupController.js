// ============================================================
// Controller: Setup — handles initial workspace setup
// ============================================================
const Role   = require('../models/Role');
const Module = require('../models/Module');
const User   = require('../models/User');

const roleRecommendations = {
  'Student':      [1, 2, 4, 6, 12, 13, 15],
  'Professional': [1, 3, 13, 14, 15],
  'Freelancer':   [1, 3, 6, 12, 13, 14, 15]
};

exports.getSetup = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const roles   = await Role.findAll();
    const modules = await Module.findAll();
    const step = req.query.step || 'role';
    const recommended = roleRecommendations[req.session.user.role] || [];
    res.render('setup', { user: req.session.user, roles, modules, step, recommended, roleRecommendations });
  } catch (err) {
    console.error('Setup error:', err);
    req.session.error = 'Failed to load setup.';
    res.redirect('/login');
  }
};

exports.postRole = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { role_id } = req.body;
  try {
    await User.updateRole(req.session.user.id, role_id);
    const role = await Role.findById(role_id);
    req.session.user.role_id = parseInt(role_id);
    req.session.user.role = role ? role.name : 'Member';
    res.redirect('/setup?step=modules');
  } catch (err) {
    console.error('Setup role error:', err);
    req.session.error = 'Failed to save role.';
    res.redirect('/setup');
  }
};

exports.postModules = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const userId = req.session.user.id;
  let selected = req.body.modules || [];
  if (!Array.isArray(selected)) selected = [selected];
  try {
    await Module.deleteUserModules(userId);
    for (const modId of selected) {
      await Module.enableForUser(userId, modId);
    }
    await User.completeSetup(userId);
    req.session.user.setup_completed = 1;
    req.session.success = 'Workspace launched! Welcome to ALMS.';
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Setup modules error:', err);
    req.session.error = 'Failed to save modules.';
    res.redirect('/setup?step=modules');
  }
};

// ============================================================
// Controller: Setup — handles initial workspace setup
// ============================================================
const Role   = require('../models/Role');
const Module = require('../models/Module');
const User   = require('../models/User');

const roleRecommendations = {
  'Student':                    [1, 2, 4, 6, 12, 13, 15],
  'Professional':                [1, 3, 13, 14, 15, 16],
  'Freelancer':                  [1, 3, 6, 12, 13, 14, 15, 16],
  'Entrepreneur':                [1, 3, 12, 13, 14, 15, 16],
  'Parent / Caregiver':          [1, 3, 4, 6, 8, 9],
  'Fitness Enthusiast':          [4, 6, 12, 14, 15],
  'Creative / Content Creator':  [1, 6, 12, 13, 14, 16],
  'Remote Worker':               [1, 4, 8, 9, 13, 15, 16]
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
    res.redirect('/setup?step=profile');
  } catch (err) {
    console.error('Setup modules error:', err);
    req.session.error = 'Failed to save modules.';
    res.redirect('/setup?step=modules');
  }
};

exports.postProfile = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const userId = req.session.user.id;
  try {
    const photoData = req.body.photo_data;
    if (photoData && photoData.startsWith('data:image/') && photoData.length < 2_800_000) {
      await User.updateProfilePicture(userId, photoData);
      req.session.user.profile_picture = photoData;
    }
    if (req.body.name && req.body.name.trim()) {
      await User.updateName(userId, req.body.name.trim());
      req.session.user.name = req.body.name.trim();
    }
    await User.completeSetup(userId);
    req.session.user.setup_completed = 1;
    req.session.success = "You're all set! Welcome to ALMS — let's build some great habits. 🎉";
    res.redirect('/dashboard?justSetup=1');
  } catch (err) {
    console.error('Setup profile error:', err);
    req.session.error = 'Failed to finish setup.';
    res.redirect('/setup?step=profile');
  }
};

// ============================================================
// Controller: Setup — handles initial workspace setup
// Order: role -> age -> weight -> activity -> experience -> avatar -> modules -> done.
// One question per screen, Duolingo-style, so setup never feels like a wall
// of fields. Avatar comes last among the personal questions (once gender is
// known, the water goal can be computed from it + the weight asked earlier)
// and modules comes last overall, since the experience-level answer shapes
// which modules get pre-recommended (a beginner gets a short starter list;
// someone experienced gets the full set).
// ============================================================
const Role = require('../models/Role');
const Module = require('../models/Module');
const User = require('../models/User');
const HealthGuidelines = require('../models/HealthGuidelines');

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

// Beginners get a short starter list so setup doesn't feel overwhelming;
// experienced users get the full role-based recommendation.
function recommendedForExperience(fullList, experienceLevel) {
  if (experienceLevel === 'beginner') return fullList.slice(0, 3);
  if (experienceLevel === 'intermediate') return fullList.slice(0, 5);
  return fullList;
}

exports.getSetup = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const roles   = await Role.findAll();
    const modules = await Module.findAll();
    const step = req.query.step || 'role';
    const fullRecommended = roleRecommendations[req.session.user.role] || [];
    const recommended = recommendedForExperience(fullRecommended, req.session.user.experience_level);
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
    res.redirect('/setup?step=age');
  } catch (err) {
    console.error('Setup role error:', err);
    req.session.error = 'Failed to save role.';
    res.redirect('/setup');
  }
};

exports.postAge = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const userId = req.session.user.id;
  const age = req.body.skip === '1' ? null : (parseInt(req.body.age, 10) || null);
  try {
    await User.updateAge(userId, age);
    req.session.user.age = age;
    res.redirect('/setup?step=weight');
  } catch (err) {
    console.error('Setup age step error:', err);
    req.session.error = 'Failed to save your info.';
    res.redirect('/setup?step=age');
  }
};

exports.postWeight = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const userId = req.session.user.id;
  const weight_kg = req.body.skip === '1' ? null : (parseFloat(req.body.weight_kg) || null);
  try {
    await User.updateWeight(userId, weight_kg);
    req.session.user.weight_kg = weight_kg;
    res.redirect('/setup?step=activity');
  } catch (err) {
    console.error('Setup weight step error:', err);
    req.session.error = 'Failed to save your info.';
    res.redirect('/setup?step=weight');
  }
};

exports.postActivity = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const userId = req.session.user.id;
  const activity_level = ['sedentary', 'lightly_active', 'active', 'very_active'].includes(req.body.activity_level)
    ? req.body.activity_level : 'lightly_active';
  try {
    await User.updateActivityLevel(userId, activity_level);
    req.session.user.activity_level = activity_level;
    res.redirect('/setup?step=experience');
  } catch (err) {
    console.error('Setup activity step error:', err);
    req.session.error = 'Failed to save your info.';
    res.redirect('/setup?step=activity');
  }
};

exports.postExperience = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const userId = req.session.user.id;
  const experience = ['beginner', 'intermediate', 'experienced'].includes(req.body.experience_level)
    ? req.body.experience_level : 'intermediate';
  try {
    await User.updateExperienceLevel(userId, experience);
    req.session.user.experience_level = experience;
    res.redirect('/setup?step=avatar');
  } catch (err) {
    console.error('Setup experience step error:', err);
    req.session.error = 'Failed to save your info.';
    res.redirect('/setup?step=experience');
  }
};

exports.postAvatar = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const userId = req.session.user.id;
  const gender = ['male', 'female'].includes(req.body.gender) ? req.body.gender : 'male';
  const skin = req.body.skin || '#F0B594';
  const hair = req.body.hair || '#3B2314';
  const shirt = req.body.shirt || '#5B8DEF';

  try {
    await User.updateAvatarColors(userId, { gender, skin, hair, shirt });
    // Weight was asked earlier in the flow, so by the time gender is known
    // (this is the last personal-info step) we can compute an accurate,
    // personalized water goal instead of everyone getting the same number.
    await User.updateWaterGoal(userId, HealthGuidelines.waterGoal({ gender, weightKg: req.session.user.weight_kg }));

    req.session.user.avatar_gender = gender;
    req.session.user.avatar_skin = skin;
    req.session.user.avatar_hair = hair;
    req.session.user.avatar_shirt = shirt;

    res.redirect('/setup?step=modules');
  } catch (err) {
    console.error('Setup avatar step error:', err);
    req.session.error = 'Failed to save your info.';
    res.redirect('/setup?step=avatar');
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
    req.session.success = "You're all set! Welcome to ALMS, let's build some great habits. 🎉";
    res.redirect('/dashboard?justSetup=1');
  } catch (err) {
    console.error('Setup modules error:', err);
    req.session.error = 'Failed to save modules.';
    res.redirect('/setup?step=modules');
  }
};

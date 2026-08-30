// ============================================================
// Controller: Setup — handles initial workspace setup
// Order: role -> you (avatar/age/experience) -> modules -> done.
// "You" comes before modules deliberately, so the experience-level answer
// can actually shape which modules get pre-recommended (a beginner gets a
// short starter list; someone experienced gets the full set) — the same
// idea as Duolingo asking "brand new or already know some?" before
// deciding where to start you.
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
    res.redirect('/setup?step=you');
  } catch (err) {
    console.error('Setup role error:', err);
    req.session.error = 'Failed to save role.';
    res.redirect('/setup');
  }
};

exports.postYou = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const userId = req.session.user.id;
  const gender = ['male', 'female'].includes(req.body.gender) ? req.body.gender : 'male';
  const skin = req.body.skin || '#F0B594';
  const hair = req.body.hair || '#3B2314';
  const shirt = req.body.shirt || '#5B8DEF';
  const age = parseInt(req.body.age, 10) || null;
  const weight_kg = parseFloat(req.body.weight_kg) || null;
  const experience = ['beginner', 'intermediate', 'experienced'].includes(req.body.experience_level)
    ? req.body.experience_level : 'intermediate';
  const activity_level = ['sedentary', 'lightly_active', 'active', 'very_active'].includes(req.body.activity_level)
    ? req.body.activity_level : 'lightly_active';

  try {
    await User.updateIdentity(userId, { gender, skin, hair, shirt, age, experience_level: experience, weight_kg, activity_level });
    // Sensible starting targets right away, based on who they actually are,
    // instead of everyone defaulting to the same flat numbers.
    await User.updateWaterGoal(userId, HealthGuidelines.waterGoal({ gender, weightKg: weight_kg }));

    req.session.user.avatar_gender = gender;
    req.session.user.avatar_skin = skin;
    req.session.user.avatar_hair = hair;
    req.session.user.avatar_shirt = shirt;
    req.session.user.age = age;
    req.session.user.experience_level = experience;
    req.session.user.weight_kg = weight_kg;
    req.session.user.activity_level = activity_level;

    res.redirect('/setup?step=modules');
  } catch (err) {
    console.error('Setup "you" step error:', err);
    req.session.error = 'Failed to save your info.';
    res.redirect('/setup?step=you');
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
    req.session.success = "You're all set! Welcome to ALMS — let's build some great habits. 🎉";
    res.redirect('/dashboard?justSetup=1');
  } catch (err) {
    console.error('Setup modules error:', err);
    req.session.error = 'Failed to save modules.';
    res.redirect('/setup?step=modules');
  }
};

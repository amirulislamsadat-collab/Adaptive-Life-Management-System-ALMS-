// ============================================================
// Controller: Profile — the user's own identity page (avatar, name, age,
// experience level, level/XP, streak). Its own top-level page rather than
// a subsection of Settings, since Settings is about the app (modules,
// theme, notifications) while this is about the person using it.
// ============================================================
const User = require('../models/User');
const Gamification = require('../models/Gamification');
const HealthGuidelines = require('../models/HealthGuidelines');

exports.getProfile = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const fullUser = await User.findById(req.session.user.id);
    const levelInfo = Gamification.getLevelInfo(req.session.user.xp || 0);
    res.render('profile', { user: req.session.user, fullUser, levelInfo });
  } catch (err) {
    console.error('Profile load error:', err);
    req.session.error = 'Failed to load your profile.';
    res.redirect('/dashboard');
  }
};

exports.postName = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const name = (req.body.name || '').trim();
  if (!name) {
    req.session.error = 'Name cannot be empty.';
    return res.redirect('/profile');
  }
  try {
    await User.updateName(req.session.user.id, name);
    req.session.user.name = name;
    req.session.success = 'Name updated!';
  } catch (err) {
    console.error('Update name error:', err);
    req.session.error = 'Failed to update name.';
  }
  res.redirect('/profile');
};

exports.postAvatar = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const gender = ['male', 'female'].includes(req.body.gender) ? req.body.gender : req.session.user.avatar_gender;
  const skin = req.body.skin || req.session.user.avatar_skin;
  const hair = req.body.hair || req.session.user.avatar_hair;
  const shirt = req.body.shirt || req.session.user.avatar_shirt;
  const age = req.body.age ? parseInt(req.body.age, 10) : req.session.user.age;
  const weight_kg = req.body.weight_kg ? parseFloat(req.body.weight_kg) : req.session.user.weight_kg;
  const experience = ['beginner', 'intermediate', 'experienced'].includes(req.body.experience_level)
    ? req.body.experience_level : req.session.user.experience_level;
  const activity_level = ['sedentary', 'lightly_active', 'active', 'very_active'].includes(req.body.activity_level)
    ? req.body.activity_level : req.session.user.activity_level;
  try {
    await User.updateIdentity(req.session.user.id, { gender, skin, hair, shirt, age, experience_level: experience, weight_kg, activity_level });
    // Re-derive the water goal too, in case gender/weight changed here.
    await User.updateWaterGoal(req.session.user.id, HealthGuidelines.waterGoal({ gender, weightKg: weight_kg }));

    req.session.user.avatar_gender = gender;
    req.session.user.avatar_skin = skin;
    req.session.user.avatar_hair = hair;
    req.session.user.avatar_shirt = shirt;
    req.session.user.age = age;
    req.session.user.weight_kg = weight_kg;
    req.session.user.experience_level = experience;
    req.session.user.activity_level = activity_level;
    req.session.success = 'Profile updated!';
  } catch (err) {
    console.error('Update avatar error:', err);
    req.session.error = 'Failed to update profile.';
  }
  res.redirect('/profile');
};

// ============================================================
// Controller: SocialMediaLog — handles per-platform usage tracking (Feature 26)
// ============================================================
const SocialMediaLog = require('../models/SocialMediaLog');

exports.getSocialMedia = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const [logs, byPlatform] = await Promise.all([
      SocialMediaLog.findAllByUser(req.session.user.id),
      SocialMediaLog.getWeeklyByPlatform(req.session.user.id)
    ]);
    res.render('social-media-list', { user: req.session.user, logs, byPlatform });
  } catch (err) {
    console.error('Social media list error:', err);
    req.session.error = 'Failed to load social media logs.';
    res.redirect('/modules/screentime');
  }
};

exports.getCreateSocialMedia = (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('social-media-form', { user: req.session.user, log: null, formAction: '/social-media/create', pageTitle: 'Log Social Media Usage' });
};

exports.postCreateSocialMedia = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { log_date, platform, minutes } = req.body;
  if (!log_date || !platform || !platform.trim() || !minutes) {
    req.session.error = 'Date, platform, and minutes are required.';
    return res.redirect('/social-media/new');
  }
  try {
    await SocialMediaLog.create(req.session.user.id, { log_date, platform: platform.trim(), minutes });
    req.session.success = 'Social media usage logged successfully!';
    res.redirect('/social-media');
  } catch (err) {
    console.error('Create social media log error:', err);
    req.session.error = 'Failed to log social media usage.';
    res.redirect('/social-media/new');
  }
};

exports.getEditSocialMedia = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const log = await SocialMediaLog.findById(req.params.id, req.session.user.id);
    if (!log) {
      req.session.error = 'Social media log not found.';
      return res.redirect('/social-media');
    }
    res.render('social-media-form', { user: req.session.user, log, formAction: `/social-media/edit/${req.params.id}`, pageTitle: 'Edit Social Media Log' });
  } catch (err) {
    console.error('Edit social media form error:', err);
    req.session.error = 'Failed to load social media log.';
    res.redirect('/social-media');
  }
};

exports.postEditSocialMedia = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { log_date, platform, minutes } = req.body;
  if (!log_date || !platform || !platform.trim() || !minutes) {
    req.session.error = 'Date, platform, and minutes are required.';
    return res.redirect(`/social-media/edit/${req.params.id}`);
  }
  try {
    const result = await SocialMediaLog.update(req.params.id, req.session.user.id, { log_date, platform: platform.trim(), minutes });
    if (!result.affectedRows) {
      req.session.error = 'Social media log not found.';
      return res.redirect('/social-media');
    }
    req.session.success = 'Social media log updated successfully!';
    res.redirect('/social-media');
  } catch (err) {
    console.error('Update social media log error:', err);
    req.session.error = 'Failed to update social media log.';
    res.redirect(`/social-media/edit/${req.params.id}`);
  }
};

exports.deleteSocialMedia = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    await SocialMediaLog.delete(req.params.id, req.session.user.id);
    req.session.success = 'Social media log deleted.';
  } catch (err) {
    console.error('Delete social media log error:', err);
    req.session.error = 'Failed to delete social media log.';
  }
  res.redirect('/social-media');
};

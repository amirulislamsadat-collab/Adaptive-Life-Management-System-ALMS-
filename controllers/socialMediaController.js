// ============================================================
// Controller: SocialMediaLog — handles per-platform usage tracking (Feature 26)
// ============================================================
const SocialMediaLog = require('../models/SocialMediaLog');

exports.getSocialMedia = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  try {
    const logs = await SocialMediaLog.findAllByUser(req.session.user.id);
    const byPlatform = await SocialMediaLog.getWeeklyByPlatform(req.session.user.id);
    res.render('social-media-list', { user: req.session.user, logs, byPlatform });
  } catch (e) {
    console.error('Social media list error:', e);
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

  const platform = req.body.platform;
  const logDate = req.body.log_date;
  const minutes = req.body.minutes;

  if (!logDate || !platform || !platform.trim() || !minutes) {
    req.session.error = 'Date, platform, and minutes are required.';
    return res.redirect('/social-media/new');
  }

  try {
    await SocialMediaLog.create(req.session.user.id, { log_date: logDate, platform: platform.trim(), minutes });
    req.session.success = 'Social media usage logged successfully!';
    res.redirect('/social-media');
  } catch (e) {
    console.error('Create social media log error:', e);
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
  } catch (e) {
    console.error('Edit social media form error:', e);
    req.session.error = 'Failed to load social media log.';
    res.redirect('/social-media');
  }
};

exports.postEditSocialMedia = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const platform = req.body.platform;
  const logDate = req.body.log_date;
  const minutes = req.body.minutes;

  if (!logDate || !platform || !platform.trim() || !minutes) {
    req.session.error = 'Date, platform, and minutes are required.';
    return res.redirect(`/social-media/edit/${req.params.id}`);
  }

  try {
    const result = await SocialMediaLog.update(req.params.id, req.session.user.id, { log_date: logDate, platform: platform.trim(), minutes });
    if (!result.affectedRows) {
      req.session.error = 'Social media log not found.';
      return res.redirect('/social-media');
    }
    req.session.success = 'Social media log updated successfully!';
    res.redirect('/social-media');
  } catch (e) {
    console.error('Update social media log error:', e);
    req.session.error = 'Failed to update social media log.';
    res.redirect(`/social-media/edit/${req.params.id}`);
  }
};

exports.deleteSocialMedia = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  try {
    await SocialMediaLog.delete(req.params.id, req.session.user.id);
    req.session.success = 'Social media log deleted.';
  } catch (e) {
    console.error('Delete social media log error:', e);
    req.session.error = 'Failed to delete social media log.';
  }
  res.redirect('/social-media');
};

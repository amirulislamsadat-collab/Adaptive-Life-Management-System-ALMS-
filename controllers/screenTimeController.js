// ============================================================
// Controller: ScreenTimeLog — handles screen time recording (Feature 25)
// ============================================================
const ScreenTimeLog = require('../models/ScreenTimeLog');

exports.getScreenTime = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const logs = await ScreenTimeLog.findAllByUser(req.session.user.id);
    res.render('screen-time-list', { user: req.session.user, logs });
  } catch (err) {
    console.error('Screen time list error:', err);
    req.session.error = 'Failed to load screen time logs.';
    res.redirect('/modules/screentime');
  }
};

exports.getCreateScreenTime = (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('screen-time-form', { user: req.session.user, log: null, formAction: '/screen-time/create', pageTitle: 'Log Screen Time' });
};

exports.postCreateScreenTime = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { log_date, activity_name, minutes, category, notes } = req.body;
  if (!log_date || !activity_name || !activity_name.trim() || !minutes) {
    req.session.error = 'Date, activity, and minutes are required.';
    return res.redirect('/screen-time/new');
  }
  try {
    await ScreenTimeLog.create(req.session.user.id, { log_date, activity_name: activity_name.trim(), minutes, category, notes });
    req.session.success = 'Screen time logged successfully!';
    res.redirect('/screen-time');
  } catch (err) {
    console.error('Create screen time error:', err);
    req.session.error = 'Failed to log screen time.';
    res.redirect('/screen-time/new');
  }
};

exports.getEditScreenTime = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const log = await ScreenTimeLog.findById(req.params.id, req.session.user.id);
    if (!log) {
      req.session.error = 'Screen time log not found.';
      return res.redirect('/screen-time');
    }
    res.render('screen-time-form', { user: req.session.user, log, formAction: `/screen-time/edit/${req.params.id}`, pageTitle: 'Edit Screen Time Log' });
  } catch (err) {
    console.error('Edit screen time form error:', err);
    req.session.error = 'Failed to load screen time log.';
    res.redirect('/screen-time');
  }
};

exports.postEditScreenTime = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { log_date, activity_name, minutes, category, notes } = req.body;
  if (!log_date || !activity_name || !activity_name.trim() || !minutes) {
    req.session.error = 'Date, activity, and minutes are required.';
    return res.redirect(`/screen-time/edit/${req.params.id}`);
  }
  try {
    const result = await ScreenTimeLog.update(req.params.id, req.session.user.id, { log_date, activity_name: activity_name.trim(), minutes, category, notes });
    if (!result.affectedRows) {
      req.session.error = 'Screen time log not found.';
      return res.redirect('/screen-time');
    }
    req.session.success = 'Screen time log updated successfully!';
    res.redirect('/screen-time');
  } catch (err) {
    console.error('Update screen time error:', err);
    req.session.error = 'Failed to update screen time log.';
    res.redirect(`/screen-time/edit/${req.params.id}`);
  }
};

exports.deleteScreenTime = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    await ScreenTimeLog.delete(req.params.id, req.session.user.id);
    req.session.success = 'Screen time log deleted.';
  } catch (err) {
    console.error('Delete screen time error:', err);
    req.session.error = 'Failed to delete screen time log.';
  }
  res.redirect('/screen-time');
};

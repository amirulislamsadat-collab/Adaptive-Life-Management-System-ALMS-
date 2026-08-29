// ============================================================
// Controller: SleepLog — handles sleep tracking (Feature 18)
// ============================================================
const SleepLog = require('../models/SleepLog');

function computeDurationMinutes(bedtime, wakeTime) {
  const [bh, bm] = bedtime.split(':').map(Number);
  const [wh, wm] = wakeTime.split(':').map(Number);
  let minutes = (wh * 60 + wm) - (bh * 60 + bm);
  if (minutes <= 0) minutes += 24 * 60; // crosses midnight
  return minutes;
}

exports.getSleepLogs = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const [logs, avgMinutes] = await Promise.all([
      SleepLog.findAllByUser(req.session.user.id),
      SleepLog.getAverageMinutes(req.session.user.id, 7)
    ]);
    res.render('sleep-list', { user: req.session.user, logs, avgMinutes });
  } catch (err) {
    console.error('Sleep list error:', err);
    req.session.error = 'Failed to load sleep logs.';
    res.redirect('/modules/health');
  }
};

exports.getCreateSleepLog = (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('sleep-form', { user: req.session.user, log: null, formAction: '/sleep/create', pageTitle: 'Log Sleep' });
};

exports.postCreateSleepLog = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { sleep_date, bedtime, wake_time, quality, notes } = req.body;
  if (!sleep_date || !bedtime || !wake_time) {
    req.session.error = 'Date, bedtime, and wake time are required.';
    return res.redirect('/sleep/new');
  }
  try {
    const duration_minutes = computeDurationMinutes(bedtime, wake_time);
    await SleepLog.create(req.session.user.id, { sleep_date, bedtime, wake_time, duration_minutes, quality, notes });
    req.session.success = 'Sleep logged successfully!';
    res.redirect('/sleep');
  } catch (err) {
    console.error('Create sleep log error:', err);
    req.session.error = 'Failed to log sleep.';
    res.redirect('/sleep/new');
  }
};

exports.getEditSleepLog = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const log = await SleepLog.findById(req.params.id, req.session.user.id);
    if (!log) {
      req.session.error = 'Sleep log not found.';
      return res.redirect('/sleep');
    }
    res.render('sleep-form', { user: req.session.user, log, formAction: `/sleep/edit/${req.params.id}`, pageTitle: 'Edit Sleep Log' });
  } catch (err) {
    console.error('Edit sleep log form error:', err);
    req.session.error = 'Failed to load sleep log.';
    res.redirect('/sleep');
  }
};

exports.postEditSleepLog = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { sleep_date, bedtime, wake_time, quality, notes } = req.body;
  if (!sleep_date || !bedtime || !wake_time) {
    req.session.error = 'Date, bedtime, and wake time are required.';
    return res.redirect(`/sleep/edit/${req.params.id}`);
  }
  try {
    const duration_minutes = computeDurationMinutes(bedtime, wake_time);
    const result = await SleepLog.update(req.params.id, req.session.user.id, { sleep_date, bedtime, wake_time, duration_minutes, quality, notes });
    if (!result.affectedRows) {
      req.session.error = 'Sleep log not found.';
      return res.redirect('/sleep');
    }
    req.session.success = 'Sleep log updated successfully!';
    res.redirect('/sleep');
  } catch (err) {
    console.error('Update sleep log error:', err);
    req.session.error = 'Failed to update sleep log.';
    res.redirect(`/sleep/edit/${req.params.id}`);
  }
};

exports.deleteSleepLog = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    await SleepLog.delete(req.params.id, req.session.user.id);
    req.session.success = 'Sleep log deleted.';
  } catch (err) {
    console.error('Delete sleep log error:', err);
    req.session.error = 'Failed to delete sleep log.';
  }
  res.redirect('/sleep');
};

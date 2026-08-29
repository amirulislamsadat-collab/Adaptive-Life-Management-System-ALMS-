// ============================================================
// Controller: WaterLog — handles daily water intake tracking (Feature 19)
// ============================================================
const WaterLog = require('../models/WaterLog');

const DAILY_GOAL_ML = 2000;

exports.getWaterLogs = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const [logs, todayTotal] = await Promise.all([
      WaterLog.findAllByUser(req.session.user.id),
      WaterLog.getTodayTotal(req.session.user.id)
    ]);
    const progress = Math.min(100, Math.round((todayTotal / DAILY_GOAL_ML) * 100));
    res.render('water-list', { user: req.session.user, logs, todayTotal, goal: DAILY_GOAL_ML, progress });
  } catch (err) {
    console.error('Water list error:', err);
    req.session.error = 'Failed to load water intake logs.';
    res.redirect('/modules/health');
  }
};

exports.postCreateWaterLog = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { log_date, amount_ml } = req.body;
  const amount = parseInt(amount_ml, 10);
  if (!log_date || !amount || amount <= 0) {
    req.session.error = 'A valid date and amount are required.';
    return res.redirect('/water');
  }
  try {
    const now = new Date();
    const logged_at = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
    await WaterLog.create(req.session.user.id, { log_date, amount_ml: amount, logged_at });
    req.session.success = `Logged ${amount} ml of water!`;
    res.redirect('/water');
  } catch (err) {
    console.error('Create water log error:', err);
    req.session.error = 'Failed to log water intake.';
    res.redirect('/water');
  }
};

exports.getEditWaterLog = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const log = await WaterLog.findById(req.params.id, req.session.user.id);
    if (!log) {
      req.session.error = 'Water log not found.';
      return res.redirect('/water');
    }
    res.render('water-form', { user: req.session.user, log, formAction: `/water/edit/${req.params.id}`, pageTitle: 'Edit Water Intake' });
  } catch (err) {
    console.error('Edit water log form error:', err);
    req.session.error = 'Failed to load water log.';
    res.redirect('/water');
  }
};

exports.postEditWaterLog = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { log_date, amount_ml } = req.body;
  const amount = parseInt(amount_ml, 10);
  if (!log_date || !amount || amount <= 0) {
    req.session.error = 'A valid date and amount are required.';
    return res.redirect(`/water/edit/${req.params.id}`);
  }
  try {
    const existing = await WaterLog.findById(req.params.id, req.session.user.id);
    const result = await WaterLog.update(req.params.id, req.session.user.id, {
      log_date, amount_ml: amount, logged_at: existing ? existing.logged_at : null
    });
    if (!result.affectedRows) {
      req.session.error = 'Water log not found.';
      return res.redirect('/water');
    }
    req.session.success = 'Water log updated successfully!';
    res.redirect('/water');
  } catch (err) {
    console.error('Update water log error:', err);
    req.session.error = 'Failed to update water log.';
    res.redirect(`/water/edit/${req.params.id}`);
  }
};

exports.deleteWaterLog = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    await WaterLog.delete(req.params.id, req.session.user.id);
    req.session.success = 'Water log deleted.';
  } catch (err) {
    console.error('Delete water log error:', err);
    req.session.error = 'Failed to delete water log.';
  }
  res.redirect('/water');
};

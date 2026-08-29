// ============================================================
// Controller: MoodLog — handles daily mood/emotional state tracking (Feature 21)
// ============================================================
const MoodLog = require('../models/MoodLog');

exports.getMoodLogs = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const logs = await MoodLog.findAllByUser(req.session.user.id);
    res.render('mood-list', { user: req.session.user, logs });
  } catch (err) {
    console.error('Mood list error:', err);
    req.session.error = 'Failed to load mood logs.';
    res.redirect('/modules/health');
  }
};

exports.getCreateMoodLog = (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('mood-form', { user: req.session.user, log: null, formAction: '/mood/create', pageTitle: 'Log Mood' });
};

exports.postCreateMoodLog = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { log_date, mood, notes } = req.body;
  if (!log_date || !mood) {
    req.session.error = 'Date and mood are required.';
    return res.redirect('/mood/new');
  }
  try {
    await MoodLog.create(req.session.user.id, { log_date, mood, notes });
    req.session.success = 'Mood logged successfully!';
    res.redirect('/mood');
  } catch (err) {
    console.error('Create mood log error:', err);
    req.session.error = 'Failed to log mood.';
    res.redirect('/mood/new');
  }
};

exports.getEditMoodLog = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const log = await MoodLog.findById(req.params.id, req.session.user.id);
    if (!log) {
      req.session.error = 'Mood log not found.';
      return res.redirect('/mood');
    }
    res.render('mood-form', { user: req.session.user, log, formAction: `/mood/edit/${req.params.id}`, pageTitle: 'Edit Mood Log' });
  } catch (err) {
    console.error('Edit mood log form error:', err);
    req.session.error = 'Failed to load mood log.';
    res.redirect('/mood');
  }
};

exports.postEditMoodLog = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { log_date, mood, notes } = req.body;
  if (!log_date || !mood) {
    req.session.error = 'Date and mood are required.';
    return res.redirect(`/mood/edit/${req.params.id}`);
  }
  try {
    const result = await MoodLog.update(req.params.id, req.session.user.id, { log_date, mood, notes });
    if (!result.affectedRows) {
      req.session.error = 'Mood log not found.';
      return res.redirect('/mood');
    }
    req.session.success = 'Mood log updated successfully!';
    res.redirect('/mood');
  } catch (err) {
    console.error('Update mood log error:', err);
    req.session.error = 'Failed to update mood log.';
    res.redirect(`/mood/edit/${req.params.id}`);
  }
};

exports.deleteMoodLog = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    await MoodLog.delete(req.params.id, req.session.user.id);
    req.session.success = 'Mood log deleted.';
  } catch (err) {
    console.error('Delete mood log error:', err);
    req.session.error = 'Failed to delete mood log.';
  }
  res.redirect('/mood');
};

// ============================================================
// Controller: ExerciseLog — handles daily exercise tracking (Feature 20)
// ============================================================
const ExerciseLog = require('../models/ExerciseLog');

exports.getExerciseLogs = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const [logs, weeklyMinutes] = await Promise.all([
      ExerciseLog.findAllByUser(req.session.user.id),
      ExerciseLog.getWeeklyMinutes(req.session.user.id)
    ]);
    res.render('exercise-list', { user: req.session.user, logs, weeklyMinutes });
  } catch (err) {
    console.error('Exercise list error:', err);
    req.session.error = 'Failed to load exercise logs.';
    res.redirect('/modules/health');
  }
};

exports.getCreateExerciseLog = (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('exercise-form', { user: req.session.user, log: null, formAction: '/exercise/create', pageTitle: 'Log Exercise' });
};

exports.postCreateExerciseLog = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { log_date, activity_type, duration_minutes, intensity, calories_burned, notes } = req.body;
  if (!log_date || !activity_type || !activity_type.trim() || !duration_minutes) {
    req.session.error = 'Date, activity, and duration are required.';
    return res.redirect('/exercise/new');
  }
  try {
    await ExerciseLog.create(req.session.user.id, {
      log_date, activity_type: activity_type.trim(), duration_minutes, intensity, calories_burned, notes
    });
    req.session.success = 'Exercise logged successfully!';
    res.redirect('/exercise');
  } catch (err) {
    console.error('Create exercise log error:', err);
    req.session.error = 'Failed to log exercise.';
    res.redirect('/exercise/new');
  }
};

exports.getEditExerciseLog = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const log = await ExerciseLog.findById(req.params.id, req.session.user.id);
    if (!log) {
      req.session.error = 'Exercise log not found.';
      return res.redirect('/exercise');
    }
    res.render('exercise-form', { user: req.session.user, log, formAction: `/exercise/edit/${req.params.id}`, pageTitle: 'Edit Exercise Log' });
  } catch (err) {
    console.error('Edit exercise log form error:', err);
    req.session.error = 'Failed to load exercise log.';
    res.redirect('/exercise');
  }
};

exports.postEditExerciseLog = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { log_date, activity_type, duration_minutes, intensity, calories_burned, notes } = req.body;
  if (!log_date || !activity_type || !activity_type.trim() || !duration_minutes) {
    req.session.error = 'Date, activity, and duration are required.';
    return res.redirect(`/exercise/edit/${req.params.id}`);
  }
  try {
    const result = await ExerciseLog.update(req.params.id, req.session.user.id, {
      log_date, activity_type: activity_type.trim(), duration_minutes, intensity, calories_burned, notes
    });
    if (!result.affectedRows) {
      req.session.error = 'Exercise log not found.';
      return res.redirect('/exercise');
    }
    req.session.success = 'Exercise log updated successfully!';
    res.redirect('/exercise');
  } catch (err) {
    console.error('Update exercise log error:', err);
    req.session.error = 'Failed to update exercise log.';
    res.redirect(`/exercise/edit/${req.params.id}`);
  }
};

exports.deleteExerciseLog = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    await ExerciseLog.delete(req.params.id, req.session.user.id);
    req.session.success = 'Exercise log deleted.';
  } catch (err) {
    console.error('Delete exercise log error:', err);
    req.session.error = 'Failed to delete exercise log.';
  }
  res.redirect('/exercise');
};

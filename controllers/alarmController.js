// ============================================================
// Controller: Alarm — handles alarm CRUD (Feature 12)
// ============================================================
const Alarm = require('../models/Alarm');

function normalizeAlarm(body) {
  const days = Array.isArray(body.days_of_week) ? body.days_of_week : (body.days_of_week ? [body.days_of_week] : []);
  return {
    title: (body.title || '').trim(),
    message: (body.message || '').trim(),
    frequency: body.frequency || 'daily',
    time_of_day: body.time_of_day,
    days_of_week: days.sort().join(',')
  };
}

function validateAlarm(alarm) {
  if (!alarm.title) return 'Alarm title is required.';
  if (!alarm.time_of_day) return 'Alarm time is required.';
  if (alarm.frequency === 'custom' && !alarm.days_of_week) return 'Select at least one weekday for custom schedule.';
  return null;
}

exports.getAlarms = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const alarms = await Alarm.findAllByUser(req.session.user.id);
    res.render('alarms-list', { user: req.session.user, alarms });
  } catch (err) {
    console.error('Alarm list error:', err);
    req.session.error = 'Failed to load alarms.';
    res.redirect('/dashboard');
  }
};

exports.getCreateAlarm = (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('alarms-form', { user: req.session.user, alarm: null, formAction: '/alarms/create', pageTitle: 'Create Alarm' });
};

exports.postCreateAlarm = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const alarm = normalizeAlarm(req.body);
  const validationError = validateAlarm(alarm);
  if (validationError) {
    req.session.error = validationError;
    return res.redirect('/alarms/new');
  }

  try {
    await Alarm.create(req.session.user.id, alarm);
    req.session.success = 'Alarm created successfully!';
    res.redirect('/alarms');
  } catch (err) {
    console.error('Create alarm error:', err);
    req.session.error = 'Failed to create alarm.';
    res.redirect('/alarms/new');
  }
};

exports.getEditAlarm = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const alarm = await Alarm.findById(req.params.id, req.session.user.id);
    if (!alarm) {
      req.session.error = 'Alarm not found.';
      return res.redirect('/alarms');
    }
    res.render('alarms-form', {
      user: req.session.user,
      alarm,
      formAction: `/alarms/edit/${req.params.id}`,
      pageTitle: 'Edit Alarm'
    });
  } catch (err) {
    console.error('Edit alarm form error:', err);
    req.session.error = 'Failed to load alarm.';
    res.redirect('/alarms');
  }
};

exports.postEditAlarm = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const alarm = normalizeAlarm(req.body);
  const validationError = validateAlarm(alarm);
  if (validationError) {
    req.session.error = validationError;
    return res.redirect(`/alarms/edit/${req.params.id}`);
  }

  try {
    await Alarm.update(req.params.id, req.session.user.id, alarm);
    req.session.success = 'Alarm updated successfully!';
    res.redirect('/alarms');
  } catch (err) {
    console.error('Update alarm error:', err);
    req.session.error = 'Failed to update alarm.';
    res.redirect(`/alarms/edit/${req.params.id}`);
  }
};

exports.deleteAlarm = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    await Alarm.delete(req.params.id, req.session.user.id);
    req.session.success = 'Alarm deleted.';
  } catch (err) {
    console.error('Delete alarm error:', err);
    req.session.error = 'Failed to delete alarm.';
  }
  res.redirect('/alarms');
};

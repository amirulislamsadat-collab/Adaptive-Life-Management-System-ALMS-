// ============================================================
// Controller: ScreenTimeLog — handles screen time recording (Feature 25)
// ============================================================
const ScreenTimeLog = require('../models/ScreenTimeLog');

async function getScreenTime(req, res) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  try {
    const logs = await ScreenTimeLog.findAllByUser(req.session.user.id);
    res.render('screen-time-list', { user: req.session.user, logs: logs });
  } catch (err) {
    console.log('screen time list error', err);
    req.session.error = 'Failed to load screen time logs.';
    res.redirect('/modules/screentime');
  }
}

function getCreateScreenTime(req, res) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.render('screen-time-form', { user: req.session.user, log: null, formAction: '/screen-time/create', pageTitle: 'Log Screen Time' });
}

async function postCreateScreenTime(req, res) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  const body = req.body;
  if (!body.log_date || !body.activity_name || !body.activity_name.trim() || !body.minutes) {
    req.session.error = 'Date, activity, and minutes are required.';
    return res.redirect('/screen-time/new');
  }
  try {
    await ScreenTimeLog.create(req.session.user.id, {
      log_date: body.log_date,
      activity_name: body.activity_name.trim(),
      minutes: body.minutes,
      category: body.category,
      notes: body.notes
    });
    req.session.success = 'Screen time logged successfully!';
    res.redirect('/screen-time');
  } catch (err) {
    console.log('screen time create error', err);
    req.session.error = 'Failed to log screen time.';
    res.redirect('/screen-time/new');
  }
}

async function getEditScreenTime(req, res) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  try {
    const log = await ScreenTimeLog.findById(req.params.id, req.session.user.id);
    if (!log) {
      req.session.error = 'Screen time log not found.';
      return res.redirect('/screen-time');
    }
    res.render('screen-time-form', { user: req.session.user, log: log, formAction: '/screen-time/edit/' + req.params.id, pageTitle: 'Edit Screen Time Log' });
  } catch (err) {
    console.log('screen time edit form error', err);
    req.session.error = 'Failed to load screen time log.';
    res.redirect('/screen-time');
  }
}

async function postEditScreenTime(req, res) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  const body = req.body;
  if (!body.log_date || !body.activity_name || !body.activity_name.trim() || !body.minutes) {
    req.session.error = 'Date, activity, and minutes are required.';
    return res.redirect('/screen-time/edit/' + req.params.id);
  }
  try {
    const result = await ScreenTimeLog.update(req.params.id, req.session.user.id, {
      log_date: body.log_date,
      activity_name: body.activity_name.trim(),
      minutes: body.minutes,
      category: body.category,
      notes: body.notes
    });
    if (!result.affectedRows) {
      req.session.error = 'Screen time log not found.';
      return res.redirect('/screen-time');
    }
    req.session.success = 'Screen time log updated successfully!';
    res.redirect('/screen-time');
  } catch (err) {
    console.log('screen time update error', err);
    req.session.error = 'Failed to update screen time log.';
    res.redirect('/screen-time/edit/' + req.params.id);
  }
}

async function deleteScreenTime(req, res) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  try {
    await ScreenTimeLog.delete(req.params.id, req.session.user.id);
    req.session.success = 'Screen time log deleted.';
  } catch (err) {
    console.log('screen time delete error', err);
    req.session.error = 'Failed to delete screen time log.';
  }
  res.redirect('/screen-time');
}

module.exports = {
  getScreenTime: getScreenTime,
  getCreateScreenTime: getCreateScreenTime,
  postCreateScreenTime: postCreateScreenTime,
  getEditScreenTime: getEditScreenTime,
  postEditScreenTime: postEditScreenTime,
  deleteScreenTime: deleteScreenTime
};

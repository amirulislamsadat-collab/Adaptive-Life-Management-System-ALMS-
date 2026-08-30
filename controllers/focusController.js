// ============================================================
// Controller: FocusSession — scheduled focus windows + check-ins (Focus Mode)
// ============================================================
const FocusSession = require('../models/FocusSession');
const Gamification = require('../models/Gamification');

exports.getFocusSessions = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const userId = req.session.user.id;
    const [sessions, activeNow, stats] = await Promise.all([
      FocusSession.findAllByUser(userId),
      FocusSession.getActiveSessionNow(userId),
      FocusSession.getStats(userId)
    ]);
    let activeCheckedIn = false;
    if (activeNow) activeCheckedIn = await FocusSession.hasCheckedInToday(activeNow.id, userId);
    res.render('focus-list', { user: req.session.user, sessions, activeNow, activeCheckedIn, stats });
  } catch (err) {
    console.error('Focus session list error:', err);
    req.session.error = 'Failed to load focus sessions.';
    res.redirect('/dashboard');
  }
};

exports.getCreateFocusSession = (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('focus-form', { user: req.session.user, session: null, formAction: '/focus/create', pageTitle: 'New Focus Session' });
};

exports.postCreateFocusSession = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { name, start_time, end_time, blocklist } = req.body;
  let days = req.body.days_of_week || [];
  if (!Array.isArray(days)) days = [days];
  if (!name || !name.trim() || !start_time || !end_time || !days.length) {
    req.session.error = 'Name, days, and a start/end time are required.';
    return res.redirect('/focus/new');
  }
  try {
    await FocusSession.create(req.session.user.id, { name: name.trim(), days_of_week: days.join(','), start_time, end_time, blocklist });
    req.session.success = 'Focus session scheduled!';
    res.redirect('/focus');
  } catch (err) {
    console.error('Create focus session error:', err);
    req.session.error = 'Failed to schedule focus session.';
    res.redirect('/focus/new');
  }
};

exports.getEditFocusSession = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const session = await FocusSession.findById(req.params.id, req.session.user.id);
    if (!session) {
      req.session.error = 'Focus session not found.';
      return res.redirect('/focus');
    }
    res.render('focus-form', { user: req.session.user, session, formAction: `/focus/edit/${req.params.id}`, pageTitle: 'Edit Focus Session' });
  } catch (err) {
    console.error('Edit focus session form error:', err);
    req.session.error = 'Failed to load focus session.';
    res.redirect('/focus');
  }
};

exports.postEditFocusSession = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { name, start_time, end_time, blocklist } = req.body;
  let days = req.body.days_of_week || [];
  if (!Array.isArray(days)) days = [days];
  if (!name || !name.trim() || !start_time || !end_time || !days.length) {
    req.session.error = 'Name, days, and a start/end time are required.';
    return res.redirect(`/focus/edit/${req.params.id}`);
  }
  try {
    const result = await FocusSession.update(req.params.id, req.session.user.id, { name: name.trim(), days_of_week: days.join(','), start_time, end_time, blocklist });
    if (!result.affectedRows) {
      req.session.error = 'Focus session not found.';
      return res.redirect('/focus');
    }
    req.session.success = 'Focus session updated!';
    res.redirect('/focus');
  } catch (err) {
    console.error('Update focus session error:', err);
    req.session.error = 'Failed to update focus session.';
    res.redirect(`/focus/edit/${req.params.id}`);
  }
};

exports.toggleActive = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const session = await FocusSession.findById(req.params.id, req.session.user.id);
    if (session) await FocusSession.toggleActive(req.params.id, req.session.user.id, session.is_active);
  } catch (err) {
    console.error('Toggle focus session error:', err);
    req.session.error = 'Failed to update focus session.';
  }
  res.redirect('/focus');
};

exports.deleteFocusSession = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    await FocusSession.delete(req.params.id, req.session.user.id);
    req.session.success = 'Focus session deleted.';
  } catch (err) {
    console.error('Delete focus session error:', err);
    req.session.error = 'Failed to delete focus session.';
  }
  res.redirect('/focus');
};

exports.checkIn = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const stayedFocused = req.body.stayed_focused === '1';
  try {
    await FocusSession.checkIn(req.params.id, req.session.user.id, stayedFocused);
    if (stayedFocused) {
      const result = await Gamification.awardXp(req.session.user.id, 20);
      req.session.success = 'Nice, you stayed focused! +20 XP' + Gamification.bonusSuffix(result);
    } else {
      req.session.success = 'Check-in logged. There\'s always the next session.';
    }
  } catch (err) {
    console.error('Focus check-in error:', err);
    req.session.error = 'Failed to log check-in.';
  }
  res.redirect('/focus');
};

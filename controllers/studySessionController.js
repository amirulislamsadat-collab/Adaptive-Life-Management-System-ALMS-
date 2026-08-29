// ============================================================
// Controller: StudySession — handles study session CRUD (Feature 17)
// ============================================================
const StudySession = require('../models/StudySession');
const Subject      = require('../models/Subject');

exports.getSessions = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const [sessions, stats] = await Promise.all([
      StudySession.findAllByUser(req.session.user.id),
      StudySession.getStats(req.session.user.id)
    ]);
    res.render('study-sessions-list', { user: req.session.user, sessions, stats });
  } catch (err) {
    console.error('Study session list error:', err);
    req.session.error = 'Failed to load study sessions.';
    res.redirect('/modules/study');
  }
};

exports.getCreateSession = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const subjects = await Subject.findAllByUser(req.session.user.id);
    res.render('study-sessions-form', {
      user: req.session.user, subjects, session: null,
      formAction: '/study-sessions/create', pageTitle: 'Plan Study Session'
    });
  } catch (err) {
    console.error('Create study session form error:', err);
    res.redirect('/study-sessions');
  }
};

exports.postCreateSession = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { subject_id, title, session_date, duration_minutes, notes } = req.body;
  if (!title || !title.trim()) { req.session.error = 'Study session title is required.'; return res.redirect('/study-sessions/new'); }
  if (!session_date) { req.session.error = 'Session date & time is required.'; return res.redirect('/study-sessions/new'); }
  try {
    await StudySession.create(req.session.user.id, {
      subject_id, title: title.trim(), session_date, duration_minutes, notes
    });
    req.session.success = 'Study session planned successfully!';
    res.redirect('/study-sessions');
  } catch (err) {
    console.error('Create study session error:', err);
    req.session.error = 'Failed to plan study session.';
    res.redirect('/study-sessions/new');
  }
};

exports.getEditSession = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const [session, subjects] = await Promise.all([
      StudySession.findById(req.params.id, req.session.user.id),
      Subject.findAllByUser(req.session.user.id)
    ]);
    if (!session) {
      req.session.error = 'Study session not found.';
      return res.redirect('/study-sessions');
    }
    res.render('study-sessions-form', {
      user: req.session.user, subjects, session,
      formAction: `/study-sessions/edit/${req.params.id}`, pageTitle: 'Edit Study Session'
    });
  } catch (err) {
    console.error('Edit study session form error:', err);
    req.session.error = 'Failed to load study session.';
    res.redirect('/study-sessions');
  }
};

exports.postEditSession = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { subject_id, title, session_date, duration_minutes, status, notes } = req.body;
  if (!title || !title.trim()) {
    req.session.error = 'Study session title is required.';
    return res.redirect(`/study-sessions/edit/${req.params.id}`);
  }
  try {
    const result = await StudySession.update(req.params.id, req.session.user.id, {
      subject_id, title: title.trim(), session_date, duration_minutes, status, notes
    });
    if (!result.affectedRows) {
      req.session.error = 'Study session not found.';
      return res.redirect('/study-sessions');
    }
    req.session.success = 'Study session updated successfully!';
    res.redirect('/study-sessions');
  } catch (err) {
    console.error('Update study session error:', err);
    req.session.error = 'Failed to update study session.';
    res.redirect(`/study-sessions/edit/${req.params.id}`);
  }
};

exports.markStatus = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const status = ['planned', 'completed', 'missed'].includes(req.body.status) ? req.body.status : 'completed';
  try {
    await StudySession.markStatus(req.params.id, req.session.user.id, status);
    req.session.success = status === 'completed' ? 'Study session marked as completed!' : 'Study session updated.';
  } catch (err) {
    console.error('Study session status error:', err);
    req.session.error = 'Failed to update study session.';
  }
  res.redirect('/study-sessions');
};

exports.deleteSession = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    await StudySession.delete(req.params.id, req.session.user.id);
    req.session.success = 'Study session deleted.';
  } catch (err) {
    console.error('Delete study session error:', err);
    req.session.error = 'Failed to delete study session.';
  }
  res.redirect('/study-sessions');
};

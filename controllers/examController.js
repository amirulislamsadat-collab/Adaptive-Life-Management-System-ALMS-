// ============================================================
// Controller: Examination — handles exam scheduling & countdowns (Feature 16)
// ============================================================
const Examination = require('../models/Examination');
const Subject     = require('../models/Subject');

exports.getExams = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const exams = await Examination.findAllByUser(req.session.user.id);
    res.render('exams-list', { user: req.session.user, exams });
  } catch (err) {
    console.error('Exam list error:', err);
    req.session.error = 'Failed to load examinations.';
    res.redirect('/modules/study');
  }
};

exports.getCreateExam = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const subjects = await Subject.findAllByUser(req.session.user.id);
    res.render('exams-form', {
      user: req.session.user, subjects, exam: null,
      formAction: '/exams/create', pageTitle: 'Schedule Examination'
    });
  } catch (err) {
    console.error('Create exam form error:', err);
    res.redirect('/exams');
  }
};

exports.postCreateExam = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { subject_id, title, exam_date, location, notes } = req.body;
  if (!title || !title.trim()) { req.session.error = 'Examination title is required.'; return res.redirect('/exams/new'); }
  if (!exam_date) { req.session.error = 'Examination date & time is required.'; return res.redirect('/exams/new'); }
  try {
    await Examination.create(req.session.user.id, { subject_id, title: title.trim(), exam_date, location, notes });
    req.session.success = 'Examination scheduled successfully!';
    res.redirect('/exams');
  } catch (err) {
    console.error('Create exam error:', err);
    req.session.error = 'Failed to schedule examination.';
    res.redirect('/exams/new');
  }
};

exports.getEditExam = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const [exam, subjects] = await Promise.all([
      Examination.findById(req.params.id, req.session.user.id),
      Subject.findAllByUser(req.session.user.id)
    ]);
    if (!exam) {
      req.session.error = 'Examination not found.';
      return res.redirect('/exams');
    }
    res.render('exams-form', {
      user: req.session.user, subjects, exam,
      formAction: `/exams/edit/${req.params.id}`, pageTitle: 'Edit Examination'
    });
  } catch (err) {
    console.error('Edit exam form error:', err);
    req.session.error = 'Failed to load examination.';
    res.redirect('/exams');
  }
};

exports.postEditExam = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { subject_id, title, exam_date, location, notes } = req.body;
  if (!title || !title.trim()) {
    req.session.error = 'Examination title is required.';
    return res.redirect(`/exams/edit/${req.params.id}`);
  }
  try {
    const result = await Examination.update(req.params.id, req.session.user.id, {
      subject_id, title: title.trim(), exam_date, location, notes
    });
    if (!result.affectedRows) {
      req.session.error = 'Examination not found.';
      return res.redirect('/exams');
    }
    req.session.success = 'Examination updated successfully!';
    res.redirect('/exams');
  } catch (err) {
    console.error('Update exam error:', err);
    req.session.error = 'Failed to update examination.';
    res.redirect(`/exams/edit/${req.params.id}`);
  }
};

exports.deleteExam = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    await Examination.delete(req.params.id, req.session.user.id);
    req.session.success = 'Examination deleted.';
  } catch (err) {
    console.error('Delete exam error:', err);
    req.session.error = 'Failed to delete examination.';
  }
  res.redirect('/exams');
};

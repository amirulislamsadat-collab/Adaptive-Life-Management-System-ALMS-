// ============================================================
// Controller: Examination — handles exam scheduling & countdowns (Feature 16)
// ============================================================
const Examination = require('../models/Examination');
const Subject     = require('../models/Subject');

async function getExams(req, res) {
  if (!req.session.user) {
    res.redirect('/login');
    return;
  }
  try {
    const exams = await Examination.findAllByUser(req.session.user.id);
    res.render('exams-list', { user: req.session.user, exams: exams });
  } catch (err) {
    console.error('Exam list error:', err);
    req.session.error = 'Failed to load examinations.';
    res.redirect('/modules/study');
  }
}

async function getCreateExam(req, res) {
  if (!req.session.user) {
    res.redirect('/login');
    return;
  }
  try {
    const subjects = await Subject.findAllByUser(req.session.user.id);
    res.render('exams-form', {
      user: req.session.user,
      subjects: subjects,
      exam: null,
      formAction: '/exams/create',
      pageTitle: 'Schedule Examination'
    });
  } catch (err) {
    console.error('Create exam form error:', err);
    res.redirect('/exams');
  }
}

async function postCreateExam(req, res) {
  if (!req.session.user) {
    res.redirect('/login');
    return;
  }
  const subjectId = req.body.subject_id;
  const title = req.body.title;
  const examDate = req.body.exam_date;
  const location = req.body.location;
  const notes = req.body.notes;

  if (!title || !title.trim()) {
    req.session.error = 'Examination title is required.';
    res.redirect('/exams/new');
    return;
  }
  if (!examDate) {
    req.session.error = 'Examination date & time is required.';
    res.redirect('/exams/new');
    return;
  }

  try {
    await Examination.create(req.session.user.id, { subject_id: subjectId, title: title.trim(), exam_date: examDate, location: location, notes: notes });
    req.session.success = 'Examination scheduled successfully!';
    res.redirect('/exams');
  } catch (err) {
    console.error('Create exam error:', err);
    req.session.error = 'Failed to schedule examination.';
    res.redirect('/exams/new');
  }
}

async function getEditExam(req, res) {
  if (!req.session.user) {
    res.redirect('/login');
    return;
  }
  try {
    const exam = await Examination.findById(req.params.id, req.session.user.id);
    const subjects = await Subject.findAllByUser(req.session.user.id);
    if (!exam) {
      req.session.error = 'Examination not found.';
      res.redirect('/exams');
      return;
    }
    res.render('exams-form', {
      user: req.session.user,
      subjects: subjects,
      exam: exam,
      formAction: `/exams/edit/${req.params.id}`,
      pageTitle: 'Edit Examination'
    });
  } catch (err) {
    console.error('Edit exam form error:', err);
    req.session.error = 'Failed to load examination.';
    res.redirect('/exams');
  }
}

async function postEditExam(req, res) {
  if (!req.session.user) {
    res.redirect('/login');
    return;
  }
  const subjectId = req.body.subject_id;
  const title = req.body.title;
  const examDate = req.body.exam_date;
  const location = req.body.location;
  const notes = req.body.notes;

  if (!title || !title.trim()) {
    req.session.error = 'Examination title is required.';
    res.redirect(`/exams/edit/${req.params.id}`);
    return;
  }

  try {
    const result = await Examination.update(req.params.id, req.session.user.id, {
      subject_id: subjectId, title: title.trim(), exam_date: examDate, location: location, notes: notes
    });
    if (!result.affectedRows) {
      req.session.error = 'Examination not found.';
      res.redirect('/exams');
      return;
    }
    req.session.success = 'Examination updated successfully!';
    res.redirect('/exams');
  } catch (err) {
    console.error('Update exam error:', err);
    req.session.error = 'Failed to update examination.';
    res.redirect(`/exams/edit/${req.params.id}`);
  }
}

async function deleteExam(req, res) {
  if (!req.session.user) {
    res.redirect('/login');
    return;
  }
  try {
    await Examination.delete(req.params.id, req.session.user.id);
    req.session.success = 'Examination deleted.';
  } catch (err) {
    console.error('Delete exam error:', err);
    req.session.error = 'Failed to delete examination.';
  }
  res.redirect('/exams');
}

module.exports = {
  getExams,
  getCreateExam,
  postCreateExam,
  getEditExam,
  postEditExam,
  deleteExam
};

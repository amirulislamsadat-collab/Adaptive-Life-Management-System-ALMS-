// ============================================================
// Controller: Subject — handles subject CRUD (Feature 14)
// ============================================================
const Subject = require('../models/Subject');

exports.getSubjects = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const subjects = await Subject.findAllByUser(req.session.user.id);
    res.render('subjects-list', { user: req.session.user, subjects });
  } catch (err) {
    console.error('Subject list error:', err);
    req.session.error = 'Failed to load subjects.';
    res.redirect('/dashboard');
  }
};

exports.getCreateSubject = (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('subjects-form', { user: req.session.user, subject: null, formAction: '/subjects/create', pageTitle: 'Create Subject' });
};

exports.postCreateSubject = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const name = (req.body.name || '').trim();
  const code = (req.body.code || '').trim();
  const instructor = (req.body.instructor || '').trim();
  if (!name) {
    req.session.error = 'Subject name is required.';
    return res.redirect('/subjects/new');
  }

  try {
    await Subject.create(req.session.user.id, { name, code, instructor });
    req.session.success = 'Subject created successfully!';
    res.redirect('/subjects');
  } catch (err) {
    console.error('Create subject error:', err);
    req.session.error = 'Failed to create subject.';
    res.redirect('/subjects/new');
  }
};

exports.getEditSubject = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const subject = await Subject.findById(req.params.id, req.session.user.id);
    if (!subject) {
      req.session.error = 'Subject not found.';
      return res.redirect('/subjects');
    }
    res.render('subjects-form', {
      user: req.session.user,
      subject,
      formAction: `/subjects/edit/${req.params.id}`,
      pageTitle: 'Edit Subject'
    });
  } catch (err) {
    console.error('Edit subject form error:', err);
    req.session.error = 'Failed to load subject.';
    res.redirect('/subjects');
  }
};

exports.postEditSubject = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const name = (req.body.name || '').trim();
  const code = (req.body.code || '').trim();
  const instructor = (req.body.instructor || '').trim();
  if (!name) {
    req.session.error = 'Subject name is required.';
    return res.redirect(`/subjects/edit/${req.params.id}`);
  }

  try {
    await Subject.update(req.params.id, req.session.user.id, { name, code, instructor });
    req.session.success = 'Subject updated successfully!';
    res.redirect('/subjects');
  } catch (err) {
    console.error('Update subject error:', err);
    req.session.error = 'Failed to update subject.';
    res.redirect(`/subjects/edit/${req.params.id}`);
  }
};

exports.deleteSubject = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    await Subject.delete(req.params.id, req.session.user.id);
    req.session.success = 'Subject deleted.';
  } catch (err) {
    console.error('Delete subject error:', err);
    req.session.error = 'Failed to delete subject.';
  }
  res.redirect('/subjects');
};

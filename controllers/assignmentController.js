// ============================================================
// Controller: Assignment — handles assignment CRUD (Feature 15)
// ============================================================
const Assignment = require('../models/Assignment');
const Subject    = require('../models/Subject');

exports.getAssignments = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const assignments = await Assignment.findAllByUser(req.session.user.id);
    res.render('assignments-list', { user: req.session.user, assignments });
  } catch (err) {
    console.error('Assignment list error:', err);
    req.session.error = 'Failed to load assignments.';
    res.redirect('/modules/study');
  }
};

exports.getCreateAssignment = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const subjects = await Subject.findAllByUser(req.session.user.id);
    res.render('assignments-form', {
      user: req.session.user, subjects, assignment: null,
      formAction: '/assignments/create', pageTitle: 'New Assignment'
    });
  } catch (err) {
    console.error('Create assignment form error:', err);
    res.redirect('/assignments');
  }
};

exports.postCreateAssignment = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { subject_id, title, description, due_date, priority, status } = req.body;
  if (!title || !title.trim()) { req.session.error = 'Assignment title is required.'; return res.redirect('/assignments/new'); }
  if (!due_date) { req.session.error = 'Due date is required.'; return res.redirect('/assignments/new'); }
  try {
    await Assignment.create(req.session.user.id, {
      subject_id, title: title.trim(), description, due_date, priority, status
    });
    req.session.success = 'Assignment created successfully!';
    res.redirect('/assignments');
  } catch (err) {
    console.error('Create assignment error:', err);
    req.session.error = 'Failed to create assignment.';
    res.redirect('/assignments/new');
  }
};

exports.getEditAssignment = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const [assignment, subjects] = await Promise.all([
      Assignment.findById(req.params.id, req.session.user.id),
      Subject.findAllByUser(req.session.user.id)
    ]);
    if (!assignment) {
      req.session.error = 'Assignment not found.';
      return res.redirect('/assignments');
    }
    res.render('assignments-form', {
      user: req.session.user, subjects, assignment,
      formAction: `/assignments/edit/${req.params.id}`, pageTitle: 'Edit Assignment'
    });
  } catch (err) {
    console.error('Edit assignment form error:', err);
    req.session.error = 'Failed to load assignment.';
    res.redirect('/assignments');
  }
};

exports.postEditAssignment = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { subject_id, title, description, due_date, priority, status } = req.body;
  if (!title || !title.trim()) {
    req.session.error = 'Assignment title is required.';
    return res.redirect(`/assignments/edit/${req.params.id}`);
  }
  try {
    const result = await Assignment.update(req.params.id, req.session.user.id, {
      subject_id, title: title.trim(), description, due_date, priority, status
    });
    if (!result.affectedRows) {
      req.session.error = 'Assignment not found.';
      return res.redirect('/assignments');
    }
    req.session.success = 'Assignment updated successfully!';
    res.redirect('/assignments');
  } catch (err) {
    console.error('Update assignment error:', err);
    req.session.error = 'Failed to update assignment.';
    res.redirect(`/assignments/edit/${req.params.id}`);
  }
};

exports.markStatus = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const status = ['pending', 'in_progress', 'completed'].includes(req.body.status) ? req.body.status : 'completed';
  try {
    await Assignment.updateStatus(req.params.id, req.session.user.id, status);
    req.session.success = 'Assignment status updated.';
  } catch (err) {
    console.error('Assignment status error:', err);
    req.session.error = 'Failed to update assignment status.';
  }
  res.redirect('/assignments');
};

exports.deleteAssignment = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    await Assignment.delete(req.params.id, req.session.user.id);
    req.session.success = 'Assignment deleted.';
  } catch (err) {
    console.error('Delete assignment error:', err);
    req.session.error = 'Failed to delete assignment.';
  }
  res.redirect('/assignments');
};

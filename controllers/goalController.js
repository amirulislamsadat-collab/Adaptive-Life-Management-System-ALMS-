// ============================================================
// Controller: Goal — handles personal goal CRUD & progress (Feature 30)
// ============================================================
const Goal = require('../models/Goal');

exports.getGoals = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const [goals, stats] = await Promise.all([
      Goal.findAllByUser(req.session.user.id),
      Goal.getStats(req.session.user.id)
    ]);
    res.render('goals-list', { user: req.session.user, goals, stats });
  } catch (err) {
    console.error('Goal list error:', err);
    req.session.error = 'Failed to load goals.';
    res.redirect('/dashboard');
  }
};

exports.getCreateGoal = (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('goals-form', { user: req.session.user, goal: null, formAction: '/goals/create', pageTitle: 'New Goal' });
};

exports.postCreateGoal = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { title, description, target_date } = req.body;
  if (!title || !title.trim()) { req.session.error = 'Goal title is required.'; return res.redirect('/goals/new'); }
  try {
    await Goal.create(req.session.user.id, { title: title.trim(), description, target_date });
    req.session.success = 'Goal created successfully!';
    res.redirect('/goals');
  } catch (err) {
    console.error('Create goal error:', err);
    req.session.error = 'Failed to create goal.';
    res.redirect('/goals/new');
  }
};

exports.getEditGoal = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const goal = await Goal.findById(req.params.id, req.session.user.id);
    if (!goal) {
      req.session.error = 'Goal not found.';
      return res.redirect('/goals');
    }
    res.render('goals-form', { user: req.session.user, goal, formAction: `/goals/edit/${req.params.id}`, pageTitle: 'Edit Goal' });
  } catch (err) {
    console.error('Edit goal form error:', err);
    req.session.error = 'Failed to load goal.';
    res.redirect('/goals');
  }
};

exports.postEditGoal = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { title, description, target_date, progress_percent } = req.body;
  if (!title || !title.trim()) {
    req.session.error = 'Goal title is required.';
    return res.redirect(`/goals/edit/${req.params.id}`);
  }
  try {
    const result = await Goal.update(req.params.id, req.session.user.id, { title: title.trim(), description, target_date, progress_percent });
    if (!result.affectedRows) {
      req.session.error = 'Goal not found.';
      return res.redirect('/goals');
    }
    req.session.success = 'Goal updated successfully!';
    res.redirect('/goals');
  } catch (err) {
    console.error('Update goal error:', err);
    req.session.error = 'Failed to update goal.';
    res.redirect(`/goals/edit/${req.params.id}`);
  }
};

exports.updateProgress = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    await Goal.updateProgress(req.params.id, req.session.user.id, req.body.progress_percent);
    req.session.success = 'Progress updated!';
  } catch (err) {
    console.error('Goal progress error:', err);
    req.session.error = 'Failed to update progress.';
  }
  res.redirect('/goals');
};

exports.deleteGoal = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    await Goal.delete(req.params.id, req.session.user.id);
    req.session.success = 'Goal deleted.';
  } catch (err) {
    console.error('Delete goal error:', err);
    req.session.error = 'Failed to delete goal.';
  }
  res.redirect('/goals');
};

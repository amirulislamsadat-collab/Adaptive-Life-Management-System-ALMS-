// ============================================================
// Controller: SavingsGoal — handles savings goals + contributions (Feature 29)
// ============================================================
const SavingsGoal = require('../models/SavingsGoal');

exports.getSavingsGoals = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const goals = await SavingsGoal.findAllByUser(req.session.user.id);
    res.render('savings-goals-list', { user: req.session.user, goals });
  } catch (err) {
    console.error('Savings goal list error:', err);
    req.session.error = 'Failed to load savings goals.';
    res.redirect('/modules/finance');
  }
};

exports.getCreateSavingsGoal = (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('savings-goals-form', { user: req.session.user, goal: null, contributions: null, formAction: '/savings-goals/create', pageTitle: 'New Savings Goal' });
};

exports.postCreateSavingsGoal = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { name, target_amount, target_date } = req.body;
  if (!name || !name.trim() || !target_amount) {
    req.session.error = 'Name and target amount are required.';
    return res.redirect('/savings-goals/new');
  }
  try {
    await SavingsGoal.create(req.session.user.id, { name: name.trim(), target_amount, target_date });
    req.session.success = 'Savings goal created successfully!';
    res.redirect('/savings-goals');
  } catch (err) {
    console.error('Create savings goal error:', err);
    req.session.error = 'Failed to create savings goal.';
    res.redirect('/savings-goals/new');
  }
};

exports.getEditSavingsGoal = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const goal = await SavingsGoal.findById(req.params.id, req.session.user.id);
    if (!goal) {
      req.session.error = 'Savings goal not found.';
      return res.redirect('/savings-goals');
    }
    const contributions = await SavingsGoal.getContributions(req.params.id, req.session.user.id);
    res.render('savings-goals-form', { user: req.session.user, goal, contributions, formAction: `/savings-goals/edit/${req.params.id}`, pageTitle: 'Edit Savings Goal' });
  } catch (err) {
    console.error('Edit savings goal form error:', err);
    req.session.error = 'Failed to load savings goal.';
    res.redirect('/savings-goals');
  }
};

exports.postEditSavingsGoal = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { name, target_amount, target_date } = req.body;
  if (!name || !name.trim() || !target_amount) {
    req.session.error = 'Name and target amount are required.';
    return res.redirect(`/savings-goals/edit/${req.params.id}`);
  }
  try {
    const result = await SavingsGoal.update(req.params.id, req.session.user.id, { name: name.trim(), target_amount, target_date });
    if (!result.affectedRows) {
      req.session.error = 'Savings goal not found.';
      return res.redirect('/savings-goals');
    }
    req.session.success = 'Savings goal updated successfully!';
    res.redirect('/savings-goals');
  } catch (err) {
    console.error('Update savings goal error:', err);
    req.session.error = 'Failed to update savings goal.';
    res.redirect(`/savings-goals/edit/${req.params.id}`);
  }
};

exports.deleteSavingsGoal = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    await SavingsGoal.delete(req.params.id, req.session.user.id);
    req.session.success = 'Savings goal deleted.';
  } catch (err) {
    console.error('Delete savings goal error:', err);
    req.session.error = 'Failed to delete savings goal.';
  }
  res.redirect('/savings-goals');
};

exports.addContribution = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { amount, contributed_on } = req.body;
  if (!amount || parseFloat(amount) <= 0) {
    req.session.error = 'A valid contribution amount is required.';
    return res.redirect(`/savings-goals/edit/${req.params.id}`);
  }
  try {
    await SavingsGoal.addContribution(req.params.id, req.session.user.id, amount, contributed_on || new Date().toISOString().slice(0, 10));
    req.session.success = 'Contribution added!';
  } catch (err) {
    console.error('Add contribution error:', err);
    req.session.error = 'Failed to add contribution.';
  }
  res.redirect(`/savings-goals/edit/${req.params.id}`);
};

exports.deleteContribution = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    await SavingsGoal.deleteContribution(req.params.contributionId, req.session.user.id);
    req.session.success = 'Contribution removed.';
  } catch (err) {
    console.error('Delete contribution error:', err);
    req.session.error = 'Failed to remove contribution.';
  }
  res.redirect(`/savings-goals/edit/${req.params.id}`);
};

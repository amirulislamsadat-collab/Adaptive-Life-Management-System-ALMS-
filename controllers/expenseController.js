// ============================================================
// Controller: Expense — handles income/expense tracking (Feature 28)
// ============================================================
const Expense = require('../models/Expense');

exports.getExpenses = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const [expenses, summary] = await Promise.all([
      Expense.findAllByUser(req.session.user.id),
      Expense.getSummary(req.session.user.id)
    ]);
    res.render('expenses-list', { user: req.session.user, expenses, summary });
  } catch (err) {
    console.error('Expense list error:', err);
    req.session.error = 'Failed to load expenses.';
    res.redirect('/modules/finance');
  }
};

exports.getCreateExpense = (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('expenses-form', { user: req.session.user, expense: null, formAction: '/expenses/create', pageTitle: 'New Entry' });
};

exports.postCreateExpense = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { type, category, amount, description, expense_date } = req.body;
  if (!category || !category.trim() || !amount || !expense_date) {
    req.session.error = 'Category, amount, and date are required.';
    return res.redirect('/expenses/new');
  }
  try {
    await Expense.create(req.session.user.id, { type, category: category.trim(), amount, description, expense_date });
    req.session.success = 'Entry added successfully!';
    res.redirect('/expenses');
  } catch (err) {
    console.error('Create expense error:', err);
    req.session.error = 'Failed to add entry.';
    res.redirect('/expenses/new');
  }
};

exports.getEditExpense = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const expense = await Expense.findById(req.params.id, req.session.user.id);
    if (!expense) {
      req.session.error = 'Entry not found.';
      return res.redirect('/expenses');
    }
    res.render('expenses-form', { user: req.session.user, expense, formAction: `/expenses/edit/${req.params.id}`, pageTitle: 'Edit Entry' });
  } catch (err) {
    console.error('Edit expense form error:', err);
    req.session.error = 'Failed to load entry.';
    res.redirect('/expenses');
  }
};

exports.postEditExpense = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { type, category, amount, description, expense_date } = req.body;
  if (!category || !category.trim() || !amount || !expense_date) {
    req.session.error = 'Category, amount, and date are required.';
    return res.redirect(`/expenses/edit/${req.params.id}`);
  }
  try {
    const result = await Expense.update(req.params.id, req.session.user.id, { type, category: category.trim(), amount, description, expense_date });
    if (!result.affectedRows) {
      req.session.error = 'Entry not found.';
      return res.redirect('/expenses');
    }
    req.session.success = 'Entry updated successfully!';
    res.redirect('/expenses');
  } catch (err) {
    console.error('Update expense error:', err);
    req.session.error = 'Failed to update entry.';
    res.redirect(`/expenses/edit/${req.params.id}`);
  }
};

exports.deleteExpense = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    await Expense.delete(req.params.id, req.session.user.id);
    req.session.success = 'Entry deleted.';
  } catch (err) {
    console.error('Delete expense error:', err);
    req.session.error = 'Failed to delete entry.';
  }
  res.redirect('/expenses');
};

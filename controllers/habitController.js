// ============================================================
// Controller: Habit — handles habit CRUD, check-ins & streaks (Features 23-24)
// ============================================================
const Habit = require('../models/Habit');

exports.getHabits = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const habits = await Habit.findAllByUserWithStats(req.session.user.id);
    res.render('habits-list', { user: req.session.user, habits });
  } catch (err) {
    console.error('Habit list error:', err);
    req.session.error = 'Failed to load habits.';
    res.redirect('/dashboard');
  }
};

exports.getCreateHabit = (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('habits-form', { user: req.session.user, habit: null, formAction: '/habits/create', pageTitle: 'New Habit' });
};

exports.postCreateHabit = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { name, description, frequency } = req.body;
  if (!name || !name.trim()) { req.session.error = 'Habit name is required.'; return res.redirect('/habits/new'); }
  try {
    await Habit.create(req.session.user.id, { name: name.trim(), description, frequency });
    req.session.success = 'Habit created successfully!';
    res.redirect('/habits');
  } catch (err) {
    console.error('Create habit error:', err);
    req.session.error = 'Failed to create habit.';
    res.redirect('/habits/new');
  }
};

exports.getEditHabit = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const habit = await Habit.findById(req.params.id, req.session.user.id);
    if (!habit) {
      req.session.error = 'Habit not found.';
      return res.redirect('/habits');
    }
    res.render('habits-form', { user: req.session.user, habit, formAction: `/habits/edit/${req.params.id}`, pageTitle: 'Edit Habit' });
  } catch (err) {
    console.error('Edit habit form error:', err);
    req.session.error = 'Failed to load habit.';
    res.redirect('/habits');
  }
};

exports.postEditHabit = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { name, description, frequency } = req.body;
  if (!name || !name.trim()) {
    req.session.error = 'Habit name is required.';
    return res.redirect(`/habits/edit/${req.params.id}`);
  }
  try {
    const result = await Habit.update(req.params.id, req.session.user.id, { name: name.trim(), description, frequency });
    if (!result.affectedRows) {
      req.session.error = 'Habit not found.';
      return res.redirect('/habits');
    }
    req.session.success = 'Habit updated successfully!';
    res.redirect('/habits');
  } catch (err) {
    console.error('Update habit error:', err);
    req.session.error = 'Failed to update habit.';
    res.redirect(`/habits/edit/${req.params.id}`);
  }
};

exports.checkinHabit = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const nowChecked = await Habit.toggleToday(req.params.id, req.session.user.id);
    req.session.success = nowChecked ? "Nice work — marked done for today!" : 'Check-in removed for today.';
  } catch (err) {
    console.error('Habit check-in error:', err);
    req.session.error = 'Failed to update check-in.';
  }
  res.redirect('/habits');
};

exports.deleteHabit = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    await Habit.delete(req.params.id, req.session.user.id);
    req.session.success = 'Habit deleted.';
  } catch (err) {
    console.error('Delete habit error:', err);
    req.session.error = 'Failed to delete habit.';
  }
  res.redirect('/habits');
};

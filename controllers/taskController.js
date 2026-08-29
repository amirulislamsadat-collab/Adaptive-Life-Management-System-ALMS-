// ============================================================
// Controller: Task — handles task CRUD operations
// ============================================================
const Task     = require('../models/Task');
const Category = require('../models/Category');

exports.getTaskHub = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    res.render('tasks-hub', { user: req.session.user });
  } catch (err) {
    console.error('Hub error:', err);
    res.redirect('/dashboard');
  }
};

exports.getCreateTask = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const categories = await Category.findAll();
    res.render('tasks-create', {
      user: req.session.user,
      categories,
      task: null,
      formAction: '/tasks/create',
      pageTitle: 'Create New Task',
      submitLabel: 'Save Task'
    });
  } catch (err) {
    console.error('Create form error:', err);
    res.redirect('/tasks/hub');
  }
};

exports.getEditTask = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const [task, categories] = await Promise.all([
      Task.findById(req.params.id, req.session.user.id),
      Category.findAll()
    ]);

    if (!task) {
      req.session.error = 'Task not found.';
      return res.redirect('/tasks/view');
    }

    res.render('tasks-create', {
      user: req.session.user,
      categories,
      task,
      formAction: `/tasks/edit/${req.params.id}`,
      pageTitle: 'Edit Task',
      submitLabel: 'Update Task'
    });
  } catch (err) {
    console.error('Edit form error:', err);
    req.session.error = 'Failed to load task.';
    res.redirect('/tasks/view');
  }
};

exports.postCreateTask = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { title, description, category_id, priority, difficulty, availability } = req.body;
  if (!title || !title.trim()) { req.session.error = 'Task title is required.'; return res.redirect('/tasks/new'); }
  try {
    await Task.create(req.session.user.id, {
      category_id, title: title.trim(), description, priority, difficulty, availability
    });
    req.session.success = 'Task created successfully!';
    res.redirect('/tasks/view');
  } catch (err) {
    console.error('Create error:', err);
    req.session.error = 'Failed to create task.';
    res.redirect('/tasks/new');
  }
};

exports.getTaskList = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const tasks      = await Task.findAllByUser(req.session.user.id);
    const categories = await Category.findAll();
    res.render('tasks-list', { user: req.session.user, tasks, categories });
  } catch (err) {
    console.error('Task view error:', err);
    res.redirect('/tasks/hub');
  }
};

exports.markDone = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    await Task.markDone(req.params.id, req.session.user.id);
    req.session.success = 'Task marked as done!';
  } catch (err) { req.session.error = 'Failed to complete task.'; }
  res.redirect('/tasks/view');
};

exports.deleteTask = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    await Task.delete(req.params.id, req.session.user.id);
    req.session.success = 'Task deleted.';
  } catch (err) { req.session.error = 'Failed to delete task.'; }
  res.redirect('/tasks/view');
};

exports.postEditTask = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { title, description, category_id, priority, difficulty, availability, status } = req.body;
  if (!title || !title.trim()) {
    req.session.error = 'Task title is required.';
    return res.redirect(`/tasks/edit/${req.params.id}`);
  }

  try {
    const result = await Task.update(req.params.id, req.session.user.id, {
      category_id, title: title.trim(), description, priority, difficulty, availability, status
    });

    if (!result.affectedRows) {
      req.session.error = 'Task not found.';
      return res.redirect('/tasks/view');
    }

    req.session.success = 'Task updated successfully!';
    res.redirect('/tasks/view');
  } catch (err) {
    console.error('Edit task error:', err);
    req.session.error = 'Failed to update task.';
    res.redirect(`/tasks/edit/${req.params.id}`);
  }
};

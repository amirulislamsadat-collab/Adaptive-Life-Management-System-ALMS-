// ============================================================
// Controller: Task — handles task CRUD operations
// ============================================================
const Task     = require('../models/Task');
const Category = require('../models/Category');
const Gamification = require('../models/Gamification');

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
  const { title, description, category_id, priority, difficulty, availability, due_date } = req.body;
  if (!title || !title.trim()) { req.session.error = 'Task title is required.'; return res.redirect('/tasks/new'); }
  try {
    await Task.create(req.session.user.id, {
      category_id, title: title.trim(), description, priority, difficulty, availability, due_date
    });
    req.session.success = 'Task created successfully!';
    res.redirect('/tasks/view');
  } catch (err) {
    console.error('Create error:', err);
    req.session.error = 'Failed to create task.';
    res.redirect('/tasks/new');
  }
};

// --- Quick-Add: natural-language task entry ("buy milk tomorrow high priority") ---
// Deliberately simple keyword matching rather than a full NLP library — good
// enough to strip a handful of common phrases while leaving everything else
// as the task title, and fast/dependency-free for a serverless deploy.
function parseQuickAdd(text) {
  let remaining = text;
  let priority = 'medium';
  let due_date = null;

  if (/\b(urgent|asap|high priority|!!!)\b/i.test(remaining)) priority = 'high';
  else if (/\blow priority\b/i.test(remaining)) priority = 'low';
  remaining = remaining.replace(/\b(urgent|asap|high priority|low priority|!!!)\b/gi, '');

  const today = new Date();
  const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const toDateStr = (d) => d.toISOString().slice(0, 10);

  if (/\btoday\b/i.test(remaining)) {
    due_date = toDateStr(today);
    remaining = remaining.replace(/\btoday\b/gi, '');
  } else if (/\btomorrow\b/i.test(remaining)) {
    const d = new Date(today); d.setDate(d.getDate() + 1);
    due_date = toDateStr(d);
    remaining = remaining.replace(/\btomorrow\b/gi, '');
  } else {
    const match = remaining.match(/\b(next\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i);
    if (match) {
      const targetDay = WEEKDAYS.indexOf(match[2].toLowerCase());
      const d = new Date(today);
      let diff = (targetDay - d.getDay() + 7) % 7;
      if (diff === 0 || match[1]) diff += 7;
      d.setDate(d.getDate() + diff);
      due_date = toDateStr(d);
      remaining = remaining.replace(match[0], '');
    }
  }

  const title = remaining.replace(/\s{2,}/g, ' ').trim();
  return { title: title || text.trim(), priority, due_date };
}

exports.postQuickAddTask = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const text = (req.body.text || '').trim();
  if (!text) { req.session.error = 'Type something to add.'; return res.redirect('/tasks/view'); }
  try {
    const parsed = parseQuickAdd(text);
    await Task.create(req.session.user.id, { title: parsed.title, priority: parsed.priority, due_date: parsed.due_date });
    req.session.success = `Added "${parsed.title}"${parsed.due_date ? ' — due ' + parsed.due_date : ''}.`;
    res.redirect(req.get('Referrer') || req.get('Referer') || '/tasks/view');
  } catch (err) {
    console.error('Quick-add error:', err);
    req.session.error = 'Failed to add task.';
    res.redirect('/tasks/view');
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
    const task = await Task.findById(req.params.id, req.session.user.id);
    await Task.markDone(req.params.id, req.session.user.id);
    const multiplier = Gamification.PRIORITY_MULTIPLIER[task && task.priority] || 1;
    const xp = Math.round(10 * multiplier);
    const result = await Gamification.awardXp(req.session.user.id, xp);
    req.session.success = `Task marked as done! +${xp} XP` + (result.leveledUp ? ` — 🎉 Level up! You're now Level ${result.newLevel}: ${result.newTitle}` : '');
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
  const { title, description, category_id, priority, difficulty, availability, status, due_date } = req.body;
  if (!title || !title.trim()) {
    req.session.error = 'Task title is required.';
    return res.redirect(`/tasks/edit/${req.params.id}`);
  }

  try {
    const result = await Task.update(req.params.id, req.session.user.id, {
      category_id, title: title.trim(), description, priority, difficulty, availability, status, due_date
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

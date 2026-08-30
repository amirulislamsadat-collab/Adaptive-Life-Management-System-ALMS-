// ============================================================
// Controller: Dashboard — renders the "Today" dashboard, a single glance
// at everything due across every enabled module instead of making someone
// click through 15 pages to see what needs attention.
// ============================================================
const Module        = require('../models/Module');
const Task           = require('../models/Task');
const Habit           = require('../models/Habit');
const Medication       = require('../models/Medication');
const Reminder           = require('../models/Reminder');
const CalendarEvent       = require('../models/CalendarEvent');
const WaterLog              = require('../models/WaterLog');
const FocusSession            = require('../models/FocusSession');
const Gamification             = require('../models/Gamification');
const User                       = require('../models/User');
const DailyQuote                   = require('../models/DailyQuote');

const DAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

const DEFAULT_WIDGET_ORDER = ['tasks', 'habits', 'meds', 'reminders', 'events', 'water'];

function resolveWidgetLayout(savedJson) {
  let saved = [];
  try { saved = savedJson ? JSON.parse(savedJson) : []; } catch (e) { saved = []; }
  const known = new Set(DEFAULT_WIDGET_ORDER);
  const layout = saved.filter(w => w && known.has(w.key));
  const seen = new Set(layout.map(w => w.key));
  DEFAULT_WIDGET_ORDER.forEach(key => { if (!seen.has(key)) layout.push({ key, visible: true }); });
  return layout;
}

function medicationDueToday(med) {
  const dayCode = DAY_CODES[new Date().getDay()];
  if (!med.is_enabled) return false;
  if (med.frequency === 'daily') return true;
  if (med.frequency === 'weekdays') return ['MO', 'TU', 'WE', 'TH', 'FR'].includes(dayCode);
  if (med.frequency === 'custom') return !!(med.days_of_week && med.days_of_week.split(',').includes(dayCode));
  return false;
}

exports.getDashboard = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  if (req.session.user.setup_completed != 1) return res.redirect('/setup');
  const userId = req.session.user.id;
  try {
    const [modules, stats, fullUser] = await Promise.all([
      Module.findEnabledForUser(userId),
      Task.getStats(userId),
      User.findById(userId)
    ]);
    const enabled = new Set(modules.map(m => m.slug));
    const widgetLayout = resolveWidgetLayout(fullUser && fullUser.widget_layout);

    const [
      tasksDue, habits, medications, remindersDue, eventsToday, waterTotal, activeFocus
    ] = await Promise.all([
      enabled.has('tasks') ? Task.findDueToday(userId) : [],
      enabled.has('habits') ? Habit.findAllByUserWithStats(userId) : [],
      enabled.has('health') ? Medication.findAllByUser(userId) : [],
      enabled.has('reminders') ? Reminder.findDue(userId, 5) : [],
      enabled.has('calendar') ? CalendarEvent.findAllByUser(userId) : [],
      enabled.has('health') ? WaterLog.getTodayTotal(userId) : 0,
      enabled.has('focus') ? FocusSession.getActiveSessionNow(userId) : null
    ]);

    const habitsToCheckIn = habits.filter(h => !h.checkedInToday);
    const medsDueToday = medications.filter(medicationDueToday);
    const todayStr = new Date().toISOString().slice(0, 10);
    const todaysEvents = (eventsToday || []).filter(e => new Date(e.start_time).toISOString().slice(0, 10) === todayStr);

    const today = {
      tasksDue,
      habitsToCheckIn,
      medsDueToday,
      remindersDue,
      todaysEvents,
      waterTotal,
      waterGoal: req.session.user.daily_water_goal_ml || 2000,
      activeFocus
    };

    const levelInfo = Gamification.getLevelInfo(req.session.user.xp || 0);
    const dailyQuote = DailyQuote.today();

    res.render('dashboard', { user: req.session.user, modules, stats, today, levelInfo, widgetLayout, dailyQuote });
  } catch (err) {
    console.error('Dashboard error:', err);
    req.session.error = 'Dashboard error: ' + err.message;
    res.redirect('/login');
  }
};

exports.postWidgetLayout = async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Please log in.' });
  const layout = req.body.layout;
  if (!Array.isArray(layout) || layout.length > 20) {
    return res.status(400).json({ error: 'Invalid layout.' });
  }
  const known = new Set(DEFAULT_WIDGET_ORDER);
  const clean = layout
    .filter(w => w && known.has(w.key))
    .map(w => ({ key: w.key, visible: !!w.visible }));
  try {
    await User.updateWidgetLayout(req.session.user.id, JSON.stringify(clean));
    res.json({ success: true });
  } catch (err) {
    console.error('Widget layout save error:', err);
    res.status(500).json({ error: 'Failed to save layout.' });
  }
};

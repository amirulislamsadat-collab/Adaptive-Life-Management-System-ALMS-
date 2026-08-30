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

const DAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

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
    const [modules, stats] = await Promise.all([
      Module.findEnabledForUser(userId),
      Task.getStats(userId)
    ]);
    const enabled = new Set(modules.map(m => m.slug));

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
      waterGoal: 2000,
      activeFocus
    };

    const levelInfo = Gamification.getLevelInfo(req.session.user.xp || 0);

    res.render('dashboard', { user: req.session.user, modules, stats, today, levelInfo });
  } catch (err) {
    console.error('Dashboard error:', err);
    req.session.error = 'Dashboard error: ' + err.message;
    res.redirect('/login');
  }
};

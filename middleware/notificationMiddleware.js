// ============================================================
// Middleware: Notification — checks due reminders/alarms (Feature 13)
// Uses Reminder and Alarm models (proper MVC)
// ============================================================
const Reminder = require('../models/Reminder');
const Alarm    = require('../models/Alarm');

const DAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

function alarmMatchesToday(alarm, dayCode) {
  if (alarm.frequency === 'daily') return true;
  if (alarm.frequency === 'weekdays') return ['MO', 'TU', 'WE', 'TH', 'FR'].includes(dayCode);
  if (alarm.frequency === 'custom') {
    if (!alarm.days_of_week) return false;
    return alarm.days_of_week.split(',').includes(dayCode);
  }
  return false;
}

module.exports = async (req, res, next) => {
  res.locals.dueNotifications = [];

  if (!req.session.user) return next();

  try {
    const userId = req.session.user.id;
    const dueReminders = await Reminder.findDue(userId, 5);

    const alarms = await Alarm.findEnabledByUser(userId);

    const now = new Date();
    const nowHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dayCode = DAY_CODES[now.getDay()];
    const dueAlarms = [];

    for (const alarm of alarms) {
      if (!alarmMatchesToday(alarm, dayCode)) continue;
      const alarmTime = String(alarm.time_of_day || '').slice(0, 5);
      if (!alarmTime || alarmTime > nowHHMM) continue;

      const last = alarm.last_triggered_at ? new Date(alarm.last_triggered_at) : null;
      const alreadyTriggeredToday = last &&
        last.getFullYear() === now.getFullYear() &&
        last.getMonth() === now.getMonth() &&
        last.getDate() === now.getDate();

      if (alreadyTriggeredToday) continue;

      dueAlarms.push(alarm);
      await Alarm.markTriggered(alarm.id, userId);
    }

    res.locals.dueNotifications = [
      ...dueReminders.map(rem => ({ type: 'reminder', title: rem.title, time: rem.due_at })),
      ...dueAlarms.map(alarm => ({ type: 'alarm', title: alarm.title, time: alarm.time_of_day }))
    ];

    if (dueReminders.length) {
      const reminderIds = dueReminders.map(rem => rem.id);
      await Reminder.markNotified(userId, reminderIds);
    }
  } catch (err) {
    console.error('Notification middleware error:', err);
  }

  next();
};

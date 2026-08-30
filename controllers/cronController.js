// ============================================================
// Controller: Cron — the scheduled job (see vercel.json's `crons`) that
// actually delivers real push notifications when a reminder/alarm comes
// due, regardless of whether anyone has ALMS open in a tab. The in-app
// notification banner (middleware/notificationMiddleware.js) only ever
// fires while someone is actively browsing the page — this is what makes
// "notify when the time comes" actually true.
// ============================================================
const Reminder = require('../models/Reminder');
const Alarm = require('../models/Alarm');
const PushService = require('../models/PushService');

const DAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

function alarmMatchesToday(alarm, dayCode) {
  if (alarm.frequency === 'daily') return true;
  if (alarm.frequency === 'weekdays') return ['MO', 'TU', 'WE', 'TH', 'FR'].includes(dayCode);
  if (alarm.frequency === 'custom') return !!(alarm.days_of_week && alarm.days_of_week.split(',').includes(dayCode));
  return false;
}

exports.runNotificationSweep = async (req, res) => {
  // Vercel automatically sends this header on real cron invocations when
  // CRON_SECRET is set as an env var — anyone else calling this URL
  // without it gets rejected.
  if (process.env.CRON_SECRET) {
    const auth = req.headers.authorization;
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
  }

  if (!PushService.isConfigured) {
    return res.json({ sent: 0, note: 'Push not configured (VAPID keys unset) — nothing to do.' });
  }

  let sent = 0;

  try {
    const dueReminders = await Reminder.findAllDueGlobal();
    for (const rem of dueReminders) {
      await PushService.sendToUser(rem.user_id, {
        title: 'Reminder due',
        body: rem.title,
        url: '/reminders'
      });
      await Reminder.markNotified(rem.user_id, [rem.id]);
      sent++;
    }

    const now = new Date();
    const nowHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dayCode = DAY_CODES[now.getDay()];
    const alarms = await Alarm.findAllEnabledGlobal();

    for (const alarm of alarms) {
      if (!alarmMatchesToday(alarm, dayCode)) continue;
      const alarmTime = String(alarm.time_of_day || '').slice(0, 5);
      if (!alarmTime || alarmTime > nowHHMM) continue;

      const last = alarm.last_triggered_at ? new Date(alarm.last_triggered_at) : null;
      const triggeredToday = last &&
        last.getFullYear() === now.getFullYear() &&
        last.getMonth() === now.getMonth() &&
        last.getDate() === now.getDate();
      if (triggeredToday) continue;

      await PushService.sendToUser(alarm.user_id, {
        title: 'Alarm',
        body: alarm.title,
        url: '/alarms'
      });
      await Alarm.markTriggered(alarm.id, alarm.user_id);
      sent++;
    }

    res.json({ sent });
  } catch (err) {
    console.error('Cron notification sweep error:', err);
    res.status(500).json({ error: 'Sweep failed.' });
  }
};

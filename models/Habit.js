// ============================================================
// Model: Habit — handles habit CRUD and streak calculation (Features 23-24)
// ============================================================
const db = require('../config/db');

function toDateOnly(d) {
  const dt = new Date(d);
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

function diffInDays(a, b) {
  return Math.round((toDateOnly(a) - toDateOnly(b)) / 86400000);
}

// Given completed log dates (any order), compute current and longest streaks.
function computeStreaks(logDates) {
  if (!logDates.length) return { current: 0, longest: 0 };

  const days = [...new Set(logDates.map(d => toDateOnly(d).getTime()))]
    .sort((a, b) => b - a)
    .map(t => new Date(t));

  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    if (diffInDays(days[i - 1], days[i]) === 1) {
      run++;
    } else {
      longest = Math.max(longest, run);
      run = 1;
    }
  }
  longest = Math.max(longest, run);

  const today = toDateOnly(new Date());
  const gapFromToday = diffInDays(today, days[0]);
  let current = 0;
  if (gapFromToday <= 1) {
    current = 1;
    for (let i = 1; i < days.length; i++) {
      if (diffInDays(days[i - 1], days[i]) === 1) current++;
      else break;
    }
  }

  return { current, longest };
}

const Habit = {
  findAllByUser: async (userId) => {
    const [rows] = await db.query(
      'SELECT * FROM habits WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC',
      [userId]
    );
    return rows;
  },

  findById: async (id, userId) => {
    const [rows] = await db.query(
      'SELECT * FROM habits WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return rows[0] || null;
  },

  create: async (userId, data) => {
    const [result] = await db.query(
      'INSERT INTO habits (user_id, name, description, frequency) VALUES (?, ?, ?, ?)',
      [userId, data.name, data.description || '', data.frequency || 'daily']
    );
    return result;
  },

  update: async (id, userId, data) => {
    const [result] = await db.query(
      'UPDATE habits SET name = ?, description = ?, frequency = ? WHERE id = ? AND user_id = ?',
      [data.name, data.description || '', data.frequency || 'daily', id, userId]
    );
    return result;
  },

  delete: async (id, userId) => {
    await db.query('DELETE FROM habits WHERE id = ? AND user_id = ?', [id, userId]);
  },

  isCheckedInToday: async (habitId, userId) => {
    const [rows] = await db.query(
      "SELECT id FROM habit_logs WHERE habit_id = ? AND user_id = ? AND log_date = CURDATE()",
      [habitId, userId]
    );
    return !!rows[0];
  },

  toggleToday: async (habitId, userId) => {
    const already = await Habit.isCheckedInToday(habitId, userId);
    if (already) {
      await db.query("DELETE FROM habit_logs WHERE habit_id = ? AND user_id = ? AND log_date = CURDATE()", [habitId, userId]);
    } else {
      await db.query(
        "INSERT INTO habit_logs (habit_id, user_id, log_date, completed) VALUES (?, ?, CURDATE(), 1)",
        [habitId, userId]
      );
    }
    return !already;
  },

  getStreaks: async (habitId, userId) => {
    const [rows] = await db.query(
      'SELECT log_date FROM habit_logs WHERE habit_id = ? AND user_id = ? AND completed = 1',
      [habitId, userId]
    );
    return computeStreaks(rows.map(r => r.log_date));
  },

  getTotalCheckIns: async (habitId, userId) => {
    const [[row]] = await db.query(
      'SELECT COUNT(*) AS total FROM habit_logs WHERE habit_id = ? AND user_id = ? AND completed = 1',
      [habitId, userId]
    );
    return parseInt(row.total) || 0;
  },

  // Attaches checkedInToday, streaks, and totalCheckIns to each habit for list views.
  findAllByUserWithStats: async (userId) => {
    const habits = await Habit.findAllByUser(userId);
    const [logs] = await db.query(
      `SELECT habit_id, log_date FROM habit_logs
       WHERE user_id = ? AND completed = 1
       ORDER BY log_date DESC`,
      [userId]
    );
    const [checkIns] = await db.query(
      `SELECT habit_id, COUNT(*) AS total FROM habit_logs
       WHERE user_id = ? AND completed = 1 GROUP BY habit_id`,
      [userId]
    );
    const totalMap = {};
    checkIns.forEach(row => { totalMap[row.habit_id] = parseInt(row.total) || 0; });

    const logsByHabit = {};
    logs.forEach(row => {
      if (!logsByHabit[row.habit_id]) logsByHabit[row.habit_id] = [];
      logsByHabit[row.habit_id].push(row.log_date);
    });

    const today = toDateOnly(new Date()).getTime();
    return habits.map(h => {
      const streaks = computeStreaks(logsByHabit[h.id] || []);
      const checkedInToday = (logsByHabit[h.id] || []).some(d => toDateOnly(d).getTime() === today);
      return {
        ...h,
        currentStreak: streaks.current,
        longestStreak: streaks.longest,
        totalCheckIns: totalMap[h.id] || 0,
        checkedInToday
      };
    });
  }
};

module.exports = Habit;

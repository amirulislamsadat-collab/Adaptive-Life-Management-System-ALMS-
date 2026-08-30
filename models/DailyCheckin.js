// ============================================================
// Model: DailyCheckin — energy/water-goal/today's-focus, one per local day.
// checkin_date is always the CLIENT's local date (passed in from JS), not
// server CURDATE() — a check-in "day" should match where the user actually
// is, not the server's timezone.
// ============================================================
const db = require('../config/db');

const DailyCheckin = {
  findByDate: async (userId, checkinDate) => {
    const [rows] = await db.query(
      'SELECT * FROM daily_checkins WHERE user_id = ? AND checkin_date = ?',
      [userId, checkinDate]
    );
    return rows[0] || null;
  },

  create: async (userId, { checkin_date, energy_level, water_goal_ml, focus_text }) => {
    const [result] = await db.query(
      `INSERT INTO daily_checkins (user_id, checkin_date, energy_level, water_goal_ml, focus_text)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, checkin_date, energy_level, water_goal_ml, focus_text || null]
    );
    return result;
  }
};

module.exports = DailyCheckin;

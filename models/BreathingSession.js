// ============================================================
// Model: BreathingSession — logs completed guided breathing exercises.
// ============================================================
const db = require('../config/db');

const BreathingSession = {
  create: async (userId, pattern, cycles) => {
    const [result] = await db.query(
      'INSERT INTO breathing_sessions (user_id, pattern, cycles) VALUES (?, ?, ?)',
      [userId, pattern, cycles]
    );
    return result;
  },

  getWeeklyCount: async (userId) => {
    const [[row]] = await db.query(
      `SELECT COUNT(*) AS total FROM breathing_sessions
       WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
      [userId]
    );
    return parseInt(row.total) || 0;
  }
};

module.exports = BreathingSession;

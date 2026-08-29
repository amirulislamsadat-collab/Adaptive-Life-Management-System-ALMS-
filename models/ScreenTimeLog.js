// ============================================================
// Model: ScreenTimeLog — handles screen time recording & productive time
// analysis (Features 25, 27)
// ============================================================
const db = require('../config/db');

const ScreenTimeLog = {
  findAllByUser: async (userId) => {
    const [rows] = await db.query(
      'SELECT * FROM screen_time_logs WHERE user_id = ? ORDER BY log_date DESC, id DESC',
      [userId]
    );
    return rows;
  },

  findById: async (id, userId) => {
    const [rows] = await db.query(
      'SELECT * FROM screen_time_logs WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return rows[0] || null;
  },

  create: async (userId, data) => {
    const [result] = await db.query(
      `INSERT INTO screen_time_logs (user_id, log_date, activity_name, minutes, category, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, data.log_date, data.activity_name, data.minutes, data.category || 'non_productive', data.notes || '']
    );
    return result;
  },

  update: async (id, userId, data) => {
    const [result] = await db.query(
      `UPDATE screen_time_logs
       SET log_date = ?, activity_name = ?, minutes = ?, category = ?, notes = ?
       WHERE id = ? AND user_id = ?`,
      [data.log_date, data.activity_name, data.minutes, data.category || 'non_productive', data.notes || '', id, userId]
    );
    return result;
  },

  delete: async (id, userId) => {
    await db.query('DELETE FROM screen_time_logs WHERE id = ? AND user_id = ?', [id, userId]);
  },

  // Productive Time Analysis (Feature 27): categorized usage summary over the
  // last N days, combined with social media usage (always non-productive).
  getSummary: async (userId, days) => {
    const [[screenRow]] = await db.query(
      `SELECT
         COALESCE(SUM(CASE WHEN category = 'productive' THEN minutes ELSE 0 END), 0) AS productive_minutes,
         COALESCE(SUM(CASE WHEN category != 'productive' THEN minutes ELSE 0 END), 0) AS non_productive_minutes
       FROM screen_time_logs
       WHERE user_id = ? AND log_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
      [userId, days]
    );
    const [[socialRow]] = await db.query(
      `SELECT COALESCE(SUM(minutes), 0) AS social_minutes
       FROM social_media_logs
       WHERE user_id = ? AND log_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
      [userId, days]
    );

    const productive = parseInt(screenRow.productive_minutes) || 0;
    const nonProductive = (parseInt(screenRow.non_productive_minutes) || 0) + (parseInt(socialRow.social_minutes) || 0);
    const total = productive + nonProductive;
    const productivePct = total ? Math.round((productive / total) * 100) : 0;

    return {
      productiveMinutes: productive,
      nonProductiveMinutes: nonProductive,
      totalMinutes: total,
      productivePct,
      nonProductivePct: total ? 100 - productivePct : 0
    };
  }
};

module.exports = ScreenTimeLog;

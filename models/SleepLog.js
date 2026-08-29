// ============================================================
// Model: SleepLog — handles sleep tracking (Feature 18)
// ============================================================
const db = require('../config/db');

const SleepLog = {
  findAllByUser: async (userId) => {
    const [rows] = await db.query(
      'SELECT * FROM sleep_logs WHERE user_id = ? ORDER BY sleep_date DESC, id DESC',
      [userId]
    );
    return rows;
  },

  findById: async (id, userId) => {
    const [rows] = await db.query(
      'SELECT * FROM sleep_logs WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return rows[0] || null;
  },

  create: async (userId, data) => {
    const [result] = await db.query(
      `INSERT INTO sleep_logs (user_id, sleep_date, bedtime, wake_time, duration_minutes, quality, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, data.sleep_date, data.bedtime, data.wake_time, data.duration_minutes, data.quality || 'okay', data.notes || '']
    );
    return result;
  },

  update: async (id, userId, data) => {
    const [result] = await db.query(
      `UPDATE sleep_logs
       SET sleep_date = ?, bedtime = ?, wake_time = ?, duration_minutes = ?, quality = ?, notes = ?
       WHERE id = ? AND user_id = ?`,
      [data.sleep_date, data.bedtime, data.wake_time, data.duration_minutes, data.quality || 'okay', data.notes || '', id, userId]
    );
    return result;
  },

  delete: async (id, userId) => {
    await db.query('DELETE FROM sleep_logs WHERE id = ? AND user_id = ?', [id, userId]);
  },

  getAverageMinutes: async (userId, days) => {
    const [[row]] = await db.query(
      `SELECT COALESCE(AVG(duration_minutes), 0) AS avg_minutes
       FROM sleep_logs
       WHERE user_id = ? AND sleep_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
      [userId, days]
    );
    return Math.round(row.avg_minutes) || 0;
  }
};

module.exports = SleepLog;

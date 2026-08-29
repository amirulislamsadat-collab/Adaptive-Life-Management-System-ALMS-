// ============================================================
// Model: Alarm — handles alarm-related database operations
// ============================================================
const db = require('../config/db');

const Alarm = {
  findAllByUser: async (userId) => {
    const [rows] = await db.query(
      'SELECT * FROM alarms WHERE user_id = ? ORDER BY time_of_day ASC',
      [userId]
    );
    return rows;
  },

  findById: async (id, userId) => {
    const [rows] = await db.query(
      'SELECT * FROM alarms WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return rows[0] || null;
  },

  findEnabledByUser: async (userId) => {
    const [rows] = await db.query(
      `SELECT id, title, frequency, days_of_week, time_of_day, last_triggered_at
       FROM alarms
       WHERE user_id = ? AND is_enabled = 1`,
      [userId]
    );
    return rows;
  },

  markTriggered: async (id, userId) => {
    await db.query('UPDATE alarms SET last_triggered_at = NOW() WHERE id = ? AND user_id = ?', [id, userId]);
  },

  create: async (userId, data) => {
    const [result] = await db.query(
      'INSERT INTO alarms (user_id, title, message, frequency, days_of_week, time_of_day) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, data.title, data.message, data.frequency, data.days_of_week || null, data.time_of_day]
    );
    return result;
  },

  update: async (id, userId, data) => {
    await db.query(
      `UPDATE alarms
       SET title = ?, message = ?, frequency = ?, days_of_week = ?, time_of_day = ?
       WHERE id = ? AND user_id = ?`,
      [data.title, data.message, data.frequency, data.days_of_week || null, data.time_of_day, id, userId]
    );
  },

  delete: async (id, userId) => {
    await db.query('DELETE FROM alarms WHERE id = ? AND user_id = ?', [id, userId]);
  }
};

module.exports = Alarm;

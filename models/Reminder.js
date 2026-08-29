// ============================================================
// Model: Reminder — handles reminder-related database ops
// ============================================================
const db = require('../config/db');

const Reminder = {
  findAllByUser: async (userId) => {
    const [rows] = await db.query(
      'SELECT * FROM reminders WHERE user_id = ? ORDER BY due_at ASC',
      [userId]
    );
    return rows;
  },

  findById: async (id, userId) => {
    const [rows] = await db.query(
      'SELECT * FROM reminders WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return rows[0] || null;
  },

  findDue: async (userId, limit = 5) => {
    const [rows] = await db.query(
      `SELECT id, title, due_at
       FROM reminders
       WHERE user_id = ? AND due_at <= NOW() AND notified_at IS NULL
       ORDER BY due_at ASC
       LIMIT ?`,
      [userId, limit]
    );
    return rows;
  },

  markNotified: async (userId, reminderIds) => {
    if (!reminderIds.length) return;
    const placeholders = reminderIds.map(() => '?').join(',');
    await db.query(
      `UPDATE reminders SET notified_at = NOW() WHERE user_id = ? AND id IN (${placeholders})`,
      [userId].concat(reminderIds)
    );
  },

  create: async (userId, data) => {
    const [result] = await db.query(
      'INSERT INTO reminders (user_id, title, message, due_at) VALUES (?, ?, ?, ?)',
      [userId, data.title, data.message, data.due_at]
    );
    return result;
  },

  update: async (id, userId, data) => {
    await db.query(
      'UPDATE reminders SET title = ?, message = ?, due_at = ? WHERE id = ? AND user_id = ?',
      [data.title, data.message, data.due_at, id, userId]
    );
  },

  delete: async (id, userId) => {
    await db.query('DELETE FROM reminders WHERE id = ? AND user_id = ?', [id, userId]);
  }
};

module.exports = Reminder;

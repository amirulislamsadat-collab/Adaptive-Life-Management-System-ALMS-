// ============================================================
// Model: MoodLog — handles daily mood/emotional state tracking (Feature 21)
// ============================================================
const db = require('../config/db');

const MoodLog = {
  findAllByUser: async (userId) => {
    const [rows] = await db.query(
      'SELECT * FROM mood_logs WHERE user_id = ? ORDER BY log_date DESC, id DESC',
      [userId]
    );
    return rows;
  },

  findById: async (id, userId) => {
    const [rows] = await db.query(
      'SELECT * FROM mood_logs WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return rows[0] || null;
  },

  findLatest: async (userId) => {
    const [rows] = await db.query(
      'SELECT * FROM mood_logs WHERE user_id = ? ORDER BY log_date DESC, id DESC LIMIT 1',
      [userId]
    );
    return rows[0] || null;
  },

  create: async (userId, data) => {
    const [result] = await db.query(
      `INSERT INTO mood_logs (user_id, log_date, mood, notes) VALUES (?, ?, ?, ?)`,
      [userId, data.log_date, data.mood, data.notes || '']
    );
    return result;
  },

  update: async (id, userId, data) => {
    const [result] = await db.query(
      `UPDATE mood_logs SET log_date = ?, mood = ?, notes = ? WHERE id = ? AND user_id = ?`,
      [data.log_date, data.mood, data.notes || '', id, userId]
    );
    return result;
  },

  delete: async (id, userId) => {
    await db.query('DELETE FROM mood_logs WHERE id = ? AND user_id = ?', [id, userId]);
  }
};

module.exports = MoodLog;

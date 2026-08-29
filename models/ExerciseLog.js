// ============================================================
// Model: ExerciseLog — handles daily exercise tracking (Feature 20)
// ============================================================
const db = require('../config/db');

const ExerciseLog = {
  findAllByUser: async (userId) => {
    const [rows] = await db.query(
      'SELECT * FROM exercise_logs WHERE user_id = ? ORDER BY log_date DESC, id DESC',
      [userId]
    );
    return rows;
  },

  findById: async (id, userId) => {
    const [rows] = await db.query(
      'SELECT * FROM exercise_logs WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return rows[0] || null;
  },

  create: async (userId, data) => {
    const [result] = await db.query(
      `INSERT INTO exercise_logs (user_id, log_date, activity_type, duration_minutes, intensity, calories_burned, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, data.log_date, data.activity_type, data.duration_minutes,
       data.intensity || 'moderate', data.calories_burned || null, data.notes || '']
    );
    return result;
  },

  update: async (id, userId, data) => {
    const [result] = await db.query(
      `UPDATE exercise_logs
       SET log_date = ?, activity_type = ?, duration_minutes = ?, intensity = ?, calories_burned = ?, notes = ?
       WHERE id = ? AND user_id = ?`,
      [data.log_date, data.activity_type, data.duration_minutes,
       data.intensity || 'moderate', data.calories_burned || null, data.notes || '', id, userId]
    );
    return result;
  },

  delete: async (id, userId) => {
    await db.query('DELETE FROM exercise_logs WHERE id = ? AND user_id = ?', [id, userId]);
  },

  getWeeklyMinutes: async (userId) => {
    const [[row]] = await db.query(
      `SELECT COALESCE(SUM(duration_minutes), 0) AS total_minutes
       FROM exercise_logs
       WHERE user_id = ? AND log_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
      [userId]
    );
    return parseInt(row.total_minutes) || 0;
  }
};

module.exports = ExerciseLog;

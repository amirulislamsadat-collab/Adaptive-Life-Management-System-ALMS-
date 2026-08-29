// ============================================================
// Model: StudySession — handles study session CRUD (Feature 17)
// ============================================================
const db = require('../config/db');

const StudySession = {
  findAllByUser: async (userId) => {
    const [rows] = await db.query(
      `SELECT ss.*, s.name AS subject_name
       FROM study_sessions ss
       LEFT JOIN subjects s ON ss.subject_id = s.id
       WHERE ss.user_id = ?
       ORDER BY FIELD(ss.status, 'planned', 'completed', 'missed') ASC, ss.session_date ASC`,
      [userId]
    );
    return rows;
  },

  findById: async (id, userId) => {
    const [rows] = await db.query(
      'SELECT * FROM study_sessions WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return rows[0] || null;
  },

  create: async (userId, data) => {
    const [result] = await db.query(
      `INSERT INTO study_sessions (user_id, subject_id, title, session_date, duration_minutes, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, data.subject_id || null, data.title, data.session_date,
       data.duration_minutes || 60, data.status || 'planned', data.notes || '']
    );
    return result;
  },

  update: async (id, userId, data) => {
    const [result] = await db.query(
      `UPDATE study_sessions
       SET subject_id = ?, title = ?, session_date = ?, duration_minutes = ?, status = ?, notes = ?
       WHERE id = ? AND user_id = ?`,
      [data.subject_id || null, data.title, data.session_date,
       data.duration_minutes || 60, data.status || 'planned', data.notes || '', id, userId]
    );
    return result;
  },

  markStatus: async (id, userId, status) => {
    await db.query('UPDATE study_sessions SET status = ? WHERE id = ? AND user_id = ?', [status, id, userId]);
  },

  delete: async (id, userId) => {
    await db.query('DELETE FROM study_sessions WHERE id = ? AND user_id = ?', [id, userId]);
  },

  getStats: async (userId) => {
    const [[stats]] = await db.query(
      `SELECT
         COUNT(*) AS total,
         SUM(status = 'completed') AS completed,
         COALESCE(SUM(CASE WHEN status = 'completed' THEN duration_minutes END), 0) AS total_minutes
       FROM study_sessions WHERE user_id = ?`,
      [userId]
    );
    return {
      total:         parseInt(stats.total)     || 0,
      completed:     parseInt(stats.completed) || 0,
      total_minutes: parseInt(stats.total_minutes) || 0
    };
  }
};

module.exports = StudySession;

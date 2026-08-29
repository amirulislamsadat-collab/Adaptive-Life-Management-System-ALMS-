// ============================================================
// Model: Examination — handles exam scheduling & countdowns (Feature 16)
// ============================================================
const db = require('../config/db');

const Examination = {
  findAllByUser: async (userId) => {
    const [rows] = await db.query(
      `SELECT e.*, s.name AS subject_name
       FROM examinations e
       LEFT JOIN subjects s ON e.subject_id = s.id
       WHERE e.user_id = ?
       ORDER BY e.exam_date ASC`,
      [userId]
    );
    return rows;
  },

  findUpcomingByUser: async (userId, limit) => {
    const [rows] = await db.query(
      `SELECT e.*, s.name AS subject_name
       FROM examinations e
       LEFT JOIN subjects s ON e.subject_id = s.id
       WHERE e.user_id = ? AND e.exam_date >= NOW()
       ORDER BY e.exam_date ASC
       LIMIT ?`,
      [userId, limit]
    );
    return rows;
  },

  findById: async (id, userId) => {
    const [rows] = await db.query(
      'SELECT * FROM examinations WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return rows[0] || null;
  },

  create: async (userId, data) => {
    const [result] = await db.query(
      `INSERT INTO examinations (user_id, subject_id, title, exam_date, location, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, data.subject_id || null, data.title, data.exam_date, data.location || '', data.notes || '']
    );
    return result;
  },

  update: async (id, userId, data) => {
    const [result] = await db.query(
      `UPDATE examinations
       SET subject_id = ?, title = ?, exam_date = ?, location = ?, notes = ?
       WHERE id = ? AND user_id = ?`,
      [data.subject_id || null, data.title, data.exam_date, data.location || '', data.notes || '', id, userId]
    );
    return result;
  },

  delete: async (id, userId) => {
    await db.query('DELETE FROM examinations WHERE id = ? AND user_id = ?', [id, userId]);
  }
};

module.exports = Examination;

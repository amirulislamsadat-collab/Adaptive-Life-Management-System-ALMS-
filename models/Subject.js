// ============================================================
// Model: Subject — handles subject-related database operations
// ============================================================
const db = require('../config/db');

const Subject = {
  findAllByUser: async (userId) => {
    const [rows] = await db.query(
      'SELECT * FROM subjects WHERE user_id = ? ORDER BY name ASC',
      [userId]
    );
    return rows;
  },

  findById: async (id, userId) => {
    const [rows] = await db.query(
      'SELECT * FROM subjects WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return rows[0] || null;
  },

  create: async (userId, data) => {
    const [result] = await db.query(
      'INSERT INTO subjects (user_id, name, code, instructor) VALUES (?, ?, ?, ?)',
      [userId, data.name, data.code || null, data.instructor || null]
    );
    return result;
  },

  update: async (id, userId, data) => {
    await db.query(
      'UPDATE subjects SET name = ?, code = ?, instructor = ? WHERE id = ? AND user_id = ?',
      [data.name, data.code || null, data.instructor || null, id, userId]
    );
  },

  delete: async (id, userId) => {
    await db.query('DELETE FROM subjects WHERE id = ? AND user_id = ?', [id, userId]);
  }
};

module.exports = Subject;

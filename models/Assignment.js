// ============================================================
// Model: Assignment — handles assignment CRUD (Feature 15)
// ============================================================
const db = require('../config/db');

const Assignment = {
  findAllByUser: async (userId) => {
    const [rows] = await db.query(
      `SELECT a.*, s.name AS subject_name
       FROM assignments a
       LEFT JOIN subjects s ON a.subject_id = s.id
       WHERE a.user_id = ?
       ORDER BY FIELD(a.status, 'pending', 'in_progress', 'completed') ASC, a.due_date ASC`,
      [userId]
    );
    return rows;
  },

  findById: async (id, userId) => {
    const [rows] = await db.query(
      'SELECT * FROM assignments WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return rows[0] || null;
  },

  create: async (userId, data) => {
    const [result] = await db.query(
      `INSERT INTO assignments (user_id, subject_id, title, description, due_date, priority, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, data.subject_id || null, data.title, data.description || '',
       data.due_date, data.priority || 'medium', data.status || 'pending']
    );
    return result;
  },

  update: async (id, userId, data) => {
    const [result] = await db.query(
      `UPDATE assignments
       SET subject_id = ?, title = ?, description = ?, due_date = ?, priority = ?, status = ?
       WHERE id = ? AND user_id = ?`,
      [data.subject_id || null, data.title, data.description || '',
       data.due_date, data.priority || 'medium', data.status || 'pending', id, userId]
    );
    return result;
  },

  updateStatus: async (id, userId, status) => {
    await db.query('UPDATE assignments SET status = ? WHERE id = ? AND user_id = ?', [status, id, userId]);
  },

  delete: async (id, userId) => {
    await db.query('DELETE FROM assignments WHERE id = ? AND user_id = ?', [id, userId]);
  },

  getStats: async (userId) => {
    const [[stats]] = await db.query(
      `SELECT
         COUNT(*) AS total,
         SUM(status = 'completed') AS completed,
         SUM(status != 'completed' AND due_date < NOW()) AS overdue
       FROM assignments WHERE user_id = ?`,
      [userId]
    );
    return {
      total:     parseInt(stats.total)     || 0,
      completed: parseInt(stats.completed) || 0,
      overdue:   parseInt(stats.overdue)   || 0
    };
  }
};

module.exports = Assignment;

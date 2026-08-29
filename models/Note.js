// ============================================================
// Model: Note — handles note-related database operations
// ============================================================
const db = require('../config/db');

const Note = {
  findAllByUser: async (userId, searchQuery) => {
    let sql = 'SELECT * FROM notes WHERE user_id = ?';
    const params = [userId];
    if (searchQuery) {
      sql += ' AND (title LIKE ? OR content LIKE ?)';
      params.push(`%${searchQuery}%`, `%${searchQuery}%`);
    }
    sql += ' ORDER BY is_pinned DESC, updated_at DESC';
    const [rows] = await db.query(sql, params);
    return rows;
  },

  findById: async (id, userId) => {
    const [rows] = await db.query(
      'SELECT * FROM notes WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return rows[0] || null;
  },

  create: async (userId, title, content) => {
    const [result] = await db.query(
      'INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)',
      [userId, title, content]
    );
    return result;
  },

  update: async (id, userId, title, content) => {
    await db.query(
      'UPDATE notes SET title = ?, content = ? WHERE id = ? AND user_id = ?',
      [title, content, id, userId]
    );
  },

  togglePin: async (id, userId) => {
    await db.query(
      'UPDATE notes SET is_pinned = 1 - is_pinned WHERE id = ? AND user_id = ?',
      [id, userId]
    );
  },

  delete: async (id, userId) => {
    await db.query('DELETE FROM notes WHERE id = ? AND user_id = ?', [id, userId]);
  }
};

module.exports = Note;

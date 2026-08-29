// ============================================================
// Model: JournalEntry — handles daily journal CRUD & search (Feature 31)
// ============================================================
const db = require('../config/db');

const JournalEntry = {
  findAllByUser: async (userId, searchQuery) => {
    let sql = 'SELECT * FROM journal_entries WHERE user_id = ?';
    const params = [userId];
    if (searchQuery) {
      sql += ' AND (title LIKE ? OR content LIKE ?)';
      params.push(`%${searchQuery}%`, `%${searchQuery}%`);
    }
    sql += ' ORDER BY entry_date DESC, id DESC';
    const [rows] = await db.query(sql, params);
    return rows;
  },

  findById: async (id, userId) => {
    const [rows] = await db.query('SELECT * FROM journal_entries WHERE id = ? AND user_id = ?', [id, userId]);
    return rows[0] || null;
  },

  create: async (userId, data) => {
    const [result] = await db.query(
      'INSERT INTO journal_entries (user_id, entry_date, title, content, mood_tag) VALUES (?, ?, ?, ?, ?)',
      [userId, data.entry_date, data.title, data.content || '', data.mood_tag || null]
    );
    return result;
  },

  update: async (id, userId, data) => {
    const [result] = await db.query(
      'UPDATE journal_entries SET entry_date = ?, title = ?, content = ?, mood_tag = ? WHERE id = ? AND user_id = ?',
      [data.entry_date, data.title, data.content || '', data.mood_tag || null, id, userId]
    );
    return result;
  },

  delete: async (id, userId) => {
    await db.query('DELETE FROM journal_entries WHERE id = ? AND user_id = ?', [id, userId]);
  },

  // How many distinct calendar days in the last 30 have a journal entry —
  // used to show a lightweight "writing consistency" figure without needing
  // a full streak engine like Habits has.
  getDaysWrittenLast30: async (userId) => {
    const [[row]] = await db.query(
      `SELECT COUNT(DISTINCT entry_date) AS days
       FROM journal_entries WHERE user_id = ? AND entry_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
      [userId]
    );
    return parseInt(row.days) || 0;
  }
};

module.exports = JournalEntry;

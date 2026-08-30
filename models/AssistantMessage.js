// ============================================================
// Model: AssistantMessage — persisted AI assistant chat history, so a
// conversation survives a page reload or switching devices instead of
// resetting every time the chat panel opens. Only the most recent 20
// messages per user are kept (pruned after each write).
// ============================================================
const db = require('../config/db');

const HISTORY_LIMIT = 20;

const AssistantMessage = {
  findRecentByUser: async (userId) => {
    const [rows] = await db.query(
      `SELECT role, content, created_at FROM assistant_messages
       WHERE user_id = ? ORDER BY id DESC LIMIT ?`,
      [userId, HISTORY_LIMIT]
    );
    return rows.reverse();
  },

  create: async (userId, role, content) => {
    await db.query(
      'INSERT INTO assistant_messages (user_id, role, content) VALUES (?, ?, ?)',
      [userId, role, content]
    );
    // Keep only the most recent HISTORY_LIMIT rows for this user.
    await db.query(
      `DELETE FROM assistant_messages WHERE user_id = ? AND id NOT IN (
         SELECT id FROM (SELECT id FROM assistant_messages WHERE user_id = ? ORDER BY id DESC LIMIT ?) AS keep
       )`,
      [userId, userId, HISTORY_LIMIT]
    );
  },

  clearForUser: async (userId) => {
    await db.query('DELETE FROM assistant_messages WHERE user_id = ?', [userId]);
  }
};

module.exports = AssistantMessage;

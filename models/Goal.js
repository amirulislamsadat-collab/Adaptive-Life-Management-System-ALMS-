// ============================================================
// Model: Goal — handles personal goal CRUD & progress (Feature 30)
// ============================================================
const db = require('../config/db');

// A goal's status isn't stored as free choice — it's derived from its progress
// and deadline so the list always reflects reality even if the user forgets
// to update it manually.
function deriveStatus(progressPercent, targetDate) {
  if (progressPercent >= 100) return 'completed';
  const isOverdue = targetDate && new Date(targetDate) < new Date(new Date().toDateString());
  if (isOverdue) return 'overdue';
  if (progressPercent > 0) return 'in_progress';
  return 'not_started';
}

const Goal = {
  findAllByUser: async (userId) => {
    const [rows] = await db.query(
      'SELECT * FROM goals WHERE user_id = ? ORDER BY target_date IS NULL, target_date ASC, created_at DESC',
      [userId]
    );
    return rows.map(g => ({ ...g, status: deriveStatus(g.progress_percent, g.target_date) }));
  },

  findById: async (id, userId) => {
    const [rows] = await db.query('SELECT * FROM goals WHERE id = ? AND user_id = ?', [id, userId]);
    if (!rows[0]) return null;
    return { ...rows[0], status: deriveStatus(rows[0].progress_percent, rows[0].target_date) };
  },

  create: async (userId, data) => {
    const [result] = await db.query(
      'INSERT INTO goals (user_id, title, description, target_date, progress_percent) VALUES (?, ?, ?, ?, ?)',
      [userId, data.title, data.description || '', data.target_date || null, data.progress_percent || 0]
    );
    return result;
  },

  update: async (id, userId, data) => {
    const [result] = await db.query(
      'UPDATE goals SET title = ?, description = ?, target_date = ?, progress_percent = ? WHERE id = ? AND user_id = ?',
      [data.title, data.description || '', data.target_date || null, data.progress_percent || 0, id, userId]
    );
    return result;
  },

  updateProgress: async (id, userId, progressPercent) => {
    const clamped = Math.max(0, Math.min(100, parseInt(progressPercent, 10) || 0));
    await db.query('UPDATE goals SET progress_percent = ? WHERE id = ? AND user_id = ?', [clamped, id, userId]);
    return clamped;
  },

  delete: async (id, userId) => {
    await db.query('DELETE FROM goals WHERE id = ? AND user_id = ?', [id, userId]);
  },

  getStats: async (userId) => {
    const goals = await Goal.findAllByUser(userId);
    return {
      total: goals.length,
      completed: goals.filter(g => g.status === 'completed').length,
      overdue: goals.filter(g => g.status === 'overdue').length
    };
  }
};

module.exports = Goal;

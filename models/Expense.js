// ============================================================
// Model: Expense — handles income/expense tracking (Feature 28)
// ============================================================
const db = require('../config/db');

const Expense = {
  findAllByUser: async (userId) => {
    const [rows] = await db.query(
      'SELECT * FROM expenses WHERE user_id = ? ORDER BY expense_date DESC, id DESC',
      [userId]
    );
    return rows;
  },

  findById: async (id, userId) => {
    const [rows] = await db.query(
      'SELECT * FROM expenses WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return rows[0] || null;
  },

  create: async (userId, data) => {
    const [result] = await db.query(
      `INSERT INTO expenses (user_id, type, category, amount, description, expense_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, data.type || 'expense', data.category, data.amount, data.description || '', data.expense_date]
    );
    return result;
  },

  update: async (id, userId, data) => {
    const [result] = await db.query(
      `UPDATE expenses SET type = ?, category = ?, amount = ?, description = ?, expense_date = ?
       WHERE id = ? AND user_id = ?`,
      [data.type || 'expense', data.category, data.amount, data.description || '', data.expense_date, id, userId]
    );
    return result;
  },

  delete: async (id, userId) => {
    await db.query('DELETE FROM expenses WHERE id = ? AND user_id = ?', [id, userId]);
  },

  getSummary: async (userId) => {
    const [[row]] = await db.query(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense
       FROM expenses WHERE user_id = ?`,
      [userId]
    );
    const totalIncome = parseFloat(row.total_income) || 0;
    const totalExpense = parseFloat(row.total_expense) || 0;
    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense
    };
  },

  getCategoryBreakdown: async (userId) => {
    const [rows] = await db.query(
      `SELECT category, type, COALESCE(SUM(amount), 0) AS total
       FROM expenses WHERE user_id = ? GROUP BY category, type ORDER BY total DESC`,
      [userId]
    );
    return rows;
  }
};

module.exports = Expense;

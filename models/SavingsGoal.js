// ============================================================
// Model: SavingsGoal — handles savings goals + contributions (Feature 29)
// A savings goal's "current amount" is never stored directly — it's always
// the sum of its contribution log, the same way a real bank balance works.
// ============================================================
const db = require('../config/db');

class SavingsGoal {
  static async findAllByUser(userId) {
    const [goals] = await db.query(
      'SELECT * FROM savings_goals WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    const [totals] = await db.query(
      `SELECT goal_id, COALESCE(SUM(amount), 0) AS saved
       FROM savings_contributions WHERE user_id = ? GROUP BY goal_id`,
      [userId]
    );
    const savedByGoal = {};
    for (const row of totals) savedByGoal[row.goal_id] = parseFloat(row.saved);

    return goals.map(goal => {
      const saved = savedByGoal[goal.id] || 0;
      const target = parseFloat(goal.target_amount);
      const percent = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
      return { ...goal, savedAmount: saved, progressPercent: percent };
    });
  }

  static async findById(id, userId) {
    const [rows] = await db.query('SELECT * FROM savings_goals WHERE id = ? AND user_id = ?', [id, userId]);
    return rows[0] || null;
  }

  static async getContributions(goalId, userId) {
    const [rows] = await db.query(
      'SELECT * FROM savings_contributions WHERE goal_id = ? AND user_id = ? ORDER BY contributed_on DESC, id DESC',
      [goalId, userId]
    );
    return rows;
  }

  static async create(userId, data) {
    const [result] = await db.query(
      'INSERT INTO savings_goals (user_id, name, target_amount, target_date) VALUES (?, ?, ?, ?)',
      [userId, data.name, data.target_amount, data.target_date || null]
    );
    return result;
  }

  static async update(id, userId, data) {
    const [result] = await db.query(
      'UPDATE savings_goals SET name = ?, target_amount = ?, target_date = ? WHERE id = ? AND user_id = ?',
      [data.name, data.target_amount, data.target_date || null, id, userId]
    );
    return result;
  }

  static async delete(id, userId) {
    await db.query('DELETE FROM savings_goals WHERE id = ? AND user_id = ?', [id, userId]);
  }

  static async addContribution(goalId, userId, amount, contributedOn) {
    const [result] = await db.query(
      'INSERT INTO savings_contributions (goal_id, user_id, amount, contributed_on) VALUES (?, ?, ?, ?)',
      [goalId, userId, amount, contributedOn]
    );
    return result;
  }

  static async deleteContribution(id, userId) {
    await db.query('DELETE FROM savings_contributions WHERE id = ? AND user_id = ?', [id, userId]);
  }
}

module.exports = SavingsGoal;

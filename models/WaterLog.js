// ============================================================
// Model: WaterLog — handles daily water intake tracking (Feature 19)
// ============================================================
const db = require('../config/db');

const WaterLog = {
  findAllByUser: async (userId) => {
    const [rows] = await db.query(
      'SELECT * FROM water_logs WHERE user_id = ? ORDER BY log_date DESC, id DESC',
      [userId]
    );
    return rows;
  },

  findById: async (id, userId) => {
    const [rows] = await db.query(
      'SELECT * FROM water_logs WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return rows[0] || null;
  },

  create: async (userId, data) => {
    const [result] = await db.query(
      `INSERT INTO water_logs (user_id, log_date, amount_ml, logged_at)
       VALUES (?, ?, ?, ?)`,
      [userId, data.log_date, data.amount_ml, data.logged_at || null]
    );
    return result;
  },

  update: async (id, userId, data) => {
    const [result] = await db.query(
      `UPDATE water_logs SET log_date = ?, amount_ml = ?, logged_at = ? WHERE id = ? AND user_id = ?`,
      [data.log_date, data.amount_ml, data.logged_at || null, id, userId]
    );
    return result;
  },

  delete: async (id, userId) => {
    await db.query('DELETE FROM water_logs WHERE id = ? AND user_id = ?', [id, userId]);
  },

  getTodayTotal: async (userId) => {
    const [[row]] = await db.query(
      `SELECT COALESCE(SUM(amount_ml), 0) AS total_ml
       FROM water_logs WHERE user_id = ? AND log_date = CURDATE()`,
      [userId]
    );
    return parseInt(row.total_ml) || 0;
  }
};

module.exports = WaterLog;

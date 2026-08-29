// ============================================================
// Model: Role — handles role-related database operations
// ============================================================
const db = require('../config/db');

const Role = {
  findAll: async () => {
    const [rows] = await db.query('SELECT * FROM roles ORDER BY id');
    return rows;
  },

  findById: async (id) => {
    const [rows] = await db.query('SELECT name FROM roles WHERE id = ?', [id]);
    return rows[0] || null;
  }
};

module.exports = Role;

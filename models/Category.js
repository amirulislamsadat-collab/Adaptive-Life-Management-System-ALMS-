// ============================================================
// Model: Category — handles category-related database operations
// ============================================================
const db = require('../config/db');

const Category = {
  findAll: async () => {
    const [rows] = await db.query('SELECT * FROM categories ORDER BY name');
    return rows;
  }
};

module.exports = Category;

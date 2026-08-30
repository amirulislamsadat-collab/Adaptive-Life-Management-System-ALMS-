// ============================================================
// Model: Module — handles module and user_module database ops
// ============================================================
const db = require('../config/db');

const Module = {
  findAll: async () => {
    const [rows] = await db.query('SELECT * FROM modules ORDER BY id');
    return rows;
  },

  findById: async (id) => {
    const [rows] = await db.query('SELECT * FROM modules WHERE id = ?', [id]);
    return rows[0] || null;
  },

  findBySlug: async (slug) => {
    const [rows] = await db.query(
      'SELECT slug, name, description FROM modules WHERE slug = ?',
      [slug]
    );
    return rows[0] || null;
  },

  findAllWithUserStatus: async (userId) => {
    const [rows] = await db.query(
      `SELECT m.*, IFNULL(um.is_enabled, 0) AS is_enabled
       FROM modules m
       LEFT JOIN user_modules um ON m.id = um.module_id AND um.user_id = ?
       ORDER BY m.id`,
      [userId]
    );
    return rows;
  },

  findEnabledForUser: async (userId) => {
    const [rows] = await db.query(
      `SELECT m.id, m.name, m.slug, m.description, m.icon
       FROM user_modules um
       INNER JOIN modules m ON um.module_id = m.id
       WHERE um.user_id = ? AND um.is_enabled = 1 ORDER BY m.id`,
      [userId]
    );
    return rows;
  },

  deleteUserModules: async (userId) => {
    await db.query('DELETE FROM user_modules WHERE user_id = ?', [userId]);
  },

  enableForUser: async (userId, moduleId) => {
    await db.query(
      'INSERT INTO user_modules (user_id, module_id, is_enabled) VALUES (?, ?, 1)',
      [userId, parseInt(moduleId)]
    );
  },

  findUserModule: async (userId, moduleId) => {
    const [rows] = await db.query(
      'SELECT * FROM user_modules WHERE user_id = ? AND module_id = ?',
      [userId, moduleId]
    );
    return rows[0] || null;
  },

  toggleUserModule: async (userId, moduleId, currentState) => {
    const newState = currentState ? 0 : 1;
    await db.query(
      'UPDATE user_modules SET is_enabled = ? WHERE user_id = ? AND module_id = ?',
      [newState, userId, moduleId]
    );
  }
};

module.exports = Module;

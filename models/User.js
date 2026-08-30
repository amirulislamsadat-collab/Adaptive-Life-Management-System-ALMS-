// ============================================================
// Model: User — handles all user-related database operations
// ============================================================
const db = require('../config/db');

const User = {
  findByEmail: async (email) => {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  },

  findById: async (id) => {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  },

  create: async (name, email, hashedPassword) => {
    const [result] = await db.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );
    return result;
  },

  updateRole: async (userId, roleId) => {
    await db.query('UPDATE users SET role_id = ? WHERE id = ?', [roleId, userId]);
  },

  completeSetup: async (userId) => {
    await db.query('UPDATE users SET setup_completed = 1 WHERE id = ?', [userId]);
  },

  updateProfilePicture: async (userId, dataUrl) => {
    await db.query('UPDATE users SET profile_picture = ? WHERE id = ?', [dataUrl, userId]);
  },

  updateName: async (userId, name) => {
    await db.query('UPDATE users SET name = ? WHERE id = ?', [name, userId]);
  }
};

module.exports = User;

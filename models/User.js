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

  findByGoogleId: async (googleId) => {
    const [rows] = await db.query('SELECT * FROM users WHERE google_id = ?', [googleId]);
    return rows[0] || null;
  },

  create: async (name, email, hashedPassword) => {
    const [result] = await db.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );
    return result;
  },

  createGoogleUser: async (name, email, googleId, picture) => {
    const [result] = await db.query(
      'INSERT INTO users (name, email, google_id, profile_picture) VALUES (?, ?, ?, ?)',
      [name, email, googleId, picture || null]
    );
    return result;
  },

  linkGoogleId: async (userId, googleId) => {
    await db.query('UPDATE users SET google_id = ? WHERE id = ?', [googleId, userId]);
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
  },

  updateWaterGoal: async (userId, ml) => {
    await db.query('UPDATE users SET daily_water_goal_ml = ? WHERE id = ?', [ml, userId]);
  }
};

module.exports = User;

// ============================================================
// Model: SocialMediaLog — handles per-platform social media usage (Feature 26)
// ============================================================
const db = require('../config/db');

const SocialMediaLog = {
  findAllByUser: async (userId) => {
    const [rows] = await db.query(
      'SELECT * FROM social_media_logs WHERE user_id = ? ORDER BY log_date DESC, id DESC',
      [userId]
    );
    return rows;
  },

  findById: async (id, userId) => {
    const [rows] = await db.query(
      'SELECT * FROM social_media_logs WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return rows[0] || null;
  },

  create: async (userId, data) => {
    const [result] = await db.query(
      `INSERT INTO social_media_logs (user_id, log_date, platform, minutes) VALUES (?, ?, ?, ?)`,
      [userId, data.log_date, data.platform, data.minutes]
    );
    return result;
  },

  update: async (id, userId, data) => {
    const [result] = await db.query(
      `UPDATE social_media_logs SET log_date = ?, platform = ?, minutes = ? WHERE id = ? AND user_id = ?`,
      [data.log_date, data.platform, data.minutes, id, userId]
    );
    return result;
  },

  delete: async (id, userId) => {
    await db.query('DELETE FROM social_media_logs WHERE id = ? AND user_id = ?', [id, userId]);
  },

  getWeeklyByPlatform: async (userId) => {
    const [rows] = await db.query(
      `SELECT platform, COALESCE(SUM(minutes), 0) AS total_minutes
       FROM social_media_logs
       WHERE user_id = ? AND log_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY platform ORDER BY total_minutes DESC`,
      [userId]
    );
    return rows;
  }
};

module.exports = SocialMediaLog;

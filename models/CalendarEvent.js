// ============================================================
// Model: CalendarEvent — handles calendar event database ops
// ============================================================
const db = require('../config/db');

const CalendarEvent = {
  findAllByUser: async (userId) => {
    const [rows] = await db.query(
      'SELECT * FROM calendar_events WHERE user_id = ? ORDER BY start_time ASC',
      [userId]
    );
    return rows;
  },

  findById: async (id, userId) => {
    const [rows] = await db.query(
      'SELECT * FROM calendar_events WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return rows[0] || null;
  },

  findConflict: async (userId, startTime, endTime, excludeId = null) => {
    const params = [userId, endTime, startTime];
    let sql = `
      SELECT id, title, start_time, end_time
      FROM calendar_events
      WHERE user_id = ?
        AND start_time < ?
        AND end_time > ?`;
    if (excludeId) {
      sql += ' AND id <> ?';
      params.push(excludeId);
    }
    sql += ' ORDER BY start_time ASC LIMIT 1';
    const [rows] = await db.query(sql, params);
    return rows[0] || null;
  },

  create: async (userId, data) => {
    const [result] = await db.query(
      `INSERT INTO calendar_events (user_id, title, description, location, start_time, end_time)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, data.title, data.description, data.location || null, data.start_time, data.end_time]
    );
    return result;
  },

  update: async (id, userId, data) => {
    await db.query(
      `UPDATE calendar_events
       SET title = ?, description = ?, location = ?, start_time = ?, end_time = ?
       WHERE id = ? AND user_id = ?`,
      [data.title, data.description, data.location || null, data.start_time, data.end_time, id, userId]
    );
  },

  delete: async (id, userId) => {
    await db.query('DELETE FROM calendar_events WHERE id = ? AND user_id = ?', [id, userId]);
  }
};

module.exports = CalendarEvent;

// ============================================================
// Model: FocusSession — scheduled focus/distraction-reduction windows
// with an accountability check-in log (Focus Mode).
//
// A real website cannot block other apps on someone's phone — that needs
// OS-level permissions no PWA can get. So this is deliberately modeled the
// honest way similar apps like Opal actually work at the web layer: a
// scheduled commitment (with an optional "avoid these" blocklist) plus a
// daily check-in the user honestly logs themselves, not a technical block.
// ============================================================
const db = require('../config/db');

const DAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

const FocusSession = {
  findAllByUser: async (userId) => {
    const [rows] = await db.query(
      'SELECT * FROM focus_sessions WHERE user_id = ? ORDER BY start_time ASC',
      [userId]
    );
    return rows;
  },

  findById: async (id, userId) => {
    const [rows] = await db.query(
      'SELECT * FROM focus_sessions WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return rows[0] || null;
  },

  create: async (userId, data) => {
    const [result] = await db.query(
      `INSERT INTO focus_sessions (user_id, name, days_of_week, start_time, end_time, blocklist)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, data.name, data.days_of_week, data.start_time, data.end_time, data.blocklist || '']
    );
    return result;
  },

  update: async (id, userId, data) => {
    const [result] = await db.query(
      `UPDATE focus_sessions
       SET name = ?, days_of_week = ?, start_time = ?, end_time = ?, blocklist = ?
       WHERE id = ? AND user_id = ?`,
      [data.name, data.days_of_week, data.start_time, data.end_time, data.blocklist || '', id, userId]
    );
    return result;
  },

  toggleActive: async (id, userId, currentState) => {
    await db.query('UPDATE focus_sessions SET is_active = ? WHERE id = ? AND user_id = ?', [currentState ? 0 : 1, id, userId]);
  },

  delete: async (id, userId) => {
    await db.query('DELETE FROM focus_sessions WHERE id = ? AND user_id = ?', [id, userId]);
  },

  // Is any of this user's active sessions scheduled for right now?
  getActiveSessionNow: async (userId) => {
    const sessions = await FocusSession.findAllByUser(userId);
    const now = new Date();
    const dayCode = DAY_CODES[now.getDay()];
    const nowHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return sessions.find(s => {
      if (!s.is_active) return false;
      if (!s.days_of_week.split(',').includes(dayCode)) return false;
      const start = String(s.start_time).slice(0, 5);
      const end = String(s.end_time).slice(0, 5);
      return start <= end ? (nowHHMM >= start && nowHHMM <= end) : (nowHHMM >= start || nowHHMM <= end);
    }) || null;
  },

  hasCheckedInToday: async (sessionId, userId) => {
    const [rows] = await db.query(
      'SELECT id FROM focus_checkins WHERE session_id = ? AND user_id = ? AND checkin_date = CURDATE()',
      [sessionId, userId]
    );
    return !!rows[0];
  },

  checkIn: async (sessionId, userId, stayedFocused) => {
    await db.query(
      `INSERT INTO focus_checkins (session_id, user_id, checkin_date, stayed_focused)
       VALUES (?, ?, CURDATE(), ?)
       ON DUPLICATE KEY UPDATE stayed_focused = VALUES(stayed_focused)`,
      [sessionId, userId, stayedFocused ? 1 : 0]
    );
  },

  getStats: async (userId) => {
    const [[row]] = await db.query(
      `SELECT COUNT(*) AS total, SUM(stayed_focused) AS stayed
       FROM focus_checkins WHERE user_id = ?`,
      [userId]
    );
    const total = parseInt(row.total) || 0;
    const stayed = parseInt(row.stayed) || 0;
    return { total, stayed, rate: total ? Math.round((stayed / total) * 100) : null };
  }
};

module.exports = FocusSession;

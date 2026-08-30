// ============================================================
// AuthHandoff — short-lived, single-use codes that hand a completed
// Google sign-in from the system browser back to the desktop/mobile app's
// own embedded webview. Backed by the database (not an in-memory map)
// since Vercel serverless invocations don't share process memory.
// ============================================================
const crypto = require('crypto');
const db = require('../config/db');

const TTL_MS = 5 * 60 * 1000;

module.exports = {
  create: async (userId) => {
    const code = crypto.randomBytes(32).toString('hex');
    await db.query('INSERT INTO auth_handoff_codes (code, user_id) VALUES (?, ?)', [code, userId]);
    return code;
  },

  // Single-use: the row is deleted as part of redeeming it, so a code can
  // never be replayed even if it leaks (e.g. via a referrer header).
  consume: async (code) => {
    const [rows] = await db.query('SELECT user_id, created_at FROM auth_handoff_codes WHERE code = ?', [code]);
    if (!rows.length) return null;
    await db.query('DELETE FROM auth_handoff_codes WHERE code = ?', [code]);
    const ageMs = Date.now() - new Date(rows[0].created_at).getTime();
    if (ageMs > TTL_MS) return null;
    return rows[0].user_id;
  }
};

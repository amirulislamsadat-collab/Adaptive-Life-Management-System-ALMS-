// ============================================================
// Model: PushSubscription — real OS-level Web Push subscriptions, so
// reminders/alarms can actually notify a user even when ALMS isn't open
// in a tab (unlike the in-app notification banner/chip, which only works
// while the page is loaded).
// ============================================================
const db = require('../config/db');

const PushSubscription = {
  save: async (userId, subscription) => {
    await db.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), p256dh = VALUES(p256dh), auth = VALUES(auth)`,
      [userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth]
    );
  },

  removeByEndpoint: async (endpoint) => {
    await db.query('DELETE FROM push_subscriptions WHERE endpoint = ?', [endpoint]);
  },

  findAllByUser: async (userId) => {
    const [rows] = await db.query('SELECT * FROM push_subscriptions WHERE user_id = ?', [userId]);
    return rows;
  },

  // Every subscription joined with its owner, for the cron job to send
  // per-user due notifications without a query per user.
  findAllWithUser: async () => {
    const [rows] = await db.query('SELECT * FROM push_subscriptions');
    return rows;
  }
};

module.exports = PushSubscription;

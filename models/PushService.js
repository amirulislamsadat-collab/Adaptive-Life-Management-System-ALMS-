// ============================================================
// PushService — sends real Web Push notifications and cleans up
// subscriptions the browser has revoked (a 404/410 response means the
// endpoint no longer exists, so there's no point keeping it around).
// ============================================================
const { webpush, isConfigured } = require('../config/webpush');
const PushSubscription = require('./PushSubscription');

async function sendToSubscription(sub, payload) {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload)
    );
    return true;
  } catch (err) {
    if (err.statusCode === 404 || err.statusCode === 410) {
      await PushSubscription.removeByEndpoint(sub.endpoint);
    } else {
      console.error('Push send error:', err.statusCode, err.body || err.message);
    }
    return false;
  }
}

module.exports = {
  isConfigured,

  sendToUser: async (userId, payload) => {
    if (!isConfigured) return;
    const subs = await PushSubscription.findAllByUser(userId);
    await Promise.all(subs.map(sub => sendToSubscription(sub, payload)));
  },

  // For the cron job: sends the same-shaped payload to a specific
  // subscription row directly (already joined/fetched by the caller),
  // instead of re-querying per user.
  sendToSubscription
};

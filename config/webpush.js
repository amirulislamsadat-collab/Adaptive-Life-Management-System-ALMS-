// ============================================================
// Web Push config — VAPID keys for real OS-level browser notifications.
// Generate a pair once with `npx web-push generate-vapid-keys` and set
// VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY as env vars. Without them, push
// notifications are simply disabled (isConfigured stays false) rather
// than crashing anything that would otherwise use them.
// ============================================================
const webpush = require('web-push');

const isConfigured = !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

if (isConfigured) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

module.exports = { webpush, isConfigured, publicKey: process.env.VAPID_PUBLIC_KEY || null };

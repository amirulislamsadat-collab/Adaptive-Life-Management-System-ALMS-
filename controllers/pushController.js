// ============================================================
// Controller: Push — subscribing/unsubscribing a browser for real Web
// Push notifications (Settings > Notifications toggle).
// ============================================================
const PushSubscription = require('../models/PushSubscription');
const { isConfigured, publicKey } = require('../config/webpush');

exports.isConfigured = isConfigured;
exports.publicKey = publicKey;

exports.subscribe = async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Please log in.' });
  if (!isConfigured) return res.status(503).json({ error: 'Push notifications are not configured on this server.' });
  const sub = req.body.subscription;
  if (!sub || !sub.endpoint || !sub.keys || !sub.keys.p256dh || !sub.keys.auth) {
    return res.status(400).json({ error: 'Invalid subscription.' });
  }
  try {
    await PushSubscription.save(req.session.user.id, sub);
    res.json({ success: true });
  } catch (err) {
    console.error('Push subscribe error:', err);
    res.status(500).json({ error: 'Failed to save subscription.' });
  }
};

exports.unsubscribe = async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Please log in.' });
  const endpoint = req.body.endpoint;
  if (!endpoint) return res.status(400).json({ error: 'Endpoint is required.' });
  try {
    await PushSubscription.removeByEndpoint(endpoint);
    res.json({ success: true });
  } catch (err) {
    console.error('Push unsubscribe error:', err);
    res.status(500).json({ error: 'Failed to remove subscription.' });
  }
};

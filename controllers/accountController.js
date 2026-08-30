// ============================================================
// Controller: Account — profile picture + display name updates
// ============================================================
const User = require('../models/User');

// Profile pictures are stored as a base64 data URL directly in the users
// table (MEDIUMTEXT) rather than on disk or an external bucket — Vercel's
// serverless functions have an ephemeral filesystem, so anything written
// locally would vanish on the next cold start. A data URL works everywhere
// with zero extra infrastructure. The client resizes/compresses the image
// before upload to keep this reasonable in size.
const MAX_DATA_URL_LENGTH = 2 * 1024 * 1024; // ~2MB of base64 text

exports.updateProfilePicture = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const dataUrl = req.body.photo_data || '';
  if (!dataUrl.startsWith('data:image/')) {
    req.session.error = 'Please choose a valid image.';
    return res.redirect('/modules/settings');
  }
  if (dataUrl.length > MAX_DATA_URL_LENGTH) {
    req.session.error = 'That image is too large — try a smaller photo.';
    return res.redirect('/modules/settings');
  }
  try {
    await User.updateProfilePicture(req.session.user.id, dataUrl);
    req.session.success = 'Profile picture updated!';
  } catch (err) {
    console.error('Update profile picture error:', err);
    req.session.error = 'Failed to update profile picture.';
  }
  res.redirect('/modules/settings');
};

exports.removeProfilePicture = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    await User.updateProfilePicture(req.session.user.id, null);
    req.session.success = 'Profile picture removed.';
  } catch (err) {
    console.error('Remove profile picture error:', err);
    req.session.error = 'Failed to remove profile picture.';
  }
  res.redirect('/modules/settings');
};

exports.updateName = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const name = (req.body.name || '').trim();
  if (!name) {
    req.session.error = 'Name cannot be empty.';
    return res.redirect('/modules/settings');
  }
  try {
    await User.updateName(req.session.user.id, name);
    req.session.user.name = name;
    req.session.success = 'Name updated!';
  } catch (err) {
    console.error('Update name error:', err);
    req.session.error = 'Failed to update name.';
  }
  res.redirect('/modules/settings');
};

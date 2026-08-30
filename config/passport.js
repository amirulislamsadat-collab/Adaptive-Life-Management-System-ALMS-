// ============================================================
// Passport Config — Google OAuth 2.0 strategy
// ============================================================
// The app doesn't use passport's own session (req.session.user is set
// manually in routes/authRoutes.js, matching the existing email/password
// login flow), so this file only wires up the Google strategy itself.

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

const isConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

if (isConfigured) {
  passport.use(new GoogleStrategy({
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails && profile.emails[0] && profile.emails[0].value;
      if (!email) return done(null, false, { message: 'Google account has no email.' });

      let user = await User.findByGoogleId(profile.id);
      if (!user) {
        user = await User.findByEmail(email);
        if (user) {
          // Existing password-based account with a matching email — link it.
          await User.linkGoogleId(user.id, profile.id);
        } else {
          const name = profile.displayName || email.split('@')[0];
          const picture = profile.photos && profile.photos[0] ? profile.photos[0].value : null;
          const result = await User.createGoogleUser(name, email, profile.id, picture);
          user = await User.findById(result.insertId);
        }
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));
}

module.exports = { passport, isConfigured };

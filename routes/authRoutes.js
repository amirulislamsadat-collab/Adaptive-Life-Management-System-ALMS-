const express  = require('express');
const router   = express.Router();
const passport = require('passport');
const ctrl     = require('../controllers/authController');

router.get('/login',     ctrl.getLogin);
router.post('/login',    ctrl.postLogin);
router.get('/register',  ctrl.getRegister);
router.post('/register', ctrl.postRegister);
router.get('/logout',    ctrl.logout);

router.get('/auth/google', (req, res, next) => {
  if (!req.app.locals.googleAuthConfigured) {
    req.session.error = 'Google sign-in is not configured on this server.';
    return res.redirect('/login');
  }
  // Which client kicked this off travels through as the OAuth "state" param
  // and comes back unchanged in the callback below, so we know afterward
  // whether to hand off to a native app or just redirect like normal.
  const client = ['desktop', 'mobile'].includes(req.query.client) ? req.query.client : 'web';
  passport.authenticate('google', { scope: ['profile', 'email'], session: false, state: client })(req, res, next);
});

router.get('/auth/google/callback',
  (req, res, next) => passport.authenticate('google', { session: false, failureRedirect: '/login' })(req, res, next),
  ctrl.googleCallback
);

router.get('/auth/complete-handoff', ctrl.completeHandoff);

module.exports = router;

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
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
});

router.get('/auth/google/callback',
  (req, res, next) => passport.authenticate('google', { session: false, failureRedirect: '/login' })(req, res, next),
  ctrl.googleCallback
);

module.exports = router;

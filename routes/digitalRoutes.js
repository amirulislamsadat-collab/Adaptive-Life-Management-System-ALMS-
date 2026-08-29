// ============================================================
// Routes: Digital Wellbeing — Screen Time (25), Social Media (26),
// Productive Time Analysis (27, rendered on the hub page)
// ============================================================
const express        = require('express');
const router         = express.Router();
const screenTimeCtrl  = require('../controllers/screenTimeController');
const socialMediaCtrl = require('../controllers/socialMediaController');

// --- Screen Time Recording (Feature 25) ---
router.get('/screen-time',             screenTimeCtrl.getScreenTime);
router.get('/screen-time/new',         screenTimeCtrl.getCreateScreenTime);
router.post('/screen-time/create',     screenTimeCtrl.postCreateScreenTime);
router.get('/screen-time/edit/:id',    screenTimeCtrl.getEditScreenTime);
router.post('/screen-time/edit/:id',   screenTimeCtrl.postEditScreenTime);
router.post('/screen-time/delete/:id', screenTimeCtrl.deleteScreenTime);

// --- Social Media Usage Tracking (Feature 26) ---
router.get('/social-media',             socialMediaCtrl.getSocialMedia);
router.get('/social-media/new',         socialMediaCtrl.getCreateSocialMedia);
router.post('/social-media/create',     socialMediaCtrl.postCreateSocialMedia);
router.get('/social-media/edit/:id',    socialMediaCtrl.getEditSocialMedia);
router.post('/social-media/edit/:id',   socialMediaCtrl.postEditSocialMedia);
router.post('/social-media/delete/:id', socialMediaCtrl.deleteSocialMedia);

module.exports = router;

// ============================================================
// Routes: Health & Wellness — Sleep (18), Water (19), Exercise (20), Mood (21)
// ============================================================
const express     = require('express');
const router      = express.Router();
const sleepCtrl    = require('../controllers/sleepController');
const waterCtrl     = require('../controllers/waterController');
const exerciseCtrl  = require('../controllers/exerciseController');
const moodCtrl      = require('../controllers/moodController');

// --- Sleep Tracking (Feature 18) ---
router.get('/sleep',             sleepCtrl.getSleepLogs);
router.get('/sleep/new',         sleepCtrl.getCreateSleepLog);
router.post('/sleep/create',     sleepCtrl.postCreateSleepLog);
router.get('/sleep/edit/:id',    sleepCtrl.getEditSleepLog);
router.post('/sleep/edit/:id',   sleepCtrl.postEditSleepLog);
router.post('/sleep/delete/:id', sleepCtrl.deleteSleepLog);

// --- Water Intake Tracking (Feature 19) ---
router.get('/water',             waterCtrl.getWaterLogs);
router.post('/water/create',     waterCtrl.postCreateWaterLog);
router.get('/water/edit/:id',    waterCtrl.getEditWaterLog);
router.post('/water/edit/:id',   waterCtrl.postEditWaterLog);
router.post('/water/delete/:id', waterCtrl.deleteWaterLog);

// --- Exercise Tracking (Feature 20) ---
router.get('/exercise',             exerciseCtrl.getExerciseLogs);
router.get('/exercise/new',         exerciseCtrl.getCreateExerciseLog);
router.post('/exercise/create',     exerciseCtrl.postCreateExerciseLog);
router.get('/exercise/edit/:id',    exerciseCtrl.getEditExerciseLog);
router.post('/exercise/edit/:id',   exerciseCtrl.postEditExerciseLog);
router.post('/exercise/delete/:id', exerciseCtrl.deleteExerciseLog);

// --- Mood Tracking (Feature 21) ---
router.get('/mood',             moodCtrl.getMoodLogs);
router.get('/mood/new',         moodCtrl.getCreateMoodLog);
router.post('/mood/create',     moodCtrl.postCreateMoodLog);
router.get('/mood/edit/:id',    moodCtrl.getEditMoodLog);
router.post('/mood/edit/:id',   moodCtrl.postEditMoodLog);
router.post('/mood/delete/:id', moodCtrl.deleteMoodLog);

module.exports = router;

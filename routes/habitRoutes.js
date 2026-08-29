// ============================================================
// Routes: Habit Tracker — Habit Management (23), Streak Calculation (24)
// ============================================================
const express  = require('express');
const router   = express.Router();
const habitCtrl = require('../controllers/habitController');

router.get('/habits',              habitCtrl.getHabits);
router.get('/habits/new',          habitCtrl.getCreateHabit);
router.post('/habits/create',      habitCtrl.postCreateHabit);
router.get('/habits/edit/:id',     habitCtrl.getEditHabit);
router.post('/habits/edit/:id',    habitCtrl.postEditHabit);
router.post('/habits/checkin/:id', habitCtrl.checkinHabit);
router.post('/habits/delete/:id',  habitCtrl.deleteHabit);

module.exports = router;

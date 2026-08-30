const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reminderController');
const requireModule = require('../middleware/moduleAccessMiddleware');

router.use(requireModule('reminders', ['/reminders']));

router.get('/reminders', ctrl.getReminders);
router.get('/reminders/new', ctrl.getCreateReminder);
router.post('/reminders/create', ctrl.postCreateReminder);
router.get('/reminders/edit/:id', ctrl.getEditReminder);
router.post('/reminders/edit/:id', ctrl.postEditReminder);
router.post('/reminders/delete/:id', ctrl.deleteReminder);

module.exports = router;

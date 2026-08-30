const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/alarmController');
const requireModule = require('../middleware/moduleAccessMiddleware');

router.use(requireModule('alarms', ['/alarms']));

router.get('/alarms', ctrl.getAlarms);
router.get('/alarms/new', ctrl.getCreateAlarm);
router.post('/alarms/create', ctrl.postCreateAlarm);
router.get('/alarms/edit/:id', ctrl.getEditAlarm);
router.post('/alarms/edit/:id', ctrl.postEditAlarm);
router.post('/alarms/delete/:id', ctrl.deleteAlarm);

module.exports = router;

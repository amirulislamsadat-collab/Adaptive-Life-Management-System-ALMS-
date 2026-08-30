// ============================================================
// Routes: Focus Mode — scheduled focus sessions + accountability check-ins
// ============================================================
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/focusController');
const requireModule = require('../middleware/moduleAccessMiddleware');

router.use(requireModule('focus', ['/focus']));

router.get('/focus',              ctrl.getFocusSessions);
router.get('/focus/new',          ctrl.getCreateFocusSession);
router.post('/focus/create',      ctrl.postCreateFocusSession);
router.get('/focus/edit/:id',     ctrl.getEditFocusSession);
router.post('/focus/edit/:id',    ctrl.postEditFocusSession);
router.post('/focus/toggle/:id',  ctrl.toggleActive);
router.post('/focus/delete/:id',  ctrl.deleteFocusSession);
router.post('/focus/checkin/:id', ctrl.checkIn);

module.exports = router;

// ============================================================
// Routes: Personal Journal — Journal Management (Feature 31)
// ============================================================
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/journalController');
const requireModule = require('../middleware/moduleAccessMiddleware');

router.use(requireModule('journal', ['/journal']));

router.get('/journal',            ctrl.getEntries);
router.get('/journal/new',        ctrl.getCreateEntry);
router.post('/journal/create',    ctrl.postCreateEntry);
router.get('/journal/edit/:id',   ctrl.getEditEntry);
router.post('/journal/edit/:id',  ctrl.postEditEntry);
router.post('/journal/delete/:id',ctrl.deleteEntry);

module.exports = router;

// ============================================================
// Routes: Goals — Goal Management (Feature 30)
// ============================================================
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/goalController');
const requireModule = require('../middleware/moduleAccessMiddleware');

router.use(requireModule('goals', ['/goals']));

router.get('/goals',              ctrl.getGoals);
router.get('/goals/new',          ctrl.getCreateGoal);
router.post('/goals/create',      ctrl.postCreateGoal);
router.get('/goals/edit/:id',     ctrl.getEditGoal);
router.post('/goals/edit/:id',    ctrl.postEditGoal);
router.post('/goals/progress/:id',ctrl.updateProgress);
router.post('/goals/delete/:id',  ctrl.deleteGoal);

module.exports = router;

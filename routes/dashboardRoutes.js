const express   = require('express');
const router    = express.Router();
const dashCtrl  = require('../controllers/dashboardController');
const setupCtrl = require('../controllers/setupController');
const modCtrl   = require('../controllers/moduleController');

router.get('/dashboard', dashCtrl.getDashboard);

router.get('/setup',          setupCtrl.getSetup);
router.post('/setup/role',    setupCtrl.postRole);
router.post('/setup/modules', setupCtrl.postModules);

router.get('/modules/settings',              modCtrl.getSettings);
router.post('/modules/settings/toggle/:id',  modCtrl.toggleModule);
router.get('/modules/:slug',                 modCtrl.getModulePage);

module.exports = router;

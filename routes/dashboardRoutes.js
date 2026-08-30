const express     = require('express');
const router      = express.Router();
const dashCtrl     = require('../controllers/dashboardController');
const setupCtrl     = require('../controllers/setupController');
const modCtrl         = require('../controllers/moduleController');
const profileCtrl       = require('../controllers/profileController');

router.get('/dashboard', dashCtrl.getDashboard);
router.post('/dashboard/widgets', dashCtrl.postWidgetLayout);

router.get('/setup',          setupCtrl.getSetup);
router.post('/setup/role',    setupCtrl.postRole);
router.post('/setup/you',     setupCtrl.postYou);
router.post('/setup/modules', setupCtrl.postModules);

router.get('/modules/settings',              modCtrl.getSettings);
router.post('/modules/settings/toggle/:id',  modCtrl.toggleModule);

router.get('/profile',         profileCtrl.getProfile);
router.post('/profile/name',   profileCtrl.postName);
router.post('/profile/avatar', profileCtrl.postAvatar);

router.get('/modules/:slug', modCtrl.getModulePage);

module.exports = router;

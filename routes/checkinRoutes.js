const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/checkinController');

router.get('/checkin/status', ctrl.getStatus);
router.post('/checkin', ctrl.postCheckin);

module.exports = router;

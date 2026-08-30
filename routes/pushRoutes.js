const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/pushController');

router.post('/push/subscribe', ctrl.subscribe);
router.post('/push/unsubscribe', ctrl.unsubscribe);

module.exports = router;

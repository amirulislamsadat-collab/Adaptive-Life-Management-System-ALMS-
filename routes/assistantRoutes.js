const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/assistantController');

router.post('/assistant/chat', ctrl.postChat);

module.exports = router;

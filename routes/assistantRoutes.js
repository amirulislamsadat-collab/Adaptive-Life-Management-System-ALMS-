const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/assistantController');

router.get('/assistant/history', ctrl.getHistory);
router.delete('/assistant/history', ctrl.clearHistory);
router.post('/assistant/chat', ctrl.postChat);

module.exports = router;

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/calendarController');

router.get('/calendar', ctrl.getEvents);
router.get('/calendar/new', ctrl.getCreateEvent);
router.post('/calendar/create', ctrl.postCreateEvent);
router.get('/calendar/edit/:id', ctrl.getEditEvent);
router.post('/calendar/edit/:id', ctrl.postEditEvent);
router.post('/calendar/delete/:id', ctrl.deleteEvent);

module.exports = router;

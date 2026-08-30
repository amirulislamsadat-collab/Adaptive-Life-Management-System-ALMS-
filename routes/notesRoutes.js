const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notesController');
const requireModule = require('../middleware/moduleAccessMiddleware');

router.use(requireModule('notes', ['/notes']));

router.get('/notes', ctrl.getNotes);
router.get('/notes/new', ctrl.getCreateNote);
router.post('/notes/create', ctrl.postCreateNote);
router.get('/notes/edit/:id', ctrl.getEditNote);
router.post('/notes/edit/:id', ctrl.postEditNote);
router.post('/notes/pin/:id', ctrl.togglePin);
router.post('/notes/delete/:id', ctrl.deleteNote);

module.exports = router;

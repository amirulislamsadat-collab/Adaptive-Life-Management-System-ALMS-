const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/subjectController');
const requireModule = require('../middleware/moduleAccessMiddleware');

router.use(requireModule('subjects', ['/subjects']));

router.get('/subjects', ctrl.getSubjects);
router.get('/subjects/new', ctrl.getCreateSubject);
router.post('/subjects/create', ctrl.postCreateSubject);
router.get('/subjects/edit/:id', ctrl.getEditSubject);
router.post('/subjects/edit/:id', ctrl.postEditSubject);
router.post('/subjects/delete/:id', ctrl.deleteSubject);

module.exports = router;

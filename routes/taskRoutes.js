const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/taskController');

router.get('/tasks/hub',       ctrl.getTaskHub);
router.get('/tasks/new',       ctrl.getCreateTask);
router.get('/tasks/edit/:id',  ctrl.getEditTask);
router.post('/tasks/create',   ctrl.postCreateTask);
router.post('/tasks/edit/:id', ctrl.postEditTask);
router.get('/tasks/view',      ctrl.getTaskList);
router.post('/tasks/done/:id', ctrl.markDone);
router.post('/tasks/delete/:id', ctrl.deleteTask);

// Redirect base to hub
router.get('/tasks', (req, res) => res.redirect('/tasks/hub'));

module.exports = router;

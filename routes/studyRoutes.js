// ============================================================
// Routes: Study Planner — Assignments (15), Examinations (16), Study Sessions (17)
// ============================================================
const express      = require('express');
const router       = express.Router();
const assignCtrl    = require('../controllers/assignmentController');
const examCtrl       = require('../controllers/examController');
const sessionCtrl    = require('../controllers/studySessionController');

// --- Assignments (Feature 15) ---
router.get('/assignments',              assignCtrl.getAssignments);
router.get('/assignments/new',          assignCtrl.getCreateAssignment);
router.post('/assignments/create',      assignCtrl.postCreateAssignment);
router.get('/assignments/edit/:id',     assignCtrl.getEditAssignment);
router.post('/assignments/edit/:id',    assignCtrl.postEditAssignment);
router.post('/assignments/status/:id',  assignCtrl.markStatus);
router.post('/assignments/delete/:id',  assignCtrl.deleteAssignment);

// --- Examinations (Feature 16) ---
router.get('/exams',            examCtrl.getExams);
router.get('/exams/new',        examCtrl.getCreateExam);
router.post('/exams/create',    examCtrl.postCreateExam);
router.get('/exams/edit/:id',   examCtrl.getEditExam);
router.post('/exams/edit/:id',  examCtrl.postEditExam);
router.post('/exams/delete/:id',examCtrl.deleteExam);

// --- Study Sessions (Feature 17) ---
router.get('/study-sessions',             sessionCtrl.getSessions);
router.get('/study-sessions/new',         sessionCtrl.getCreateSession);
router.post('/study-sessions/create',     sessionCtrl.postCreateSession);
router.get('/study-sessions/edit/:id',    sessionCtrl.getEditSession);
router.post('/study-sessions/edit/:id',   sessionCtrl.postEditSession);
router.post('/study-sessions/status/:id', sessionCtrl.markStatus);
router.post('/study-sessions/delete/:id', sessionCtrl.deleteSession);

module.exports = router;

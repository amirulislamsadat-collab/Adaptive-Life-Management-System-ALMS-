// ============================================================
// Routes: Finance Tracker — Expense Tracking (28), Savings Goals (29)
// ============================================================
const express    = require('express');
const router     = express.Router();
const expenseCtrl = require('../controllers/expenseController');
const savingsCtrl  = require('../controllers/savingsGoalController');
const requireModule = require('../middleware/moduleAccessMiddleware');

router.use(requireModule('finance', ['/expenses', '/savings-goals']));

router.get('/expenses',             expenseCtrl.getExpenses);
router.get('/expenses/new',         expenseCtrl.getCreateExpense);
router.post('/expenses/create',     expenseCtrl.postCreateExpense);
router.get('/expenses/edit/:id',    expenseCtrl.getEditExpense);
router.post('/expenses/edit/:id',   expenseCtrl.postEditExpense);
router.post('/expenses/delete/:id', expenseCtrl.deleteExpense);

// --- Savings Goal Management (Feature 29) ---
router.get('/savings-goals',              savingsCtrl.getSavingsGoals);
router.get('/savings-goals/new',          savingsCtrl.getCreateSavingsGoal);
router.post('/savings-goals/create',      savingsCtrl.postCreateSavingsGoal);
router.get('/savings-goals/edit/:id',     savingsCtrl.getEditSavingsGoal);
router.post('/savings-goals/edit/:id',    savingsCtrl.postEditSavingsGoal);
router.post('/savings-goals/delete/:id',  savingsCtrl.deleteSavingsGoal);
router.post('/savings-goals/:id/contributions/add',              savingsCtrl.addContribution);
router.post('/savings-goals/:id/contributions/:contributionId/delete', savingsCtrl.deleteContribution);

module.exports = router;

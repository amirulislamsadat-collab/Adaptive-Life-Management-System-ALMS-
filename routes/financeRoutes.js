// ============================================================
// Routes: Finance Tracker — Expense Tracking (Feature 28)
// ============================================================
const express    = require('express');
const router     = express.Router();
const expenseCtrl = require('../controllers/expenseController');

router.get('/expenses',             expenseCtrl.getExpenses);
router.get('/expenses/new',         expenseCtrl.getCreateExpense);
router.post('/expenses/create',     expenseCtrl.postCreateExpense);
router.get('/expenses/edit/:id',    expenseCtrl.getEditExpense);
router.post('/expenses/edit/:id',   expenseCtrl.postEditExpense);
router.post('/expenses/delete/:id', expenseCtrl.deleteExpense);

module.exports = router;

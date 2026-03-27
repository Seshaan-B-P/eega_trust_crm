const express = require('express');
const router = express.Router();
const {
    createExpense,
    getAllExpenses,
    getExpenseById,
    updateExpense,
    deleteExpense,
    getExpenseStats
} = require('../controllers/expenseController');
const { authenticate, authorize } = require('../middleware/auth');

// All expense routes are protected and for admins only
router.use(authenticate);
router.use(authorize('admin'));

router.route('/')
    .get(getAllExpenses)
    .post(createExpense);

router.get('/stats', getExpenseStats); // Alias for frontend
router.get('/stats/overview', getExpenseStats);

router.route('/:id')
    .get(getExpenseById)
    .put(updateExpense)
    .delete(deleteExpense);

module.exports = router;

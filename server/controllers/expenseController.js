const Expense = require('../models/Expense');
const mongoose = require('mongoose');

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private (Admin only)
exports.createExpense = async (req, res) => {
    try {
        const expenseData = {
            ...req.body,
            createdBy: req.user.id
        };

        const expense = await Expense.create(expenseData);

        const populatedExpense = await Expense.findById(expense._id)
            .populate('createdBy', 'name email');

        res.status(201).json({
            success: true,
            message: 'Expense recorded successfully',
            data: populatedExpense
        });
    } catch (error) {
        console.error('Error creating expense:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: messages
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get all expenses with filters
// @route   GET /api/expenses
// @access  Private (Admin only)
exports.getAllExpenses = async (req, res) => {
    try {
        const {
            category,
            status,
            startDate,
            endDate,
            minAmount,
            maxAmount,
            vendorName,
            page = 1,
            limit = 20,
            sortBy = 'date',
            sortOrder = 'desc',
            search
        } = req.query;

        let query = {};

        if (search) {
            query.$or = [
                { description: { $regex: search, $options: 'i' } },
                { vendorName: { $regex: search, $options: 'i' } }
            ];
        }

        if (category) query.category = category;
        if (status) query.status = status;

        if (vendorName) {
            query.vendorName = { $regex: vendorName, $options: 'i' };
        }

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        if (minAmount || maxAmount) {
            query.amount = {};
            if (minAmount) query.amount.$gte = Number(minAmount);
            if (maxAmount) query.amount.$lte = Number(maxAmount);
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const expenses = await Expense.find(query)
            .populate('createdBy', 'name email')
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNum)
            .lean();

        const total = await Expense.countDocuments(query);

        // Stats for current query
        const stats = await Expense.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' },
                    avgAmount: { $avg: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Distribution by category
        const categoryDistribution = await Expense.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    total: { $sum: '$amount' }
                }
            },
            { $sort: { total: -1 } }
        ]);

        // Distribution by vendor
        const vendorDistribution = await Expense.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$vendorName',
                    count: { $sum: 1 },
                    total: { $sum: '$amount' }
                }
            },
            { $sort: { total: -1 } },
            { $limit: 10 }
        ]);

        res.status(200).json({
            success: true,
            count: expenses.length,
            total,
            totalPages: Math.ceil(total / limitNum),
            currentPage: pageNum,
            stats: stats[0] || { totalAmount: 0, count: 0 },
            distributions: {
                byCategory: categoryDistribution,
                byVendor: vendorDistribution
            },
            data: expenses
        });
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get expense by ID
// @route   GET /api/expenses/:id
// @access  Private (Admin only)
exports.getExpenseById = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id)
            .populate('createdBy', 'name email')
            .lean();

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        res.status(200).json({
            success: true,
            data: expense
        });
    } catch (error) {
        console.error('Error fetching expense:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private (Admin only)
exports.updateExpense = async (req, res) => {
    try {
        let expense = await Expense.findById(req.params.id);

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        expense = await Expense.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('createdBy', 'name email');

        res.status(200).json({
            success: true,
            message: 'Expense updated successfully',
            data: expense
        });
    } catch (error) {
        console.error('Error updating expense:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private (Admin only)
exports.deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        await expense.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Expense deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get expense statistics
// @route   GET /api/expenses/stats/overview
// @access  Private (Admin only)
exports.getExpenseStats = async (req, res) => {
    try {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const totalStats = await Expense.aggregate([
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const monthStats = await Expense.aggregate([
            { $match: { date: { $gte: startOfMonth } } },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                total: totalStats[0] || { totalAmount: 0, count: 0 },
                thisMonth: monthStats[0] || { totalAmount: 0, count: 0 }
            }
        });
    } catch (error) {
        console.error('Error fetching expense statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

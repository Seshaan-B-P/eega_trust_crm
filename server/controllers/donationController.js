const Donation = require('../models/Donation');
const User = require('../models/User');
const mongoose = require('mongoose');
const PDFGenerator = require('../services/pdfGenerator');
const { createNotification } = require('../utils/notificationHelper');

// @desc    Create new donation
// @route   POST /api/donations
// @access  Private (Admin only)
exports.createDonation = async (req, res) => {
    try {
        const donationData = {
            ...req.body,
            receivedBy: req.user.id,
            createdBy: req.user.id
        };

        const donation = await Donation.create(donationData);

        // Notify admins if created by staff
        if (req.user.role === 'staff') {
            await createNotification({
                title: 'New Donation Created',
                message: `Staff ${req.user.name} created a new donation of ₹${donation.amount} from ${donation.donorName}`,
                type: 'donation',
                data: { donationId: donation._id },
                createdBy: req.user._id
            });
        }

        const populatedDonation = await Donation.findById(donation._id)
            .populate('receivedBy', 'name email')
            .populate('createdBy', 'name email');

        res.status(201).json({
            success: true,
            message: 'Donation recorded successfully',
            data: populatedDonation
        });
    } catch (error) {
        console.error('Error creating donation:', error);

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

// @desc    Get all donations with filters
// @route   GET /api/donations
// @access  Private (Admin only)
exports.getAllDonations = async (req, res) => {
    try {
        const {
            donorName,
            donationType,
            purpose,
            status,
            startDate,
            endDate,
            minAmount,
            maxAmount,
            page = 1,
            limit = 20,
            sortBy = 'date',
            sortOrder = 'desc'
        } = req.query;

        let query = {};

        // Text search
        if (donorName) {
            query.$or = [
                { donorName: { $regex: donorName, $options: 'i' } },
                { donorEmail: { $regex: donorName, $options: 'i' } },
                { donationId: { $regex: donorName, $options: 'i' } },
                { receiptNumber: { $regex: donorName, $options: 'i' } }
            ];
        }

        // Filters
        if (donationType) query.donationType = donationType;
        if (purpose) query.purpose = purpose;
        if (status) query.status = status;

        // Date range
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        // Amount range
        if (minAmount || maxAmount) {
            query.amount = {};
            if (minAmount) query.amount.$gte = Number(minAmount);
            if (maxAmount) query.amount.$lte = Number(maxAmount);
        }

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Sorting
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const donations = await Donation.find(query)
            .populate('receivedBy', 'name email')
            .populate('verifiedBy', 'name email')
            .populate('createdBy', 'name')
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNum)
            .lean();

        const total = await Donation.countDocuments(query);

        // Statistics
        const stats = await Donation.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' },
                    avgAmount: { $avg: '$amount' },
                    minAmount: { $min: '$amount' },
                    maxAmount: { $max: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // This month's donations Total
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const monthStats = await Donation.aggregate([
            { $match: { date: { $gte: startOfMonth } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const finalStats = stats[0] || { totalAmount: 0, count: 0 };
        finalStats.thisMonth = monthStats[0]?.total || 0;

        // Type distribution
        const typeDistribution = await Donation.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$donationType',
                    count: { $sum: 1 },
                    total: { $sum: '$amount' }
                }
            },
            { $sort: { total: -1 } }
        ]);

        // Purpose distribution
        const purposeDistribution = await Donation.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$purpose',
                    count: { $sum: 1 },
                    total: { $sum: '$amount' }
                }
            },
            { $sort: { total: -1 } }
        ]);

        res.status(200).json({
            success: true,
            count: donations.length,
            total,
            totalPages: Math.ceil(total / limitNum),
            currentPage: pageNum,
            stats: finalStats,
            distributions: {
                byType: typeDistribution,
                byPurpose: purposeDistribution
            },
            data: donations
        });
    } catch (error) {
        console.error('Error fetching donations:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get donation by ID
// @route   GET /api/donations/:id
// @access  Private (Admin only)
exports.getDonationById = async (req, res) => {
    try {
        const donation = await Donation.findById(req.params.id)
            .populate('receivedBy', 'name email phone')
            .populate('verifiedBy', 'name email')
            .populate('createdBy', 'name email')
            .lean();

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: 'Donation not found'
            });
        }

        res.status(200).json({
            success: true,
            data: donation
        });
    } catch (error) {
        console.error('Error fetching donation:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid donation ID'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update donation
// @route   PUT /api/donations/:id
// @access  Private (Admin only)
exports.updateDonation = async (req, res) => {
    try {
        const donation = await Donation.findById(req.params.id);

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: 'Donation not found'
            });
        }

        const updatedDonation = await Donation.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('receivedBy', 'name email')
            .populate('verifiedBy', 'name email');

        // Notify admins if updated by staff
        if (req.user.role === 'staff') {
            await createNotification({
                title: 'Donation Updated',
                message: `Staff ${req.user.name} updated donation ${updatedDonation.donationId}`,
                type: 'donation',
                data: { donationId: updatedDonation._id },
                createdBy: req.user._id
            });
        }

        res.status(200).json({
            success: true,
            message: 'Donation updated successfully',
            data: updatedDonation
        });
    } catch (error) {
        console.error('Error updating donation:', error);

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

// @desc    Delete donation
// @route   DELETE /api/donations/:id
// @access  Private (Admin only)
exports.deleteDonation = async (req, res) => {
    try {
        const donation = await Donation.findById(req.params.id);

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: 'Donation not found'
            });
        }

        await donation.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Donation deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting donation:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid donation ID'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Verify donation
// @route   PUT /api/donations/:id/verify
// @access  Private (Admin only)
exports.verifyDonation = async (req, res) => {
    try {
        const donation = await Donation.findById(req.params.id);

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: 'Donation not found'
            });
        }

        donation.status = 'verified';
        donation.verifiedBy = req.user.id;
        donation.verificationDate = new Date();
        await donation.save();

        const populatedDonation = await Donation.findById(donation._id)
            .populate('verifiedBy', 'name email');

        res.status(200).json({
            success: true,
            message: 'Donation verified successfully',
            data: populatedDonation
        });
    } catch (error) {
        console.error('Error verifying donation:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Generate receipt
// @route   POST /api/donations/:id/generate-receipt
// @access  Private (Admin only)
exports.generateReceipt = async (req, res) => {
    try {
        const donation = await Donation.findById(req.params.id);

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: 'Donation not found'
            });
        }

        // Generate receipt using PDFGenerator (even if already generated, to fix broken/old links)
        const result = await PDFGenerator.generateDonationReceipt(donation, req.user);
        
        donation.receiptGenerated = true;
        donation.receiptUrl = result.url;
        await donation.save();

        res.status(200).json({
            success: true,
            message: 'Receipt generated successfully',
            data: {
                receiptNumber: donation.receiptNumber,
                receiptUrl: donation.receiptUrl
            }
        });
    } catch (error) {
        console.error('Error generating receipt:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Send thank you message
// @route   POST /api/donations/:id/send-thankyou
// @access  Private (Admin only)
exports.sendThankYou = async (req, res) => {
    try {
        const donation = await Donation.findById(req.params.id);

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: 'Donation not found'
            });
        }

        donation.thankYouSent = true;
        donation.thankYouDate = new Date();
        await donation.save();

        res.status(200).json({
            success: true,
            message: 'Thank you message sent successfully'
        });
    } catch (error) {
        console.error('Error sending thank you:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get donation statistics
// @route   GET /api/donations/stats/overview
// @access  Private (Admin only)
exports.getDonationStats = async (req, res) => {
    try {
        const today = new Date();
        const startOfToday = new Date(today.setHours(0, 0, 0, 0));
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfYear = new Date(today.getFullYear(), 0, 1);

        // Total statistics
        const totalStats = await Donation.aggregate([
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' },
                    totalDonations: { $sum: 1 },
                    avgAmount: { $avg: '$amount' }
                }
            }
        ]);

        // Today's donations
        const todayStats = await Donation.aggregate([
            { $match: { date: { $gte: startOfToday } } },
            {
                $group: {
                    _id: null,
                    amount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // This month's donations
        const monthStats = await Donation.aggregate([
            { $match: { date: { $gte: startOfMonth } } },
            {
                $group: {
                    _id: null,
                    amount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // This year's donations
        const yearStats = await Donation.aggregate([
            { $match: { date: { $gte: startOfYear } } },
            {
                $group: {
                    _id: null,
                    amount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Monthly trend (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

        const monthlyTrend = await Donation.aggregate([
            { $match: { date: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: {
                        year: { $year: '$date' },
                        month: { $month: '$date' }
                    },
                    amount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Top donors
        const topDonors = await Donation.aggregate([
            { $match: { isAnonymous: false, status: 'verified' } },
            {
                $group: {
                    _id: {
                        name: '$donorName',
                        email: '$donorEmail',
                        phone: '$donorPhone'
                    },
                    totalAmount: { $sum: '$amount' },
                    donationCount: { $sum: 1 },
                    lastDonation: { $max: '$date' }
                }
            },
            { $sort: { totalAmount: -1 } },
            { $limit: 10 }
        ]);

        res.status(200).json({
            success: true,
            data: {
                totals: totalStats[0] || { totalAmount: 0, totalDonations: 0, avgAmount: 0 },
                today: todayStats[0] || { amount: 0, count: 0 },
                thisMonth: monthStats[0] || { amount: 0, count: 0 },
                thisYear: yearStats[0] || { amount: 0, count: 0 },
                monthlyTrend,
                topDonors
            }
        });
    } catch (error) {
        console.error('Error fetching donation statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get donation receipts
// @route   GET /api/donations/receipts/recent
// @access  Private (Admin only)
exports.getRecentReceipts = async (req, res) => {
    try {
        const receipts = await Donation.find({
            receiptGenerated: true,
            receiptNumber: { $ne: null }
        })
            .select('donorName receiptNumber receiptUrl date amount donationId')
            .sort({ date: -1 })
            .limit(20)
            .lean();

        res.status(200).json({
            success: true,
            count: receipts.length,
            data: receipts
        });
    } catch (error) {
        console.error('Error fetching receipts:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};
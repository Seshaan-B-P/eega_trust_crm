const Child = require('../models/Child');
const User = require('../models/User');
const Donation = require('../models/Donation');
const DailyReport = require('../models/DailyReport');
const Attendance = require('../models/Attendance');
const mongoose = require('mongoose');

// @desc    Get comprehensive analytics
// @route   GET /api/analytics/dashboard
// @access  Private (Admin)
exports.getDashboardAnalytics = async (req, res) => {
    try {
        const today = new Date();
        const startOfToday = new Date(today.setHours(0, 0, 0, 0));
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfYear = new Date(today.getFullYear(), 0, 1);

        // Parallel queries for performance
        const [
            childStats,
            staffStats,
            donationStats,
            attendanceStats,
            healthStats,
            ageDistribution,
            genderDistribution,
            monthlyTrends
        ] = await Promise.all([
            // Child statistics
            Child.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Staff statistics
            User.aggregate([
                { $match: { role: 'staff' } },
                {
                    $group: {
                        _id: '$isActive',
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Donation statistics
            Donation.aggregate([
                {
                    $facet: {
                        total: [
                            {
                                $group: {
                                    _id: null,
                                    amount: { $sum: '$amount' },
                                    count: { $sum: 1 }
                                }
                            }
                        ],
                        byType: [
                            {
                                $group: {
                                    _id: '$donationType',
                                    amount: { $sum: '$amount' },
                                    count: { $sum: 1 }
                                }
                            }
                        ],
                        today: [
                            { $match: { date: { $gte: startOfToday } } },
                            {
                                $group: {
                                    _id: null,
                                    amount: { $sum: '$amount' },
                                    count: { $sum: 1 }
                                }
                            }
                        ],
                        thisMonth: [
                            { $match: { date: { $gte: startOfMonth } } },
                            {
                                $group: {
                                    _id: null,
                                    amount: { $sum: '$amount' },
                                    count: { $sum: 1 }
                                }
                            }
                        ]
                    }
                }
            ]),

            // Attendance statistics
            Attendance.aggregate([
                { $match: { date: { $gte: startOfMonth } } },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Health statistics
            DailyReport.aggregate([
                { $match: { date: { $gte: startOfMonth } } },
                {
                    $group: {
                        _id: '$healthStatus.overall',
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Age distribution
            Child.aggregate([
                { $match: { status: 'active' } },
                {
                    $bucket: {
                        groupBy: '$age',
                        boundaries: [0, 5, 10, 15, 18],
                        default: 'Other',
                        output: {
                            count: { $sum: 1 },
                            children: { $push: { name: '$name', childId: '$childId' } }
                        }
                    }
                }
            ]),

            // Gender distribution
            Child.aggregate([
                { $match: { status: 'active' } },
                {
                    $group: {
                        _id: '$gender',
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Monthly trends (last 12 months)
            Child.aggregate([
                {
                    $match: {
                        dateOfAdmission: {
                            $gte: new Date(new Date().setMonth(new Date().getMonth() - 12))
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$dateOfAdmission' },
                            month: { $month: '$dateOfAdmission' }
                        },
                        admissions: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ])
        ]);

        // Process child stats
        const childCounts = {
            total: childStats.reduce((sum, stat) => sum + stat.count, 0),
            active: childStats.find(s => s._id === 'active')?.count || 0,
            discharged: childStats.find(s => s._id === 'discharged')?.count || 0,
            transferred: childStats.find(s => s._id === 'transferred')?.count || 0
        };

        // Process staff stats
        const staffCounts = {
            total: staffStats.reduce((sum, stat) => sum + stat.count, 0),
            active: staffStats.find(s => s._id === true)?.count || 0,
            inactive: staffStats.find(s => s._id === false)?.count || 0
        };

        // Process donation stats (Admin only)
        const donationData = donationStats[0] || {};
        const donationSummary = {
            total: donationData.total?.[0]?.amount || 0,
            totalCount: donationData.total?.[0]?.count || 0,
            today: donationData.today?.[0]?.amount || 0,
            todayCount: donationData.today?.[0]?.count || 0,
            thisMonth: donationData.thisMonth?.[0]?.amount || 0,
            thisMonthCount: donationData.thisMonth?.[0]?.count || 0,
            byType: donationData.byType || []
        };

        // Calculate occupancy rate
        const occupancyRate = childCounts.active / (childCounts.total || 1) * 100;

        const responseData = {
            children: {
                ...childCounts,
                occupancyRate: occupancyRate.toFixed(2),
                ageDistribution,
                genderDistribution
            },
            staff: staffCounts,
            attendance: attendanceStats,
            health: healthStats,
            trends: {
                monthlyAdmissions: monthlyTrends
            },
            timestamp: new Date()
        };

        // Only include sensitive financial data for admins
        if (req.user.role === 'admin') {
            responseData.donations = donationSummary;
        }

        res.status(200).json({
            success: true,
            data: responseData
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get predictive analytics
// @route   GET /api/analytics/predictive
// @access  Private (Admin)
exports.getPredictiveAnalytics = async (req, res) => {
    try {
        // Calculate average daily expenses
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // This would be replaced with actual expense data
        const avgDailyExpense = 5000; // Placeholder

        // Project next month's needs
        const activeChildren = await Child.countDocuments({ status: 'active' });

        // Calculate projected expenses
        const projectedMonthlyExpense = activeChildren * 30 * 200; // ₹200 per child per day
        const projectedAnnualExpense = projectedMonthlyExpense * 12;

        // Calculate donation trends
        const donations = await Donation.aggregate([
            {
                $match: {
                    date: { $gte: thirtyDaysAgo },
                    status: 'verified'
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    dailyAmount: { $sum: '$amount' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Calculate average daily donation
        const avgDailyDonation = donations.reduce((sum, d) => sum + d.dailyAmount, 0) / donations.length;

        // Predict funding gap
        const fundingGap = projectedMonthlyExpense - (avgDailyDonation * 30);

        // Staff workload prediction
        const staffWorkload = await User.aggregate([
            { $match: { role: 'staff', isActive: true } },
            {
                $lookup: {
                    from: 'children',
                    localField: '_id',
                    foreignField: 'assignedStaff',
                    as: 'assigned'
                }
            },
            {
                $project: {
                    name: 1,
                    assignedCount: { $size: '$assigned' },
                    workload: {
                        $multiply: [
                            { $divide: [{ $size: '$assigned' }, 10] },
                            100
                        ]
                    }
                }
            },
            { $sort: { workload: -1 } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                financial: {
                    avgDailyExpense,
                    projectedMonthlyExpense,
                    projectedAnnualExpense,
                    avgDailyDonation,
                    fundingGap,
                    isSustainable: fundingGap < 0
                },
                staffWorkload,
                recommendations: [
                    fundingGap > 0 ? 'Increase donation efforts to cover funding gap' : 'Financially stable',
                    staffWorkload.some(s => s.workload > 80) ? 'Consider hiring additional staff' : 'Staff workload is manageable',
                    avgDailyDonation < projectedMonthlyExpense / 30 ? 'Donations below daily expenses' : 'Donations sufficient for daily operations'
                ]
            }
        });
    } catch (error) {
        console.error('Error generating predictive analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Export analytics report
// @route   GET /api/analytics/export
// @access  Private (Admin)
exports.exportAnalytics = async (req, res) => {
    try {
        const { startDate, endDate, format = 'excel' } = req.query;

        // Fetch all analytics data
        const analytics = await this.getDashboardAnalytics(req, res);

        if (format === 'excel') {
            // Generate Excel file
            const ExcelJS = require('exceljs');
            const workbook = new ExcelJS.Workbook();

            // Summary sheet
            const summarySheet = workbook.addWorksheet('Summary');
            summarySheet.columns = [
                { header: 'Metric', key: 'metric', width: 30 },
                { header: 'Value', key: 'value', width: 20 },
                { header: 'Unit', key: 'unit', width: 15 }
            ];

            // Add data
            summarySheet.addRow({ metric: 'Total Children', value: analytics.data.children.total });
            summarySheet.addRow({ metric: 'Active Children', value: analytics.data.children.active });
            summarySheet.addRow({ metric: 'Total Staff', value: analytics.data.staff.total });
            summarySheet.addRow({ metric: 'Active Staff', value: analytics.data.staff.active });
            summarySheet.addRow({ metric: 'Total Donations', value: analytics.data.donations.total, unit: '₹' });
            summarySheet.addRow({ metric: 'Monthly Donations', value: analytics.data.donations.thisMonth, unit: '₹' });
            summarySheet.addRow({ metric: 'Occupancy Rate', value: analytics.data.children.occupancyRate, unit: '%' });

            // Children sheet
            const childrenSheet = workbook.addWorksheet('Children Distribution');
            childrenSheet.columns = [
                { header: 'Category', key: 'category', width: 20 },
                { header: 'Count', key: 'count', width: 15 }
            ];

            analytics.data.children.genderDistribution.forEach(g => {
                childrenSheet.addRow({ category: `Gender: ${g._id}`, count: g.count });
            });

            analytics.data.children.ageDistribution.forEach(a => {
                childrenSheet.addRow({ category: `Age: ${a._id}`, count: a.count });
            });

            // Set response headers
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=analytics_report.xlsx');

            await workbook.xlsx.write(res);
            res.end();
        } else {
            // Return JSON
            res.status(200).json(analytics);
        }
    } catch (error) {
        console.error('Error exporting analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Error exporting analytics'
        });
    }
};
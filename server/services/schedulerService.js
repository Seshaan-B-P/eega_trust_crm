const cron = require('node-cron');
const User = require('../models/User');
const Child = require('../models/Child');
const DailyReport = require('../models/DailyReport');
const Attendance = require('../models/Attendance');
const emailService = require('./emailService');

class SchedulerService {
    constructor() {
        this.initSchedulers();
    }

    initSchedulers() {
        // Daily report reminder at 5 PM
        cron.schedule('0 17 * * *', () => {
            this.sendDailyReportReminders();
        });

        // Attendance reminder at 9 AM
        cron.schedule('0 9 * * *', () => {
            this.sendAttendanceReminders();
        });

        // Weekly summary on Monday at 9 AM
        cron.schedule('0 9 * * 1', () => {
            this.sendWeeklySummary();
        });

        // Monthly report on 1st of month at 8 AM
        cron.schedule('0 8 1 * *', () => {
            this.sendMonthlyReport();
        });

        console.log('✅ Schedulers initialized');
    }

    async sendDailyReportReminders() {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Get all active staff
            const staff = await User.find({ role: 'staff', isActive: true })
                .populate('assignedChildren');

            for (const staffMember of staff) {
                // Check which assigned children don't have reports today
                const pendingChildren = [];

                for (const child of staffMember.assignedChildren) {
                    const reportExists = await DailyReport.findOne({
                        child: child._id,
                        date: { $gte: today, $lt: tomorrow }
                    });

                    if (!reportExists) {
                        pendingChildren.push(child);
                    }
                }

                if (pendingChildren.length > 0) {
                    await emailService.sendReportReminder(staffMember, pendingChildren);
                }
            }

            console.log('✅ Daily report reminders sent');
        } catch (error) {
            console.error('Error sending report reminders:', error);
        }
    }

    async sendAttendanceReminders() {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Get all active staff
            const staff = await User.find({ role: 'staff', isActive: true });

            for (const staffMember of staff) {
                const attendanceMarked = await Attendance.findOne({
                    date: { $gte: today, $lt: tomorrow },
                    markedBy: staffMember._id
                });

                if (!attendanceMarked) {
                    await emailService.sendAttendanceReminder(staffMember);
                }
            }

            console.log('✅ Attendance reminders sent');
        } catch (error) {
            console.error('Error sending attendance reminders:', error);
        }
    }

    async sendWeeklySummary() {
        try {
            const admins = await User.find({ role: 'admin' });
            const lastWeek = new Date();
            lastWeek.setDate(lastWeek.getDate() - 7);

            const stats = {
                children: await Child.countDocuments({ createdAt: { $gte: lastWeek } }),
                reports: await DailyReport.countDocuments({ createdAt: { $gte: lastWeek } }),
                attendance: await Attendance.countDocuments({ createdAt: { $gte: lastWeek } })
            };

            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Weekly Summary Report</h2>
                    <p>Here's what happened in the last 7 days:</p>
                    
                    <ul>
                        <li>New Children: ${stats.children}</li>
                        <li>Daily Reports: ${stats.reports}</li>
                        <li>Attendance Records: ${stats.attendance}</li>
                    </ul>
                    
                    <a href="${process.env.FRONTEND_URL}/analytics" 
                       style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                        View Full Analytics
                    </a>
                </div>
            `;

            for (const admin of admins) {
                await emailService.sendEmail(admin.email, 'Weekly Summary - EEGA Trust', html);
            }

            console.log('✅ Weekly summary sent');
        } catch (error) {
            console.error('Error sending weekly summary:', error);
        }
    }

    async sendMonthlyReport() {
        try {
            const admins = await User.find({ role: 'admin' });
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);

            const stats = {
                children: await Child.countDocuments({ createdAt: { $gte: lastMonth } }),
                staff: await User.countDocuments({ role: 'staff', createdAt: { $gte: lastMonth } }),
                reports: await DailyReport.countDocuments({ createdAt: { $gte: lastMonth } }),
                attendance: await Attendance.countDocuments({ createdAt: { $gte: lastMonth } })
            };

            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Monthly Report</h2>
                    <p>Monthly statistics for ${lastMonth.toLocaleString('default', { month: 'long' })}:</p>
                    
                    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px;">
                        <p>Children Added: ${stats.children}</p>
                        <p>Staff Joined: ${stats.staff}</p>
                        <p>Daily Reports: ${stats.reports}</p>
                        <p>Attendance Records: ${stats.attendance}</p>
                    </div>
                    
                    <a href="${process.env.FRONTEND_URL}/reports/monthly" 
                       style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; display: inline-block;">
                        Download Full Report
                    </a>
                </div>
            `;

            for (const admin of admins) {
                await emailService.sendEmail(admin.email, 'Monthly Report - EEGA Trust', html);
            }

            console.log('✅ Monthly report sent');
        } catch (error) {
            console.error('Error sending monthly report:', error);
        }
    }
}

module.exports = new SchedulerService();
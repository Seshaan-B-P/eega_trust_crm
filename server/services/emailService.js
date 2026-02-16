const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: process.env.EMAIL_PORT || 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    // Load and compile template
    async loadTemplate(templateName, data) {
        const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.html`);
        const source = fs.readFileSync(templatePath, 'utf-8');
        const template = handlebars.compile(source);
        return template(data);
    }

    // Send thank you email to donor
    async sendThankYouEmail(donation, donor) {
        try {
            const html = await this.loadTemplate('thankyou', {
                donorName: donation.donorName,
                amount: donation.amount,
                donationId: donation.donationId,
                date: new Date(donation.date).toLocaleDateString(),
                purpose: donation.purpose,
                receiptNumber: donation.receiptNumber,
                receiptUrl: donation.receiptUrl
            });

            const mailOptions = {
                from: '"EEGA Trust" <donations@eegatrust.org>',
                to: donation.donorEmail || donor.email,
                subject: 'Thank You for Your Donation to EEGA Trust',
                html: html,
                attachments: donation.receiptUrl ? [{
                    filename: `receipt_${donation.receiptNumber}.pdf`,
                    path: path.join(__dirname, '..', donation.receiptUrl)
                }] : []
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('Thank you email sent:', info.messageId);
            return info;
        } catch (error) {
            console.error('Error sending thank you email:', error);
            throw error;
        }
    }

    // Send daily report reminder to staff
    async sendDailyReportReminder(staff, children) {
        try {
            const html = await this.loadTemplate('report-reminder', {
                staffName: staff.name,
                childrenCount: children.length,
                children: children.map(c => ({
                    name: c.name,
                    id: c.childId
                }))
            });

            const mailOptions = {
                from: '"EEGA Trust" <reports@eegatrust.org>',
                to: staff.email,
                subject: 'Daily Report Reminder - EEGA Trust',
                html: html
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('Report reminder sent:', info.messageId);
            return info;
        } catch (error) {
            console.error('Error sending report reminder:', error);
            throw error;
        }
    }

    // Send attendance alert
    async sendAttendanceAlert(staff, absentChildren) {
        try {
            const html = await this.loadTemplate('attendance-alert', {
                staffName: staff.name,
                date: new Date().toLocaleDateString(),
                absentCount: absentChildren.length,
                absentChildren: absentChildren.map(c => ({
                    name: c.name,
                    id: c.childId
                }))
            });

            const mailOptions = {
                from: '"EEGA Trust" <attendance@eegatrust.org>',
                to: staff.email,
                subject: 'Attendance Alert - EEGA Trust',
                html: html
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('Attendance alert sent:', info.messageId);
            return info;
        } catch (error) {
            console.error('Error sending attendance alert:', error);
            throw error;
        }
    }

    // Send weekly summary to admin
    async sendWeeklySummary(admin, summary) {
        try {
            const html = await this.loadTemplate('weekly-summary', summary);

            const mailOptions = {
                from: '"EEGA Trust" <admin@eegatrust.org>',
                to: admin.email,
                subject: `Weekly Summary - Week ${summary.weekNumber}, ${summary.year}`,
                html: html,
                attachments: summary.reportUrl ? [{
                    filename: `weekly_summary_week${summary.weekNumber}.pdf`,
                    path: summary.reportUrl
                }] : []
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('Weekly summary sent:', info.messageId);
            return info;
        } catch (error) {
            console.error('Error sending weekly summary:', error);
            throw error;
        }
    }

    // Send new child admission notification
    async sendAdmissionNotification(staff, child) {
        try {
            const html = await this.loadTemplate('new-admission', {
                staffName: staff.name,
                childName: child.name,
                childId: child.childId,
                age: child.age,
                admissionDate: new Date(child.dateOfAdmission).toLocaleDateString(),
                background: child.background
            });

            const mailOptions = {
                from: '"EEGA Trust" <admissions@eegatrust.org>',
                to: staff.email,
                subject: `New Child Admission: ${child.name}`,
                html: html
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('Admission notification sent:', info.messageId);
            return info;
        } catch (error) {
            console.error('Error sending admission notification:', error);
            throw error;
        }
    }

    // Send password reset email
    async sendPasswordResetEmail(user, resetToken) {
        try {
            const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

            const html = await this.loadTemplate('password-reset', {
                userName: user.name,
                resetUrl: resetUrl,
                expiryTime: '1 hour'
            });

            const mailOptions = {
                from: '"EEGA Trust" <security@eegatrust.org>',
                to: user.email,
                subject: 'Password Reset Request - EEGA Trust',
                html: html
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('Password reset email sent:', info.messageId);
            return info;
        } catch (error) {
            console.error('Error sending password reset email:', error);
            throw error;
        }
    }
}

module.exports = new EmailService();
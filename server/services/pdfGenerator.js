const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFGenerator {
    // Generate donation receipt
    static async generateDonationReceipt(donation, user) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const filename = `receipt_${donation.receiptNumber}_${Date.now()}.pdf`;
                const filepath = path.join(__dirname, '../uploads/receipts/', filename);

                // Create write stream
                const stream = fs.createWriteStream(filepath);
                doc.pipe(stream);

                // Add logo
                // doc.image('path/to/logo.png', 50, 45, { width: 100 });

                // Header
                doc.fontSize(25)
                    .font('Helvetica-Bold')
                    .text('EEGA Trust', 50, 50)
                    .fontSize(12)
                    .font('Helvetica')
                    .text('123 Main Street, City, State - 123456', 50, 80)
                    .text('Phone: +91 9876543210 | Email: info@eegatrust.org', 50, 95)
                    .text('GST No: 1234567890', 50, 110)
                    .moveDown();

                // Receipt Title
                doc.moveDown()
                    .fontSize(20)
                    .font('Helvetica-Bold')
                    .text('DONATION RECEIPT', { align: 'center' })
                    .moveDown();

                // Receipt details
                doc.fontSize(12)
                    .font('Helvetica-Bold')
                    .text(`Receipt No: ${donation.receiptNumber}`, 50, doc.y)
                    .font('Helvetica')
                    .text(`Date: ${new Date(donation.date).toLocaleDateString()}`, 300, doc.y - 15)
                    .moveDown();

                // Donor details
                doc.fontSize(12)
                    .font('Helvetica-Bold')
                    .text('Received from:', 50, doc.y)
                    .font('Helvetica')
                    .text(donation.donorName, 50, doc.y + 20)
                    .text(donation.donorAddress?.street || '', 50, doc.y + 35)
                    .text(`${donation.donorAddress?.city || ''} ${donation.donorAddress?.pincode || ''}`, 50, doc.y + 50)
                    .text(`Phone: ${donation.donorPhone}`, 50, doc.y + 65)
                    .text(`Email: ${donation.donorEmail || 'N/A'}`, 50, doc.y + 80);

                // Donation details table
                const tableTop = doc.y + 50;
                doc.rect(50, tableTop, 500, 30).fill('#f0f0f0');
                doc.fillColor('#000000')
                    .font('Helvetica-Bold')
                    .text('Description', 60, tableTop + 10)
                    .text('Amount (₹)', 400, tableTop + 10);

                doc.font('Helvetica')
                    .fillColor('#000000')
                    .text(`Donation for ${donation.purpose}`, 60, tableTop + 45)
                    .text(donation.amount.toFixed(2), 400, tableTop + 45);

                // Total
                const totalTop = tableTop + 80;
                doc.rect(350, totalTop, 200, 30).fill('#f0f0f0');
                doc.fillColor('#000000')
                    .font('Helvetica-Bold')
                    .text('Total Amount:', 360, totalTop + 10)
                    .text(`₹ ${donation.amount.toFixed(2)}`, 460, totalTop + 10);

                // Payment details
                doc.moveDown(3)
                    .font('Helvetica')
                    .text(`Mode of Payment: ${donation.paymentMethod || donation.donationType}`, 50, doc.y)
                    .text(`Transaction ID: ${donation.transactionId || 'N/A'}`, 50, doc.y + 20);

                // Footer
                const footerTop = doc.y + 100;
                doc.font('Helvetica')
                    .text('This is a computer generated receipt and does not require a signature.', 50, footerTop, { align: 'center' })
                    .text('Thank you for your generous donation!', 50, footerTop + 20, { align: 'center' });

                // Signature
                doc.text(`Authorized Signatory`, 400, footerTop + 50);

                doc.end();

                stream.on('finish', () => {
                    resolve({
                        filename,
                        filepath,
                        url: `/uploads/receipts/${filename}`
                    });
                });

                stream.on('error', reject);
            } catch (error) {
                reject(error);
            }
        });
    }

    // Generate monthly report
    static async generateMonthlyReport(data, month, year) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const filename = `monthly_report_${month}_${year}_${Date.now()}.pdf`;
                const filepath = path.join(__dirname, '../uploads/reports/', filename);

                const stream = fs.createWriteStream(filepath);
                doc.pipe(stream);

                // Header
                doc.fontSize(20)
                    .font('Helvetica-Bold')
                    .text(`Monthly Report - ${month}/${year}`, { align: 'center' })
                    .moveDown();

                // Summary
                doc.fontSize(14)
                    .text('Summary', { underline: true })
                    .moveDown(0.5);

                doc.fontSize(12)
                    .text(`Total Children: ${data.totalChildren}`)
                    .text(`Active Children: ${data.activeChildren}`)
                    .text(`Total Staff: ${data.totalStaff}`)
                    .text(`Total Donations: ₹${data.totalDonations}`)
                    .text(`Attendance Rate: ${data.attendanceRate}%`)
                    .moveDown();

                // Donations
                if (data.donations && data.donations.length > 0) {
                    doc.fontSize(14)
                        .text('Donations Received', { underline: true })
                        .moveDown(0.5);

                    data.donations.forEach(donation => {
                        doc.fontSize(12)
                            .text(`${new Date(donation.date).toLocaleDateString()} - ${donation.donorName}: ₹${donation.amount} (${donation.purpose})`);
                    });
                    doc.moveDown();
                }

                // Health Statistics
                if (data.healthStats) {
                    doc.fontSize(14)
                        .text('Health Statistics', { underline: true })
                        .moveDown(0.5);

                    Object.entries(data.healthStats).forEach(([status, count]) => {
                        doc.fontSize(12).text(`${status}: ${count} children`);
                    });
                }

                doc.end();

                stream.on('finish', () => {
                    resolve({
                        filename,
                        filepath,
                        url: `/uploads/reports/${filename}`
                    });
                });

                stream.on('error', reject);
            } catch (error) {
                reject(error);
            }
        });
    }

    // Generate child report
    static async generateChildReport(child, reports, attendance) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const filename = `child_report_${child.childId}_${Date.now()}.pdf`;
                const filepath = path.join(__dirname, '..//uploads/reports/', filename);

                const stream = fs.createWriteStream(filepath);
                doc.pipe(stream);

                // Header
                doc.fontSize(20)
                    .font('Helvetica-Bold')
                    .text('Child Report', { align: 'center' })
                    .moveDown();

                // Child details
                doc.fontSize(14)
                    .text('Child Information', { underline: true })
                    .moveDown(0.5);

                doc.fontSize(12)
                    .text(`Name: ${child.name}`)
                    .text(`Child ID: ${child.childId}`)
                    .text(`Date of Birth: ${new Date(child.dateOfBirth).toLocaleDateString()}`)
                    .text(`Age: ${child.age}`)
                    .text(`Gender: ${child.gender}`)
                    .text(`Admission Date: ${new Date(child.dateOfAdmission).toLocaleDateString()}`)
                    .text(`Assigned Staff: ${child.assignedStaff?.name || 'Not assigned'}`)
                    .text(`Blood Group: ${child.bloodGroup || 'Not recorded'}`)
                    .moveDown();

                // Medical History
                if (child.medicalHistory) {
                    doc.text(`Medical History: ${child.medicalHistory}`);
                }
                if (child.allergies) {
                    doc.text(`Allergies: ${child.allergies}`);
                }
                doc.moveDown();

                // Recent reports
                if (reports && reports.length > 0) {
                    doc.fontSize(14)
                        .text('Recent Daily Reports', { underline: true })
                        .moveDown(0.5);

                    reports.slice(0, 10).forEach(report => {
                        doc.fontSize(12)
                            .text(`${new Date(report.date).toLocaleDateString()}`)
                            .text(`  Health: ${report.healthStatus.overall} | Temp: ${report.healthStatus.temperature || 'N/A'}°C`)
                            .text(`  Behavior: ${report.behavior}`)
                            .text(`  Notes: ${report.specialNotes || 'No notes'}`)
                            .moveDown(0.5);
                    });
                }

                // Attendance summary
                if (attendance && attendance.length > 0) {
                    doc.fontSize(14)
                        .text('Attendance Summary', { underline: true })
                        .moveDown(0.5);

                    const present = attendance.filter(a => a.status === 'present').length;
                    const absent = attendance.filter(a => a.status === 'absent').length;
                    const sick = attendance.filter(a => a.status === 'sick').length;
                    const leave = attendance.filter(a => a.status === 'leave').length;
                    const total = attendance.length;

                    doc.fontSize(12)
                        .text(`Present: ${present} (${((present / total) * 100).toFixed(1)}%)`)
                        .text(`Absent: ${absent} (${((absent / total) * 100).toFixed(1)}%)`)
                        .text(`Sick: ${sick} (${((sick / total) * 100).toFixed(1)}%)`)
                        .text(`Leave: ${leave} (${((leave / total) * 100).toFixed(1)}%)`);
                }

                doc.end();

                stream.on('finish', () => {
                    resolve({
                        filename,
                        filepath,
                        url: `/uploads/reports/${filename}`
                    });
                });

                stream.on('error', reject);
            } catch (error) {
                reject(error);
            }
        });
    }
}

module.exports = PDFGenerator;
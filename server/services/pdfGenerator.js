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

                // Header (Logo on Left, Organization Info on Right)
                const logoPath = path.join(__dirname, '../assets/logo.jpg');
                if (fs.existsSync(logoPath)) {
                    doc.image(logoPath, 50, 45, { width: 60 });
                }

                doc.fontSize(22)
                    .font('Helvetica-Bold')
                    .text('EEGA Trust', 120, 50)
                    .fontSize(10)
                    .font('Helvetica')
                    .text('No. 45, 3rd Street, Vedaranyam - 614810, Nagapattinam District, Tamil Nadu', 120, 75)
                    .text('Phone: +91 94435 53364 | Email: info@eegatrust.org', 120, 90)
                    .text('GST No: 1234567890', 120, 105);

                // Separation Line
                doc.moveTo(50, 130).lineTo(550, 130).stroke('#eeeeee');

                // Receipt Title
                doc.fontSize(18)
                    .font('Helvetica-Bold')
                    .text('DONATION RECEIPT', 50, 150, { align: 'center' });

                // Receipt ID & Date (Compact Row)
                doc.fontSize(11)
                    .font('Helvetica-Bold')
                    .text(`Receipt No: ${donation.receiptNumber}`, 50, 190)
                    .font('Helvetica')
                    .text(`Date: ${new Date(donation.date).toLocaleDateString()}`, 400, 190);

                // Donor Info (Relative)
                doc.moveDown(2)
                    .fontSize(12)
                    .font('Helvetica-Bold')
                    .text('Received from:', 50)
                    .font('Helvetica')
                    .fontSize(13)
                    .text(donation.donorName, 50)
                    .fontSize(10)
                    .text(donation.donorAddress?.street || '', 50)
                    .text(`${donation.donorAddress?.city || ''} ${donation.donorAddress?.pincode || ''}`, 50)
                    .text(`Phone: ${donation.donorPhone}`, 50)
                    .text(`Email: ${donation.donorEmail || 'N/A'}`, 50);

                // Donation Table
                doc.moveDown(2);
                const tableTop = doc.y;
                doc.rect(50, tableTop, 500, 25).fill('#f9f9f9');
                doc.fillColor('#333333')
                    .font('Helvetica-Bold')
                    .fontSize(10)
                    .text('Description', 65, tableTop + 8)
                    .text('Amount (INR)', 450, tableTop + 8);

                doc.moveTo(50, tableTop + 25).lineTo(550, tableTop + 25).stroke('#dddddd');

                doc.font('Helvetica')
                    .fillColor('#000000')
                    .fontSize(11)
                    .text(`Donation for ${donation.purpose}`, 65, tableTop + 40)
                    .font('Helvetica-Bold')
                    .text(`₹ ${donation.amount.toLocaleString()}`, 450, tableTop + 40);

                // Total Summary
                doc.moveDown(2);
                const totalY = doc.y;
                doc.rect(350, totalY, 200, 30).fill('#f0f0f0');
                doc.fillColor('#000000')
                    .font('Helvetica-Bold')
                    .fontSize(12)
                    .text('Total Amount:', 365, totalY + 10)
                    .text(`₹ ${donation.amount.toLocaleString()}`, 465, totalY + 10);

                // Payment Info
                doc.moveDown(3)
                    .fontSize(10)
                    .font('Helvetica')
                    .text(`Mode of Payment: ${donation.paymentMethod || donation.donationType}`, 50)
                    .text(`Transaction ID: ${donation.transactionId || 'N/A'}`, 50);

                // Signature Box
                const signatureY = doc.page.height - 170;
                doc.fontSize(10)
                    .text('__________________________', 380, signatureY)
                    .text('Authorized Signatory', 400, signatureY + 15);

                // Footer
                doc.fontSize(9)
                    .fillColor('#999999')
                    .text('This is a computer generated receipt and does not require a signature.', 50, doc.page.height - 100, { align: 'center' })
                    .text('Thank you for supporting EEGA Trust!', 50, doc.page.height - 90, { align: 'center' });

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
                const logoPath = path.join(__dirname, '../assets/logo.jpg');
                if (fs.existsSync(logoPath)) {
                    doc.image(logoPath, 50, 45, { width: 50 });
                }

                doc.fontSize(20)
                    .font('Helvetica-Bold')
                    .text('EEGA Trust', 110, 50)
                    .fontSize(14)
                    .text(`Monthly Report - ${month}/${year}`, 110, 75)
                    .moveDown(2);

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
                const logoPath = path.join(__dirname, '../assets/logo.jpg');
                if (fs.existsSync(logoPath)) {
                    doc.image(logoPath, 50, 45, { width: 50 });
                }

                doc.fontSize(20)
                    .font('Helvetica-Bold')
                    .text('EEGA Trust', 110, 50)
                    .fontSize(14)
                    .text('Child Report', 110, 75)
                    .moveDown(2);

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
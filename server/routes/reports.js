// In server/routes/reports.js
const PDFGenerator = require('../services/pdfGenerator');
const EmailService = require('../services/emailService');

// @desc    Export child report as PDF
// @route   GET /api/reports/child/:id/export
// @access  Private
router.get('/child/:id/export', authenticate, async (req, res) => {
    try {
        const child = await Child.findById(req.params.id)
            .populate('assignedStaff');

        if (!child) {
            return res.status(404).json({
                success: false,
                message: 'Child not found'
            });
        }

        const reports = await DailyReport.find({ child: child._id })
            .sort({ date: -1 })
            .limit(30);

        const attendance = await Attendance.find({ child: child._id })
            .sort({ date: -1 })
            .limit(90);

        const pdf = await PDFGenerator.generateChildReport(child, reports, attendance);

        res.download(pdf.filepath, pdf.filename);
    } catch (error) {
        console.error('Error exporting child report:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating report'
        });
    }
});

// @desc    Send report via email
// @route   POST /api/reports/child/:id/email
// @access  Private
router.post('/child/:id/email', authenticate, async (req, res) => {
    try {
        const { email } = req.body;
        const child = await Child.findById(req.params.id);

        if (!child) {
            return res.status(404).json({
                success: false,
                message: 'Child not found'
            });
        }

        // Generate PDF
        const reports = await DailyReport.find({ child: child._id })
            .sort({ date: -1 })
            .limit(30);

        const attendance = await Attendance.find({ child: child._id })
            .sort({ date: -1 })
            .limit(90);

        const pdf = await PDFGenerator.generateChildReport(child, reports, attendance);

        // Send email
        await EmailService.sendChildReport(email, child, pdf.url);

        res.status(200).json({
            success: true,
            message: 'Report sent successfully'
        });
    } catch (error) {
        console.error('Error sending report:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending report'
        });
    }
});
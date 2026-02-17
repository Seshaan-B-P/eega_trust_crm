import React, { useState } from 'react';
import { FiMail, FiSend, FiEye } from 'react-icons/fi';
import api from '../utils/api';
import { toast } from 'react-hot-toast';

const EmailTemplates = () => {
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [preview, setPreview] = useState(false);

    const templates = [
        {
            id: 'welcome',
            name: 'Welcome Email',
            description: 'Send welcome email to new staff members',
            subject: 'Welcome to EEGA Trust'
        },
        {
            id: 'report_reminder',
            name: 'Daily Report Reminder',
            description: 'Remind staff about pending daily reports',
            subject: 'Daily Report Reminder'
        },
        {
            id: 'attendance_reminder',
            name: 'Attendance Reminder',
            description: 'Remind staff to mark attendance',
            subject: 'Attendance Reminder'
        },
        {
            id: 'health_alert',
            name: 'Health Alert',
            description: 'Alert staff about child health issues',
            subject: 'Health Alert'
        },
        {
            id: 'leave_request',
            name: 'Leave Request',
            description: 'Notify staff about leave requests',
            subject: 'Leave Request'
        },
        {
            id: 'holiday_reminder',
            name: 'Holiday Reminder',
            description: 'Remind staff about upcoming holidays',
            subject: 'Holiday Reminder'
        },
        {
            id: 'child_admission',
            name: 'Child Admission',
            description: 'Notify staff about new child admissions',
            subject: 'Child Admission'
        }
    ];

    const handleSendEmail = async () => {
        try {
            const response = await api.post('/email/send', {
                templateId: selectedTemplate,
                to: 'staff@eega.com'
            });
            toast.success('Email sent successfully');
        } catch (error) {
            toast.error('Failed to send email');
        }
    };

    const handlePreview = () => {
        setPreview(true);
    };

    const handleClosePreview = () => {
        setPreview(false);
    };

    return (
        <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">Email Templates</h2>
            <div className="flex flex-col gap-4">
                {templates.map((template) => (
                    <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.id)}
                        className="flex items-center gap-2 p-2 border border-gray-200 rounded hover:bg-gray-100"
                    >
                        <FiMail />
                        {template.name}
                    </button>
                ))}
            </div>
            {preview && (
                <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-bold">Preview</h3>
                    <div className="flex items-center gap-2">
                        <FiEye />
                        {templates.find((template) => template.id === selectedTemplate)?.name}
                    </div>
                    <p>{templates.find((template) => template.id === selectedTemplate)?.description}</p>
                    <p>{templates.find((template) => template.id === selectedTemplate)?.subject}</p>
                    <button
                        onClick={handleSendEmail}
                        className="flex items-center gap-2 p-2 border border-gray-200 rounded hover:bg-gray-100"
                    >
                        <FiSend />
                        Send Email
                    </button>
                    <button
                        onClick={handleClosePreview}
                        className="flex items-center gap-2 p-2 border border-gray-200 rounded hover:bg-gray-100"
                    >
                        <FiX />
                        Close Preview
                    </button>
                </div>
            )}
        </div>
    );
};

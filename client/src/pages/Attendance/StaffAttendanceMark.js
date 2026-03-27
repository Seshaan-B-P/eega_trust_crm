import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import {
    FiCalendar, FiCheckCircle, FiXCircle,
    FiClock, FiAlertCircle, FiChevronLeft, FiSave,
    FiUsers, FiUser
} from 'react-icons/fi';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const validationSchema = Yup.object({
    date: Yup.date()
        .required('Date is required')
        .max(new Date(), 'Date cannot be in future'),
    attendanceList: Yup.array().of(
        Yup.object({
            staff: Yup.string().required(),
            status: Yup.string().required('Status is required'),
            remarks: Yup.string()
        })
    )
});

const StaffAttendanceMark = () => {
    const navigate = useNavigate();
    const [staffSummary, setStaffSummary] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        fetchStaffSummary();
    }, []);

    const fetchStaffSummary = async (date) => {
        try {
            setFetching(true);
            const endpoint = date ? `/staff-attendance/today/summary?date=${date}` : '/staff-attendance/today/summary';
            const response = await api.get(endpoint);
            setStaffSummary(response.data.data?.summary || []);
        } catch (error) {
            toast.error('Error fetching staff list');
            console.error('Error:', error);
        } finally {
            setFetching(false);
        }
    };

    const initialValues = {
        date: new Date().toISOString().split('T')[0],
        attendanceList: staffSummary.map(item => ({
            staff: item.user._id,
            status: item.attendance?.status || 'present',
            remarks: item.attendance?.remarks || ''
        }))
    };

    const statusOptions = [
        { value: 'present', label: 'Present', icon: FiCheckCircle, color: 'text-green-600 bg-green-100 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/30' },
        { value: 'absent', label: 'Absent', icon: FiXCircle, color: 'text-red-600 bg-red-100 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/30' },
        { value: 'late', label: 'Late', icon: FiAlertCircle, color: 'text-yellow-600 bg-yellow-100 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/30' },
        { value: 'leave', label: 'Leave', icon: FiClock, color: 'text-primary-600 bg-primary-100 border-primary-200 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-800/30' },
        { value: 'half_day', label: 'Half Day', icon: FiUsers, color: 'text-orange-600 bg-orange-100 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800/30' }
    ];

    const handleSubmit = async (values, { setSubmitting }) => {
        try {
            setLoading(true);
            const response = await api.post('/staff-attendance/bulk', values);
            toast.success(response.data.message || 'Staff attendance marked successfully');
            navigate('/attendance?tab=staff');
        } catch (error) {
            console.error('Error:', error);
            toast.error(error.response?.data?.message || 'Error marking staff attendance');
        } finally {
            setSubmitting(false);
            setLoading(false);
        }
    };

    const bulkUpdateStatus = (status, setFieldValue, currentValues) => {
        const updatedList = currentValues.attendanceList.map(item => ({
            ...item,
            status
        }));
        setFieldValue('attendanceList', updatedList);
        toast.success(`All staff marked as ${status}`);
    };

    if (fetching) {
        return <LoadingSpinner message="Loading staff list..." />;
    }

    return (
        <div className="p-6 min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                        <button
                            onClick={() => navigate('/attendance')}
                            className="flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 transition-colors"
                        >
                            <FiChevronLeft className="mr-1" />
                            Back to Attendance
                        </button>
                        <span className="mx-2 text-gray-400">/</span>
                        <span className="text-gray-800 dark:text-gray-200 font-medium">Mark Staff Attendance</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white tracking-tight">Mark Staff Attendance</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Record daily attendance for staff members</p>
                </div>

                <Formik
                    initialValues={initialValues}
                    validationSchema={validationSchema}
                    onSubmit={handleSubmit}
                    enableReinitialize
                >
                    {({ isSubmitting, values, setFieldValue }) => (
                        <Form>
                            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-100 dark:border-slate-700/50 p-6 mb-6 transition-colors">
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 pb-6 border-b border-gray-200 dark:border-slate-700">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center">
                                            <FiCalendar className="h-5 w-5 text-gray-400 mr-2" />
                                            <Field
                                                type="date"
                                                name="date"
                                                onChange={(e) => {
                                                    const newDate = e.target.value;
                                                    setFieldValue('date', newDate);
                                                    fetchStaffSummary(newDate);
                                                }}
                                                className="px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-800 dark:text-gray-100 transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 mt-4 md:mt-0">
                                        <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Bulk Update:</span>
                                        {statusOptions.map(option => (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => bulkUpdateStatus(option.value, setFieldValue, values)}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${option.color} hover:opacity-80 transition-all`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {values.attendanceList.map((item, index) => {
                                        const summary = staffSummary.find(s => s.user._id === item.staff);
                                        const user = summary?.user;
                                        const profile = summary?.profile;

                                        return (
                                            <div key={item.staff} className="flex flex-col md:flex-row items-start md:items-center p-4 bg-gray-50 dark:bg-slate-900/50 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors">
                                                <div className="flex items-center flex-1 mb-3 md:mb-0">
                                                    <div className="h-12 w-12 bg-gradient-to-r from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-800 rounded-full flex items-center justify-center mr-4">
                                                        <FiUser className="text-emerald-600 dark:text-emerald-400 text-xl" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-800 dark:text-gray-100">{user?.name}</p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            ID: {profile?.employeeId || 'N/A'} • {profile?.designation || 'Staff'} • {profile?.department || 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center space-x-2 ml-14 md:ml-0">
                                                    {statusOptions.map(option => {
                                                        const Icon = option.icon;
                                                        return (
                                                            <label
                                                                key={option.value}
                                                                className={`flex flex-col items-center p-2 rounded-lg cursor-pointer transition-all ${item.status === option.value
                                                                    ? option.color
                                                                    : 'border border-gray-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-500 text-gray-600 dark:text-gray-400'
                                                                    }`}
                                                            >
                                                                <Field
                                                                    type="radio"
                                                                    name={`attendanceList[${index}].status`}
                                                                    value={option.value}
                                                                    className="hidden"
                                                                />
                                                                <Icon className="h-5 w-5 mb-1" />
                                                                <span className="text-xs">{option.label}</span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>

                                                <div className="flex-1 mt-3 md:mt-0 md:ml-4">
                                                    <Field
                                                        type="text"
                                                        name={`attendanceList[${index}].remarks`}
                                                        placeholder="Remarks"
                                                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm text-gray-800 dark:text-gray-100"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/attendance')}
                                        className="px-6 py-2 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || loading}
                                        className="px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition font-medium disabled:opacity-50 flex items-center"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <FiSave className="mr-2" />
                                                Save Staff Attendance
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
        </div>
    );
};

export default StaffAttendanceMark;

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import {
    FiCalendar, FiUser, FiCheckCircle, FiXCircle,
    FiClock, FiAlertCircle, FiChevronLeft, FiSave,
    FiUsers, FiThermometer
} from 'react-icons/fi';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const validationSchema = Yup.object({
    date: Yup.date()
        .required('Date is required')
        .max(new Date(), 'Date cannot be in future'),
    attendanceList: Yup.array().of(
        Yup.object({
            child: Yup.string(),
            elderly: Yup.string(),
            status: Yup.string().required('Status is required'),
            remarks: Yup.string(),
            temperature: Yup.string()
        })
    )
});

const AttendanceMark = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const preselectedChildId = queryParams.get('child');

    const [residentType, setResidentType] = useState('child');
    const [residents, setResidents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingResidents, setFetchingResidents] = useState(true);
    const [todaysAttendance, setTodaysAttendance] = useState([]);

    useEffect(() => {
        fetchResidents();
        fetchTodaysAttendance();
    }, [residentType]);

    const fetchResidents = async () => {
        try {
            setFetchingResidents(true);
            const endpoint = residentType === 'child' ? '/children?status=active' : '/elderly?status=Active';
            const response = await api.get(endpoint);
            // Backend for elderly uses 'data' key for the array, children uses 'children'
            setResidents(residentType === 'child' ? response.data.children : response.data.elderly || []);
        } catch (error) {
            toast.error(`Error fetching ${residentType === 'child' ? 'children' : 'elderly'}`);
            console.error('Error:', error);
        } finally {
            setFetchingResidents(false);
        }
    };

    const fetchTodaysAttendance = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await api.get('/attendance/today/summary');
            setTodaysAttendance(response.data.data?.summary || []);
        } catch (error) {
            console.error('Error fetching today\'s attendance:', error);
        }
    };

    const initialValues = {
        date: new Date().toISOString().split('T')[0],
        attendanceList: residents.map(res => {
            const existingAttendance = todaysAttendance.find(a => a.resident?._id === res._id);
            return {
                child: residentType === 'child' ? res._id : undefined,
                elderly: residentType === 'elderly' ? res._id : undefined,
                status: existingAttendance?.attendance?.status || 'present',
                remarks: existingAttendance?.attendance?.remarks || '',
                temperature: existingAttendance?.attendance?.temperature || ''
            };
        })
    };

    const statusOptions = [
        { value: 'present', label: 'Present', icon: FiCheckCircle, color: 'text-green-600 bg-green-100 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/30' },
        { value: 'absent', label: 'Absent', icon: FiXCircle, color: 'text-red-600 bg-red-100 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/30' },
        { value: 'sick', label: 'Sick', icon: FiAlertCircle, color: 'text-yellow-600 bg-yellow-100 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/30' },
        { value: 'leave', label: 'Leave', icon: FiClock, color: 'text-primary-600 bg-primary-100 border-primary-200 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-800/30' },
        { value: 'half_day', label: 'Half Day', icon: FiUsers, color: 'text-orange-600 bg-orange-100 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800/30' }
    ];

    const handleSubmit = async (values, { setSubmitting }) => {
        try {
            setLoading(true);

            const attendanceData = {
                date: values.date,
                attendanceList: values.attendanceList.map(item => ({
                    child: item.child,
                    elderly: item.elderly,
                    status: item.status,
                    remarks: item.remarks,
                    temperature: item.temperature
                }))
            };

            const response = await api.post('/attendance/bulk', attendanceData);

            toast.success(`Attendance marked for ${response.data.data.inserted + response.data.data.modified} ${residentType === 'child' ? 'children' : 'elderly'}`);
            navigate('/attendance');
        } catch (error) {
            console.error('Error:', error);
            toast.error(error.response?.data?.message || 'Error marking attendance');
        } finally {
            setSubmitting(false);
            setLoading(false);
        }
    };

    const getAttendanceStatusForResident = (id) => {
        const existing = todaysAttendance.find(a => a.resident?._id === id);
        return existing?.attendance?.status || null;
    };

    const bulkUpdateStatus = (status, setFieldValue, currentValues) => {
        const updatedList = currentValues.attendanceList.map(item => ({
            ...item,
            status
        }));
        setFieldValue('attendanceList', updatedList);
        toast.success(`All ${residentType === 'child' ? 'children' : 'elderly'} marked as ${status}`);
    };

    if (fetchingResidents) {
        return <LoadingSpinner message={`Loading ${residentType === 'child' ? 'children' : 'elderly'}...`} />;
    }

    return (
        <div className="p-6 min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
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
                        <span className="text-gray-800 dark:text-gray-200 font-medium">Mark Attendance</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white tracking-tight">Mark Attendance</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Record daily attendance for {residentType === 'child' ? 'children' : 'elderly'}</p>
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
                                {/* Date and Quick Actions */}
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 pb-6 border-b border-gray-200 dark:border-slate-700">
                                    <div className="flex flex-col space-y-4">
                                        <div className="flex items-center space-x-4">
                                            <div className="flex items-center">
                                                <FiCalendar className="h-5 w-5 text-gray-400 mr-2" />
                                                <Field
                                                    type="date"
                                                    name="date"
                                                    className="px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-800 dark:text-gray-100 transition-colors"
                                                />
                                            </div>

                                            {/* Resident Type Toggle */}
                                            <div className="flex bg-gray-100 dark:bg-slate-900 p-1 rounded-lg">
                                                {['child', 'elderly'].map(type => (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        onClick={() => {
                                                            setResidentType(type);
                                                        }}
                                                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${residentType === type
                                                                ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm'
                                                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                                            }`}
                                                    >
                                                        {type}
                                                    </button>
                                                ))}
                                            </div>
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

                                {/* Attendance Table */}
                                <div className="space-y-4">
                                    {values.attendanceList.map((attendance, index) => {
                                        const resId = residentType === 'child' ? attendance.child : attendance.elderly;
                                        const resident = residents.find(r => r._id === resId);
                                        const existingStatus = getAttendanceStatusForResident(resId);

                                        return (
                                            <div key={resId} className="flex flex-col md:flex-row items-start md:items-center p-4 bg-gray-50 dark:bg-slate-900/50 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors">
                                                {/* Resident Info */}
                                                <div className="flex items-center flex-1 mb-3 md:mb-0">
                                                    <div className="h-12 w-12 bg-gradient-to-r from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-full flex items-center justify-center mr-4">
                                                        {resident?.photo ? (
                                                            <img
                                                                src={resident.photo}
                                                                alt={resident.name}
                                                                className="h-12 w-12 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className="font-semibold text-primary-600 dark:text-primary-400 text-lg">
                                                                {resident?.name?.charAt(0)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-800 dark:text-gray-100">{resident?.name}</p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            {resident?.childId && `ID: ${resident.childId} • `}Age: {resident?.age} years
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Status Selection */}
                                                <div className="flex items-center space-x-2 ml-14 md:ml-0">
                                                    {statusOptions.map(option => {
                                                        const Icon = option.icon;
                                                        return (
                                                            <label
                                                                key={option.value}
                                                                className={`flex flex-col items-center p-2 rounded-lg cursor-pointer transition-all ${attendance.status === option.value
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

                                                {/* Temperature (Optional) */}
                                                <div className="flex items-center mt-3 md:mt-0 md:ml-4">
                                                    <FiThermometer className="h-4 w-4 text-gray-400 mr-1" />
                                                    <Field
                                                        type="number"
                                                        name={`attendanceList[${index}].temperature`}
                                                        placeholder="Temp °C"
                                                        step="0.1"
                                                        min="35"
                                                        max="42"
                                                        className="w-24 px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm text-gray-800 dark:text-gray-100"
                                                    />
                                                </div>

                                                {/* Remarks */}
                                                <div className="flex-1 mt-3 md:mt-0 md:ml-4">
                                                    <Field
                                                        type="text"
                                                        name={`attendanceList[${index}].remarks`}
                                                        placeholder="Remarks"
                                                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm text-gray-800 dark:text-gray-100"
                                                    />
                                                </div>

                                                {/* Existing Status Indicator */}
                                                {existingStatus && existingStatus !== attendance.status && (
                                                    <div className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded mt-2 md:mt-0 md:ml-2 border border-yellow-100 dark:border-yellow-800/30">
                                                        Already marked as {existingStatus}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Summary */}
                                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        {statusOptions.map(option => {
                                            const count = values.attendanceList.filter(a => a.status === option.value).length;
                                            const Icon = option.icon;
                                            return (
                                                <div key={option.value} className={`p-3 rounded-lg ${option.color}`}>
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-xs opacity-75">{option.label}</p>
                                                            <p className="text-2xl font-bold mt-1">{count}</p>
                                                        </div>
                                                        <Icon className="h-6 w-6 opacity-75" />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Form Actions */}
                                <div className="flex justify-end space-x-4 mt-6">
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
                                                Save Attendance
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

export default AttendanceMark;
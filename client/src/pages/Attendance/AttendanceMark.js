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
            child: Yup.string().required(),
            status: Yup.string().required('Status is required'),
            remarks: Yup.string()
        })
    )
});

const AttendanceMark = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const preselectedChildId = queryParams.get('child');

    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingChildren, setFetchingChildren] = useState(true);
    const [todaysAttendance, setTodaysAttendance] = useState([]);

    useEffect(() => {
        fetchChildren();
        fetchTodaysAttendance();
    }, []);

    const fetchChildren = async () => {
        try {
            setFetchingChildren(true);
            const response = await api.get('/children?status=active');
            setChildren(response.data.data || []);
        } catch (error) {
            toast.error('Error fetching children');
            console.error('Error:', error);
        } finally {
            setFetchingChildren(false);
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
        attendanceList: children.map(child => {
            const existingAttendance = todaysAttendance.find(a => a.child?._id === child._id);
            return {
                child: child._id,
                status: existingAttendance?.attendance?.status || 'present',
                remarks: existingAttendance?.attendance?.remarks || '',
                temperature: existingAttendance?.attendance?.temperature || ''
            };
        })
    };

    const statusOptions = [
        { value: 'present', label: 'Present', icon: FiCheckCircle, color: 'text-green-600 bg-green-100 border-green-200' },
        { value: 'absent', label: 'Absent', icon: FiXCircle, color: 'text-red-600 bg-red-100 border-red-200' },
        { value: 'sick', label: 'Sick', icon: FiAlertCircle, color: 'text-yellow-600 bg-yellow-100 border-yellow-200' },
        { value: 'leave', label: 'Leave', icon: FiClock, color: 'text-blue-600 bg-blue-100 border-blue-200' },
        { value: 'half_day', label: 'Half Day', icon: FiUsers, color: 'text-orange-600 bg-orange-100 border-orange-200' }
    ];

    const handleSubmit = async (values, { setSubmitting }) => {
        try {
            setLoading(true);
            
            const attendanceData = {
                date: values.date,
                attendanceList: values.attendanceList.map(item => ({
                    child: item.child,
                    status: item.status,
                    remarks: item.remarks,
                    temperature: item.temperature
                }))
            };
            
            const response = await api.post('/attendance/bulk', attendanceData);
            
            toast.success(`Attendance marked for ${response.data.data.inserted + response.data.data.modified} children`);
            navigate('/attendance');
        } catch (error) {
            console.error('Error:', error);
            toast.error(error.response?.data?.message || 'Error marking attendance');
        } finally {
            setSubmitting(false);
            setLoading(false);
        }
    };

    const getAttendanceStatusForChild = (childId) => {
        const existing = todaysAttendance.find(a => a.child?._id === childId);
        return existing?.attendance?.status || null;
    };

    const bulkUpdateStatus = (status, setFieldValue, currentValues) => {
        const updatedList = currentValues.attendanceList.map(item => ({
            ...item,
            status
        }));
        setFieldValue('attendanceList', updatedList);
        toast.success(`All children marked as ${status}`);
    };

    if (fetchingChildren) {
        return <LoadingSpinner message="Loading children..." />;
    }

    return (
        <div className="p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center text-sm text-gray-600 mb-4">
                        <button
                            onClick={() => navigate('/attendance')}
                            className="flex items-center text-blue-600 hover:text-blue-800"
                        >
                            <FiChevronLeft className="mr-1" />
                            Back to Attendance
                        </button>
                        <span className="mx-2">/</span>
                        <span className="text-gray-800 font-medium">Mark Attendance</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">Mark Attendance</h1>
                    <p className="text-gray-600">Record daily attendance for children</p>
                </div>

                <Formik
                    initialValues={initialValues}
                    validationSchema={validationSchema}
                    onSubmit={handleSubmit}
                    enableReinitialize
                >
                    {({ isSubmitting, values, setFieldValue }) => (
                        <Form>
                            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                                {/* Date and Quick Actions */}
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 pb-6 border-b border-gray-200">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center">
                                            <FiCalendar className="h-5 w-5 text-gray-400 mr-2" />
                                            <Field
                                                type="date"
                                                name="date"
                                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 mt-4 md:mt-0">
                                        <span className="text-sm text-gray-600 mr-2">Bulk Update:</span>
                                        {statusOptions.map(option => (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => bulkUpdateStatus(option.value, setFieldValue, values)}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${option.color} hover:opacity-80 transition`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Attendance Table */}
                                <div className="space-y-4">
                                    {values.attendanceList.map((attendance, index) => {
                                        const child = children.find(c => c._id === attendance.child);
                                        const existingStatus = getAttendanceStatusForChild(attendance.child);
                                        
                                        return (
                                            <div key={attendance.child} className="flex flex-col md:flex-row items-start md:items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                                                {/* Child Info */}
                                                <div className="flex items-center flex-1 mb-3 md:mb-0">
                                                    <div className="h-12 w-12 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center mr-4">
                                                        {child?.photo ? (
                                                            <img 
                                                                src={child.photo} 
                                                                alt={child.name}
                                                                className="h-12 w-12 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className="font-semibold text-blue-600 text-lg">
                                                                {child?.name?.charAt(0)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-800">{child?.name}</p>
                                                        <p className="text-sm text-gray-500">
                                                            ID: {child?.childId} • Age: {child?.age} years
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
                                                                className={`flex flex-col items-center p-2 rounded-lg cursor-pointer transition ${
                                                                    attendance.status === option.value
                                                                        ? option.color
                                                                        : 'border border-gray-200 hover:border-blue-300'
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
                                                        className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                                    />
                                                </div>

                                                {/* Remarks */}
                                                <div className="flex-1 mt-3 md:mt-0 md:ml-4">
                                                    <Field
                                                        type="text"
                                                        name={`attendanceList[${index}].remarks`}
                                                        placeholder="Remarks"
                                                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                                    />
                                                </div>

                                                {/* Existing Status Indicator */}
                                                {existingStatus && existingStatus !== attendance.status && (
                                                    <div className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded mt-2 md:mt-0 md:ml-2">
                                                        Already marked as {existingStatus}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Summary */}
                                <div className="mt-6 pt-6 border-t border-gray-200">
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
                                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || loading}
                                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition font-medium disabled:opacity-50 flex items-center"
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
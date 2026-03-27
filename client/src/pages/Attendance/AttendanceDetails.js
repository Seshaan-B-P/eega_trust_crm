import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
    FiCalendar, FiUser, FiClock, FiCheckCircle,
    FiXCircle, FiAlertCircle, FiEdit, FiTrash2,
    FiChevronLeft, FiThermometer, FiActivity,
    FiFileText, FiPrinter
} from 'react-icons/fi';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const AttendanceDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const type = queryParams.get('type') || 'children';
    const [attendance, setAttendance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        status: '',
        remarks: '',
        temperature: '',
        symptoms: '',
        medication: ''
    });

    useEffect(() => {
        fetchAttendance();
    }, [id]);

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            const endpoint = type === 'staff' ? `/staff-attendance/${id}` : `/attendance/${id}`;
            const response = await api.get(endpoint);
            const data = response.data.data;
            setAttendance(data);
            setFormData({
                status: data.status,
                remarks: data.remarks || '',
                temperature: data.temperature || '',
                symptoms: data.symptoms?.join(', ') || '',
                medication: data.medication || ''
            });
        } catch (error) {
            toast.error('Error fetching attendance record');
            navigate('/attendance');
        } finally {
            setLoading(false);
        }
    };

    const statusConfig = {
        present: {
            label: 'Present',
            icon: FiCheckCircle,
            color: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800/50',
            fullLabel: 'Present - Full Day'
        },
        absent: {
            label: 'Absent',
            icon: FiXCircle,
            color: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800/50',
            fullLabel: 'Absent'
        },
        sick: {
            label: 'Sick',
            icon: FiAlertCircle,
            color: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/50',
            fullLabel: 'Sick - Attended but unwell'
        },
        leave: {
            label: 'Leave',
            icon: FiCalendar,
            color: 'bg-primary-100 dark:bg-primary-900/20 text-primary-800 dark:text-primary-400 border-primary-200 dark:border-primary-800/50',
            fullLabel: 'On Leave'
        },
        half_day: {
            label: 'Half Day',
            icon: FiClock,
            color: 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-400 border-orange-200 dark:border-orange-800/50',
            fullLabel: 'Half Day - Attended half day'
        }
    };

    const handleUpdate = async () => {
        try {
            const updateData = {
                ...formData,
                symptoms: formData.symptoms ? formData.symptoms.split(',').map(s => s.trim()) : []
            };

            const endpoint = type === 'staff' ? `/staff-attendance/${id}` : `/attendance/${id}`;
            await api.put(endpoint, updateData);

            toast.success('Attendance updated successfully');
            setEditing(false);
            fetchAttendance();
        } catch (error) {
            toast.error('Error updating attendance');
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this attendance record?')) {
            try {
                const endpoint = type === 'staff' ? `/staff-attendance/${id}` : `/attendance/${id}`;
                await api.delete(endpoint);
                toast.success('Attendance record deleted');
                navigate('/attendance');
            } catch (error) {
                toast.error('Error deleting attendance record');
            }
        }
    };

    const handleVerify = async () => {
        try {
            const endpoint = type === 'staff' ? `/staff-attendance/${id}/verify` : `/attendance/${id}/verify`;
            await api.put(endpoint);
            toast.success('Attendance verified successfully');
            fetchAttendance();
        } catch (error) {
            toast.error('Only admin can verify attendance');
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (timeString) => {
        if (!timeString) return 'Not recorded';
        const time = new Date(timeString);
        return time.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getDuration = () => {
        if (!attendance?.checkInTime || !attendance?.checkOutTime) return null;

        const checkIn = new Date(attendance.checkInTime);
        const checkOut = new Date(attendance.checkOutTime);

        // Handle cases where check-out might be on a different day or earlier than check-in (unlikely but possible if data is wrong)
        if (checkOut < checkIn) return 'N/A';

        const durationMs = checkOut - checkIn;

        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

        if (hours === 0 && minutes === 0) return '0m';
        if (hours === 0) return `${minutes}m`;
        return `${hours}h ${minutes}m`;
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return <LoadingSpinner message="Loading attendance details..." />;
    }

    if (!attendance) {
        return (
            <div className="p-6 text-center dark:bg-slate-900 min-h-screen">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Attendance record not found</h3>
                <button
                    onClick={() => navigate('/attendance')}
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
                >
                    Back to Attendance
                </button>
            </div>
        );
    }

    const status = statusConfig[attendance.status] || statusConfig.present;
    const StatusIcon = status.icon;

    return (
        <div className="p-6 dark:bg-slate-900 min-h-screen">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <button
                                onClick={() => navigate('/attendance')}
                                className="flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 transition-colors"
                            >
                                <FiChevronLeft className="mr-1" />
                                Back to Attendance
                            </button>
                            <span className="mx-2">/</span>
                            <span className="text-gray-800 dark:text-gray-200 font-medium">Attendance Details</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={handlePrint}
                                className="flex items-center px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 transition-colors"
                            >
                                <FiPrinter className="mr-2" />
                                Print
                            </button>
                            <button
                                onClick={() => setEditing(!editing)}
                                className="flex items-center px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
                            >
                                <FiEdit className="mr-2" />
                                {editing ? 'Cancel Edit' : 'Edit'}
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                <FiTrash2 className="mr-2" />
                                Delete
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center">
                        <div className="h-16 w-16 rounded-xl border-4 border-white dark:border-slate-800 shadow-lg overflow-hidden bg-gradient-to-r from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 mr-4 flex items-center justify-center">
                            {attendance.child?.photo || attendance.elderly?.photo ? (
                                <img
                                    src={attendance.child?.photo || attendance.elderly?.photo}
                                    alt={attendance.child?.name || attendance.elderly?.name || attendance.staff?.name}
                                    className="h-16 w-16 object-cover"
                                />
                            ) : (
                                <div className="h-16 w-16 flex items-center justify-center">
                                    <span className="text-2xl font-black text-primary-400 dark:text-primary-600">
                                        {(attendance.child?.name || attendance.elderly?.name || attendance.staff?.name || '?')[0]}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-white uppercase tracking-tight">
                                {attendance.child?.name || attendance.elderly?.name || attendance.staff?.name}
                            </h1>
                            <div className="flex items-center flex-wrap gap-3 mt-2">
                                <span className={`px-4 py-1.5 rounded-full text-sm font-black border flex items-center uppercase tracking-wide ${status.color}`}>
                                    <StatusIcon className="mr-2" />
                                    {status.fullLabel}
                                </span>
                                <span className="text-gray-600 dark:text-gray-400 flex items-center font-medium">
                                    <FiCalendar className="mr-1" />
                                    {formatDate(attendance.date)}
                                </span>
                                {(attendance.child?.childId || attendance.staffProfile?.employeeId) && (
                                    <span className="text-gray-600 dark:text-gray-400">
                                        ID: <span className="font-black text-gray-800 dark:text-white uppercase tracking-wider">{attendance.child?.childId || attendance.staffProfile?.employeeId}</span>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Attendance Details */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 mb-6 border border-gray-100 dark:border-slate-700">
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">Attendance Information</h2>

                            {editing ? (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Status
                                        </label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
                                        >
                                            <option value="present" className="dark:bg-slate-900">Present</option>
                                            <option value="absent" className="dark:bg-slate-900">Absent</option>
                                            <option value="sick" className="dark:bg-slate-900">Sick</option>
                                            <option value="leave" className="dark:bg-slate-900">Leave</option>
                                            <option value="half_day" className="dark:bg-slate-900">Half Day</option>
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                <FiThermometer className="mr-2 text-gray-400 dark:text-gray-500" />
                                                Temperature (°C)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="35"
                                                max="45"
                                                value={formData.temperature}
                                                onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
                                                placeholder="36.5"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Medication
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.medication}
                                                onChange={(e) => setFormData({ ...formData, medication: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
                                                placeholder="Paracetamol 250mg"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Symptoms (comma separated)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.symptoms}
                                            onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
                                            placeholder="cough, fever, headache"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Remarks
                                        </label>
                                        <textarea
                                            value={formData.remarks}
                                            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                            rows="4"
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
                                            placeholder="Additional remarks..."
                                        />
                                    </div>

                                    <div className="flex justify-end space-x-4">
                                        <button
                                            onClick={() => setEditing(false)}
                                            className="px-6 py-3 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleUpdate}
                                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Basic Info */}
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Date</p>
                                            <p className="font-medium text-gray-800">{formatDate(attendance.date)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Marked By</p>
                                            <div className="flex items-center mt-1">
                                                <div className="h-8 w-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-3">
                                                    <span className="text-green-600 dark:text-green-400 font-semibold">
                                                        {attendance.markedBy?.name ? attendance.markedBy.name[0] : '?'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-800 dark:text-gray-200">{attendance.markedBy?.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{attendance.markedBy?.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Verified By</p>
                                            {attendance.verifiedBy ? (
                                                <div className="flex items-center mt-1">
                                                    <div className="h-8 w-8 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center mr-3">
                                                        <span className="text-primary-600 dark:text-primary-400 font-semibold">
                                                            {attendance.verifiedBy?.name ? attendance.verifiedBy.name[0] : '?'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-800 dark:text-gray-200">{attendance.verifiedBy.name}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {new Date(attendance.verificationDate).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 dark:text-gray-500 italic">Not verified</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Time & Health */}
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Time Details</p>
                                            <div className="grid grid-cols-2 gap-4 mt-2">
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Check In</p>
                                                    <p className="font-medium text-gray-800 dark:text-gray-100">{formatTime(attendance.checkInTime)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Check Out</p>
                                                    <p className="font-medium text-gray-800 dark:text-gray-100">{formatTime(attendance.checkOutTime)}</p>
                                                </div>
                                            </div>
                                            {getDuration() && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                                    Duration: <span className="font-medium text-gray-800 dark:text-white">{getDuration()}</span>
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Health Information</p>
                                            <div className="mt-2 space-y-2">
                                                {attendance.temperature && (
                                                    <div className="flex items-center">
                                                        <FiThermometer className="mr-2 text-gray-400" />
                                                        <span className="font-medium">{attendance.temperature}°C</span>
                                                        <span className={`ml-2 text-xs px-2 py-1 rounded-full ${attendance.temperature >= 38 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                            {attendance.temperature >= 38 ? 'Fever' : 'Normal'}
                                                        </span>
                                                    </div>
                                                )}
                                                {attendance.symptoms && attendance.symptoms.length > 0 && (
                                                    <div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Symptoms</p>
                                                        <p className="text-sm text-gray-800 dark:text-gray-200">{attendance.symptoms.join(', ')}</p>
                                                    </div>
                                                )}
                                                {attendance.medication && (
                                                    <div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Medication</p>
                                                        <p className="text-sm text-gray-800 dark:text-gray-200">{attendance.medication}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Remarks */}
                                    <div className="md:col-span-2">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Remarks</p>
                                        <div className="mt-2 p-4 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-100 dark:border-slate-800">
                                            <p className="text-gray-800 dark:text-gray-200">
                                                {attendance.remarks || 'No remarks provided'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Member Information */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-slate-700 transition-colors">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 uppercase tracking-tight">
                                {attendance.staff ? 'Staff Member' : (attendance.child ? 'Child' : 'Elderly')} Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black mb-1">Full Name</p>
                                    <p className="font-bold text-slate-800 dark:text-white tracking-tight">{attendance.child?.name || attendance.elderly?.name || attendance.staff?.name}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black mb-1">Member ID</p>
                                    <p className="font-bold text-slate-800 dark:text-white tracking-tight">{attendance.child?.childId || attendance.staffProfile?.employeeId || 'N/A'}</p>
                                </div>
                                {attendance.child || attendance.elderly ? (
                                    <>
                                        <div>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black mb-1">Age</p>
                                            <p className="font-bold text-slate-800 dark:text-white tracking-tight">{attendance.child?.age || attendance.elderly?.age} years</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black mb-1">Gender</p>
                                            <p className="font-bold text-slate-800 dark:text-white tracking-tight capitalize">{attendance.child?.gender || attendance.elderly?.gender}</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black mb-1">Designation</p>
                                            <p className="font-bold text-slate-800 dark:text-white tracking-tight">{attendance.staffProfile?.designation || 'Staff Member'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black mb-1">Department</p>
                                            <p className="font-bold text-slate-800 dark:text-white tracking-tight">{attendance.staffProfile?.department || 'N/A'}</p>
                                        </div>
                                    </>
                                )}
                                <div>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black mb-1">Assigned Staff / Contact</p>
                                    {attendance.child?.assignedStaff ? (
                                        <div className="flex items-center mt-1">
                                            <div className="h-8 w-8 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mr-3">
                                                <span className="text-green-600 dark:text-green-400 font-bold">
                                                    {attendance.child?.assignedStaff?.name ? attendance.child.assignedStaff.name[0] : '?'}
                                                </span>
                                            </div>
                                            <p className="font-bold text-slate-800 dark:text-white tracking-tight">{attendance.child.assignedStaff.name}</p>
                                        </div>
                                    ) : (
                                        <p className="text-slate-500 dark:text-slate-400 italic">Not assigned</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Actions & History */}
                    <div className="lg:col-span-1">
                        {/* Verification Status */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 mb-6 border border-gray-100 dark:border-slate-700">
                            <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Verification Status</h3>
                            <div className="space-y-4">
                                {attendance.verifiedBy ? (
                                    <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-lg border border-green-200 dark:border-green-800/50">
                                        <div className="flex items-center mb-2">
                                            <FiCheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 mr-3" />
                                            <div>
                                                <p className="font-medium text-green-800 dark:text-green-300">Verified</p>
                                                <p className="text-sm text-green-600 dark:text-green-500">By {attendance.verifiedBy.name}</p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-green-700 dark:text-green-600">
                                            Verified on {new Date(attendance.verificationDate).toLocaleString()}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                        <div className="flex items-center mb-2">
                                            <FiAlertCircle className="h-6 w-6 text-yellow-600 mr-3" />
                                            <div>
                                                <p className="font-medium text-yellow-800">Pending Verification</p>
                                                <p className="text-sm text-yellow-600">Not verified yet</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleVerify}
                                            className="w-full mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
                                        >
                                            Verify Attendance
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 mb-6 border border-gray-100 dark:border-slate-700">
                            <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <button
                                    onClick={() => navigate(`/children/${attendance.child?._id}`)}
                                    className="w-full flex items-center p-3 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                                >
                                    <FiUser className="mr-3 text-primary-600 dark:text-primary-400" />
                                    <div className="text-left">
                                        <p className="font-medium text-gray-800 dark:text-gray-200">View Child Profile</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">See complete child details</p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => navigate(`/reports/add?child=${attendance.child?._id}`)}
                                    className="w-full flex items-center p-3 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                                >
                                    <FiFileText className="mr-3 text-green-600 dark:text-green-400" />
                                    <div className="text-left">
                                        <p className="font-medium text-gray-800 dark:text-gray-200">Add Daily Report</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Create health report</p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => navigate(`/attendance/mark?child=${attendance.child?._id}`)}
                                    className="w-full flex items-center p-3 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                                >
                                    <FiActivity className="mr-3 text-purple-600 dark:text-purple-400" />
                                    <div className="text-left">
                                        <p className="font-medium text-gray-800 dark:text-gray-200">Mark Attendance</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Record new attendance</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Recent Attendance */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-slate-700">
                            <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Recent Attendance</h3>
                            <div className="space-y-3">
                                {['Yesterday', '2 days ago', '3 days ago'].map((day, index) => (
                                    <div key={index} className="p-3 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-gray-100 dark:border-slate-800">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 ${index === 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-slate-800'}`}>
                                                    {index === 0 ? (
                                                        <FiCheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                    ) : (
                                                        <FiClock className="h-4 w-4 text-gray-600 dark:text-gray-500" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{day}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Status: Present</p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-gray-500 dark:text-gray-500">10:00 AM</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceDetails;
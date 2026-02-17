import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
            const response = await api.get(`/attendance/${id}`);
            setAttendance(response.data.data);
            setFormData({
                status: response.data.data.status,
                remarks: response.data.data.remarks || '',
                temperature: response.data.data.temperature || '',
                symptoms: response.data.data.symptoms?.join(', ') || '',
                medication: response.data.data.medication || ''
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
            color: 'bg-green-100 text-green-800 border-green-200',
            fullLabel: 'Present - Full Day'
        },
        absent: {
            label: 'Absent',
            icon: FiXCircle,
            color: 'bg-red-100 text-red-800 border-red-200',
            fullLabel: 'Absent'
        },
        sick: {
            label: 'Sick',
            icon: FiAlertCircle,
            color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            fullLabel: 'Sick - Attended but unwell'
        },
        leave: {
            label: 'Leave',
            icon: FiCalendar,
            color: 'bg-blue-100 text-blue-800 border-blue-200',
            fullLabel: 'On Leave'
        },
        half_day: {
            label: 'Half Day',
            icon: FiClock,
            color: 'bg-orange-100 text-orange-800 border-orange-200',
            fullLabel: 'Half Day - Attended half day'
        }
    };

    const handleUpdate = async () => {
        try {
            const updateData = {
                ...formData,
                symptoms: formData.symptoms ? formData.symptoms.split(',').map(s => s.trim()) : []
            };

            await api.put(`/attendance/${id}`, updateData);
            
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
                await api.delete(`/attendance/${id}`);
                toast.success('Attendance record deleted');
                navigate('/attendance');
            } catch (error) {
                toast.error('Error deleting attendance record');
            }
        }
    };

    const handleVerify = async () => {
        try {
            await api.put(`/attendance/${id}/verify`);
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
        const durationMs = checkOut - checkIn;
        
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        
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
            <div className="p-6 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Attendance record not found</h3>
                <button
                    onClick={() => navigate('/attendance')}
                    className="text-blue-600 hover:text-blue-800"
                >
                    Back to Attendance
                </button>
            </div>
        );
    }

    const status = statusConfig[attendance.status] || statusConfig.present;
    const StatusIcon = status.icon;

    return (
        <div className="p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                            <button
                                onClick={() => navigate('/attendance')}
                                className="flex items-center text-blue-600 hover:text-blue-800"
                            >
                                <FiChevronLeft className="mr-1" />
                                Back to Attendance
                            </button>
                            <span className="mx-2">/</span>
                            <span className="text-gray-800 font-medium">Attendance Details</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={handlePrint}
                                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                <FiPrinter className="mr-2" />
                                Print
                            </button>
                            <button
                                onClick={() => setEditing(!editing)}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
                        <div className="h-16 w-16 rounded-xl border-4 border-white shadow-lg overflow-hidden bg-gradient-to-r from-blue-100 to-blue-200 mr-4">
                            {attendance.child?.photo ? (
                                <img 
                                    src={attendance.child.photo} 
                                    alt={attendance.child.name}
                                    className="h-16 w-16 object-cover"
                                />
                            ) : (
                                <div className="h-16 w-16 flex items-center justify-center">
                                    <FiUser className="h-8 w-8 text-blue-400" />
                                </div>
                            )}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">{attendance.child?.name}</h1>
                            <div className="flex items-center flex-wrap gap-3 mt-2">
                                <span className={`px-4 py-1.5 rounded-full text-sm font-medium border flex items-center ${status.color}`}>
                                    <StatusIcon className="mr-2" />
                                    {status.fullLabel}
                                </span>
                                <span className="text-gray-600">
                                    <FiCalendar className="inline mr-1" />
                                    {formatDate(attendance.date)}
                                </span>
                                <span className="text-gray-600">
                                    ID: <span className="font-mono font-semibold">{attendance.child?.childId}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Attendance Details */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-6">Attendance Information</h2>
                            
                            {editing ? (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Status
                                        </label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="present">Present</option>
                                            <option value="absent">Absent</option>
                                            <option value="sick">Sick</option>
                                            <option value="leave">Leave</option>
                                            <option value="half_day">Half Day</option>
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                                                <FiThermometer className="mr-2" />
                                                Temperature (°C)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="35"
                                                max="45"
                                                value={formData.temperature}
                                                onChange={(e) => setFormData({...formData, temperature: e.target.value})}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                placeholder="36.5"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Medication
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.medication}
                                                onChange={(e) => setFormData({...formData, medication: e.target.value})}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                placeholder="Paracetamol 250mg"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Symptoms (comma separated)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.symptoms}
                                            onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="cough, fever, headache"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Remarks
                                        </label>
                                        <textarea
                                            value={formData.remarks}
                                            onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                                            rows="4"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="Additional remarks..."
                                        />
                                    </div>

                                    <div className="flex justify-end space-x-4">
                                        <button
                                            onClick={() => setEditing(false)}
                                            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
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
                                            <p className="text-sm text-gray-500">Marked By</p>
                                            <div className="flex items-center mt-1">
                                                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                                    <span className="text-green-600 font-semibold">
                                                        {attendance.markedBy?.name?.charAt(0)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-800">{attendance.markedBy?.name}</p>
                                                    <p className="text-xs text-gray-500">{attendance.markedBy?.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Verified By</p>
                                            {attendance.verifiedBy ? (
                                                <div className="flex items-center mt-1">
                                                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                                        <span className="text-blue-600 font-semibold">
                                                            {attendance.verifiedBy.name.charAt(0)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-800">{attendance.verifiedBy.name}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(attendance.verificationDate).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 italic">Not verified</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Time & Health */}
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Time Details</p>
                                            <div className="grid grid-cols-2 gap-4 mt-2">
                                                <div>
                                                    <p className="text-xs text-gray-500">Check In</p>
                                                    <p className="font-medium text-gray-800">{formatTime(attendance.checkInTime)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Check Out</p>
                                                    <p className="font-medium text-gray-800">{formatTime(attendance.checkOutTime)}</p>
                                                </div>
                                            </div>
                                            {getDuration() && (
                                                <p className="text-sm text-gray-600 mt-2">
                                                    Duration: <span className="font-medium">{getDuration()}</span>
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
                                                        <p className="text-xs text-gray-500">Symptoms</p>
                                                        <p className="text-sm text-gray-800">{attendance.symptoms.join(', ')}</p>
                                                    </div>
                                                )}
                                                {attendance.medication && (
                                                    <div>
                                                        <p className="text-xs text-gray-500">Medication</p>
                                                        <p className="text-sm text-gray-800">{attendance.medication}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Remarks */}
                                    <div className="md:col-span-2">
                                        <p className="text-sm text-gray-500">Remarks</p>
                                        <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                                            <p className="text-gray-800">
                                                {attendance.remarks || 'No remarks provided'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Child Information */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-6">Child Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-sm text-gray-500">Full Name</p>
                                    <p className="font-medium text-gray-800">{attendance.child?.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Child ID</p>
                                    <p className="font-mono font-medium text-gray-800">{attendance.child?.childId}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Age</p>
                                    <p className="font-medium text-gray-800">{attendance.child?.age} years</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Gender</p>
                                    <p className="font-medium text-gray-800 capitalize">{attendance.child?.gender}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Blood Group</p>
                                    <p className="font-medium text-gray-800">{attendance.child?.bloodGroup || 'Not specified'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Assigned Staff</p>
                                    {attendance.child?.assignedStaff ? (
                                        <div className="flex items-center mt-1">
                                            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                                <span className="text-green-600 font-semibold">
                                                    {attendance.child.assignedStaff.name.charAt(0)}
                                                </span>
                                            </div>
                                            <p className="font-medium text-gray-800">{attendance.child.assignedStaff.name}</p>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 italic">Not assigned</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Actions & History */}
                    <div className="lg:col-span-1">
                        {/* Verification Status */}
                        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                            <h3 className="font-semibold text-gray-800 mb-4">Verification Status</h3>
                            <div className="space-y-4">
                                {attendance.verifiedBy ? (
                                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                        <div className="flex items-center mb-2">
                                            <FiCheckCircle className="h-6 w-6 text-green-600 mr-3" />
                                            <div>
                                                <p className="font-medium text-green-800">Verified</p>
                                                <p className="text-sm text-green-600">By {attendance.verifiedBy.name}</p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-green-700">
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
                        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                            <h3 className="font-semibold text-gray-800 mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <button
                                    onClick={() => navigate(`/children/${attendance.child?._id}`)}
                                    className="w-full flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                                >
                                    <FiUser className="mr-3 text-blue-600" />
                                    <div className="text-left">
                                        <p className="font-medium text-gray-800">View Child Profile</p>
                                        <p className="text-sm text-gray-500">See complete child details</p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => navigate(`/reports/add?child=${attendance.child?._id}`)}
                                    className="w-full flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                                >
                                    <FiFileText className="mr-3 text-green-600" />
                                    <div className="text-left">
                                        <p className="font-medium text-gray-800">Add Daily Report</p>
                                        <p className="text-sm text-gray-500">Create health report</p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => navigate(`/attendance/mark?child=${attendance.child?._id}`)}
                                    className="w-full flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                                >
                                    <FiActivity className="mr-3 text-purple-600" />
                                    <div className="text-left">
                                        <p className="font-medium text-gray-800">Mark Attendance</p>
                                        <p className="text-sm text-gray-500">Record new attendance</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Recent Attendance */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h3 className="font-semibold text-gray-800 mb-4">Recent Attendance</h3>
                            <div className="space-y-3">
                                {['Yesterday', '2 days ago', '3 days ago'].map((day, index) => (
                                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 ${index === 0 ? 'bg-green-100' : 'bg-gray-100'}`}>
                                                    {index === 0 ? (
                                                        <FiCheckCircle className="h-4 w-4 text-green-600" />
                                                    ) : (
                                                        <FiClock className="h-4 w-4 text-gray-600" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800">{day}</p>
                                                    <p className="text-xs text-gray-500">Status: Present</p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-gray-500">10:00 AM</span>
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
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
    FiUser, FiMail, FiPhone, FiMapPin, FiBriefcase,
    FiCalendar, FiClock, FiAward, FiDollarSign,
    FiEdit, FiTrash2, FiChevronLeft, FiStar,
    FiUsers, FiActivity, FiCheckCircle, FiXCircle,
    FiFileText, FiAlertCircle
} from 'react-icons/fi';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const StaffDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [staff, setStaff] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchStaffDetails();
    }, [id]);

    const fetchStaffDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/staff/${id}`);
            setStaff(response.data.data);
        } catch (error) {
            toast.error('Error loading staff details');
            navigate('/staff');
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivate = async () => {
        if (window.confirm(`Are you sure you want to deactivate ${staff?.user?.name}?`)) {
            try {
                await api.delete(`/staff/${id}`);
                toast.success('Staff deactivated successfully');
                navigate('/staff');
            } catch (error) {
                toast.error('Error deactivating staff');
            }
        }
    };

    const departmentColors = {
        caretaker: 'bg-green-100 text-green-800',
        teacher: 'bg-blue-100 text-blue-800',
        cook: 'bg-yellow-100 text-yellow-800',
        doctor: 'bg-red-100 text-red-800',
        administrator: 'bg-purple-100 text-purple-800',
        security: 'bg-gray-100 text-gray-800',
        other: 'bg-indigo-100 text-indigo-800'
    };

    const shiftLabels = {
        morning: 'Morning (6 AM - 2 PM)',
        afternoon: 'Afternoon (2 PM - 10 PM)',
        evening: 'Evening (10 PM - 6 AM)',
        flexible: 'Flexible'
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const capitalize = (str) => {
        return str?.charAt(0).toUpperCase() + str?.slice(1) || '';
    };

    if (loading) {
        return <LoadingSpinner message="Loading staff details..." />;
    }

    if (!staff) {
        return (
            <div className="p-6 text-center">
                <FiUser className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Staff member not found</h3>
                <button
                    onClick={() => navigate('/staff')}
                    className="text-blue-600 hover:text-blue-800"
                >
                    Back to Staff List
                </button>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => navigate('/staff')}
                            className="flex items-center text-blue-600 hover:text-blue-800"
                        >
                            <FiChevronLeft className="mr-1" />
                            Back to Staff List
                        </button>
                        <div className="flex items-center space-x-3">
                            <Link
                                to={`/staff/${id}/edit`}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                <FiEdit className="mr-2" />
                                Edit Profile
                            </Link>
                            {staff.isActive && (
                                <button
                                    onClick={handleDeactivate}
                                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                                >
                                    <FiTrash2 className="mr-2" />
                                    Deactivate
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Staff Header Card */}
                    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                        <div className="flex flex-col md:flex-row items-start md:items-center">
                            {/* Avatar */}
                            <div className="h-24 w-24 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mr-6">
                                {staff.user?.profileImage ? (
                                    <img 
                                        src={staff.user.profileImage} 
                                        alt={staff.user.name}
                                        className="h-24 w-24 rounded-full object-cover"
                                    />
                                ) : (
                                    staff.user?.name?.charAt(0)
                                )}
                            </div>

                            {/* Staff Info */}
                            <div className="flex-1 mt-4 md:mt-0">
                                <div className="flex flex-col md:flex-row md:items-center justify-between">
                                    <div>
                                        <div className="flex items-center">
                                            <h1 className="text-2xl font-bold text-gray-800 mr-3">
                                                {staff.user?.name}
                                            </h1>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${staff.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {staff.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <div className="flex items-center mt-2 space-x-4">
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${departmentColors[staff.department] || 'bg-gray-100'}`}>
                                                {capitalize(staff.department)}
                                            </span>
                                            <span className="text-gray-600 flex items-center">
                                                <FiBriefcase className="mr-1" />
                                                {staff.designation}
                                            </span>
                                            <span className="text-gray-600 flex items-center">
                                                <FiUsers className="mr-1" />
                                                {staff.employeeId}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Performance Rating */}
                                    <div className="mt-4 md:mt-0 bg-blue-50 p-4 rounded-lg">
                                        <div className="flex items-center">
                                            <div className="flex items-center mr-3">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <FiStar
                                                        key={star}
                                                        className={`h-5 w-5 ${star <= (staff.performance?.rating || 3) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                                    />
                                                ))}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">Performance Rating</p>
                                                <p className="text-xs text-gray-500">
                                                    Last reviewed: {staff.performance?.lastReview ? formatDate(staff.performance.lastReview) : 'Not reviewed'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Info */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                    <div className="flex items-center text-gray-600">
                                        <FiMail className="mr-2 text-gray-400" />
                                        {staff.user?.email}
                                    </div>
                                    <div className="flex items-center text-gray-600">
                                        <FiPhone className="mr-2 text-gray-400" />
                                        {staff.user?.phone}
                                    </div>
                                    <div className="flex items-center text-gray-600">
                                        <FiCalendar className="mr-2 text-gray-400" />
                                        Joined: {formatDate(staff.joiningDate)}
                                    </div>
                                </div>
                                {staff.user?.address && (
                                    <div className="flex items-center text-gray-600 mt-2">
                                        <FiMapPin className="mr-2 text-gray-400" />
                                        {staff.user.address}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200 mb-6">
                        <nav className="flex space-x-8">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                                    activeTab === 'overview'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab('children')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                                    activeTab === 'children'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Assigned Children
                            </button>
                            <button
                                onClick={() => setActiveTab('reports')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                                    activeTab === 'reports'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Daily Reports
                            </button>
                            <button
                                onClick={() => setActiveTab('documents')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                                    activeTab === 'documents'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Documents
                            </button>
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {/* Professional Details */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                        <FiBriefcase className="mr-2" />
                                        Professional Details
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-sm text-gray-500">Department</p>
                                            <p className="font-medium text-gray-800 mt-1">{capitalize(staff.department)}</p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-sm text-gray-500">Designation</p>
                                            <p className="font-medium text-gray-800 mt-1">{staff.designation}</p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-sm text-gray-500">Qualification</p>
                                            <p className="font-medium text-gray-800 mt-1">{staff.qualification || 'Not specified'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-sm text-gray-500">Experience</p>
                                            <p className="font-medium text-gray-800 mt-1">{staff.experience || 0} years</p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-sm text-gray-500">Monthly Salary</p>
                                            <p className="font-medium text-gray-800 mt-1">
                                                {staff.salary ? `₹${staff.salary.toLocaleString()}` : 'Not specified'}
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-sm text-gray-500">Shift</p>
                                            <p className="font-medium text-gray-800 mt-1">{shiftLabels[staff.shift] || staff.shift}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Working Days */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                        <FiClock className="mr-2" />
                                        Working Days
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                                            <span
                                                key={day}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                                                    staff.workingDays?.includes(day)
                                                        ? 'bg-green-100 text-green-800 border border-green-200'
                                                        : 'bg-gray-100 text-gray-500 border border-gray-200'
                                                }`}
                                            >
                                                {capitalize(day)}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Emergency Contact */}
                                {staff.emergencyContact && (staff.emergencyContact.name || staff.emergencyContact.phone) && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <FiPhone className="mr-2" />
                                            Emergency Contact
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {staff.emergencyContact.name && (
                                                <div className="bg-gray-50 p-4 rounded-lg">
                                                    <p className="text-sm text-gray-500">Name</p>
                                                    <p className="font-medium text-gray-800 mt-1">{staff.emergencyContact.name}</p>
                                                </div>
                                            )}
                                            {staff.emergencyContact.relationship && (
                                                <div className="bg-gray-50 p-4 rounded-lg">
                                                    <p className="text-sm text-gray-500">Relationship</p>
                                                    <p className="font-medium text-gray-800 mt-1">{capitalize(staff.emergencyContact.relationship)}</p>
                                                </div>
                                            )}
                                            {staff.emergencyContact.phone && (
                                                <div className="bg-gray-50 p-4 rounded-lg">
                                                    <p className="text-sm text-gray-500">Phone</p>
                                                    <p className="font-medium text-gray-800 mt-1">{staff.emergencyContact.phone}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Performance Notes */}
                                {staff.performance?.notes && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <FiActivity className="mr-2" />
                                            Performance Notes
                                        </h3>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-gray-700">{staff.performance.notes}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'children' && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                    <FiUsers className="mr-2" />
                                    Assigned Children ({staff.user?.assignedChildren?.length || 0})
                                </h3>
                                {staff.user?.assignedChildren?.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {staff.user.assignedChildren.map(child => (
                                            <Link
                                                key={child._id}
                                                to={`/children/${child._id}`}
                                                className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition"
                                            >
                                                <div className="h-12 w-12 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center mr-4">
                                                    {child.photo ? (
                                                        <img 
                                                            src={child.photo} 
                                                            alt={child.name}
                                                            className="h-12 w-12 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="font-semibold text-blue-600 text-lg">
                                                            {child.name?.charAt(0)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-800">{child.name}</p>
                                                    <div className="text-sm text-gray-500 flex items-center mt-1">
                                                        <span className="mr-2">ID: {child.childId}</span>
                                                        <span>Age: {child.age}</span>
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-xs ${
                                                    child.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {child.status}
                                                </span>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <FiUsers className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500">No children assigned yet</p>
                                        <Link
                                            to="/children/add"
                                            className="inline-flex items-center mt-4 text-blue-600 hover:text-blue-800"
                                        >
                                            Assign a child
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'reports' && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                    <FiFileText className="mr-2" />
                                    Recent Daily Reports
                                </h3>
                                {staff.performanceStats?.dailyReports?.length > 0 ? (
                                    <div className="space-y-4">
                                        {staff.performanceStats.dailyReports.slice(0, 10).map((report, index) => (
                                            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-gray-800">{report._id}</p>
                                                    <p className="text-sm text-gray-500">
                                                        Reports submitted: {report.reports}
                                                        {report.needsAttention > 0 && (
                                                            <span className="ml-2 text-red-600">
                                                                ({report.needsAttention} need attention)
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                                <span className="text-sm text-gray-500">
                                                    {report.reports} reports
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <FiFileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500">No daily reports found</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'documents' && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                    <FiFileText className="mr-2" />
                                    Documents
                                </h3>
                                {staff.documents?.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {staff.documents.map((doc, index) => (
                                            <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg">
                                                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                                                    <FiFileText className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-800">{doc.name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        Uploaded: {formatDate(doc.uploadedAt)}
                                                    </p>
                                                </div>
                                                <a
                                                    href={doc.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    View
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <FiFileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500">No documents uploaded</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Capacity Indicator */}
                    <div className="mt-6 bg-white rounded-xl shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <FiUsers className="mr-2" />
                            Staff Capacity
                        </h3>
                        <div className="flex items-center">
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700">
                                        Assigned Children: {staff.assignedChildrenCount || 0} / {staff.maxChildrenCapacity || 10}
                                    </span>
                                    <span className="text-sm font-medium text-gray-700">
                                        {Math.round(((staff.assignedChildrenCount || 0) / (staff.maxChildrenCapacity || 1)) * 100)}% Filled
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div 
                                        className="h-3 rounded-full transition-all duration-300"
                                        style={{ 
                                            width: `${Math.min(((staff.assignedChildrenCount || 0) / (staff.maxChildrenCapacity || 1)) * 100, 100)}%`,
                                            backgroundColor: (staff.assignedChildrenCount || 0) >= (staff.maxChildrenCapacity || 10) ? '#EF4444' : '#10B981'
                                        }}
                                    ></div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    {staff.canTakeMoreChildren ? 'Can take more children' : 'At maximum capacity'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffDetails;
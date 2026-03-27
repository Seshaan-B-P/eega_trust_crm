import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    FiChevronLeft, FiEdit, FiTrash2, FiUser, FiPhone,
    FiMapPin, FiCalendar, FiActivity, FiFileText, FiUsers
} from 'react-icons/fi';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';

const ChildDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [child, setChild] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchChildDetails();
    }, [id]);

    const fetchChildDetails = async () => {
        try {
            const response = await api.get(`/children/${id}`);
            // specific endpoint might return { child: ... } or { data: ... }
            // EditChild used response.data.child
            setChild(response.data.child || response.data.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching child details:', error);
            toast.error('Failed to load child details');
            setLoading(false);
        }
    };

    const handleDischarge = async () => {
        if (window.confirm(`Are you sure you want to discharge ${child?.name}? This action cannot be undone.`)) {
            try {
                await api.delete(`/children/${id}`);
                toast.success('Child discharged successfully');
                navigate('/children');
            } catch (error) {
                toast.error('Error discharging child');
            }
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!child) {
        return (
            <div className="p-6 text-center">
                <h3 className="text-xl font-medium text-gray-900 mb-2">Child not found</h3>
                <Link to="/children" className="text-primary-600 hover:text-primary-800">
                    Back to Children List
                </Link>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <Link to="/children" className="flex items-center text-primary-600 hover:text-primary-800">
                            <FiChevronLeft className="mr-1" />
                            Back to Children
                        </Link>
                        <div className="flex space-x-3">
                            <Link
                                to={`/children/edit/${id}`}
                                className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                            >
                                <FiEdit className="mr-2" />
                                Edit
                            </Link>
                            {child.status === 'active' && (
                                <button
                                    onClick={handleDischarge}
                                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                                >
                                    <FiTrash2 className="mr-2" />
                                    Discharge
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Profile Header Card */}
                    <div className="bg-white rounded-xl shadow-md p-6 flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
                        <div className="h-24 w-24 md:h-32 md:w-32 rounded-full overflow-hidden border-4 border-primary-100 bg-gray-100 flex-shrink-0 shadow-inner">
                            {child.photo ? (
                                <img
                                    src={child.photo}
                                    alt={child.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center bg-primary-50 text-primary-400">
                                    <FiUser className="h-12 w-12" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-800">{child.name}</h1>
                                    <p className="text-gray-500 font-mono mt-1">ID: {child.childId}</p>
                                </div>
                                <span className={`inline-block mt-2 md:mt-0 px-3 py-1 rounded-full text-sm font-medium capitalize
                                    ${child.status === 'active' ? 'bg-green-100 text-green-800' :
                                        child.status === 'discharged' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'}`}>
                                    {child.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                <div className="text-center md:text-left">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Age</p>
                                    <p className="font-semibold text-gray-800">{child.age} Years</p>
                                </div>
                                <div className="text-center md:text-left">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Gender</p>
                                    <p className="font-semibold text-gray-800 capitalize">{child.gender}</p>
                                </div>
                                <div className="text-center md:text-left">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Date of Birth</p>
                                    <p className="font-semibold text-gray-800">
                                        {new Date(child.dateOfBirth).toLocaleDateString('en-IN')}
                                    </p>
                                </div>
                                <div className="text-center md:text-left">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Blood Group</p>
                                    <p className="font-semibold text-gray-800">{child.bloodGroup || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Background */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                <FiFileText className="mr-2 text-primary-600" />
                                Background & History
                            </h2>
                            <p className="text-gray-600 whitespace-pre-line leading-relaxed">
                                {child.background}
                            </p>
                        </div>

                        {/* Medical Information */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                <FiActivity className="mr-2 text-red-500" />
                                Medical Information
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900 mb-1">Medical History</h3>
                                    <p className="text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        {child.medicalHistory || 'No significant medical history recorded.'}
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900 mb-1">Allergies</h3>
                                    <p className="text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        {child.allergies || 'No known allergies.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Guardian Information */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                <FiUsers className="mr-2 text-green-600" />
                                Guardian / Emergency Contact
                            </h2>
                            {child.guardianInfo && (child.guardianInfo.name || child.guardianInfo.phone) ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Name</p>
                                        <p className="font-medium text-gray-800 mt-1">{child.guardianInfo.name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Relationship</p>
                                        <p className="font-medium text-gray-800 mt-1 capitalize">{child.guardianInfo.relationship || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Phone</p>
                                        <div className="flex items-center mt-1">
                                            <FiPhone className="text-gray-400 mr-2" />
                                            <span className="font-medium text-gray-800">{child.guardianInfo.phone || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Address</p>
                                        <div className="flex items-start mt-1">
                                            <FiMapPin className="text-gray-400 mr-2 mt-1" />
                                            <span className="font-medium text-gray-800">{child.guardianInfo.address || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-500 italic">No guardian information available.</p>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Assigned Staff */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Assigned Staff</h2>
                            {child.assignedStaff ? (
                                <div className="flex items-center p-3 bg-primary-50 rounded-lg border border-primary-100">
                                    <div className="h-10 w-10 bg-primary-200 rounded-full flex items-center justify-center mr-3 text-primary-700 font-bold">
                                        {child.assignedStaff.name?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{child.assignedStaff.name}</p>
                                        <p className="text-xs text-gray-600">{child.assignedStaff.email}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-100 border-dashed">
                                    <p className="text-gray-500 text-sm">No staff assigned</p>
                                    <Link to={`/children/edit/${id}`} className="text-primary-600 text-xs font-medium mt-1 inline-block hover:underline">
                                        Assign Staff
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Recent Activity / System Info */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">System Information</h2>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                    <span className="text-sm text-gray-500">Admission Date</span>
                                    <span className="text-sm font-medium text-gray-800">
                                        {new Date(child.dateOfAdmission).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                    <span className="text-sm text-gray-500">Last Updated</span>
                                    <span className="text-sm font-medium text-gray-800">
                                        {new Date(child.updatedAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-sm text-gray-500">Created By</span>
                                    <span className="text-sm font-medium text-gray-800">
                                        {child.createdBy?.name || 'Admin'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
                            <div className="space-y-3">
                                <Link
                                    to={`/reports/add?child=${id}`}
                                    className="block w-full text-center py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                                >
                                    Add Daily Report
                                </Link>
                                <Link
                                    to={`/attendance/mark?child=${id}`}
                                    className="block w-full text-center py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                                >
                                    Mark Attendance
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChildDetails;
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    FiChevronLeft, FiEdit, FiTrash2, FiUser, FiPhone,
    FiMapPin, FiCalendar, FiActivity, FiFileText, FiUsers
} from 'react-icons/fi';
import elderlyService from '../../services/elderlyService';
import { toast } from 'react-hot-toast';

const ElderlyProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [elderly, setElderly] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchElderlyDetails();
    }, [id]);

    const fetchElderlyDetails = async () => {
        try {
            const response = await elderlyService.getElderlyById(id);
            setElderly(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching details:', err);
            toast.error('Failed to load resident details');
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
            try {
                await elderlyService.deleteElderly(id);
                toast.success('Resident deleted successfully');
                navigate('/elderly');
            } catch (err) {
                toast.error('Failed to delete record');
            }
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64 bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!elderly) {
        return (
            <div className="p-6 text-center min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
                <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">Resident not found</h3>
                <Link to="/elderly" className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300">
                    &larr; Back to List
                </Link>
            </div>
        );
    }

    const { emergencyContact } = elderly;
    const assignedCaretaker = elderly.assignedStaff;

    return (
        <div className="p-6 min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <Link to="/elderly" className="flex items-center text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300">
                            <FiChevronLeft className="mr-1" />
                            Back to Elderly List
                        </Link>
                        <div className="flex space-x-3">
                            <Link
                                to={`/elderly/edit/${id}`}
                                className="flex items-center px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                            >
                                <FiEdit className="mr-2" />
                                Edit
                            </Link>
                            {user?.role === 'admin' && (
                                <button
                                    onClick={handleDelete}
                                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition shadow-lg shadow-red-500/30"
                                >
                                    <FiTrash2 className="mr-2" />
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Profile Header Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-slate-700 flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
                        <div className="h-24 w-24 md:h-32 md:w-32 rounded-full overflow-hidden border-4 border-primary-100 dark:border-primary-900/30 bg-gray-100 dark:bg-slate-700 flex-shrink-0 shadow-inner">
                            {elderly.photo ? (
                                <img
                                    src={elderly.photo}
                                    alt={elderly.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center bg-primary-50 dark:bg-primary-900/20 text-primary-400 dark:text-primary-300/50">
                                    <FiUser className="h-16 w-16" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white uppercase tracking-tight">{elderly.name}</h1>
                                    <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center justify-center md:justify-start">
                                        <FiCalendar className="inline mr-1" />
                                        DOB: {new Date(elderly.dateOfBirth).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className={`inline-block mt-2 md:mt-0 px-3 py-1 rounded-full text-sm font-medium capitalize border
                                    ${elderly.status === 'Active' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/30' : 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:border-slate-600'}`}>
                                    {elderly.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                <div className="text-center md:text-left">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Age</p>
                                    <p className="font-semibold text-gray-800 dark:text-gray-100">{elderly.age} Years</p>
                                </div>
                                <div className="text-center md:text-left">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gender</p>
                                    <p className="font-semibold text-gray-800 dark:text-gray-100 capitalize">{elderly.gender}</p>
                                </div>
                                <div className="text-center md:text-left">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Admission Date</p>
                                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                                        {new Date(elderly.dateOfAdmission).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="text-center md:text-left">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Special Needs</p>
                                    <p className="font-semibold text-gray-800 dark:text-gray-100">{elderly.specialNeeds || 'None'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Details */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Medical Information */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-slate-700">
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                                <FiActivity className="mr-2 text-red-500" />
                                Health & Care
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Medical Conditions</h3>
                                    <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg border border-gray-100 dark:border-slate-700 text-gray-600 dark:text-gray-400 min-h-[60px]">
                                        {elderly.medicalConditions && elderly.medicalConditions.length > 0 ? (
                                            <ul className="list-disc list-inside">
                                                {elderly.medicalConditions.map((condition, index) => (
                                                    <li key={index}>
                                                        {condition.condition || condition.notes}
                                                        {condition.diagnosedDate && <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">({new Date(condition.diagnosedDate).toLocaleDateString()})</span>}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : 'No conditions recorded.'}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Dietary Restrictions</h3>
                                        <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg border border-gray-100 dark:border-slate-700">
                                            {elderly.dietaryRestrictions?.join(', ') || 'None'}
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Allergies</h3>
                                        <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg border border-gray-100 dark:border-slate-700">
                                            {elderly.allergies?.join(', ') || 'None'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Guardian Information */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-slate-700">
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                                <FiUsers className="mr-2 text-green-600 dark:text-green-400" />
                                Emergency Contact
                            </h2>
                            {emergencyContact && (emergencyContact.name || emergencyContact.phone) ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</p>
                                        <p className="font-medium text-gray-800 dark:text-gray-100 mt-1">{emergencyContact.name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Relationship</p>
                                        <p className="font-medium text-gray-800 dark:text-gray-100 mt-1 capitalize">{emergencyContact.relationship || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Phone</p>
                                        <div className="flex items-center mt-1">
                                            <FiPhone className="text-gray-400 dark:text-gray-500 mr-2" />
                                            <span className="font-medium text-gray-800 dark:text-gray-100">{emergencyContact.phone || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Address</p>
                                        <div className="flex items-start mt-1">
                                            <FiMapPin className="text-gray-400 dark:text-gray-500 mr-2 mt-1" />
                                            <span className="font-medium text-gray-800 dark:text-gray-100">{emergencyContact.address || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400 italic">No emergency contact info available.</p>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Assigned Staff */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-slate-700">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Assigned Caretaker</h2>
                            {assignedCaretaker ? (
                                <div className="flex items-center p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-100 dark:border-primary-800/30">
                                    <div className="h-10 w-10 bg-primary-200 dark:bg-primary-900 rounded-full flex items-center justify-center mr-3 text-primary-700 dark:text-primary-300 font-bold">
                                        {assignedCaretaker.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{assignedCaretaker.name}</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">{assignedCaretaker.email}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center p-4 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-gray-100 dark:border-slate-700 border-dashed">
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">No caretaker assigned</p>
                                    <Link to={`/elderly/edit/${id}`} className="text-primary-600 dark:text-primary-400 text-xs font-medium mt-1 inline-block hover:underline">
                                        Assign Caretaker
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* System Info */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-slate-700">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">System Information</h2>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-slate-700/50">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Created At</span>
                                    <span className="text-sm font-medium text-gray-800 dark:text-white">
                                        {new Date(elderly.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Last Updated</span>
                                    <span className="text-sm font-medium text-gray-800 dark:text-white">
                                        {new Date(elderly.updatedAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ElderlyProfile;

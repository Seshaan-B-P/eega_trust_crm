import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
    FiUsers, FiSearch, FiPlus, FiEdit, FiEye,
    FiFilter, FiDownload, FiTrash2, FiRefreshCw,
    FiUserCheck, FiUserX, FiBriefcase
} from 'react-icons/fi';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';

import { useAuth } from '../../context/AuthContext';

const StaffList = () => {
    const { user } = useAuth();
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        inactive: 0
    });
    const [filters, setFilters] = useState({
        search: '',
        department: '',
        isActive: '',
        designation: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        total: 0,
        totalPages: 1,
        limit: 10
    });

    const departments = [
        'caretaker', 'teacher', 'cook', 'doctor',
        'administrator', 'security', 'other'
    ];

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
                ...Object.fromEntries(
                    Object.entries(filters).filter(([_, value]) => value !== '')
                )
            }).toString();

            const response = await api.get(`/staff?${params}`);
            console.log('Staff Data:', response.data);
            setStaff(response.data.data || []);
            setStats(response.data.stats || stats);
            setPagination({
                ...pagination,
                total: response.data.total,
                totalPages: response.data.totalPages
            });
        } catch (error) {
            toast.error('Error fetching staff');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, [filters, pagination.page]);

    const handleDeactivate = async (id, name) => {
        if (window.confirm(`Are you sure you want to deactivate ${name}?`)) {
            try {
                await api.delete(`/staff/${id}`);
                toast.success('Staff deactivated successfully');
                fetchStaff();
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

    const departmentHexColors = {
        caretaker: '#22c55e', // green-500
        teacher: '#3b82f6',   // blue-500
        cook: '#eab308',      // yellow-500
        doctor: '#ef4444',    // red-500
        administrator: '#a855f7', // purple-500
        security: '#6b7280',  // gray-500
        other: '#6366f1'      // indigo-500
    };

    const handleExport = () => {
        toast.success('Export feature coming soon!');
    };

    const handleClearFilters = () => {
        setFilters({
            search: '',
            department: '',
            isActive: '',
            designation: ''
        });
    };

    const capitalize = (str) => {
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Staff Management</h1>
                    <p className="text-gray-600">Manage all staff members in the orphanage</p>
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={fetchStaff}
                        className="flex items-center border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
                        title="Refresh"
                    >
                        <FiRefreshCw className="mr-2" />
                        Refresh
                    </button>
                    {user?.role === 'admin' && (
                        <Link
                            to="/staff/add"
                            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                            <FiPlus className="mr-2" />
                            Add New Staff
                        </Link>
                    )}
                    <button
                        onClick={handleExport}
                        className="flex items-center border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
                    >
                        <FiDownload className="mr-2" />
                        Export
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm opacity-90">Total Staff</p>
                            <p className="text-3xl font-bold mt-2">{stats.total || 0}</p>
                        </div>
                        <FiUsers className="h-10 w-10 opacity-80" />
                    </div>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm opacity-90">Active Staff</p>
                            <p className="text-3xl font-bold mt-2">{stats.active || 0}</p>
                        </div>
                        <FiUserCheck className="h-10 w-10 opacity-80" />
                    </div>
                </div>
                <div className="bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm opacity-90">Inactive Staff</p>
                            <p className="text-3xl font-bold mt-2">{stats.inactive || 0}</p>
                        </div>
                        <FiUserX className="h-10 w-10 opacity-80" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
                    <button
                        onClick={handleClearFilters}
                        className="text-sm text-blue-600 hover:text-blue-800"
                    >
                        Clear All
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Search
                        </label>
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Name, Employee ID, Designation..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Department
                        </label>
                        <select
                            value={filters.department}
                            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Departments</option>
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{capitalize(dept)}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status
                        </label>
                        <select
                            value={filters.isActive}
                            onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Status</option>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Designation
                        </label>
                        <input
                            type="text"
                            placeholder="Designation..."
                            value={filters.designation}
                            onChange={(e) => setFilters({ ...filters, designation: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Staff Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                {loading ? (
                    <LoadingSpinner message="Loading staff..." />
                ) : staff.length === 0 ? (
                    <div className="p-8 text-center">
                        <FiUsers className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No staff members found</h3>
                        <p className="text-gray-500 mb-4">
                            {Object.values(filters).some(f => f !== '')
                                ? 'Try changing your filters'
                                : 'Add your first staff member to get started'}
                        </p>
                        <Link
                            to="/staff/add"
                            className={`inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 ${user?.role !== 'admin' ? 'hidden' : ''}`}
                        >
                            <FiPlus className="mr-2" />
                            Add New Staff
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Staff Details
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Department & Designation
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Assigned Children
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Joining Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {staff.map((staffMember) => (
                                        <tr key={staffMember._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="h-12 w-12 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center mr-4">
                                                        {staffMember.user?.profileImage ? (
                                                            <img
                                                                src={staffMember.user.profileImage}
                                                                alt={staffMember.user.name}
                                                                className="h-12 w-12 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className="font-semibold text-blue-600 text-lg">
                                                                {staffMember.user?.name?.charAt(0)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">
                                                            {staffMember.user?.name}
                                                        </p>
                                                        <div className="text-sm text-gray-500 mt-1">
                                                            <div className="flex items-center">
                                                                <span className="font-mono font-semibold mr-3">
                                                                    {staffMember.employeeId}
                                                                </span>
                                                                <span>{staffMember.user?.email}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {staffMember.user?.phone}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-2">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${departmentColors[staffMember.department] || 'bg-gray-100'}`}>
                                                        {capitalize(staffMember.department)}
                                                    </span>
                                                    <p className="text-sm font-medium text-gray-800">
                                                        {staffMember.designation}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Experience: {staffMember.experience || 0} years
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="mr-4">
                                                        <p className="text-2xl font-bold text-blue-600">
                                                            {staffMember.user?.assignedChildren?.length || 0}
                                                        </p>
                                                        <p className="text-xs text-gray-500">Assigned</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-800">
                                                            Capacity: {staffMember.assignedChildrenCount || 0}/{staffMember.maxChildrenCapacity || 0}
                                                        </p>
                                                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                                            <div
                                                                className="bg-green-500 h-2 rounded-full"
                                                                style={{
                                                                    width: `${Math.min(((staffMember.assignedChildrenCount || 0) / (staffMember.maxChildrenCapacity || 1)) * 100, 100)}%`
                                                                }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col space-y-2">
                                                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${staffMember.isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                                                        {staffMember.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                    {staffMember.performance && (
                                                        <div className="flex items-center">
                                                            <div className="flex items-center">
                                                                {[1, 2, 3, 4, 5].map(star => (
                                                                    <svg
                                                                        key={star}
                                                                        className={`h-4 w-4 ${star <= staffMember.performance.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                                                        fill="currentColor"
                                                                        viewBox="0 0 20 20"
                                                                    >
                                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                    </svg>
                                                                ))}
                                                            </div>
                                                            <span className="text-xs text-gray-500 ml-1">
                                                                {staffMember.performance.rating}/5
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(staffMember.joiningDate).toLocaleDateString('en-IN')}
                                                {staffMember.leavingDate && (
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        Left: {new Date(staffMember.leavingDate).toLocaleDateString('en-IN')}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-2">
                                                    <Link
                                                        to={`/staff/${staffMember._id}`}
                                                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                                                        title="View Details"
                                                    >
                                                        <FiEye className="h-5 w-5" />
                                                    </Link>
                                                    {user?.role === 'admin' && (
                                                        <>
                                                            <Link
                                                                to={`/staff/${staffMember._id}/edit`}
                                                                className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition"
                                                                title="Edit"
                                                            >
                                                                <FiEdit className="h-5 w-5" />
                                                            </Link>
                                                            {staffMember.isActive && (
                                                                <button
                                                                    onClick={() => handleDeactivate(staffMember._id, staffMember.user?.name)}
                                                                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition"
                                                                    title="Deactivate"
                                                                >
                                                                    <FiTrash2 className="h-5 w-5" />
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="px-6 py-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Showing {staff.length} of {pagination.total} staff members
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                                        disabled={pagination.page === 1}
                                        className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                    >
                                        Previous
                                    </button>
                                    <span className="px-3 py-1 text-sm">
                                        Page {pagination.page} of {pagination.totalPages}
                                    </span>
                                    <button
                                        onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                                        disabled={pagination.page >= pagination.totalPages}
                                        className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Department Distribution */}
            <div className="mt-8 bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-6">Department Distribution</h3>
                <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                    {departments.map(dept => {
                        const count = staff.filter(s => s.department === dept).length;
                        const percentage = staff.length > 0 ? (count / staff.length) * 100 : 0;

                        return (
                            <div key={dept} className="text-center">
                                <div className="h-20 w-20 mx-auto mb-3 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                                    style={{
                                        background: `conic-gradient(${departmentHexColors[dept]} ${percentage}%, #f3f4f6 0)`
                                    }}
                                >
                                    <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center">
                                        <span className={`text-lg font-bold ${departmentColors[dept] ? departmentColors[dept].split(' ')[1] : 'text-gray-800'}`}>
                                            {count}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-sm font-medium text-gray-700">{capitalize(dept)}</p>
                                <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default StaffList;
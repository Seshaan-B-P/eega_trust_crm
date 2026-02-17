import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
    FiUsers, FiSearch, FiPlus, FiEdit, FiEye,
    FiFilter, FiDownload, FiTrash2, FiRefreshCw,
    FiUserCheck, FiUserX
} from 'react-icons/fi';
import api from '../../../utils/api';
import LoadingSpinner from '../../../components/LoadingSpinner';


const ChildrenList = () => {
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        discharged: 0,
        transferred: 0
    });
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        gender: '',
        minAge: '',
        maxAge: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        total: 0,
        totalPages: 1,
        limit: 10
    });

    const fetchChildren = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
                ...Object.fromEntries(
                    Object.entries(filters).filter(([_, value]) => value !== '')
                )
            }).toString();

            const response = await api.get(`/children?${params}`);
            setChildren(response.data.children || []);
            setStats(response.data.stats || stats);
            setPagination({
                ...pagination,
                total: response.data.total,
                totalPages: response.data.totalPages
            });
        } catch (error) {
            toast.error('Error fetching children');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChildren();
    }, [filters, pagination.page]);

    const handleDelete = async (id, name) => {
        if (window.confirm(`Are you sure you want to discharge ${name}?`)) {
            try {
                await api.delete(`/children/${id}`);
                toast.success('Child discharged successfully');
                fetchChildren();
            } catch (error) {
                toast.error('Error discharging child');
            }
        }
    };

    const statusColors = {
        active: 'bg-green-100 text-green-800 border-green-200',
        discharged: 'bg-gray-100 text-gray-800 border-gray-200',
        transferred: 'bg-blue-100 text-blue-800 border-blue-200'
    };

    const genderColors = {
        male: 'bg-blue-100 text-blue-800',
        female: 'bg-pink-100 text-pink-800',
        other: 'bg-purple-100 text-purple-800'
    };

    const handleExport = () => {
        toast.success('Export feature coming soon!');
    };

    const handleClearFilters = () => {
        setFilters({
            search: '',
            status: '',
            gender: '',
            minAge: '',
            maxAge: ''
        });
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Children Management</h1>
                    <p className="text-gray-600">Manage all children records in the orphanage</p>
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={fetchChildren}
                        className="flex items-center border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
                        title="Refresh"
                    >
                        <FiRefreshCw className="mr-2" />
                        Refresh
                    </button>
                    <Link
                        to="/children/add"
                        className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        <FiPlus className="mr-2" />
                        Add New Child
                    </Link>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm opacity-90">Total Children</p>
                            <p className="text-3xl font-bold mt-2">{stats.total || 0}</p>
                        </div>
                        <FiUsers className="h-10 w-10 opacity-80" />
                    </div>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm opacity-90">Active</p>
                            <p className="text-3xl font-bold mt-2">{stats.active || 0}</p>
                        </div>
                        <FiUserCheck className="h-10 w-10 opacity-80" />
                    </div>
                </div>
                <div className="bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm opacity-90">Discharged</p>
                            <p className="text-3xl font-bold mt-2">{stats.discharged || 0}</p>
                        </div>
                        <FiUserX className="h-10 w-10 opacity-80" />
                    </div>
                </div>
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm opacity-90">Transferred</p>
                            <p className="text-3xl font-bold mt-2">{stats.transferred || 0}</p>
                        </div>
                        <FiUsers className="h-10 w-10 opacity-80" />
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
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Search
                        </label>
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Name, ID, Guardian..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status
                        </label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="discharged">Discharged</option>
                            <option value="transferred">Transferred</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Gender
                        </label>
                        <select
                            value={filters.gender}
                            onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Genders</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Min Age
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="18"
                            placeholder="0"
                            value={filters.minAge}
                            onChange={(e) => setFilters({ ...filters, minAge: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Max Age
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="18"
                            placeholder="18"
                            value={filters.maxAge}
                            onChange={(e) => setFilters({ ...filters, maxAge: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Children Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                {loading ? (
                    <LoadingSpinner message="Loading children..." />
                ) : children.length === 0 ? (
                    <div className="p-8 text-center">
                        <FiUsers className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No children found</h3>
                        <p className="text-gray-500 mb-4">
                            {Object.values(filters).some(f => f !== '')
                                ? 'Try changing your filters'
                                : 'Add your first child to get started'}
                        </p>
                        <Link
                            to="/children/add"
                            className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                            <FiPlus className="mr-2" />
                            Add New Child
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Child Details
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Age/Gender
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Assigned Staff
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Admission Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {children.map((child) => (
                                        <tr key={child._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="h-12 w-12 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center mr-4">
                                                        {child.photo ? (
                                                            <img
                                                                src={child.photo}
                                                                alt={child.name}
                                                                className="h-12 w-12 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className="font-semibold text-blue-600 text-lg">
                                                                {child.name.charAt(0)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center">
                                                            <p className="font-medium text-gray-900">
                                                                {child.name}
                                                            </p>
                                                        </div>
                                                        <div className="text-sm text-gray-500 mt-1">
                                                            ID: <span className="font-mono font-semibold">{child.childId}</span>
                                                        </div>
                                                        <div className="text-sm text-gray-500 truncate max-w-xs">
                                                            {child.background?.substring(0, 50)}...
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <span className="font-medium text-gray-900">{child.age || 'N/A'} yrs</span>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${genderColors[child.gender] || 'bg-gray-100 text-gray-800'}`}>
                                                        {child.gender}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {child.assignedStaff ? (
                                                    <div className="flex items-center">
                                                        <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                                            <span className="text-green-600 font-semibold text-sm">
                                                                {child.assignedStaff.name.charAt(0)}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {child.assignedStaff.name}
                                                            </p>
                                                            <p className="text-xs text-gray-500">{child.assignedStaff.email}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-500 italic">Not assigned</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${statusColors[child.status] || 'bg-gray-100 text-gray-800'}`}>
                                                    {child.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(child.dateOfAdmission).toLocaleDateString('en-IN')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-2">
                                                    <Link
                                                        to={`/children/${child._id}`}
                                                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                                                        title="View Details"
                                                    >
                                                        <FiEye className="h-5 w-5" />
                                                    </Link>
                                                    <Link
                                                        to={`/children/${child._id}/edit`}
                                                        className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition"
                                                        title="Edit"
                                                    >
                                                        <FiEdit className="h-5 w-5" />
                                                    </Link>
                                                    {child.status === 'active' && (
                                                        <button
                                                            onClick={() => handleDelete(child._id, child.name)}
                                                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition"
                                                            title="Discharge"
                                                        >
                                                            <FiTrash2 className="h-5 w-5" />
                                                        </button>
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
                                    Showing {children.length} of {pagination.total} children
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

            {/* Quick Stats Footer */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                    <div className="flex items-center mb-4">
                        <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                            <FiUsers className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-blue-800">Total Capacity</h3>
                            <p className="text-sm text-blue-600">Current: {stats.active || 0} / Max: 50</p>
                        </div>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${Math.min(((stats.active || 0) / 50) * 100, 100)}%` }}
                        ></div>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                    <div className="flex items-center mb-4">
                        <div className="h-10 w-10 bg-green-500 rounded-lg flex items-center justify-center mr-4">
                            <FiUserCheck className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-green-800">Active Children</h3>
                            <p className="text-sm text-green-600">{stats.active || 0} currently active</p>
                        </div>
                    </div>
                    <div className="text-green-700">
                        <span className="text-2xl font-bold">{stats.active || 0}</span>
                        <span className="text-sm ml-2">children in care</span>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                    <div className="flex items-center mb-4">
                        <div className="h-10 w-10 bg-purple-500 rounded-lg flex items-center justify-center mr-4">
                            <FiFilter className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-purple-800">Filter Results</h3>
                            <p className="text-sm text-purple-600">
                                {Object.values(filters).filter(f => f !== '').length} active filters
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClearFilters}
                        className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                    >
                        Clear all filters →
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChildrenList;
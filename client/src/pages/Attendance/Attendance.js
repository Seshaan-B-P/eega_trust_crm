import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
    FiCalendar, FiSearch, FiCheckCircle, FiXCircle,
    FiFilter, FiDownload, FiRefreshCw, FiUserCheck,
    FiAlertCircle, FiBarChart2, FiClock
} from 'react-icons/fi';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const Attendance = () => {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        distribution: [],
        percentage: 0
    });
    const [filters, setFilters] = useState({
        child: '',
        startDate: '',
        endDate: '',
        status: '',
        markedBy: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        total: 0,
        totalPages: 1,
        limit: 30
    });

    const statusColors = {
        present: 'bg-green-100 text-green-800 border-green-200',
        absent: 'bg-red-100 text-red-800 border-red-200',
        sick: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        leave: 'bg-blue-100 text-blue-800 border-blue-200',
        half_day: 'bg-orange-100 text-orange-800 border-orange-200'
    };

    const statusHexColors = {
        present: '#22c55e',   // green-500
        absent: '#ef4444',    // red-500
        sick: '#eab308',      // yellow-500
        leave: '#3b82f6',     // blue-500
        half_day: '#f97316'   // orange-500
    };

    const statusIcons = {
        present: FiCheckCircle,
        absent: FiXCircle,
        sick: FiAlertCircle,
        leave: FiClock,
        half_day: FiUserCheck
    };

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
                ...Object.fromEntries(
                    Object.entries(filters).filter(([_, value]) => value !== '')
                )
            }).toString();

            const response = await api.get(`/attendance?${params}`);
            setAttendance(response.data.data || []);
            setStats(response.data.stats || stats);
            setPagination({
                ...pagination,
                total: response.data.total,
                totalPages: response.data.totalPages
            });
        } catch (error) {
            toast.error('Error fetching attendance');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, [filters, pagination.page]);

    const handleExport = () => {
        toast.success('Export feature coming soon!');
    };

    const handleClearFilters = () => {
        setFilters({
            child: '',
            startDate: '',
            endDate: '',
            status: '',
            markedBy: ''
        });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            weekday: 'short',
            day: '2-digit',
            month: 'short'
        });
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        const time = new Date(timeString);
        return time.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusLabel = (status) => {
        const labels = {
            present: 'Present',
            absent: 'Absent',
            sick: 'Sick',
            leave: 'Leave',
            half_day: 'Half Day'
        };
        return labels[status] || status;
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Attendance Management</h1>
                    <p className="text-gray-600">Track and manage children attendance records</p>
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={fetchAttendance}
                        className="flex items-center border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
                        title="Refresh"
                    >
                        <FiRefreshCw className="mr-2" />
                        Refresh
                    </button>
                    <Link
                        to="/attendance/mark"
                        className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        <FiCheckCircle className="mr-2" />
                        Mark Attendance
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
                            <p className="text-sm opacity-90">Total Records</p>
                            <p className="text-3xl font-bold mt-2">{stats.total || 0}</p>
                        </div>
                        <FiCalendar className="h-10 w-10 opacity-80" />
                    </div>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm opacity-90">Attendance %</p>
                            <p className="text-3xl font-bold mt-2">{stats.percentage || 0}%</p>
                        </div>
                        <FiBarChart2 className="h-10 w-10 opacity-80" />
                    </div>
                </div>
                <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm opacity-90">Absent Today</p>
                            <p className="text-3xl font-bold mt-2">
                                {stats.distribution?.find(s => s._id === 'absent')?.count || 0}
                            </p>
                        </div>
                        <FiXCircle className="h-10 w-10 opacity-80" />
                    </div>
                </div>
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm opacity-90">Sick/Leave</p>
                            <p className="text-3xl font-bold mt-2">
                                {(stats.distribution?.find(s => s._id === 'sick')?.count || 0) +
                                    (stats.distribution?.find(s => s._id === 'leave')?.count || 0)}
                            </p>
                        </div>
                        <FiAlertCircle className="h-10 w-10 opacity-80" />
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
                            Date Range
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Start Date"
                            />
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="End Date"
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
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                            <option value="sick">Sick</option>
                            <option value="leave">Leave</option>
                            <option value="half_day">Half Day</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quick Date Filters
                        </label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => {
                                    const today = new Date();
                                    setFilters({
                                        ...filters,
                                        startDate: today.toISOString().split('T')[0],
                                        endDate: today.toISOString().split('T')[0]
                                    });
                                }}
                                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                            >
                                Today
                            </button>
                            <button
                                onClick={() => {
                                    const today = new Date();
                                    const weekAgo = new Date();
                                    weekAgo.setDate(today.getDate() - 7);
                                    setFilters({
                                        ...filters,
                                        startDate: weekAgo.toISOString().split('T')[0],
                                        endDate: today.toISOString().split('T')[0]
                                    });
                                }}
                                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                            >
                                Last 7 Days
                            </button>
                            <button
                                onClick={() => {
                                    const today = new Date();
                                    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                                    setFilters({
                                        ...filters,
                                        startDate: monthStart.toISOString().split('T')[0],
                                        endDate: today.toISOString().split('T')[0]
                                    });
                                }}
                                className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                            >
                                This Month
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Attendance Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                {loading ? (
                    <LoadingSpinner message="Loading attendance records..." />
                ) : attendance.length === 0 ? (
                    <div className="p-8 text-center">
                        <FiCalendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance records found</h3>
                        <p className="text-gray-500 mb-4">
                            {Object.values(filters).some(f => f !== '')
                                ? 'Try changing your filters'
                                : 'Mark attendance for today to get started'}
                        </p>
                        <Link
                            to="/attendance/mark"
                            className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                            <FiCheckCircle className="mr-2" />
                            Mark Attendance
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Child & Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status & Time
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Health Details
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Marked By
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Remarks
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {attendance.map((record) => {
                                        const StatusIcon = statusIcons[record.status] || FiClock;
                                        return (
                                            <tr key={record._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center mr-3">
                                                            {record.child?.photo ? (
                                                                <img
                                                                    src={record.child.photo}
                                                                    alt={record.child.name}
                                                                    className="h-10 w-10 rounded-full object-cover"
                                                                />
                                                            ) : (
                                                                <span className="font-semibold text-blue-600">
                                                                    {record.child?.name?.charAt(0)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">
                                                                {record.child?.name}
                                                            </p>
                                                            <div className="text-sm text-gray-500 flex items-center mt-1">
                                                                <FiCalendar className="mr-1 h-4 w-4" />
                                                                {formatDate(record.date)}
                                                                <span className="mx-2">•</span>
                                                                <span className="font-mono text-xs">
                                                                    {record.child?.childId}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-2">
                                                        <span className={`px-3 py-1.5 rounded-full text-sm font-medium border flex items-center w-fit ${statusColors[record.status] || 'bg-gray-100'}`}>
                                                            <StatusIcon className="mr-2 h-4 w-4" />
                                                            {getStatusLabel(record.status)}
                                                        </span>
                                                        <div className="text-sm text-gray-600">
                                                            {record.checkInTime && (
                                                                <div className="flex items-center">
                                                                    <FiClock className="mr-1 h-3 w-3" />
                                                                    In: {formatTime(record.checkInTime)}
                                                                </div>
                                                            )}
                                                            {record.checkOutTime && (
                                                                <div className="flex items-center mt-1">
                                                                    <FiClock className="mr-1 h-3 w-3" />
                                                                    Out: {formatTime(record.checkOutTime)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-2">
                                                        {record.temperature && (
                                                            <div className="flex items-center">
                                                                <span className={`text-sm font-medium ${record.temperature >= 38 ? 'text-red-600' : 'text-green-600'}`}>
                                                                    {record.temperature}°C
                                                                </span>
                                                            </div>
                                                        )}
                                                        {record.symptoms && record.symptoms.length > 0 && (
                                                            <div className="text-xs text-gray-600">
                                                                Symptoms: {record.symptoms.join(', ')}
                                                            </div>
                                                        )}
                                                        {record.medication && (
                                                            <div className="text-xs text-gray-600">
                                                                Medication: {record.medication}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                                            <span className="text-green-600 font-semibold text-sm">
                                                                {record.markedBy?.name?.charAt(0)}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {record.markedBy?.name}
                                                            </p>
                                                            {record.verifiedBy && (
                                                                <p className="text-xs text-green-600">
                                                                    Verified
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="max-w-xs">
                                                        <p className="text-sm text-gray-600 truncate">
                                                            {record.remarks || 'No remarks'}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center space-x-2">
                                                        <Link
                                                            to={`/attendance/${record._id}`}
                                                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                                                            title="View Details"
                                                        >
                                                            <FiSearch className="h-5 w-5" />
                                                        </Link>
                                                        <button
                                                            onClick={() => handleEdit(record._id)}
                                                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition"
                                                            title="Edit"
                                                        >
                                                            <FiCheckCircle className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="px-6 py-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Showing {attendance.length} of {pagination.total} records
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

            {/* Status Distribution */}
            {stats.distribution && stats.distribution.length > 0 && (
                <div className="mt-8 bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-6">Attendance Distribution</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                        {stats.distribution.map((stat) => {
                            const StatusIcon = statusIcons[stat._id] || FiClock;
                            const percentage = (stat.count / stats.total) * 100;

                            return (
                                <div key={stat._id} className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <StatusIcon className={`h-8 w-8 ${statusColors[stat._id]?.split(' ')[1] || 'text-gray-600'}`} />
                                        <span className="text-2xl font-bold text-gray-800">{stat.count}</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">
                                        {getStatusLabel(stat._id)}
                                    </p>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="h-2 rounded-full"
                                            style={{
                                                width: `${percentage}%`,
                                                backgroundColor: statusHexColors[stat._id] || '#6b7280'
                                            }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        {percentage.toFixed(1)}% of total
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Attendance;
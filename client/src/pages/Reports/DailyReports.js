import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
    FiFileText, FiSearch, FiPlus, FiEye,
    FiFilter, FiDownload, FiRefreshCw, FiAlertCircle,
    FiCalendar, FiUser, FiActivity
} from 'react-icons/fi';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const DailyReports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        todayReports: 0,
        attentionNeeded: 0,
        healthStats: []
    });
    const [filters, setFilters] = useState({
        search: '',
        child: '',
        startDate: '',
        endDate: '',
        needsAttention: '',
        healthStatus: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        total: 0,
        totalPages: 1,
        limit: 20
    });

    const healthStatusColors = {
        excellent: 'bg-green-100 text-green-800',
        good: 'bg-blue-100 text-blue-800',
        fair: 'bg-yellow-100 text-yellow-800',
        poor: 'bg-red-100 text-red-800'
    };

    const healthStatusHexColors = {
        excellent: '#22c55e', // green-500
        good: '#3b82f6',      // blue-500
        fair: '#eab308',      // yellow-500
        poor: '#ef4444'       // red-500
    };

    const behaviorColors = {
        excellent: 'bg-green-100 text-green-800',
        good: 'bg-blue-100 text-blue-800',
        average: 'bg-yellow-100 text-yellow-800',
        needs_attention: 'bg-red-100 text-red-800'
    };

    const fetchReports = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
                ...Object.fromEntries(
                    Object.entries(filters).filter(([_, value]) => value !== '')
                )
            }).toString();

            const response = await api.get(`/reports?${params}`);
            setReports(response.data.data || []);
            setStats(response.data.stats || stats);
            setPagination({
                ...pagination,
                total: response.data.total,
                totalPages: response.data.totalPages
            });
        } catch (error) {
            toast.error('Error fetching daily reports');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [filters, pagination.page]);

    const handleExport = () => {
        toast.success('Export feature coming soon!');
    };

    const handleClearFilters = () => {
        setFilters({
            search: '',
            child: '',
            startDate: '',
            endDate: '',
            needsAttention: '',
            healthStatus: ''
        });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getTemperatureColor = (temp) => {
        if (temp >= 38) return 'text-red-600 font-bold';
        if (temp >= 37.5) return 'text-yellow-600';
        return 'text-green-600';
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Daily Reports</h1>
                    <p className="text-gray-600">Manage daily health and activity reports for children</p>
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={fetchReports}
                        className="flex items-center border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
                        title="Refresh"
                    >
                        <FiRefreshCw className="mr-2" />
                        Refresh
                    </button>
                    <Link
                        to="/reports/add"
                        className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        <FiPlus className="mr-2" />
                        Add Daily Report
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm opacity-90">Today's Reports</p>
                            <p className="text-3xl font-bold mt-2">{stats.todayReports || 0}</p>
                        </div>
                        <FiFileText className="h-10 w-10 opacity-80" />
                    </div>
                </div>
                <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm opacity-90">Need Attention</p>
                            <p className="text-3xl font-bold mt-2">{stats.attentionNeeded || 0}</p>
                        </div>
                        <FiAlertCircle className="h-10 w-10 opacity-80" />
                    </div>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm opacity-90">Total Reports</p>
                            <p className="text-3xl font-bold mt-2">{pagination.total || 0}</p>
                        </div>
                        <FiActivity className="h-10 w-10 opacity-80" />
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            Health Status
                        </label>
                        <select
                            value={filters.healthStatus}
                            onChange={(e) => setFilters({ ...filters, healthStatus: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Status</option>
                            <option value="excellent">Excellent</option>
                            <option value="good">Good</option>
                            <option value="fair">Fair</option>
                            <option value="poor">Poor</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Needs Attention
                        </label>
                        <select
                            value={filters.needsAttention}
                            onChange={(e) => setFilters({ ...filters, needsAttention: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Reports</option>
                            <option value="true">Needs Attention</option>
                            <option value="false">Normal Reports</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Reports Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                {loading ? (
                    <LoadingSpinner message="Loading daily reports..." />
                ) : reports.length === 0 ? (
                    <div className="p-8 text-center">
                        <FiFileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No daily reports found</h3>
                        <p className="text-gray-500 mb-4">
                            {Object.values(filters).some(f => f !== '')
                                ? 'Try changing your filters'
                                : 'Add your first daily report'}
                        </p>
                        <Link
                            to="/reports/add"
                            className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                            <FiPlus className="mr-2" />
                            Add Daily Report
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
                                            Health Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Behavior & Activities
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Reported By
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {reports.map((report) => (
                                        <tr key={report._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center mr-3">
                                                        {report.child?.photo ? (
                                                            <img
                                                                src={report.child.photo}
                                                                alt={report.child.name}
                                                                className="h-10 w-10 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className="font-semibold text-blue-600">
                                                                {report.child?.name?.charAt(0)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">
                                                            {report.child?.name}
                                                        </p>
                                                        <div className="text-sm text-gray-500 flex items-center mt-1">
                                                            <FiCalendar className="mr-1 h-4 w-4" />
                                                            {formatDate(report.date)}
                                                            <span className="mx-2">•</span>
                                                            <span className="font-mono text-xs">
                                                                {report.child?.childId}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-2">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${healthStatusColors[report.healthStatus?.overall] || 'bg-gray-100'}`}>
                                                        {report.healthStatus?.overall || 'Not recorded'}
                                                    </span>
                                                    {report.healthStatus?.temperature && (
                                                        <div className="flex items-center">
                                                            <span className={`text-sm ${getTemperatureColor(report.healthStatus.temperature)}`}>
                                                                {report.healthStatus.temperature}°C
                                                            </span>
                                                            {report.healthStatus.symptoms && report.healthStatus.symptoms.length > 0 && (
                                                                <span className="text-xs text-gray-500 ml-2">
                                                                    {report.healthStatus.symptoms.length} symptom(s)
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-2">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${behaviorColors[report.behavior] || 'bg-gray-100'}`}>
                                                        {report.behavior?.replace('_', ' ') || 'Not recorded'}
                                                    </span>
                                                    {report.activities && report.activities.length > 0 && (
                                                        <p className="text-xs text-gray-600 truncate">
                                                            {report.activities[0]?.activity}
                                                            {report.activities.length > 1 && ` +${report.activities.length - 1} more`}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                                        <span className="text-green-600 font-semibold text-sm">
                                                            {report.staff?.name?.charAt(0)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {report.staff?.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(report.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col space-y-2">
                                                    {report.needsAttention ? (
                                                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 flex items-center">
                                                            <FiAlertCircle className="mr-1 h-3 w-3" />
                                                            Needs Attention
                                                        </span>
                                                    ) : (
                                                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                                            Normal
                                                        </span>
                                                    )}
                                                    {report.specialNotes && (
                                                        <p className="text-xs text-gray-500 truncate max-w-xs">
                                                            {report.specialNotes}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-2">
                                                    <Link
                                                        to={`/reports/${report._id}`}
                                                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                                                        title="View Details"
                                                    >
                                                        <FiEye className="h-5 w-5" />
                                                    </Link>
                                                    {/* Removed Mark as Resolved button as logic for it was not in original file/imports */}
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
                                    Showing {reports.length} of {pagination.total} reports
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

            {/* Health Statistics */}
            {stats.healthStats && stats.healthStats.length > 0 && (
                <div className="mt-8 bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-6">Health Status Distribution</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {stats.healthStats.map((stat) => (
                            <div key={stat._id} className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${healthStatusColors[stat._id] || 'bg-gray-100'}`}>
                                        {stat._id || 'Not recorded'}
                                    </span>
                                    <span className="text-2xl font-bold text-gray-800">{stat.count}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="h-2 rounded-full"
                                        style={{
                                            width: `${(stat.count / pagination.total) * 100}%`,
                                            backgroundColor: healthStatusHexColors[stat._id]
                                        }}
                                    ></div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    {((stat.count / pagination.total) * 100).toFixed(1)}% of total reports
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DailyReports;
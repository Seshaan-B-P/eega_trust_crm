import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
    FiDollarSign, FiSearch, FiPlus, FiEye,
    FiFilter, FiDownload, FiRefresh, FiCheckCircle,
    FiXCircle, FiClock, FiPrinter, FiMail
} from 'react-icons/fi';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const DonationList = () => {
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalAmount: 0,
        count: 0
    });
    const [distributions, setDistributions] = useState({
        byType: [],
        byPurpose: []
    });
    const [filters, setFilters] = useState({
        donorName: '',
        donationType: '',
        purpose: '',
        status: '',
        startDate: '',
        endDate: '',
        minAmount: '',
        maxAmount: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        total: 0,
        totalPages: 1,
        limit: 20
    });

    const donationTypes = [
        { value: 'cash', label: 'Cash' },
        { value: 'cheque', label: 'Cheque' },
        { value: 'online', label: 'Online Transfer' },
        { value: 'goods', label: 'Goods' },
        { value: 'other', label: 'Other' }
    ];

    const purposes = [
        { value: 'general', label: 'General' },
        { value: 'education', label: 'Education' },
        { value: 'medical', label: 'Medical' },
        { value: 'food', label: 'Food' },
        { value: 'shelter', label: 'Shelter' },
        { value: 'festival', label: 'Festival' },
        { value: 'emergency', label: 'Emergency' },
        { value: 'other', label: 'Other' }
    ];

    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        verified: 'bg-green-100 text-green-800 border-green-200',
        cancelled: 'bg-red-100 text-red-800 border-red-200'
    };

    const statusIcons = {
        pending: FiClock,
        verified: FiCheckCircle,
        cancelled: FiXCircle
    };

    const fetchDonations = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
                ...Object.fromEntries(
                    Object.entries(filters).filter(([_, value]) => value !== '')
                )
            }).toString();

            const response = await api.get(`/donations?${params}`);
            setDonations(response.data.data || []);
            setStats(response.data.stats || { totalAmount: 0, count: 0 });
            setDistributions(response.data.distributions || { byType: [], byPurpose: [] });
            setPagination({
                ...pagination,
                total: response.data.total,
                totalPages: response.data.totalPages
            });
        } catch (error) {
            toast.error('Error fetching donations');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDonations();
    }, [filters, pagination.page]);

    const handleVerify = async (id) => {
        try {
            await api.put(`/donations/${id}/verify`);
            toast.success('Donation verified successfully');
            fetchDonations();
        } catch (error) {
            toast.error('Error verifying donation');
        }
    };

    const handleGenerateReceipt = async (id) => {
        try {
            const response = await api.post(`/donations/${id}/generate-receipt`);
            toast.success('Receipt generated successfully');
            if (response.data.data.receiptUrl) {
                window.open(response.data.data.receiptUrl, '_blank');
            }
        } catch (error) {
            toast.error('Error generating receipt');
        }
    };

    const handleSendThankYou = async (id) => {
        try {
            await api.post(`/donations/${id}/send-thankyou`);
            toast.success('Thank you message sent');
            fetchDonations();
        } catch (error) {
            toast.error('Error sending thank you message');
        }
    };

    const handleExport = () => {
        toast.success('Export feature coming soon!');
    };

    const handleClearFilters = () => {
        setFilters({
            donorName: '',
            donationType: '',
            purpose: '',
            status: '',
            startDate: '',
            endDate: '',
            minAmount: '',
            maxAmount: ''
        });
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Donation Management</h1>
                    <p className="text-gray-600">Track and manage donations received</p>
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={fetchDonations}
                        className="flex items-center border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
                        title="Refresh"
                    >
                        <FiRefresh className="mr-2" />
                        Refresh
                    </button>
                    <Link
                        to="/donations/add"
                        className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        <FiPlus className="mr-2" />
                        Add Donation
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
                            <p className="text-sm opacity-90">Total Donations</p>
                            <p className="text-3xl font-bold mt-2">{stats.count || 0}</p>
                        </div>
                        <FiDollarSign className="h-10 w-10 opacity-80" />
                    </div>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm opacity-90">Total Amount</p>
                            <p className="text-3xl font-bold mt-2">{formatCurrency(stats.totalAmount || 0)}</p>
                        </div>
                        <FiDollarSign className="h-10 w-10 opacity-80" />
                    </div>
                </div>
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm opacity-90">Average Amount</p>
                            <p className="text-3xl font-bold mt-2">{formatCurrency(stats.avgAmount || 0)}</p>
                        </div>
                        <FiDollarSign className="h-10 w-10 opacity-80" />
                    </div>
                </div>
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm opacity-90">This Month</p>
                            <p className="text-3xl font-bold mt-2">{formatCurrency(stats.thisMonth || 0)}</p>
                        </div>
                        <FiDollarSign className="h-10 w-10 opacity-80" />
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
                            Search Donor
                        </label>
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Name, ID, Receipt..."
                                value={filters.donorName}
                                onChange={(e) => setFilters({ ...filters, donorName: e.target.value })}
                                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Donation Type
                        </label>
                        <select
                            value={filters.donationType}
                            onChange={(e) => setFilters({ ...filters, donationType: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Types</option>
                            {donationTypes.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Purpose
                        </label>
                        <select
                            value={filters.purpose}
                            onChange={(e) => setFilters({ ...filters, purpose: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Purposes</option>
                            {purposes.map(purpose => (
                                <option key={purpose.value} value={purpose.value}>{purpose.label}</option>
                            ))}
                        </select>
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
                            <option value="pending">Pending</option>
                            <option value="verified">Verified</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
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
                            Amount Range
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="number"
                                placeholder="Min"
                                value={filters.minAmount}
                                onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                                type="number"
                                placeholder="Max"
                                value={filters.maxAmount}
                                onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Donations Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                {loading ? (
                    <LoadingSpinner message="Loading donations..." />
                ) : donations.length === 0 ? (
                    <div className="p-8 text-center">
                        <FiDollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No donations found</h3>
                        <p className="text-gray-500 mb-4">
                            {Object.values(filters).some(f => f !== '')
                                ? 'Try changing your filters'
                                : 'Record your first donation'}
                        </p>
                        <Link
                            to="/donations/add"
                            className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                            <FiPlus className="mr-2" />
                            Add Donation
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Donation ID & Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Donor Details
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Type & Purpose
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Receipt
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {donations.map((donation) => {
                                        const StatusIcon = statusIcons[donation.status] || FiClock;
                                        return (
                                            <tr key={donation._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {donation.donationId}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {formatDate(donation.date)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {donation.isAnonymous ? 'Anonymous' : donation.donorName}
                                                    </div>
                                                    {!donation.isAnonymous && (
                                                        <div className="text-sm text-gray-500">
                                                            {donation.donorEmail && <div>{donation.donorEmail}</div>}
                                                            {donation.donorPhone && <div>{donation.donorPhone}</div>}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        <span className="px-2 py-1 text-xs bg-gray-100 rounded">
                                                            {donation.donationType}
                                                        </span>
                                                        <div className="text-sm text-gray-500">
                                                            {donation.purpose}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-lg font-bold text-gray-900">
                                                        {formatCurrency(donation.amount)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium border flex items-center w-fit ${statusColors[donation.status]}`}>
                                                        <StatusIcon className="mr-1 h-4 w-4" />
                                                        {donation.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {donation.receiptGenerated ? (
                                                        <a
                                                            href={donation.receiptUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:text-blue-800 flex items-center"
                                                        >
                                                            <FiPrinter className="mr-1" />
                                                            {donation.receiptNumber}
                                                        </a>
                                                    ) : (
                                                        <span className="text-gray-400">Not generated</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center space-x-2">
                                                        <Link
                                                            to={`/donations/${donation._id}`}
                                                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                                                            title="View Details"
                                                        >
                                                            <FiEye className="h-5 w-5" />
                                                        </Link>
                                                        {donation.status === 'pending' && (
                                                            <button
                                                                onClick={() => handleVerify(donation._id)}
                                                                className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition"
                                                                title="Verify Donation"
                                                            >
                                                                <FiCheckCircle className="h-5 w-5" />
                                                            </button>
                                                        )}
                                                        {donation.status === 'verified' && !donation.receiptGenerated && (
                                                            <button
                                                                onClick={() => handleGenerateReceipt(donation._id)}
                                                                className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition"
                                                                title="Generate Receipt"
                                                            >
                                                                <FiPrinter className="h-5 w-5" />
                                                            </button>
                                                        )}
                                                        {!donation.thankYouSent && (
                                                            <button
                                                                onClick={() => handleSendThankYou(donation._id)}
                                                                className="p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded-lg transition"
                                                                title="Send Thank You"
                                                            >
                                                                <FiMail className="h-5 w-5" />
                                                            </button>
                                                        )}
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
                                    Showing {donations.length} of {pagination.total} donations
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

            {/* Distribution Charts */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Type Distribution */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Donations by Type</h3>
                    <div className="space-y-4">
                        {distributions.byType.map((type) => (
                            <div key={type._id}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium text-gray-700 capitalize">
                                        {type._id}
                                    </span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {formatCurrency(type.total)} ({type.count})
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full"
                                        style={{ width: `${(type.total / stats.totalAmount) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Purpose Distribution */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Donations by Purpose</h3>
                    <div className="space-y-4">
                        {distributions.byPurpose.map((purpose) => (
                            <div key={purpose._id}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium text-gray-700 capitalize">
                                        {purpose._id}
                                    </span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {formatCurrency(purpose.total)} ({purpose.count})
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-green-600 h-2 rounded-full"
                                        style={{ width: `${(purpose.total / stats.totalAmount) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DonationList;
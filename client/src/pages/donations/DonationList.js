import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
    FiSearch, FiPlus, FiEye,
    FiFilter, FiDownload, FiRefreshCw, FiCheckCircle,
    FiXCircle, FiClock, FiPrinter, FiMail, FiCalendar, FiPieChart, FiActivity
} from 'react-icons/fi';
import { TbCurrencyRupee } from 'react-icons/tb';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const DonationList = () => {
    const { user } = useAuth();
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalAmount: 0,
        count: 0,
        avgAmount: 0,
        thisMonth: 0
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
        { value: 'online', label: 'Online' },
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
        pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400',
        verified: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400',
        cancelled: 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400'
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
            setStats(response.data.stats || { totalAmount: 0, count: 0, avgAmount: 0, thisMonth: 0 });
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
            toast.success('Donation confirmed successfully');
            fetchDonations();
        } catch (error) {
            toast.error('Error confirming donation');
        }
    };

    const handleGenerateReceipt = async (id) => {
        try {
            const response = await api.post(`/donations/${id}/generate-receipt`);
            toast.success('Receipt generated successfully');
            if (response.data.data.receiptUrl) {
                const fullUrl = response.data.data.receiptUrl.startsWith('http') 
                    ? response.data.data.receiptUrl 
                    : `http://localhost:5000${response.data.data.receiptUrl}`;
                window.open(fullUrl, '_blank');
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

    const handleExport = async () => {
        try {
            const params = new URLSearchParams({
                ...Object.fromEntries(
                    Object.entries(filters).filter(([_, value]) => value !== '')
                ),
                limit: 0 // Fetch all records
            }).toString();

            const response = await api.get(`/donations?${params}`);
            const donationsToExport = response.data.data.map(donation => {
                const flatDonation = {
                    'Donation ID': donation.donationId,
                    'Date': new Date(donation.date).toLocaleDateString(),
                    'Donor Name': donation.donorName,
                    'Donor Email': donation.donorEmail,
                    'Donor Phone': donation.donorPhone,
                    'Amount': donation.amount,
                    'Type': donation.donationType,
                    'Purpose': donation.purpose,
                    'Payment Method': donation.paymentMethod,
                    'Status': donation.status,
                    'Receipt Number': donation.receiptNumber || 'N/A',
                    'Transaction ID': donation.transactionId || 'N/A',
                    'Address': donation.donorAddress ? `${donation.donorAddress.street || ''}, ${donation.donorAddress.city || ''}, ${donation.donorAddress.state || ''} - ${donation.donorAddress.pincode || ''}` : 'N/A',
                    'Pan Card': donation.panNumber || 'N/A',
                    'Tax Benefit': donation.taxBenefit?.eligible ? (donation.taxBenefit.certificateIssued ? 'Certificate Issued' : 'Eligible') : 'Not Eligible',
                    'Bank Name': donation.chequeDetails?.bankName || 'N/A',
                    'Items Donated': donation.goodsDetails?.map(g => `${g.item} (${g.quantity} ${g.unit})`).join(', ') || 'N/A',
                    'Anonymous': donation.isAnonymous ? 'Yes' : 'No',
                    'Notes': donation.notes || ''
                };
                return flatDonation;
            });

            const dateStr = new Date().toISOString().split('T')[0];
            const fileName = `Donations_Export_${dateStr}`;

            await import('../../utils/exportUtils').then(module => {
                module.exportToExcel(donationsToExport, fileName, 'Donations');
                toast.success('Donations exported successfully');
            });

        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export donations');
        }
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

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="p-8 space-y-10 min-h-screen"
        >
            {/* Header Section */}
            <header className="pb-4 border-b border-slate-200 dark:border-slate-800">
                <motion.div variants={itemVariants} className="flex items-center space-x-2 text-primary-600 font-bold uppercase tracking-[0.2em] text-[10px] mb-2">
                     <span className="w-8 h-px bg-primary-600"></span>
                     <span>Donations</span>
                </motion.div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <motion.h1 variants={itemVariants} className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">
                            Donations List
                        </motion.h1>
                        <motion.p variants={itemVariants} className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
                            Keep track of all gifts and donations.
                        </motion.p>
                    </div>
                    
                    <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={fetchDonations}
                            className="p-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-primary-600 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95"
                        >
                            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                        </button>
                        {user?.role === 'admin' && (
                            <button
                                onClick={handleExport}
                                className="flex items-center px-5 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md font-bold text-xs uppercase tracking-widest transition-all"
                            >
                                <FiDownload className="mr-2" />
                                Export
                            </button>
                        )}
                        <Link
                            to="/donations/add"
                            className="flex items-center bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-2xl shadow-lg shadow-primary-500/25 font-black text-xs uppercase tracking-widest transition-all hover:-translate-y-1 active:scale-95"
                        >
                            <FiPlus className="mr-2 stroke-[3px]" />
                            Add Donation
                        </Link>
                    </motion.div>
                </div>
            </header>

            {/* Quick Stats Grid */}
            <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Contributions', value: stats.count || 0, icon: <FiActivity />, color: 'from-blue-600 to-indigo-700', shadow: 'shadow-blue-500/20' },
                    { label: 'Total Amount', value: formatCurrency(stats.totalAmount || 0), icon: <TbCurrencyRupee />, color: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/20' },
                    { label: 'Average Ticket', value: formatCurrency(stats.avgAmount || 0), icon: <FiPieChart />, color: 'from-purple-500 to-indigo-600', shadow: 'shadow-purple-500/20' },
                    { label: 'This Month', value: formatCurrency(stats.thisMonth || 0), icon: <FiCalendar />, color: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/20' },
                ].map((stat, idx) => (
                    <motion.div key={idx} variants={itemVariants} className={`relative p-6 rounded-[2rem] bg-gradient-to-br ${stat.color} shadow-lg ${stat.shadow} overflow-hidden group`}>
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
                             {React.cloneElement(stat.icon, { size: 80 })}
                        </div>
                        <div className="relative z-10">
                            <div className="p-3 bg-white/20 rounded-2xl w-fit backdrop-blur-md mb-4 text-white">
                                {stat.icon}
                            </div>
                            <p className="text-white/70 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
                            <h3 className="text-2xl font-black text-white mt-1 break-words">{stat.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Main Content Card */}
            <motion.div variants={itemVariants} className="card !rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                {/* Filter Toolbar */}
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col lg:flex-row gap-4">
                            <div className="flex-1 relative group">
                                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search by Donor Name, ID or Receipt..."
                                    value={filters.donorName}
                                    onChange={(e) => setFilters({ ...filters, donorName: e.target.value })}
                                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.25rem] focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all font-medium text-slate-800 dark:text-white placeholder:text-slate-400 shadow-sm"
                                />
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <select
                                    value={filters.donationType}
                                    onChange={(e) => setFilters({ ...filters, donationType: e.target.value })}
                                    className="px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.25rem] focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all font-bold text-xs uppercase tracking-widest text-slate-600 dark:text-slate-300 shadow-sm cursor-pointer"
                                >
                                    <option value="">All Types</option>
                                    {donationTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                    className="px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.25rem] focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all font-bold text-xs uppercase tracking-widest text-slate-600 dark:text-slate-300 shadow-sm cursor-pointer"
                                >
                                    <option value="">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="verified">Verified</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                                <button 
                                    onClick={handleClearFilters}
                                    className="px-6 py-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-[1.25rem] font-bold text-xs uppercase tracking-widest transition-all"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="py-24"><LoadingSpinner message="Loading donations..." /></div>
                    ) : donations.length === 0 ? (
                        <div className="p-24 text-center">
                            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <TbCurrencyRupee className="h-10 w-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">No Donations Found</h3>
                            <p className="text-slate-500 mt-2 max-w-sm mx-auto font-medium">No donation records were identified for the current selection.</p>
                        </div>
                    ) : (
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-8 py-6 text-left">ID & Date</th>
                                    <th className="px-8 py-6 text-left">Donor Profile</th>
                                    <th className="px-8 py-6 text-left">Allocation</th>
                                    <th className="px-8 py-6 text-left">Amount</th>
                                    <th className="px-8 py-6 text-left">Status</th>
                                    <th className="px-8 py-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                <AnimatePresence mode="popLayout">
                                    {donations.map((donation) => {
                                        const StatusIcon = statusIcons[donation.status] || FiClock;
                                        return (
                                            <motion.tr 
                                                key={donation._id}
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all duration-300"
                                            >
                                                <td className="px-8 py-6">
                                                    <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">{donation.donationId}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-widest">{formatDate(donation.date)}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-xs font-black text-slate-400 border border-white dark:border-slate-700 shadow-sm">
                                                            {donation.isAnonymous ? '?' : donation.donorName?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{donation.isAnonymous ? 'Anonymous Donor' : donation.donorName}</p>
                                                            {!donation.isAnonymous && donation.donorEmail && (
                                                                <p className="text-[10px] text-slate-400 dark:text-slate-500 group-hover:text-primary-500 transition-colors truncate max-w-[150px]">{donation.donorEmail}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col space-y-1">
                                                        <span className="inline-flex w-fit px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-tighter border border-slate-200 dark:border-slate-600">
                                                            {donation.donationType}
                                                        </span>
                                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{donation.purpose}</p>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="text-lg font-black text-slate-800 dark:text-white tracking-tighter group-hover:scale-105 transition-transform origin-left">{formatCurrency(donation.amount)}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`inline-flex px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${statusColors[donation.status]}`}>
                                                        <StatusIcon className="mr-1.5 h-3 w-3" />
                                                        {donation.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        {donation.receiptGenerated ? (
                                                            <a
                                                                href={donation.receiptUrl.startsWith('http') ? donation.receiptUrl : `http://localhost:5000${donation.receiptUrl}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm"
                                                                title="View Receipt"
                                                            >
                                                                <FiPrinter className="w-4 h-4" />
                                                            </a>
                                                        ) : (
                                                            user?.role === 'admin' && donation.status === 'verified' && (
                                                                <button
                                                                    onClick={() => handleGenerateReceipt(donation._id)}
                                                                    className="p-2.5 bg-slate-50 dark:bg-slate-800 text-purple-600 hover:bg-purple-600 hover:text-white rounded-xl transition-all shadow-sm"
                                                                    title="Generate Receipt"
                                                                >
                                                                    <FiPrinter className="w-4 h-4" />
                                                                </button>
                                                            )
                                                        )}
                                                        <Link to={`/donations/${donation._id}`} className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-primary-600 hover:text-white rounded-xl transition-all shadow-sm">
                                                            <FiEye className="w-4 h-4" />
                                                        </Link>
                                                        {user?.role === 'admin' && donation.status === 'pending' && (
                                                            <button
                                                                onClick={() => handleVerify(donation._id)}
                                                                className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm"
                                                                title="Confirm Donation"
                                                            >
                                                                <FiCheckCircle className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination Meta */}
                <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        Donations Count: <span className="text-slate-800 dark:text-white font-black">{donations.length}</span> of <span className="text-slate-800 dark:text-white font-black">{pagination.total}</span> Entries
                    </p>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                            disabled={pagination.page === 1}
                            className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            Back
                        </button>
                        <span className="w-8 h-8 flex items-center justify-center bg-primary-600 text-white rounded-lg text-xs font-black">{pagination.page}</span>
                        <button
                            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                            disabled={pagination.page >= pagination.totalPages}
                            className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Distribution Charts Section */}
            <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Donation Types */}
                <motion.div variants={itemVariants} className="card !rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="flex items-center space-x-3 mb-8">
                        <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-2xl text-primary-600 group-hover:scale-110 transition-transform">
                            <FiActivity />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Donation Types</h3>
                    </div>
                    <div className="space-y-6">
                        {distributions.byType.map((type) => (
                            <div key={type._id} className="relative">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{type._id}</span>
                                    <span className="text-xs font-black text-slate-700 dark:text-slate-200">{formatCurrency(type.total)}</span>
                                </div>
                                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-700">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(type.total / stats.totalAmount) * 100}%` }}
                                        transition={{ duration: 1, ease: 'easeOut' }}
                                        className="h-full bg-gradient-to-r from-primary-500 to-indigo-600 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                                    ></motion.div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Donation Purposes */}
                <motion.div variants={itemVariants} className="card !rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="flex items-center space-x-3 mb-8">
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform">
                            <FiCalendar />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Donation Purposes</h3>
                    </div>
                    <div className="space-y-6">
                        {distributions.byPurpose.map((purpose) => (
                            <div key={purpose._id} className="relative">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{purpose._id}</span>
                                    <span className="text-xs font-black text-slate-700 dark:text-slate-200">{formatCurrency(purpose.total)}</span>
                                </div>
                                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-700">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(purpose.total / stats.totalAmount) * 100}%` }}
                                        transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                    ></motion.div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        </motion.div>
    );
};

export default DonationList;
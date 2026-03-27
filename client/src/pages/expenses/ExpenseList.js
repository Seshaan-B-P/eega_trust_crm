import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
    FiSearch, FiPlus, FiEye, FiEdit2, FiTrash2,
    FiFilter, FiDownload, FiRefreshCw, FiCalendar,
    FiPieChart, FiDollarSign, FiTag, FiTruck
} from 'react-icons/fi';
import { TbCurrencyRupee } from 'react-icons/tb';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const ExpenseList = () => {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalAmount: 0,
        count: 0,
        avgAmount: 0
    });
    const [distributions, setDistributions] = useState({
        byCategory: [],
        byVendor: []
    });
    const [filters, setFilters] = useState({
        category: '',
        startDate: '',
        endDate: '',
        minAmount: '',
        maxAmount: '',
        search: ''
    });

    const categories = [
        { id: 'food', name: 'Food & Groceries' },
        { id: 'medical', name: 'Medical Supplies' },
        { id: 'utilities', name: 'Utilities' },
        { id: 'maintenance', name: 'Maintenance' },
        { id: 'salary', name: 'Staff Salaries' },
        { id: 'education', name: 'Education' },
        { id: 'festival', name: 'Festival' },
        { id: 'other', name: 'Other' }
    ];

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams(
                Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
            ).toString();
            const response = await api.get(`/expenses?${params}`);
            setExpenses(response.data.data || []);
            setStats(response.data.stats || { totalAmount: 0, count: 0, avgAmount: 0 });
            setDistributions(response.data.distributions || { byCategory: [], byVendor: [] });
        } catch (error) {
            toast.error('Error fetching expenses');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, [filters]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this expense?')) return;
        try {
            await api.delete(`/expenses/${id}`);
            toast.success('Expense deleted');
            fetchExpenses();
        } catch (error) {
            toast.error('Error deleting expense');
        }
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
                     <span>Expenses</span>
                </motion.div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <motion.h1 variants={itemVariants} className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">
                            Expense List
                        </motion.h1>
                        <motion.p variants={itemVariants} className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
                            Manage and record all outgoing payments.
                        </motion.p>
                    </div>
                    
                    <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={fetchExpenses}
                            className="p-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-primary-600 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95"
                        >
                            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                        </button>
                        <Link
                            to="/expenses/add"
                            className="flex items-center bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-2xl shadow-lg shadow-primary-500/25 font-black text-xs uppercase tracking-widest transition-all hover:-translate-y-1 active:scale-95"
                        >
                            <FiPlus className="mr-2 stroke-[3px]" />
                            Add Expense
                        </Link>
                    </motion.div>
                </div>
            </header>

            {/* Quick Stats Grid */}
            <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    { label: 'Total Spent', value: formatCurrency(stats.totalAmount || 0), icon: <TbCurrencyRupee />, color: 'from-rose-600 to-red-700', shadow: 'shadow-rose-500/20' },
                    { label: 'Average Expense', value: formatCurrency(stats.avgAmount || 0), icon: <FiPieChart />, color: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/20' },
                    { label: 'Total Expenses', value: stats.count || 0, icon: <FiTag />, color: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/20' },
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
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1 relative group">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search description or vendor..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.25rem] focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all font-medium text-slate-800 dark:text-white shadow-sm"
                            />
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <select
                                value={filters.category}
                                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                className="px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.25rem] focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all font-bold text-xs uppercase tracking-widest text-slate-600 dark:text-slate-300 shadow-sm cursor-pointer"
                            >
                                <option value="">All Categories</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="py-24"><LoadingSpinner message="Loading expenses..." /></div>
                    ) : expenses.length === 0 ? (
                        <div className="p-24 text-center">
                            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <FiTag className="h-10 w-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">No Expenses Found</h3>
                            <p className="text-slate-500 mt-2 max-w-sm mx-auto font-medium">No financial records identified for this selection.</p>
                        </div>
                    ) : (
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-8 py-6 text-left">Date & Info</th>
                                    <th className="px-8 py-6 text-left">Category</th>
                                    <th className="px-8 py-6 text-left">Vendor</th>
                                    <th className="px-8 py-6 text-left">Amount</th>
                                    <th className="px-8 py-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                <AnimatePresence mode="popLayout">
                                    {expenses.map((expense) => (
                                        <motion.tr 
                                            key={expense._id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all duration-300"
                                        >
                                            <td className="px-8 py-6">
                                                <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">{new Date(expense.date).toLocaleDateString()}</p>
                                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-widest truncate max-w-[200px]">{expense.description}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-[10px] font-black uppercase text-slate-600 dark:text-slate-400 tracking-tighter border border-slate-200 dark:border-slate-600">
                                                    {expense.category}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                                                    <FiTruck className="mr-2 text-slate-400" />
                                                    {expense.vendorName || '---'}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-lg font-black text-slate-800 dark:text-white tracking-tighter">{formatCurrency(expense.amount)}</p>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <Link to={`/expenses/edit/${expense._id}`} className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-primary-600 hover:text-white rounded-xl transition-all shadow-sm">
                                                        <FiEdit2 className="w-4 h-4" />
                                                    </Link>
                                                    <button onClick={() => handleDelete(expense._id)} className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-sm">
                                                        <FiTrash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    )}
                </div>
            </motion.div>

            {/* Spending Breakdown Section */}
            <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Category Breakdown */}
                <motion.div variants={itemVariants} className="card !rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="flex items-center space-x-3 mb-8">
                        <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-2xl text-primary-600 group-hover:scale-110 transition-transform">
                            <FiPieChart />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Spending by Category</h3>
                    </div>
                    <div className="space-y-6">
                        {distributions.byCategory?.map((cat, idx) => (
                            <div key={idx} className="relative">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{cat._id}</span>
                                    <span className="text-xs font-black text-slate-700 dark:text-slate-200">{formatCurrency(cat.total)}</span>
                                </div>
                                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${stats.totalAmount > 0 ? (cat.total / stats.totalAmount) * 100 : 0}%` }}
                                        transition={{ duration: 1, ease: 'easeOut' }}
                                        className="h-full bg-primary-500 rounded-full"
                                    ></motion.div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Vendor Summary */}
                <motion.div variants={itemVariants} className="card !rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="flex items-center space-x-3 mb-8">
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform">
                            <FiTruck />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Vendor Summary</h3>
                    </div>
                    <div className="space-y-6">
                        {distributions.byVendor?.map((vendor, idx) => (
                            <div key={idx} className="relative shadow-sm bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">{vendor._id || 'General Vendor'}</p>
                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{vendor.count} Transactions</p>
                                    </div>
                                    <p className="text-sm font-black text-primary-600">{formatCurrency(vendor.total)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        </motion.div>
    );
};

export default ExpenseList;

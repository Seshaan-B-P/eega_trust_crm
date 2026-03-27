import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
    FiUsers, FiSearch, FiPlus, FiEdit, FiEye,
    FiFilter, FiDownload, FiTrash2, FiRefreshCw,
    FiUserCheck, FiUserX, FiActivity, FiTrendingUp
} from 'react-icons/fi';
import elderlyService from '../../services/elderlyService';
import LoadingSpinner from '../LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';

const ElderlyList = () => {
    const [elderly, setElderly] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Stats state
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        hospitalized: 0,
        deceased: 0
    });

    // Filters state
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        gender: '',
        minAge: '',
        maxAge: ''
    });

    // Pagination state
    const [pagination, setPagination] = useState({
        page: 1,
        total: 0,
        totalPages: 1,
        limit: 10
    });

    const fetchElderly = async () => {
        try {
            setLoading(true);
            setError('');

            // Build query params
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                ...Object.fromEntries(
                    Object.entries(filters).filter(([_, value]) => value !== '')
                )
            };

            const response = await elderlyService.getElderly(params);

            // Handle response data
            setElderly(response.elderly || []);

            if (response.stats) {
                setStats(response.stats);
            }

            setPagination({
                ...pagination,
                total: response.total || 0,
                totalPages: response.totalPages || 1
            });

            setLoading(false);
        } catch (err) {
            console.error('Fetch error:', err);
            setError(err.response?.data?.message || err.message || 'Failed to fetch elderly records');
            toast.error('Error fetching elderly records');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchElderly();
    }, [filters, pagination.page]);

    const handleDelete = async (id, name) => {
        if (window.confirm(`Are you sure you want to delete ${name}?`)) {
            try {
                await elderlyService.deleteElderly(id);
                toast.success('Record deleted successfully');
                fetchElderly(); // Refresh list
            } catch (err) {
                toast.error('Failed to delete record');
            }
        }
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

    const handleExport = async () => {
        try {
            const response = await elderlyService.getElderly({ limit: 0 }); // Fetch all
            const elderlyData = response.elderly || [];

            const exportData = elderlyData.map(person => ({
                'Name': person.name,
                'Age': person.age,
                'Gender': person.gender,
                'Date of Birth': new Date(person.dateOfBirth).toLocaleDateString(),
                'Admission Date': new Date(person.dateOfAdmission).toLocaleDateString(),
                'Status': person.status,
                'Assigned Staff': person.assignedStaff?.name || 'Unassigned',
                'Special Needs': person.specialNeeds,
                'Medical Conditions': person.medicalConditions?.map(c => c.condition).join(', ') || 'None',
                'Allergies': person.allergies?.join(', ') || 'None',
                'Dietary Restrictions': person.dietaryRestrictions?.join(', ') || 'None',
                'Emergency Contact Name': person.emergencyContact?.name || '',
                'Emergency Contact Relation': person.emergencyContact?.relationship || '',
                'Emergency Contact Phone': person.emergencyContact?.phone || '',
                'Emergency Contact Address': person.emergencyContact?.address || ''
            }));

            const dateStr = new Date().toISOString().split('T')[0];
            const fileName = `Elderly_Export_${dateStr}`;

            await import('../../utils/exportUtils').then(module => {
                module.exportToExcel(exportData, fileName, 'Elderly_Residents');
                toast.success('Elderly records exported successfully');
            });
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export records');
        }
    };

    const statusColors = {
        Active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400',
        Inactive: 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:bg-slate-500/20 dark:text-slate-400',
        Hospitalized: 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400',
        Deceased: 'bg-stone-500/10 text-stone-600 border-stone-500/20 dark:bg-stone-500/20 dark:text-stone-400',
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

    if (error) return (
        <div className="p-8 h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
            <div className="max-w-md w-full p-8 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-xl border border-rose-100 dark:border-rose-900/30 text-center">
                <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                    <FiUserX className="w-10 h-10 text-rose-600" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Access Error</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">{error}</p>
                <button 
                    onClick={fetchElderly} 
                    className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl shadow-lg shadow-primary-500/25 font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                >
                    Retry Database Sync
                </button>
            </div>
        </div>
    );

    return (
        <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="p-8 space-y-10 min-h-screen"
        >
            {/* Page Header */}
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div>
                    <motion.div variants={itemVariants} className="flex items-center space-x-2 text-primary-600 font-bold uppercase tracking-[0.2em] text-[10px] mb-2">
                         <span className="w-8 h-px bg-primary-600"></span>
                         <span>List of Seniors</span>
                    </motion.div>
                    <motion.h1 variants={itemVariants} className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">
                        Senior Records
                    </motion.h1>
                    <motion.p variants={itemVariants} className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
                        Manage seniors and their care.
                    </motion.p>
                </div>
                
                <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={fetchElderly}
                        className="p-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-primary-600 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95"
                    >
                        <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center px-5 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md font-bold text-xs uppercase tracking-widest transition-all"
                    >
                        <FiDownload className="mr-2" />
                        Export
                    </button>
                    <Link
                        to="/elderly/add"
                        className="flex items-center bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-2xl shadow-lg shadow-primary-500/25 font-black text-xs uppercase tracking-widest transition-all hover:-translate-y-1 active:scale-95"
                    >
                        <FiPlus className="mr-2 stroke-[3px]" />
                        Add Senior
                    </Link>
                </motion.div>
            </header>

            {/* Quick Stats Grid */}
            <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Seniors', value: stats.total || 0, icon: <FiUsers />, color: 'from-blue-600 to-indigo-700', shadow: 'shadow-blue-500/20' },
                    { label: 'Active Now', value: stats.active || 0, icon: <FiUserCheck />, color: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/20' },
                    { label: 'In Hospital', value: stats.hospitalized || 0, icon: <FiActivity />, color: 'from-rose-500 to-pink-600', shadow: 'shadow-rose-500/20' },
                    { label: 'Past Records', value: stats.deceased || 0, icon: <FiUserX />, color: 'from-slate-600 to-slate-800', shadow: 'shadow-slate-500/20' },
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
                            <h3 className="text-3xl font-black text-white mt-1">{stat.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Main Content Card */}
            <motion.div variants={itemVariants} className="card !rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                {/* Filter Toolbar */}
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 relative group">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search by name, ID or notes..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.25rem] focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all font-medium text-slate-800 dark:text-white placeholder:text-slate-400 shadow-sm"
                            />
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                className="px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.25rem] focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all font-bold text-xs uppercase tracking-widest text-slate-600 dark:text-slate-300 shadow-sm cursor-pointer"
                            >
                                <option value="">Status</option>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="Hospitalized">Hospitalized</option>
                                <option value="Deceased">Deceased</option>
                            </select>
                            <select
                                value={filters.gender}
                                onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                                className="px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.25rem] focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all font-bold text-xs uppercase tracking-widest text-slate-600 dark:text-slate-300 shadow-sm cursor-pointer"
                            >
                                <option value="">Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                            {(filters.search || filters.status || filters.gender) && (
                                <button 
                                    onClick={handleClearFilters}
                                    className="px-6 py-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-[1.25rem] font-bold text-xs uppercase tracking-widest transition-all"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="py-24"><LoadingSpinner message="Loading..." /></div>
                    ) : elderly.length === 0 ? (
                        <div className="p-24 text-center">
                            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <FiUsers className="h-10 w-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white">No one found</h3>
                            <p className="text-slate-500 mt-2 max-w-sm mx-auto font-medium">Try refining your search or adding a new resident profile.</p>
                        </div>
                    ) : (
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-8 py-6 text-left">Senior Name</th>
                                    <th className="px-8 py-6 text-left">Age / Gender</th>
                                    <th className="px-8 py-6 text-left">Staff Helper</th>
                                    <th className="px-8 py-6 text-left">Status</th>
                                    <th className="px-8 py-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                <AnimatePresence mode="popLayout">
                                    {elderly.map((person, idx) => (
                                        <motion.tr 
                                            key={person._id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all duration-300"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center space-x-4">
                                                    <div className="relative">
                                                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center overflow-hidden border-2 border-white dark:border-slate-700 shadow-sm group-hover:scale-110 transition-transform duration-500">
                                                            {person.photo ? (
                                                                <img src={person.photo} alt="" className="h-full w-full object-cover" />
                                                            ) : (
                                                                <span className="text-xl font-black text-slate-400">{person.name?.charAt(0)}</span>
                                                            )}
                                                        </div>
                                                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${person.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800 dark:text-white group-hover:text-primary-600 transition-colors uppercase tracking-tight">{person.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-widest">{person.elderlyId || 'ID UNASSIGNED'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col space-y-1">
                                                    <div className="flex items-center text-xs font-bold text-slate-600 dark:text-slate-300">
                                                        <span>{person.age} YEARS</span>
                                                        <span className="mx-2 text-slate-300">•</span>
                                                        <span className={`uppercase ${person.gender === 'Female' ? 'text-rose-500' : 'text-blue-500'}`}>{person.gender}</span>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter truncate max-w-[150px]">{person.specialNeeds || 'Routine Care Plan'}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                {person.assignedStaff ? (
                                                    <div className="flex items-center space-x-2">
                                                        <div className="h-7 w-7 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-[10px] font-black text-primary-600 uppercase">
                                                            {person.assignedStaff.name?.charAt(0)}
                                                        </div>
                                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-tight">{person.assignedStaff.name}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg">Unassigned</span>
                                                )}
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`inline-flex px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${statusColors[person.status] || statusColors.Active}`}>
                                                    {person.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <Link to={`/elderly/${person._id}`} className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-primary-600 hover:text-white rounded-xl transition-all shadow-sm">
                                                        <FiEye className="w-4 h-4" />
                                                    </Link>
                                                    <Link to={`/elderly/edit/${person._id}`} className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm">
                                                        <FiEdit className="w-4 h-4" />
                                                    </Link>
                                                    <button onClick={() => handleDelete(person._id, person.name)} className="p-2.5 bg-slate-50 dark:bg-slate-800 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-sm">
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

                {/* Pagination Footer */}
                <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        Showing <span className="text-slate-800 dark:text-white font-black">{elderly.length}</span> of <span className="text-slate-800 dark:text-white font-black">{pagination.total}</span> Seniors
                    </p>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                            disabled={pagination.page === 1}
                            className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            Previous
                        </button>
                        <div className="flex items-center space-x-1">
                            <span className="w-8 h-8 flex items-center justify-center bg-primary-600 text-white rounded-lg text-xs font-black">{pagination.page}</span>
                        </div>
                        <button
                            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                            disabled={pagination.page >= pagination.totalPages}
                            className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            Next Page
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default ElderlyList;
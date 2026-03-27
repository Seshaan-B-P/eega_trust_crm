import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
    FiUsers, FiSearch, FiPlus, FiEdit, FiEye,
    FiFilter, FiDownload, FiTrash2, FiRefreshCw,
    FiUserCheck, FiUserX, FiTrendingUp
} from 'react-icons/fi';
import api from '../../../utils/api';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';

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
        if (window.confirm(`Are you sure you want to permanently delete ${name}? This action cannot be undone.`)) {
            try {
                await api.delete(`/children/${id}`);
                toast.success('Child deleted successfully');
                fetchChildren();
            } catch (error) {
                toast.error('Error discharging child');
            }
        }
    };

    const handleDeleteAll = async () => {
        if (window.confirm('WARNING: Are you sure you want to DELETE ALL children? This action cannot be undone and will remove all associated data (reports, attendance, etc.).')) {
            if (window.confirm('Please confirm again: This will permanently wipe all child records.')) {
                try {
                    setLoading(true);
                    await api.delete('/children');
                    toast.success('All children records deleted successfully');
                    fetchChildren();
                } catch (error) {
                    toast.error('Error deleting records');
                    console.error(error);
                    setLoading(false);
                }
            }
        }
    };

    const statusColors = {
        active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400',
        discharged: 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:bg-slate-500/20 dark:text-slate-400',
        transferred: 'bg-primary-500/10 text-primary-600 border-primary-500/20 dark:bg-primary-500/20 dark:text-primary-400'
    };

    const genderColorClasses = {
        male: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
        female: 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400',
        other: 'bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400'
    };

    const handleExport = async () => {
        try {
            const response = await api.get('/children');
            const childrenData = response.data.children || response.data.data || [];

            const childrenToExport = childrenData.map(child => ({
                'ID': child._id || child.id,
                'Name': child.name,
                'Age': child.age,
                'Gender': child.gender,
                'Date of Birth': child.dateOfBirth ? new Date(child.dateOfBirth).toLocaleDateString() : 'N/A',
                'Admission Date': child.admissionDate ? new Date(child.admissionDate).toLocaleDateString() : 'N/A',
                'Status': child.status || 'Active',
                'School': child.school || 'N/A',
                'Class/Grade': child.grade || 'N/A',
                'Guardian Name': child.guardian?.name || 'N/A',
                'Guardian Phone': child.guardian?.phone || 'N/A',
                'Guardian Relation': child.guardian?.relationship || 'N/A',
                'Medical Conditions': child.medicalHistory?.map(m => m.condition).join(', ') || 'None',
                'Allergies': child.allergies?.join(', ') || 'None',
                'Special Needs': child.specialNeeds || 'None'
            }));

            const dateStr = new Date().toISOString().split('T')[0];
            const fileName = `Children_Export_${dateStr}`;

            await import('../../../utils/exportUtils').then(module => {
                module.exportToExcel(childrenToExport, fileName, 'Children');
                toast.success('Children list exported successfully');
            });
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export children list');
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
            {/* Page Header */}
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div>
                    <motion.div variants={itemVariants} className="flex items-center space-x-2 text-primary-600 font-bold uppercase tracking-[0.2em] text-[10px] mb-2">
                         <span className="w-8 h-px bg-primary-600"></span>
                         <span>List</span>
                    </motion.div>
                    <motion.h1 variants={itemVariants} className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">
                        Children Records
                    </motion.h1>
                    <motion.p variants={itemVariants} className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
                        Manage children and their details.
                    </motion.p>
                </div>
                
                <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={fetchChildren}
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
                        to="/children/add"
                        className="flex items-center bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-2xl shadow-lg shadow-primary-500/25 font-black text-xs uppercase tracking-widest transition-all hover:-translate-y-1 active:scale-95"
                    >
                        <FiPlus className="mr-2 stroke-[3px]" />
                        Add New Child
                    </Link>
                </motion.div>
            </header>

            {/* Quick Stats Grid */}
            <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Children', value: stats.total || 0, icon: <FiUsers />, color: 'from-blue-600 to-indigo-700', shadow: 'shadow-blue-500/20' },
                    { label: 'Active Now', value: stats.active || 0, icon: <FiUserCheck />, color: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/20' },
                    { label: 'Left Home', value: stats.discharged || 0, icon: <FiUserX />, color: 'from-slate-600 to-slate-800', shadow: 'shadow-slate-500/20' },
                    { label: 'Space Used', value: '84%', icon: <FiTrendingUp />, color: 'from-rose-500 to-pink-600', shadow: 'shadow-rose-500/20' },
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
                                placeholder="Search by name, ID or guardian..."
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
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="discharged">Discharged</option>
                                <option value="transferred">Transferred</option>
                            </select>
                            <select
                                value={filters.gender}
                                onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                                className="px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.25rem] focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all font-bold text-xs uppercase tracking-widest text-slate-600 dark:text-slate-300 shadow-sm cursor-pointer"
                            >
                                <option value="">Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
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
                    ) : children.length === 0 ? (
                        <div className="p-24 text-center">
                            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <FiUsers className="h-10 w-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white">No entries found</h3>
                            <p className="text-slate-500 mt-2 max-w-sm mx-auto font-medium">Try refining your search or adding a new record to the database.</p>
                        </div>
                    ) : (
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-8 py-6 text-left">Name</th>
                                    <th className="px-8 py-6 text-left">Age/Gender</th>
                                    <th className="px-8 py-6 text-left">Status</th>
                                    <th className="px-8 py-6 text-left">Joined</th>
                                    <th className="px-8 py-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                <AnimatePresence mode="popLayout">
                                    {children.map((child, idx) => (
                                        <motion.tr 
                                            key={child._id}
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
                                                            {child.photo ? (
                                                                <img src={child.photo} alt="" className="h-full w-full object-cover" />
                                                            ) : (
                                                                <span className="text-xl font-black text-slate-400">{child.name?.charAt(0)}</span>
                                                            )}
                                                        </div>
                                                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${child.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800 dark:text-white group-hover:text-primary-600 transition-colors uppercase tracking-tight">{child.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-widest">{child.childId}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col space-y-1">
                                                    <div className="flex items-center text-xs font-bold text-slate-600 dark:text-slate-300">
                                                        <span>{child.age || 'N/A'} YEARS</span>
                                                        <span className="mx-2 text-slate-300">•</span>
                                                        <span className={`uppercase ${child.gender === 'female' ? 'text-rose-500' : 'text-blue-500'}`}>{child.gender}</span>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter truncate max-w-[150px]">{child.school || 'Private Home School'}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`inline-flex px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${statusColors[child.status] || statusColors.active}`}>
                                                    {child.status || 'Active'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{new Date(child.dateOfAdmission).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter mt-0.5">Joined</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <Link to={`/children/${child._id}`} className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-primary-600 hover:text-white rounded-xl transition-all shadow-sm">
                                                        <FiEye className="w-4 h-4" />
                                                    </Link>
                                                    <Link to={`/children/${child._id}/edit`} className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm">
                                                        <FiEdit className="w-4 h-4" />
                                                    </Link>
                                                    <button onClick={() => handleDelete(child._id, child.name)} className="p-2.5 bg-slate-50 dark:bg-slate-800 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-sm">
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
                        Showing <span className="text-slate-800 dark:text-white font-black">{children.length}</span> of <span className="text-slate-800 dark:text-white font-black">{pagination.total}</span> Entries
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

export default ChildrenList;
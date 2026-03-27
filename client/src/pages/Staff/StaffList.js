import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
    FiUsers, FiSearch, FiPlus, FiEdit, FiEye,
    FiFilter, FiDownload, FiTrash2, FiRefreshCw,
    FiUserCheck, FiUserX, FiBriefcase, FiAward, FiClock, FiActivity
} from 'react-icons/fi';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

const StaffList = () => {
    const { user } = useAuth();
    const { theme } = useTheme();
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

    const departmentColors = {
        caretaker: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400',
        teacher: 'bg-primary-500/10 text-primary-600 border-primary-500/20 dark:bg-primary-500/20 dark:text-primary-400',
        cook: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400',
        doctor: 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400',
        administrator: 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:bg-purple-500/20 dark:text-purple-400',
        security: 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:bg-slate-500/20 dark:text-slate-400',
        other: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:bg-indigo-500/20 dark:text-indigo-400'
    };

    const departmentHexColors = {
        caretaker: '#10b981',
        teacher: '#6366f1',
        cook: '#f59e0b',
        doctor: '#f43f5e',
        administrator: '#a855f7',
        security: '#64748b',
        other: '#4f46e5'
    };

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
            setStaff(response.data.data || []);
            setStats(response.data.stats || stats);
            setPagination({
                ...pagination,
                total: response.data.total,
                totalPages: response.data.totalPages
            });
        } catch (error) {
            toast.error('Error fetching staff metrics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, [filters, pagination.page]);

    const handleDelete = async (id, name) => {
        toast((t) => (
            <div className="flex flex-col gap-4">
                <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Archive personnel <b>{name}</b>?</p>
                <div className="flex gap-2">
                    <button 
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                await api.delete(`/staff/${id}`);
                                toast.success('Personnel successfully archived');
                                fetchStaff();
                            } catch (error) {
                                toast.error('Archival failed');
                            }
                        }}
                        className="px-4 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                    >
                        Confirm
                    </button>
                    <button onClick={() => toast.dismiss(t.id)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
                </div>
            </div>
        ), { duration: 5000 });
    };

    const handleExport = async () => {
        toast.promise(
            import('../../utils/exportUtils').then(async (module) => {
                const response = await api.get('/staff');
                const staffToExport = response.data.data.map(staff => ({
                    'Employee ID': staff.employeeId || 'N/A',
                    'Name': staff.name,
                    'Email': staff.email,
                    'Phone': staff.phone,
                    'Designation': staff.designation,
                    'Department': staff.department,
                    'Status': staff.status,
                    'Join Date': new Date(staff.joinDate).toLocaleDateString(),
                    'Salary': staff.salary
                }));
                module.exportToExcel(staffToExport, `Staff_Ledger_${new Date().toISOString().split('T')[0]}`, 'Staff');
            }),
            {
                loading: 'Compiling personnel dossier...',
                success: 'Personnel ledger exported',
                error: 'Export failed'
            }
        );
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
        return str?.charAt(0).toUpperCase() + str?.slice(1);
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
            {/* Custom Header */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Team List</h2>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={fetchStaff}
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
                    {user?.role === 'admin' && (
                        <Link
                            to="/staff/add"
                            className="flex items-center bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-2xl shadow-lg shadow-primary-500/25 font-black text-xs uppercase tracking-widest transition-all hover:-translate-y-1 active:scale-95"
                        >
                            <FiPlus className="mr-2 stroke-[3px]" />
                            Onboard Staff
                        </Link>
                    )}
                </div>
            </header>

            {/* Premium Stats Grid */}
            <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    { label: 'Total Staff', value: stats.total || 0, icon: <FiUsers />, color: 'from-blue-600 to-indigo-700', shadow: 'shadow-blue-500/20' },
                    { label: 'Active Staff', value: stats.active || 0, icon: <FiUserCheck />, color: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/20' },
                    { label: 'Inactive Staff', value: stats.inactive || 0, icon: <FiUserX />, color: 'from-slate-600 to-slate-800', shadow: 'shadow-slate-500/20' },
                ].map((stat, idx) => (
                    <motion.div key={idx} variants={itemVariants} className={`relative p-8 rounded-[2.5rem] bg-gradient-to-br ${stat.color} shadow-lg ${stat.shadow} overflow-hidden group`}>
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
                             {React.cloneElement(stat.icon, { size: 100 })}
                        </div>
                        <div className="relative z-10">
                            <div className="p-4 bg-white/20 rounded-2xl w-fit backdrop-blur-md mb-6 text-white">
                                {stat.icon}
                            </div>
                            <p className="text-white/70 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
                            <h3 className="text-3xl font-black text-white mt-1 break-words">{stat.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Advanced Filters */}
            <motion.div variants={itemVariants} className="card !rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1 relative group">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search by name, ID, or designation..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.25rem] focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all font-medium text-slate-800 dark:text-white"
                            />
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <select
                                value={filters.department}
                                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                                className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.25rem] focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all font-bold text-xs uppercase tracking-widest text-slate-600 dark:text-slate-300 min-w-[180px]"
                            >
                                <option value="">All Sectors</option>
                                {departments.map(dept => (
                                    <option key={dept} value={dept}>{capitalize(dept)}</option>
                                ))}
                            </select>
                            <select
                                value={filters.isActive}
                                onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
                                className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.25rem] focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all font-bold text-xs uppercase tracking-widest text-slate-600 dark:text-slate-300 min-w-[160px]"
                            >
                                <option value="">Status State</option>
                                <option value="true">Active Only</option>
                                <option value="false">Inactive Only</option>
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
            </motion.div>

            {/* Personnel Registry Table */}
            <motion.div variants={itemVariants} className="card !rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="py-24"><LoadingSpinner message="Reconciling Identity Matrix..." /></div>
                    ) : (
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-8 py-6 text-left">Staff Profile & ID</th>
                                    <th className="px-8 py-6 text-left">Specialization</th>
                                    <th className="px-8 py-6 text-left">Responsibility Load</th>
                                    <th className="px-8 py-6 text-left">Security Clearance</th>
                                    <th className="px-8 py-6 text-left">Tenure</th>
                                    <th className="px-8 py-6 text-right">Utility</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                <AnimatePresence mode="popLayout">
                                    {staff.map((staffMember) => (
                                        <motion.tr 
                                            key={staffMember._id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all duration-300"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center space-x-4">
                                                    <div className="relative">
                                                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white border border-white dark:border-slate-700 shadow-sm overflow-hidden">
                                                            {staffMember.user?.profileImage ? (
                                                                <img src={staffMember.user.profileImage} alt="P" className="h-full w-full object-cover" />
                                                            ) : <span className="font-black text-lg">{staffMember.user?.name?.charAt(0)}</span>}
                                                        </div>
                                                        {staffMember.isActive && (
                                                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{staffMember.user?.name}</p>
                                                        <div className="flex items-center text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-widest">
                                                            <span className="font-black text-primary-600 mr-2">{staffMember.employeeId}</span>
                                                            <span className="truncate max-w-[120px]">{staffMember.user?.email}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col space-y-2">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-tighter border transition-all w-fit ${departmentColors[staffMember.department] || 'bg-slate-100'}`}>
                                                        {capitalize(staffMember.department)}
                                                    </span>
                                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{staffMember.designation}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center space-x-4">
                                                    <div className="text-center">
                                                        <p className="text-lg font-black text-primary-600 dark:text-primary-400 tracking-tighter leading-none">{staffMember.user?.assignedChildren?.length || 0}</p>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Units</p>
                                                    </div>
                                                    <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden min-w-[80px]">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${Math.min(((staffMember.assignedChildrenCount || 0) / (staffMember.maxChildrenCapacity || 1)) * 100, 100)}%` }}
                                                            transition={{ duration: 1.5, ease: 'circOut' }}
                                                            className="h-full bg-emerald-500 rounded-full"
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-sm">
                                                <span className={`inline-flex px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${staffMember.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                                    {staffMember.isActive ? 'Verified Active' : 'Suspended'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest italic">{new Date(staffMember.joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                                <div className="flex items-center mt-1 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                                                    <FiClock className="mr-1" />
                                                    {staffMember.experience || 0}y Experience
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Link to={`/staff/${staffMember._id}`} className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-primary-600 hover:text-white rounded-xl transition-all shadow-sm">
                                                        <FiEye className="w-4 h-4" />
                                                    </Link>
                                                    {user?.role === 'admin' && (
                                                        <>
                                                            <Link to={`/staff/${staffMember._id}/edit`} className="p-2.5 bg-slate-50 dark:bg-slate-800 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm">
                                                                <FiEdit className="w-4 h-4" />
                                                            </Link>
                                                            <button onClick={() => handleDelete(staffMember._id, staffMember.user?.name)} className="p-2.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-sm">
                                                                <FiTrash2 className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination Meta */}
                <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        Total Personnel: <span className="text-slate-800 dark:text-white font-black">{staff.length}</span> of <span className="text-slate-800 dark:text-white font-black">{pagination.total}</span> Records
                    </p>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                            disabled={pagination.page === 1}
                            className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            Back
                        </button>
                        <span className="w-8 h-8 flex items-center justify-center bg-primary-600 text-white rounded-lg text-xs font-black shadow-lg shadow-primary-500/20">{pagination.page}</span>
                        <button
                            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                            disabled={pagination.page >= pagination.totalPages}
                            className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            Forward
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Department Matrix Visualization */}
            <motion.div variants={itemVariants} className="card !rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                <div className="flex items-center space-x-3 mb-10">
                    <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-2xl text-primary-600 group-hover:scale-110 transition-transform">
                        <FiBriefcase />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Departmental Infrastructure Analyze</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-8">
                    {departments.map(dept => {
                        const count = staff.filter(s => s.department === dept).length;
                        const percentage = staff.length > 0 ? (count / staff.length) * 100 : 0;
                        return (
                            <motion.div key={dept} whileHover={{ y: -5 }} className="text-center group/dept">
                                <div className="relative h-24 w-24 mx-auto mb-4 p-1.5 rounded-full border-2 border-slate-100 dark:border-slate-800 transition-colors group-hover/dept:border-primary-500/30">
                                    <div className="h-full w-full rounded-full flex items-center justify-center bg-white dark:bg-slate-800 shadow-inner relative z-10 overflow-hidden">
                                        <div 
                                            className="absolute bottom-0 left-0 w-full transition-all duration-1000 ease-out opacity-20"
                                            style={{ height: `${percentage}%`, backgroundColor: departmentHexColors[dept] }}
                                        ></div>
                                        <span className={`text-2xl font-black text-slate-800 dark:text-white relative z-10`} style={{ color: count > 0 ? departmentHexColors[dept] : undefined }}>
                                            {count}
                                        </span>
                                    </div>
                                    <svg className="absolute inset-0 w-full h-full -rotate-90 opacity-20">
                                        <circle cx="48" cy="48" r="46" fill="transparent" stroke={departmentHexColors[dept]} strokeWidth="4" strokeDasharray={`${percentage * 2.89} 289`} />
                                    </svg>
                                </div>
                                <p className="text-[10px] font-black text-slate-400 group-hover/dept:text-slate-800 dark:group-hover/dept:text-white uppercase tracking-widest transition-colors">{capitalize(dept)}</p>
                                <p className="text-[9px] font-bold text-slate-300 mt-1 uppercase tracking-tighter">{percentage.toFixed(1)}% Ratio</p>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default StaffList;
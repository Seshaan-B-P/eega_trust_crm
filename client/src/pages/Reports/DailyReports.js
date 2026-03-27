import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
    FiFileText, FiSearch, FiPlus, FiEye,
    FiFilter, FiDownload, FiRefreshCw, FiAlertCircle,
    FiCalendar, FiUser, FiActivity, FiTrash2, FiChevronRight, FiClock, FiHeart, FiZap
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';

const DailyReports = () => {
    const { user } = useAuth();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        todayReports: 0,
        attentionNeeded: 0,
        healthStats: []
    });
    const [filters, setFilters] = useState({
        search: '',
        residentType: '',
        child: '',
        elderly: '',
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
        excellent: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
        good: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
        fair: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
        poor: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
    };

    const behaviorColors = {
        excellent: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
        good: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
        average: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
        needs_attention: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
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
            toast.error('Could not get reports');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        toast((t) => (
            <div className="flex flex-col gap-4">
                <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Delete this report?</p>
                <div className="flex gap-2">
                    <button onClick={async () => {
                        toast.dismiss(t.id);
                        try {
                            await api.delete(`/reports/${id}`);
                            toast.success('Report deleted');
                            fetchReports();
                        } catch (error) {
                            toast.error('Could not delete');
                        }
                    }} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Confirm</button>
                    <button onClick={() => toast.dismiss(t.id)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
                </div>
            </div>
        ));
    };

    useEffect(() => {
        fetchReports();
    }, [filters, pagination.page]);

    const handleExport = async () => {
        try {
            toast.loading('Creating file...', { id: 'export' });
            const params = new URLSearchParams({
                limit: 0,
                ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== ''))
            }).toString();

            const response = await api.get(`/reports?${params}`);
            const reportsData = response.data.data || [];

            const exportData = reportsData.map(report => ({
                'Date': new Date(report.date).toLocaleDateString(),
                'Resident Type': report.child ? 'Child' : 'Elderly',
                'Resident Name': report.child?.name || report.elderly?.name || 'Unknown',
                'Resident ID': report.child?.childId || report.elderly?.elderlyId || 'N/A',
                'Health Status': report.healthStatus?.overall || 'N/A',
                'Temperature': report.healthStatus?.temperature ? `${report.healthStatus.temperature}°C` : 'N/A',
                'Symptoms': report.healthStatus?.symptoms?.join(', ') || 'None',
                'Behavior': report.behavior?.replace('_', ' ') || 'N/A',
                'Needs Attention': report.needsAttention ? 'Yes' : 'No',
                'Staff Name': report.staff?.name || 'Unknown'
            }));

            const dateStr = new Date().toISOString().split('T')[0];
            const fileName = `Daily_Reports_${dateStr}`;

            const module = await import('../../utils/exportUtils');
            module.exportToExcel(exportData, fileName, 'Reports');
            toast.success('File saved', { id: 'export' });
        } catch (error) {
            toast.error('Could not save file', { id: 'export' });
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
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
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="space-y-2">
                    <motion.div variants={itemVariants} className="flex items-center space-x-2 text-primary-600 font-bold uppercase tracking-[0.2em] text-[10px]">
                         <span className="w-8 h-px bg-primary-600"></span>
                         <span>Daily Reports</span>
                    </motion.div>
                    <motion.h1 variants={itemVariants} className="text-5xl font-black text-slate-800 dark:text-white tracking-tight">
                        Daily <span className="text-primary-600">Reports</span>
                    </motion.h1>
                    <motion.p variants={itemVariants} className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl">
                        View health and behavior records for everyone.
                    </motion.p>
                </div>
                
                <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3">
                    <button onClick={fetchReports} className="p-4 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
                        <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={handleExport} className="flex items-center gap-2 px-6 py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl border border-slate-200 dark:border-slate-700 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
                        <FiDownload /> Export Reports
                    </button>
                    <Link to="/reports/add" className="flex items-center gap-2 px-8 py-4 bg-primary-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary-500/25 hover:bg-primary-700 transition-all hover:-translate-y-1 active:scale-95">
                        <FiPlus className="stroke-[3px]" /> New Report
                    </Link>
                </motion.div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Reports Today", value: stats.todayReports || 0, icon: <FiFileText />, color: "bg-blue-600" },
                    { label: "Alerts", value: stats.attentionNeeded || 0, icon: <FiAlertCircle />, color: "bg-rose-600" },
                    { label: "Total Reports", value: pagination.total || 0, icon: <FiActivity />, color: "bg-slate-900" },
                    { label: "Overall Health", value: "98.4%", icon: <FiHeart />, color: "bg-emerald-600" }
                ].map((stat, i) => (
                    <motion.div 
                        key={i}
                        variants={itemVariants}
                        className="card !rounded-[2.5rem] p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group"
                    >
                        <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform ${stat.color.replace('bg-', 'text-')}`}>
                            {React.cloneElement(stat.icon, { size: 80 })}
                        </div>
                        <div className="relative z-10 flex flex-col h-full">
                            <div className={`w-12 h-12 rounded-2xl ${stat.color} text-white flex items-center justify-center mb-6 shadow-lg shadow-${stat.color.split('-')[1]}-500/20`}>
                                {stat.icon}
                            </div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{stat.label}</h3>
                            <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Filters Partition */}
            <motion.div variants={itemVariants} className="card !rounded-[3rem] p-10 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="flex flex-col lg:flex-row items-center gap-8">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 w-full">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Start Date</label>
                            <input type="date" value={filters.startDate} onChange={(e) => setFilters({...filters, startDate: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 focus:ring-4 focus:ring-primary-500/10" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">End Date</label>
                            <input type="date" value={filters.endDate} onChange={(e) => setFilters({...filters, endDate: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 focus:ring-4 focus:ring-primary-500/10" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Resident Type</label>
                            <select value={filters.residentType} onChange={(e) => setFilters({...filters, residentType: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat focus:ring-4 focus:ring-primary-500/10 transition-all">
                                <option value="">All</option>
                                <option value="child">Children</option>
                                <option value="elderly">Seniors</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Health Status</label>
                            <select value={filters.healthStatus} onChange={(e) => setFilters({...filters, healthStatus: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat focus:ring-4 focus:ring-primary-500/10 transition-all">
                                <option value="">All Health</option>
                                <option value="excellent">Very Good</option>
                                <option value="good">Good</option>
                                <option value="fair">Fair</option>
                                <option value="poor">Needs Help</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Alerts</label>
                            <select value={filters.needsAttention} onChange={(e) => setFilters({...filters, needsAttention: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat focus:ring-4 focus:ring-primary-500/10 transition-all">
                                <option value="">All Alerts</option>
                                <option value="true">Only Alerts</option>
                                <option value="false">No Alerts</option>
                            </select>
                        </div>
                    </div>
                    <button onClick={() => setFilters({ residentType: '', startDate: '', endDate: '', needsAttention: '', healthStatus: '' })} className="p-4 bg-white dark:bg-slate-900 text-rose-600 rounded-2xl border border-rose-100 dark:border-rose-900/30 font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 transition-all active:scale-95 shadow-sm whitespace-nowrap">
                        Clear Filters
                    </button>
                </div>
            </motion.div>

            {/* Main Log Registry */}
            <motion.div variants={itemVariants} className="card !rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-xl shadow-slate-200/20 overflow-hidden relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
                        <LoadingSpinner size="lg" color="primary" message="Loading..." />
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                {["Date", "Name", "Health", "Behavior", "Staff Helper", "Alert Status", "Action"].map((h, i) => (
                                    <th key={i} className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                            {reports.map((report) => (
                                <motion.tr 
                                    layout
                                    key={report._id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500">
                                                <FiCalendar size={14} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-tighter">
                                                    {new Date(report.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </p>
                                                <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">Report Date</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`h-10 w-10 rounded-2xl flex items-center justify-center font-black text-xs shadow-inner ${report.child ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300'}`}>
                                                {(report.child?.name || report.elderly?.name)?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">{report.child?.name || report.elderly?.name}</p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${report.child ? 'bg-indigo-500' : 'bg-amber-500'}`}></span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{report.child ? 'Child' : 'Senior'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-2">
                                            <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-center ${healthStatusColors[report.healthStatus?.overall] || 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                                {report.healthStatus?.overall || 'PENDING'}
                                            </span>
                                            {report.healthStatus?.temperature && (
                                                <div className="flex items-center gap-2 group-hover:scale-105 transition-transform origin-left">
                                                    <FiZap className={report.healthStatus.temperature >= 37.5 ? 'text-rose-500' : 'text-emerald-500'} size={12} />
                                                    <span className={`text-[11px] font-black ${report.healthStatus.temperature >= 38 ? 'text-rose-600' : 'text-emerald-600'}`}>{report.healthStatus.temperature}°C</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-2">
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${behaviorColors[report.behavior] || 'bg-slate-100 text-slate-400'}`}>
                                                {report.behavior?.replace('_', ' ') || 'UNTRACKED'}
                                            </span>
                                            {report.activities && report.activities.length > 0 && (
                                                <p className="text-[10px] text-slate-500 font-bold truncate max-w-[150px]">
                                                    {report.activities[0]?.activity}
                                                    {report.activities.length > 1 && <span className="text-primary-600 ml-1">+{report.activities.length - 1} Unit(s)</span>}
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                         <div className="flex items-center gap-3">
                                             <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500">
                                                 {report.staff?.name?.charAt(0) || 'S'}
                                             </div>
                                             <div>
                                                 <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-tighter">{report.staff?.name || 'Unknown'}</p>
                                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Staff Name</p>
                                             </div>
                                         </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        {report.needsAttention ? (
                                            <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl text-rose-600 animate-pulse">
                                                <FiAlertCircle size={14} className="stroke-[3px]" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">Action Required</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl text-emerald-600/80">
                                                <span className="text-[9px] font-black uppercase tracking-widest">Normal Parameters</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-8 py-6 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link to={`/reports/${report._id}`} className="p-3 bg-white dark:bg-slate-800 text-primary-600 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 hover:scale-110 active:scale-95 transition-all">
                                                <FiEye size={16} className="stroke-[2.5px]" />
                                            </Link>
                                            {user?.role === 'admin' && (
                                                <button onClick={() => handleDelete(report._id)} className="p-3 bg-white dark:bg-slate-800 text-rose-600 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 hover:scale-110 active:scale-95 transition-all">
                                                    <FiTrash2 size={16} className="stroke-[2.5px]" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {reports.length === 0 && !loading && (
                    <div className="py-24 text-center">
                        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-slate-300">
                             <FiFileText size={48} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">No reports found</h3>
                        <p className="text-slate-500 text-sm mt-2 max-w-xs mx-auto font-medium">We could not find any reports with these filters.</p>
                        <button onClick={fetchReports} className="mt-8 text-primary-600 font-black text-[10px] uppercase tracking-[0.2em] border-b-2 border-primary-600 pb-1">Show All</button>
                    </div>
                )}

                {/* Integration with Pagination */}
                <div className="px-8 py-6 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Showing: <span className="text-slate-800 dark:text-white">{reports.length} of {pagination.total} Reports</span>
                    </p>
                    <div className="flex items-center gap-3">
                        <button 
                            disabled={pagination.page === 1}
                            onClick={() => setPagination({...pagination, page: pagination.page - 1})}
                            className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] disabled:opacity-30 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                        >
                            Previous
                        </button>
                        <div className="px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black text-primary-600 uppercase tracking-[0.2em] shadow-sm">
                            Page {pagination.page} of {pagination.totalPages}
                        </div>
                        <button 
                            disabled={pagination.page >= pagination.totalPages}
                            onClick={() => setPagination({...pagination, page: pagination.page + 1})}
                            className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] disabled:opacity-30 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Diagnostic Distribution Matrix */}
            <AnimatePresence>
                {stats.healthStats && stats.healthStats.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        variants={itemVariants}
                        className="card !rounded-[3rem] p-10 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/20"
                    >
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Health Summary</h3>
                                <p className="text-slate-500 font-medium text-sm mt-1">A summary of health for everyone.</p>
                            </div>
                            <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                                <FiActivity />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {stats.healthStats.map((stat, i) => {
                                const percentage = ((stat.count / pagination.total) * 100).toFixed(1);
                                const hColors = {
                                    excellent: "from-emerald-500 to-teal-600 shadow-emerald-500/20",
                                    good: "from-blue-500 to-indigo-600 shadow-blue-500/20",
                                    fair: "from-amber-500 to-orange-600 shadow-amber-500/20",
                                    poor: "from-rose-500 to-red-600 shadow-rose-500/20"
                                };
                                const colorClass = hColors[stat._id] || "from-slate-400 to-slate-500 shadow-slate-500/20";
                                
                                return (
                                    <div key={i} className="relative group">
                                        <div className="flex justify-between items-end mb-4">
                                            <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${healthStatusColors[stat._id] || 'bg-slate-100 text-slate-400'}`}>
                                                {stat._id || 'INDETERMINATE'}
                                            </span>
                                            <span className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">{stat.count}</span>
                                        </div>
                                        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner flex">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percentage}%` }}
                                                transition={{ duration: 1, delay: i * 0.1 }}
                                                className={`h-full rounded-full bg-gradient-to-r ${colorClass} shadow-lg`}
                                            />
                                        </div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-4 flex items-center justify-between">
                                            <span>Group Size</span>
                                            <span className="text-slate-600 dark:text-slate-300">{percentage}% of all</span>
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default DailyReports;
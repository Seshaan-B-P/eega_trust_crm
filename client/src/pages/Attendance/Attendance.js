import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
    FiCheckCircle, FiXCircle, FiClock, FiSearch, 
    FiCalendar, FiUsers, FiBarChart2, FiActivity, FiRefreshCw, FiPlus,
    FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';

const Attendance = () => {
    const navigate = useNavigate();
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        present: 0,
        absent: 0,
        leave: 0,
        total: 0,
        percentage: 0
    });
    const [filters, setFilters] = useState({
        date: new Date().toISOString().split('T')[0],
        startDate: '',
        endDate: '',
        residentType: 'staff', // staff, children, elderly
        status: '',
        staff: ''
    });
    const [staffList, setStaffList] = useState([]);

    const handlePrevDay = () => {
        const current = new Date(filters.date);
        current.setDate(current.getDate() - 1);
        setFilters({ ...filters, date: current.toISOString().split('T')[0], startDate: '', endDate: '' });
    };

    const handleNextDay = () => {
        const current = new Date(filters.date);
        current.setDate(current.getDate() + 1);
        setFilters({ ...filters, date: current.toISOString().split('T')[0], startDate: '', endDate: '' });
    };

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            const endpoint = filters.residentType === 'staff' ? '/staff-attendance' : '/attendance';
            const params = new URLSearchParams(filters).toString();
            const response = await api.get(`${endpoint}?${params}`);
            setAttendance(response.data.data || []);
            
            // Handle different stats structures
            if (response.data.stats) {
                const s = response.data.stats;
                setStats({
                    present: s.distribution?.find(x => x._id === 'present')?.count || s.present || 0,
                    absent: s.distribution?.find(x => x._id === 'absent')?.count || s.absent || 0,
                    leave: s.distribution?.find(x => x._id === 'leave' || x._id === 'sick')?.count || s.leave || 0,
                    total: s.total || 0,
                    percentage: s.percentage || 0
                });
            }
        } catch (error) {
            toast.error('Error fetching attendance');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStaff = async () => {
        try {
            const response = await api.get('/staff');
            setStaffList(response.data.data || []);
        } catch (error) {
            console.error('Error fetching staff:', error);
        }
    };

    useEffect(() => {
        if (filters.residentType === 'staff') {
            fetchStaff();
        }
    }, [filters.residentType]);

    useEffect(() => {
        fetchAttendance();
    }, [filters]);

    const handleStatusChange = async (id, newStatus) => {
        try {
            const endpoint = filters.residentType === 'staff' ? '/staff-attendance' : '/attendance';
            await api.put(`${endpoint}/${id}`, { status: newStatus });
            toast.success('Status updated');
            fetchAttendance();
        } catch (error) {
            toast.error('Error updating status');
        }
    };

    const getDisplayName = (record) => {
        if (record.child?.name) return record.child.name;
        if (record.elderly?.name) return record.elderly.name;
        if (record.staff?.name) return record.staff.name;
        return record.name || 'Unknown';
    };

    const getDisplayRole = (record) => {
        if (record.child) return 'Child';
        if (record.elderly) return 'Elderly';
        if (record.staffProfile) {
            const designation = record.staffProfile.designation || 'Staff';
            const department = record.staffProfile.department ? ` • ${record.staffProfile.department}` : '';
            return `${designation}${department}`;
        }
        return record.role || filters.residentType;
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
                     <span>Attendance</span>
                </motion.div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <motion.h1 variants={itemVariants} className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">
                            Attendance List
                        </motion.h1>
                        <motion.p variants={itemVariants} className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
                            Manage daily check-ins and presence reports.
                        </motion.p>
                    </div>
                    
                    <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={fetchAttendance}
                            className="p-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-primary-600 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95"
                            title="Refresh"
                        >
                            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button
                            onClick={() => navigate(filters.residentType === 'staff' ? '/attendance/staff/report' : '/attendance/report')}
                            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl border border-slate-200 dark:border-slate-700 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                        >
                            <FiBarChart2 /> Reports
                        </button>
                        <button
                            onClick={() => navigate(filters.residentType === 'staff' ? '/attendance/staff/mark' : '/attendance/mark')}
                            className="flex items-center gap-2 px-8 py-3 bg-primary-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary-500/25 hover:bg-primary-700 transition-all hover:-translate-y-1 active:scale-95"
                        >
                            <FiPlus className="stroke-[3px]" /> Mark Attendance
                        </button>
                    </motion.div>
                </div>
            </header>

            {/* Quick Stats Grid */}
            <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Attendance %', value: `${stats.percentage}%`, icon: <FiActivity />, color: 'from-blue-600 to-indigo-700', shadow: 'shadow-blue-500/20' },
                    { label: 'Total People', value: stats.total, icon: <FiUsers />, color: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/20' },
                    { label: 'Absent Today', value: stats.absent, icon: <FiXCircle />, color: 'from-rose-500 to-red-600', shadow: 'shadow-rose-500/20' },
                    { label: 'Sick/Leave', value: stats.leave, icon: <FiBarChart2 />, color: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/20' },
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
                        <div className="flex-1 flex items-center gap-2">
                            <button
                                onClick={handlePrevDay}
                                className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.25rem] hover:text-primary-600 transition-all shadow-sm active:scale-95"
                                title="Previous Day"
                            >
                                <FiChevronLeft />
                            </button>
                            <div className="flex-1 relative group">
                                <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                                <input
                                    type="date"
                                    value={filters.date}
                                    onChange={(e) => setFilters({ ...filters, date: e.target.value, startDate: '', endDate: '' })}
                                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.25rem] focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all font-medium text-slate-800 dark:text-white shadow-sm"
                                />
                            </div>
                            <button
                                onClick={handleNextDay}
                                className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.25rem] hover:text-primary-600 transition-all shadow-sm active:scale-95"
                                title="Next Day"
                            >
                                <FiChevronRight />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <select
                                value={filters.residentType}
                                onChange={(e) => setFilters({ ...filters, residentType: e.target.value })}
                                className="px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.25rem] focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all font-bold text-xs uppercase tracking-widest text-slate-600 dark:text-slate-300 shadow-sm cursor-pointer"
                            >
                                <option value="staff">Staff Members</option>
                            </select>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                className="px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.25rem] focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all font-bold text-xs uppercase tracking-widest text-slate-600 dark:text-slate-300 shadow-sm cursor-pointer"
                            >
                                <option value="">All Status</option>
                                <option value="present">Present</option>
                                <option value="absent">Absent</option>
                                <option value="leave">On Leave</option>
                            </select>
                            
                            {filters.residentType === 'staff' && (
                                <select
                                    value={filters.staff}
                                    onChange={(e) => setFilters({ ...filters, staff: e.target.value })}
                                    className="px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.25rem] focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all font-bold text-xs uppercase tracking-widest text-slate-600 dark:text-slate-300 shadow-sm cursor-pointer"
                                >
                                    <option value="">All Staff</option>
                                    {staffList.map(s => (
                                        <option key={s._id} value={s.user?._id || s._id}>{s.name || s.user?.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>
                    
                    {filters.residentType === 'staff' && (
                        <div className="flex flex-col lg:flex-row gap-4 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex-1 relative group">
                                <label className="absolute -top-2 left-4 px-1 bg-white dark:bg-slate-900 text-[8px] font-black uppercase tracking-widest text-slate-400">Start Date</label>
                                <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                                <input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value, date: '' })}
                                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.25rem] focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all font-medium text-slate-800 dark:text-white shadow-sm"
                                />
                            </div>
                            <div className="flex-1 relative group">
                                <label className="absolute -top-2 left-4 px-1 bg-white dark:bg-slate-900 text-[8px] font-black uppercase tracking-widest text-slate-400">End Date</label>
                                <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                                <input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value, date: '' })}
                                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.25rem] focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all font-medium text-slate-800 dark:text-white shadow-sm"
                                />
                            </div>
                            <button 
                                onClick={() => setFilters({ ...filters, startDate: '', endDate: '', date: new Date().toISOString().split('T')[0] })}
                                className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-primary-600 hover:text-primary-700 transition-colors"
                            >
                                Reset Dates
                            </button>
                        </div>
                    )}
                </div>

                {/* Table Section */}
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="py-24"><LoadingSpinner message="Loading attendance records..." /></div>
                    ) : attendance.length === 0 ? (
                        <div className="p-24 text-center">
                            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <FiActivity className="h-10 w-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">No Records Found</h3>
                            <p className="text-slate-500 mt-2 max-w-sm mx-auto font-medium">No check-in data identified for this selection.</p>
                        </div>
                    ) : (
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-8 py-6 text-left">Identity</th>
                                    <th className="px-8 py-6 text-left">Check-In</th>
                                    <th className="px-8 py-6 text-left">Status</th>
                                    <th className="px-8 py-6 text-left">Details</th>
                                    <th className="px-8 py-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                <AnimatePresence mode="popLayout">
                                    {attendance.map((record) => (
                                        <motion.tr 
                                            key={record._id}
                                            layout
                                            onClick={() => navigate(`/attendance/${record._id}?type=${filters.residentType}`)}
                                            className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all duration-200 border-b border-slate-100 dark:border-slate-800 last:border-0"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center space-x-3">
                                                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-xs font-black text-slate-400 border border-white dark:border-slate-700 shadow-sm">
                                                        {getDisplayName(record).charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{getDisplayName(record)}</p>
                                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">{getDisplayRole(record)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center text-xs font-bold text-slate-600 dark:text-slate-300">
                                                    <FiClock className="mr-2 text-slate-400" />
                                                    {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`inline-flex px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                                    record.status === 'present' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                                    record.status === 'absent' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' :
                                                    'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                                }`}>
                                                    {record.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium max-w-[150px] truncate">
                                                    {record.remarks || (record.checkOutTime ? `Out: ${new Date(record.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'No remarks')}
                                                </p>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleStatusChange(record._id, 'present')}
                                                        className={`p-2.5 rounded-xl transition-all shadow-sm ${record.status === 'present' ? 'bg-emerald-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-emerald-600 hover:bg-emerald-50'}`}
                                                        title="Mark Present"
                                                    >
                                                        <FiCheckCircle className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusChange(record._id, 'absent')}
                                                        className={`p-2.5 rounded-xl transition-all shadow-sm ${record.status === 'absent' ? 'bg-rose-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-rose-600 hover:bg-rose-50'}`}
                                                        title="Mark Absent"
                                                    >
                                                        <FiXCircle className="w-4 h-4" />
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

                {/* Footer Meta */}
                <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                            Showing <span className="text-slate-800 dark:text-white font-black">{attendance.length}</span> Records
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Attendance Breakdown Section */}
            <motion.div variants={itemVariants} className="card !rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="flex items-center space-x-3 mb-8">
                    <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-2xl text-primary-600 group-hover:scale-110 transition-transform">
                        <FiBarChart2 />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Attendance Breakdown</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { label: 'Present', value: stats.present, color: 'bg-emerald-500', percentage: (stats.present / stats.total) * 100 },
                        { label: 'Absent', value: stats.absent, color: 'bg-rose-500', percentage: (stats.absent / stats.total) * 100 },
                        { label: 'On Leave', value: stats.leave, color: 'bg-amber-500', percentage: (stats.leave / stats.total) * 100 },
                    ].map((item, idx) => (
                        <div key={idx} className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{item.label}</span>
                                <span className="text-xs font-black text-slate-700 dark:text-slate-200">{item.value}</span>
                            </div>
                            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${item.percentage || 0}%` }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                    className={`h-full ${item.color} rounded-full`}
                                ></motion.div>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Attendance;
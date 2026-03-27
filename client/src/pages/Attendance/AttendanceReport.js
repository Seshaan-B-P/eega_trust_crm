import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
    FiBarChart2, FiCalendar, FiDownload, FiChevronLeft,
    FiFileText, FiCheckCircle, FiActivity, FiUsers
} from 'react-icons/fi';
import api from '../../utils/api';
import { exportToExcel } from '../../utils/exportUtils';
import LoadingSpinner from '../../components/LoadingSpinner';
import { motion } from 'framer-motion';

const AttendanceReport = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [filters, setFilters] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        residentType: 'all'
    });

    const months = [
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' }
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    const handleGenerate = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/attendance/report/monthly?month=${filters.month}&year=${filters.year}`);
            let data = response.data.data;
            
            if (filters.residentType !== 'all') {
                data.reports = data.reports.filter(r => r.type === filters.residentType);
                // Recalculate average for filtered data
                if (data.reports.length > 0) {
                    const totalPct = data.reports.reduce((acc, current) => acc + parseFloat(current.attendance.percentage), 0);
                    data.overall.averagePercentage = totalPct / data.reports.length;
                } else {
                    data.overall.averagePercentage = 0;
                }
            }
            
            setReportData(data);
            toast.success('Report generated successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error generating report');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (!reportData) return;

        const flattenedData = reportData.reports.map(item => ({
            'Type': item.type === 'child' ? 'Child' : 'Elderly',
            'Name': item.resident.name,
            'Resident ID': item.resident.id,
            'Present': item.attendance.present,
            'Absent': item.attendance.absent,
            'Sick': item.attendance.sick,
            'Leave': item.attendance.leave,
            'Half Day': item.attendance.halfDay,
            'Total Days': item.attendance.total,
            'Percentage': `${item.attendance.percentage}%`
        }));

        const monthLabel = months.find(m => m.value === filters.month)?.label;
        const fileName = `Attendance_Report_${monthLabel}_${filters.year}`;
        
        exportToExcel(flattenedData, fileName, 'Attendance');
        toast.success(`${fileName} downloaded`);
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="p-8 max-w-6xl mx-auto space-y-8"
        >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate('/attendance')}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500"
                    >
                        <FiChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Attendance Reports</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Generate and download monthly attendance summaries.</p>
                    </div>
                </div>
                <div className="p-3 bg-primary-100 dark:bg-primary-900/40 rounded-2xl text-primary-600">
                    <FiBarChart2 size={32} />
                </div>
            </div>

            {/* Selection Card */}
            <div className="card !rounded-[2.5rem] p-10 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/20">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center">
                            <FiCalendar className="mr-2" /> Select Month
                        </label>
                        <select
                            value={filters.month}
                            onChange={(e) => setFilters({ ...filters, month: parseInt(e.target.value) })}
                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-primary-500/10 transition-all cursor-pointer"
                        >
                            {months.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center">
                            <FiCalendar className="mr-2" /> Select Year
                        </label>
                        <select
                            value={filters.year}
                            onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })}
                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-primary-500/10 transition-all cursor-pointer"
                        >
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center">
                            <FiUsers className="mr-2" /> Resident Type
                        </label>
                        <select
                            value={filters.residentType}
                            onChange={(e) => setFilters({ ...filters, residentType: e.target.value })}
                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-primary-500/10 transition-all cursor-pointer"
                        >
                            <option value="all">All Residents</option>
                            <option value="child">Children Only</option>
                            <option value="elderly">Seniors Only</option>
                        </select>
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="w-full px-8 py-4 bg-primary-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary-500/25 hover:bg-primary-700 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 group"
                    >
                        {loading ? <LoadingSpinner size="sm" color="white" /> : (
                            <>
                                <FiActivity className="group-hover:rotate-12 transition-transform" /> 
                                Generate Report
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Results Section */}
            {loading ? (
                <div className="py-20 text-center">
                    <LoadingSpinner message="Calculating statistics..." />
                </div>
            ) : reportData ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                    {/* Stats Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="card !rounded-3xl p-8 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 flex items-center space-x-5">
                            <div className="h-14 w-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                <FiCheckCircle size={24} />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-[0.2em]">Avg. Attendance</h3>
                                <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">{reportData.overall.averagePercentage.toFixed(1)}%</p>
                            </div>
                        </div>
                        <div className="card !rounded-3xl p-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 flex items-center space-x-5">
                            <div className="h-14 w-14 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                                <FiUsers size={24} />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-[0.2em]">Total Records</h3>
                                <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">{reportData.reports.length}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleExport}
                            className="card !rounded-3xl p-8 bg-slate-900 text-white flex items-center space-x-5 hover:bg-slate-800 transition-all group scale-100 active:scale-95 shadow-xl shadow-slate-900/20"
                        >
                            <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                <FiDownload size={24} />
                            </div>
                            <div className="text-left">
                                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Download Data</h3>
                                <p className="text-2xl font-black tracking-tighter">Excel Export</p>
                            </div>
                        </button>
                    </div>

                    {/* Table Preview */}
                    <div className="card !rounded-[2.5rem] bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 overflow-hidden shadow-sm">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between">
                            <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center">
                                <FiFileText className="mr-3 text-primary-500" /> Report Preview
                            </h2>
                            <span className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                {months.find(m => m.value === filters.month)?.label} {filters.year}
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-900/50">
                                        <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Name</th>
                                        <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Present</th>
                                        <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Absent</th>
                                        <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Rate</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
                                    {reportData.reports.slice(0, 10).map((r, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                                            <td className="px-8 py-5">
                                                <div>
                                                    <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{r.resident.name}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${r.type === 'child' ? 'bg-indigo-500' : 'bg-amber-500'}`}></span>
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{r.type === 'child' ? 'Child' : 'Senior'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-center font-bold text-emerald-600">{r.attendance.present}</td>
                                            <td className="px-8 py-5 text-center font-bold text-rose-600">{r.attendance.absent}</td>
                                            <td className="px-8 py-5 text-center">
                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${parseFloat(r.attendance.percentage) >= 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {r.attendance.percentage}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {reportData.reports.length > 10 && (
                            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 text-center">
                                <p className="text-xs font-medium text-slate-500 italic">Showing top 10 results. Download the Excel file to view all {reportData.reports.length} records.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="py-24 text-center">
                    <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-slate-300">
                         <FiBarChart2 size={48} />
                    </div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">No report generated yet</h2>
                    <p className="text-slate-500 text-sm mt-3 max-w-xs mx-auto font-medium">Select a month and year above to generate the attendance summary.</p>
                </div>
            )}
        </motion.div>
    );
};

export default AttendanceReport;

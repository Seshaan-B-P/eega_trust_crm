import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    FiChevronLeft, FiCalendar, FiUser, FiActivity, 
    FiHeart, FiAlertCircle, FiClock, FiShield, 
    FiFileText, FiPrinter, FiEdit3, FiTrash2, FiZap
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

const ReportDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchReport = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/reports/${id}`);
            setReport(response.data.data);
        } catch (error) {
            toast.error('Diagnostic retrieval failure');
            navigate('/reports');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReport(); }, [id]);

    const handleDelete = async () => {
        toast((t) => (
            <div className="flex flex-col gap-4">
                <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Purge report record?</p>
                <div className="flex gap-2">
                    <button onClick={async () => {
                        toast.dismiss(t.id);
                        try {
                            await api.delete(`/reports/${id}`);
                            toast.success('Record purged');
                            navigate('/reports');
                        } catch (error) {
                            toast.error('Purge failure');
                        }
                    }} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Confirm</button>
                    <button onClick={() => toast.dismiss(t.id)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest">Abort</button>
                </div>
            </div>
        ));
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900"><LoadingSpinner message="Reconstructing audit matrix..." /></div>;
    if (!report) return null;

    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

    const HealthBadge = ({ status }) => {
        const colors = {
            excellent: 'bg-emerald-500 shadow-emerald-500/20 text-white',
            good: 'bg-blue-600 shadow-blue-500/20 text-white',
            fair: 'bg-amber-500 shadow-amber-500/20 text-white',
            poor: 'bg-rose-600 shadow-rose-500/20 text-white'
        };
        return (
            <span className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg ${colors[status] || 'bg-slate-500 text-white'}`}>
                {status || 'Unknown'}
            </span>
        );
    };

    return (
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="p-8 space-y-10 min-h-screen">
            {/* Header section */}
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="space-y-2">
                    <button onClick={() => navigate('/reports')} className="group flex items-center space-x-2 text-primary-600 font-bold uppercase tracking-[0.2em] text-[10px] mb-4">
                        <FiChevronLeft className="group-hover:-translate-x-1 transition-transform stroke-[3px]" />
                        <span>Registry Return</span>
                    </button>
                    <motion.h1 variants={itemVariants} className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">
                        Audit <span className="text-primary-600">Details</span>
                    </motion.h1>
                    <motion.div variants={itemVariants} className="flex items-center gap-3 text-slate-500 font-bold uppercase tracking-widest text-[11px]">
                        <FiFileText /> 
                        <span>Entry ID: {report._id.substring(0, 8)}...</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                        <FiCalendar />
                        <span>{new Date(report.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                    </motion.div>
                </div>

                <motion.div variants={itemVariants} className="flex gap-3">
                    <button onClick={() => window.print()} className="p-4 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
                        <FiPrinter />
                    </button>
                    {user?.role === 'admin' && (
                        <button onClick={handleDelete} className="p-4 bg-white dark:bg-slate-800 text-rose-600 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-rose-50 transition-all active:scale-95 shadow-sm">
                            <FiTrash2 />
                        </button>
                    )}
                </motion.div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Information matrix */}
                <main className="lg:col-span-8 space-y-8">
                    {/* Subject Bio-Identity */}
                    <motion.section variants={itemVariants} className="card !rounded-[3rem] p-10 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden relative group">
                         <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform"><FiUser size={150} /></div>
                         <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                             <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-primary-600 to-indigo-700 p-1 shadow-2xl shadow-primary-500/20">
                                 <div className="w-full h-full rounded-[2rem] bg-white dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                                     {(report.child?.photo || report.elderly?.photo) ? (
                                         <img src={report.child?.photo || report.elderly?.photo} alt="P" className="w-full h-full object-cover" />
                                     ) : (
                                         <span className="text-4xl font-black text-primary-600">{(report.child?.name || report.elderly?.name)?.charAt(0)}</span>
                                     )}
                                 </div>
                             </div>
                             <div className="flex-1 text-center md:text-left space-y-4">
                                 <div>
                                     <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{report.child?.name || report.elderly?.name}</h2>
                                     <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.3em] mt-1">{report.child ? 'PEDIATRIC' : 'GERIATRIC'} SUBJECT</p>
                                 </div>
                                 <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                     <div className="px-6 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Temporal Age</p>
                                         <p className="text-sm font-black text-slate-800 dark:text-white">{report.child?.age || report.elderly?.age} Units</p>
                                     </div>
                                     <div className="px-6 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Biological Class</p>
                                         <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tighter">{report.child?.gender || report.elderly?.gender}</p>
                                     </div>
                                 </div>
                             </div>
                         </div>
                    </motion.section>

                    {/* Diagnostic Matrix */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <motion.section variants={itemVariants} className="card !rounded-[3rem] p-10 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                <FiActivity /> HEALTH DIAGNOSTIC
                            </h3>
                            <div className="flex flex-col items-center justify-center py-6 gap-6">
                                <HealthBadge status={report.healthStatus?.overall} />
                                <div className="text-center">
                                    <p className="text-5xl font-black text-slate-800 dark:text-white tracking-tighter">{report.healthStatus?.temperature || '--'}°C</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Thermal Index</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">SYMPTOMATIC TRACE</p>
                                    <div className="flex flex-wrap gap-2">
                                        {report.healthStatus?.symptoms?.length > 0 ? report.healthStatus.symptoms.map((s, i) => (
                                            <span key={i} className="px-3 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-rose-100 dark:border-rose-900/30">{s}</span>
                                        )) : <span className="text-[10px] font-bold text-slate-400 italic">No symptoms recorded</span>}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">PHARMACOLOGICAL DELIVERY</p>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">{report.healthStatus?.medication || 'No medication administered during cycle.'}</p>
                                </div>
                            </div>
                        </motion.section>

                        <motion.section variants={itemVariants} className="card !rounded-[3rem] p-10 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
                             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                <FiZap /> BEHAVIORAL LOG
                            </h3>
                            <div className="flex flex-col items-center justify-center py-6 gap-6">
                                <div className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg ${report.behavior === 'needs_attention' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'}`}>
                                    {report.behavior?.replace('_', ' ') || 'STANDARD'}
                                </div>
                                <div className="p-8 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800/50 border border-primary-500/10 flex items-center justify-center text-primary-600">
                                    <FiActivity size={40} className="animate-pulse" />
                                </div>
                            </div>
                            <div className="space-y-4 pt-4">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Protocol Integrity</p>
                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                     <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} className="h-full bg-primary-600 rounded-full" />
                                </div>
                            </div>
                        </motion.section>
                    </div>

                    <motion.section variants={itemVariants} className="card !rounded-[3rem] p-10 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            <FiActivity /> ACTIVITY TRACE
                        </h3>
                        <div className="space-y-4">
                            {report.activities?.length > 0 ? report.activities.map((act, i) => (
                                <div key={i} className="flex gap-4 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-primary-600 shadow-sm"><FiClock /></div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">{act.activity}</p>
                                            <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-lg text-[8px] font-black uppercase tracking-widest">{act.duration}</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-500 mt-1">{act.remarks || 'No detailed log available.'}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="py-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2.5rem] text-slate-300 text-[10px] font-black uppercase tracking-widest">Empty Activity Buffer</div>
                            )}
                        </div>
                    </motion.section>
                </main>

                {/* Audit Context (Sidebar) */}
                <aside className="lg:col-span-4 space-y-8">
                    {/* Authorizing Unit */}
                    <motion.div variants={itemVariants} className="card !rounded-[2.5rem] p-8 bg-slate-900 text-white border-transparent shadow-2xl shadow-slate-900/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform"><FiShield size={80} /></div>
                        <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 mb-8">Authorizing Authority</h3>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-xl font-black border border-white/20">
                                {report.staff?.name?.charAt(0)}
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-tight">{report.staff?.name}</p>
                                <p className="text-[9px] font-bold text-primary-400 uppercase tracking-widest mt-1">Authorized Staff Unit</p>
                            </div>
                        </div>
                        <div className="mt-8 space-y-2 pt-6 border-t border-white/10 relative z-10">
                            <p className="flex items-center gap-2 text-[10px] font-bold text-white/60 uppercase tracking-widest"><FiClock /> Cycle End: {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            <p className="flex items-center gap-2 text-[10px] font-bold text-white/60 uppercase tracking-widest"><FiShield /> Encryption: AES-256 Valid</p>
                        </div>
                    </motion.div>

                    {/* Operational Protocols (Sticky) */}
                    <motion.div variants={itemVariants} className="card !rounded-[2.5rem] p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm sticky top-8 space-y-8">
                         <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Nutritional Intake Log</h3>
                         <div className="space-y-4">
                             {[
                                 { phase: 'Morning Range', value: report.morningMeal },
                                 { phase: 'Midday Range', value: report.afternoonMeal },
                                 { phase: 'Evening Range', value: report.eveningMeal }
                             ].map((m, i) => (
                                 <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                                     <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{m.phase}</span>
                                     <span className={`text-[9px] font-black uppercase tracking-widest ${m.value === 'poor' ? 'text-rose-600' : 'text-emerald-600'}`}>{m.value || 'N/A'}</span>
                                 </div>
                             ))}
                         </div>

                         <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Internal Communique</h4>
                             <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 italic">
                                 &ldquo;{report.specialNotes || 'No supplementary intelligence provided for this operational cycle.'}&rdquo;
                             </p>
                         </div>
                    </motion.div>
                </aside>
            </div>
        </motion.div>
    );
};

export default ReportDetails;
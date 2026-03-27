import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import {
    FiUser, FiCalendar, FiActivity, FiHeart,
    FiChevronLeft, FiSave, FiAlertCircle, FiPlus,
    FiTrash2, FiClock, FiSettings, FiCheckCircle, FiZap
} from 'react-icons/fi';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const validationSchema = Yup.object({
    residentType: Yup.string().oneOf(['child', 'elderly']).required('Resident type is mandatory'),
    child: Yup.string().when('residentType', {
        is: 'child',
        then: () => Yup.string().required('Select a child')
    }),
    elderly: Yup.string().when('residentType', {
        is: 'elderly',
        then: () => Yup.string().required('Select a senior')
    }),
    date: Yup.date().required('Date is mandatory').max(new Date(), 'Future dates not allowed'),
    healthStatus: Yup.object({
        overall: Yup.string().required('Health status required'),
        temperature: Yup.number().transform((value, orig) => orig === '' ? undefined : value).min(35).max(42),
        symptoms: Yup.array(),
        medication: Yup.string()
    }),
    behavior: Yup.string().oneOf(['excellent', 'good', 'average', 'needs_attention', null]),
    activities: Yup.array(),
    specialNotes: Yup.string().max(500, 'Too long (max 500 chars)')
});

const AddDailyReport = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const queryParams = new URLSearchParams(location.search);
    const preselectedChildId = queryParams.get('child');

    const [residentType, setResidentType] = useState('child');
    const [residents, setResidents] = useState([]);
    const [selectedResident, setSelectedResident] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetchingResidents, setFetchingResidents] = useState(true);

    useEffect(() => { fetchResidents(); }, [residentType]);

    useEffect(() => {
        if (preselectedChildId && residents.length > 0 && residentType === 'child') {
            const resident = residents.find(r => r._id === preselectedChildId);
            setSelectedResident(resident);
        }
    }, [preselectedChildId, residents, residentType]);

    const fetchResidents = async () => {
        try {
            setFetchingResidents(true);
            const endpoint = residentType === 'child' ? '/children?status=active' : '/elderly?status=Active';
            const response = await api.get(endpoint);
            setResidents(residentType === 'child' ? response.data.children : response.data.elderly || []);
        } catch (error) {
            toast.error(`Could not get: ${residentType}`);
        } finally {
            setFetchingResidents(false);
        }
    };

    const initialValues = {
        residentType: residentType,
        child: residentType === 'child' ? (preselectedChildId || '') : '',
        elderly: residentType === 'elderly' ? (preselectedChildId || '') : '',
        date: new Date().toISOString().split('T')[0],
        healthStatus: { overall: 'good', temperature: '', symptoms: [], medication: '' },
        morningMeal: '', afternoonMeal: '', eveningMeal: '',
        behavior: 'good', activities: [], specialNotes: ''
    };

    const healthOptions = [
        { value: 'excellent', label: 'VERY GOOD', color: 'bg-emerald-500 shadow-emerald-500/20' },
        { value: 'good', label: 'GOOD', color: 'bg-blue-600 shadow-blue-500/20' },
        { value: 'fair', label: 'FAIR', color: 'bg-amber-500 shadow-amber-500/20' },
        { value: 'poor', label: 'NEEDS HELP', color: 'bg-rose-600 shadow-rose-500/20' }
    ];

    const handleSubmit = async (values, { setSubmitting, resetForm }) => {
        try {
            setLoading(true);
            await api.post('/reports', values);
            toast.success('Report saved');
            resetForm();
            navigate('/reports');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Could not save report');
        } finally {
            setSubmitting(false);
            setLoading(false);
        }
    };

    if (fetchingResidents) return <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900"><LoadingSpinner message="Loading..." /></div>;

    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

    return (
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="p-8 space-y-10 min-h-screen">
            {/* Minimal Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="space-y-2">
                    <button onClick={() => navigate('/reports')} className="group flex items-center space-x-2 text-primary-600 font-bold uppercase tracking-[0.2em] text-[10px] mb-4">
                        <FiChevronLeft className="group-hover:-translate-x-1 transition-transform stroke-[3px]" />
                        <span>Back to Reports</span>
                    </button>
                    <motion.h1 variants={itemVariants} className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">
                        New Daily <span className="text-primary-600">Report</span>
                    </motion.h1>
                    <motion.p variants={itemVariants} className="text-slate-500 dark:text-slate-400 font-medium">
                        Create a new health and behavior report.
                    </motion.p>
                </div>
            </header>

            <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit} enableReinitialize>
                {({ isSubmitting, values, setFieldValue }) => (
                    <Form className="grid grid-cols-1 lg:grid-cols-12 gap-10 max-w-7xl mx-auto">
                        
                        {/* Control Panel (Sticky) */}
                        <aside className="lg:col-span-4 space-y-8">
                            <motion.div variants={itemVariants} className="card !rounded-[2.5rem] p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm sticky top-8">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-2">
                                    <FiSettings className="animate-spin-slow" /> Settings
                                </h3>
                                
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Who is this for?</label>
                                        <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-2xl gap-1">
                                            {['child', 'elderly'].map(type => (
                                                <button key={type} type="button" onClick={() => { setResidentType(type); setFieldValue('residentType', type); setFieldValue('child', ''); setFieldValue('elderly', ''); setSelectedResident(null); }} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${residentType === type ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}>
                                                    {type === 'child' ? 'Child' : 'Senior'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Date</label>
                                        <div className="relative group">
                                            <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500" />
                                            <Field name="date" type="date" className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-black text-xs text-slate-700 dark:text-white uppercase tracking-widest transition-all focus:ring-4 focus:ring-primary-500/5" />
                                        </div>
                                        <ErrorMessage name="date" component="p" className="text-[10px] font-bold text-rose-500 ml-1" />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Select Person</label>
                                        <Field as="select" name={residentType === 'child' ? 'child' : 'elderly'} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-black text-xs text-slate-800 dark:text-white uppercase tracking-widest appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat focus:ring-4 focus:ring-primary-500/5" onChange={(e) => { const id = e.target.value; setFieldValue(residentType === 'child' ? 'child' : 'elderly', id); setSelectedResident(residents.find(r => r._id === id)); }}>
                                            <option value="">None</option>
                                            {residents.map(res => <option key={res._id} value={res._id}>{res.name} {res.childId ? `[${res.childId}]` : ''}</option>)}
                                        </Field>
                                        <ErrorMessage name={residentType === 'child' ? 'child' : 'elderly'} component="p" className="text-[10px] font-bold text-rose-500 ml-1" />
                                    </div>
                                </div>

                                {/* Active Subject Profile */}
                                <AnimatePresence>
                                    {selectedResident && (
                                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="mt-8 p-6 rounded-3xl bg-slate-900 text-white relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><FiUser size={100} /></div>
                                            <div className="relative z-10 flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center font-black text-xl border border-white/20">
                                                    {selectedResident.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black uppercase tracking-tighter group-hover:text-primary-400 transition-colors">{selectedResident.name}</p>
                                                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mt-1">Age: {selectedResident.age}</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 space-y-3">
                                    <button type="submit" disabled={isSubmitting || loading} className="w-full py-4 bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary-500/20 hover:bg-primary-700 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3">
                                        {loading ? <LoadingSpinner size="sm" color="white" inline /> : <FiSave className="stroke-[3px]" />} Save Report
                                    </button>
                                    <button type="button" onClick={() => navigate('/reports')} className="w-full py-4 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl font-black text-xs uppercase tracking-[0.2em] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all active:scale-95">Cancel</button>
                                </div>
                            </motion.div>
                        </aside>

                        {/* Analysis Grid */}
                        <main className="lg:col-span-8 space-y-8">
                            
                            {/* Health Diagnostics */}
                            <motion.section variants={itemVariants} className="card !rounded-[3rem] p-10 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-12">
                                <header className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center"><FiHeart size={24} className="stroke-[2.5px]" /></div>
                                        <div>
                                            <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Health Status</h2>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">How is their health today?</p>
                                        </div>
                                    </div>
                                    <FiCheckCircle className="text-emerald-500" />
                                </header>

                                <div className="space-y-10">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {healthOptions.map(opt => (
                                            <label key={opt.value} className={`relative group cursor-pointer h-24 rounded-3xl border-2 transition-all flex flex-col items-center justify-center overflow-hidden ${values.healthStatus.overall === opt.value ? 'bg-slate-900 border-slate-900 shadow-xl scale-[1.05] z-10' : 'bg-slate-50 dark:bg-slate-800/50 border-transparent hover:border-slate-200'}`}>
                                                <Field type="radio" name="healthStatus.overall" value={opt.value} className="hidden" />
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${values.healthStatus.overall === opt.value ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`}>{opt.label}</span>
                                                <div className={`mt-2 w-1.5 h-1.5 rounded-full ${opt.color.replace('shadow-', '')} ${values.healthStatus.overall === opt.value ? 'animate-pulse scale-150' : 'opacity-40'}`} />
                                            </label>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="group space-y-3">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Temperature (°C)</label>
                                            <div className="relative">
                                                <FiActivity className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                                <Field name="healthStatus.temperature" type="number" step="0.1" className="w-full pl-14 pr-4 py-5 bg-slate-50 dark:bg-slate-800 rounded-[2rem] border-transparent focus:ring-4 focus:ring-primary-500/5 font-black text-xl text-slate-800 dark:text-white tracking-tighter" placeholder="36.5" />
                                            </div>
                                        </div>
                                        <div className="group space-y-3">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Medicine Given</label>
                                            <Field name="healthStatus.medication" className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 rounded-[2rem] border-transparent focus:ring-4 focus:ring-primary-500/5 font-bold text-sm text-slate-700 dark:text-white" placeholder="List medicines here..." />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Symptoms</label>
                                        <div className="flex flex-wrap gap-3">
                                            {['Fever', 'Cough', 'Cold', 'Headache', 'Vomiting', 'Rash', 'Fatigue'].map(s => {
                                                const isActive = values.healthStatus.symptoms?.includes(s);
                                                return (
                                                    <button key={s} type="button" onClick={() => { const current = values.healthStatus.symptoms || []; setFieldValue('healthStatus.symptoms', isActive ? current.filter(x => x !== s) : [...current, s]); }} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isActive ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}>
                                                        {s}
                                                    </button>
                                                );
                                            })}
                                            <div className="flex-1 min-w-[200px]">
                                                <input type="text" placeholder="Add other symptom..." className="w-full px-6 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 focus:ring-4 focus:ring-primary-500/5" onKeyDown={(e) => { if(e.key === 'Enter' && e.target.value) { e.preventDefault(); const current = values.healthStatus.symptoms || []; setFieldValue('healthStatus.symptoms', [...current, e.target.value]); e.target.value = ''; } }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.section>

                            {/* Operational Stats: Meals & Behavior */}
                            <motion.section variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="card !rounded-[3rem] p-10 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                        <FiActivity /> Meals
                                    </h3>
                                    <div className="space-y-6">
                                        {['morningMeal', 'afternoonMeal', 'eveningMeal'].map(meal => (
                                            <div key={meal} className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-400 tracking-widest ml-1">{meal.replace('Meal', '')} Time</label>
                                                <Field as="select" name={meal} className="w-full px-6 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border-transparent font-black text-[11px] uppercase tracking-widest text-slate-600 dark:text-slate-300">
                                                    <option value="">Did not eat</option>
                                                    <option value="good">Ate well</option>
                                                    <option value="average">Ate some</option>
                                                    <option value="poor">Ate very little</option>
                                                    <option value="skipped">Skipped meal</option>
                                                </Field>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="card !rounded-[3rem] p-10 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                        <FiZap /> Behavior
                                    </h3>
                                    <div className="space-y-4">
                                        {[
                                            { id: 'excellent', label: 'Very Good', color: 'bg-emerald-500' },
                                            { id: 'good', label: 'Good', color: 'bg-primary-500' },
                                            { id: 'average', label: 'Normal', color: 'bg-amber-500' },
                                            { id: 'needs_attention', label: 'Needs Attention', color: 'bg-rose-500' }
                                        ].map(opt => (
                                            <button key={opt.id} type="button" onClick={() => setFieldValue('behavior', opt.id)} className={`w-full group py-4 px-6 rounded-2xl border-2 transition-all flex items-center justify-between ${values.behavior === opt.id ? 'bg-slate-900 border-slate-900 shadow-lg' : 'bg-slate-50 dark:bg-slate-800/50 border-transparent hover:border-slate-200'}`}>
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${values.behavior === opt.id ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>{opt.label}</span>
                                                <div className={`w-2 h-2 rounded-full ${opt.color} ${values.behavior === opt.id ? 'animate-pulse scale-150' : 'opacity-20'}`} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </motion.section>

                            {/* Dynamic Activity Logs */}
                            <motion.section variants={itemVariants} className="card !rounded-[3rem] p-10 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
                                <header className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center"><FiActivity size={24} className="stroke-[2.5px]" /></div>
                                        <div>
                                            <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Activities</h2>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">What did they do today?</p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => setFieldValue('activities', [...(values.activities || []), { activity: '', duration: '', remarks: '' }])} className="p-3 bg-primary-600 text-white rounded-xl shadow-lg shadow-primary-500/20 hover:scale-110 active:scale-90 transition-all">
                                        <FiPlus className="stroke-[3px]" />
                                    </button>
                                </header>

                                <div className="space-y-4">
                                    <AnimatePresence>
                                        {(values.activities || []).map((_, index) => (
                                            <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="flex gap-4 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] relative group border border-transparent hover:border-slate-200 transition-colors">
                                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-1">Activity</label>
                                                        <Field name={`activities[${index}].activity`} className="w-full bg-white dark:bg-slate-900 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-white focus:ring-4 focus:ring-primary-500/5 transition-all" placeholder="Title..." />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-1">How long</label>
                                                        <Field name={`activities[${index}].duration`} className="w-full bg-white dark:bg-slate-900 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-white focus:ring-4 focus:ring-primary-500/5 transition-all" placeholder="Min/Hrs..." />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-1">Notes</label>
                                                        <Field name={`activities[${index}].remarks`} className="w-full bg-white dark:bg-slate-900 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-white focus:ring-4 focus:ring-primary-500/5 transition-all" placeholder="Details..." />
                                                    </div>
                                                </div>
                                                <button type="button" onClick={() => setFieldValue('activities', values.activities.filter((__, i) => i !== index))} className="mt-4 p-3 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-xl hover:bg-rose-200 transition-colors self-start opacity-0 group-hover:opacity-100">
                                                    <FiTrash2 size={16} />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                    {!values.activities?.length && <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">No activities added yet.</div>}
                                </div>
                            </motion.section>

                            {/* Final Audit Remarks */}
                            <motion.section variants={itemVariants} className="card !rounded-[3rem] p-10 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                    <FiActivity /> Other Notes
                                </h3>
                                <Field as="textarea" name="specialNotes" rows="6" className="w-full px-10 py-8 bg-slate-50 dark:bg-slate-800 rounded-[3rem] border-transparent focus:ring-8 focus:ring-primary-500/5 font-medium text-slate-700 dark:text-white text-lg leading-relaxed placeholder:opacity-30" placeholder="Add any other important notes here..." />
                                <ErrorMessage name="specialNotes" component="p" className="text-[10px] font-bold text-rose-500 ml-4" />
                            </motion.section>

                        </main>
                    </Form>
                )}
            </Formik>
        </motion.div>
    );
};

export default AddDailyReport;
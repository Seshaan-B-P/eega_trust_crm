import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import {
    FiUser, FiMail, FiPhone, FiMapPin, FiLock,
    FiSave, FiCamera, FiAlertCircle, FiShield,
    FiBell, FiMoon, FiGlobe, FiDatabase, FiChevronRight, FiTrash2, FiActivity
} from 'react-icons/fi';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';

const Settings = () => {
    const { user, updateProfile } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const [photoPreview, setPhotoPreview] = useState(null);
    const [newPhoto, setNewPhoto] = useState(null);

    const profileValidationSchema = Yup.object({
        name: Yup.string()
            .required('Legal name is mandatory')
            .min(3, 'Minimum 3 characters required'),
        email: Yup.string()
            .required('Email is mandatory')
            .email('Invalid email format'),
        phone: Yup.string()
            .matches(/^[0-9]{10}$/, 'Phone must be 10 digits')
            .required('Contact number is mandatory'),
        address: Yup.string()
    });

    const passwordValidationSchema = Yup.object({
        currentPassword: Yup.string().required('Current password required'),
        newPassword: Yup.string().required('New password required').min(6, 'Too short (min 6 chars)'),
        confirmPassword: Yup.string().required('Confirmation mandatory').oneOf([Yup.ref('newPassword'), null], 'Passwords do not match')
    });

    useEffect(() => {
        if (user?.profileImage) {
            setPhotoPreview(user.profileImage);
        }
    }, [user]);

    const handlePhotoChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error('MIME type mismatch: Image required');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Payload exceeds 5MB limit');
                return;
            }
            setNewPhoto(file);
            const reader = new FileReader();
            reader.onloadend = () => setPhotoPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handlePhotoRemove = async () => {
        try {
            if (user?.profileImage && !newPhoto) {
                toast((t) => (
                    <div className="flex flex-col gap-4">
                        <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Remove profile photo?</p>
                        <div className="flex gap-2">
                            <button onClick={async () => {
                                toast.dismiss(t.id);
                                await api.delete('/auth/profile/photo');
                                toast.success('Photo removed');
                                setPhotoPreview(null);
                                setNewPhoto(null);
                            }} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Confirm</button>
                            <button onClick={() => toast.dismiss(t.id)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
                        </div>
                    </div>
                ));
                return;
            }
            setPhotoPreview(null);
            setNewPhoto(null);
        } catch (error) {
            toast.error('Operation failed');
        }
    };

    const handleProfileSubmit = async (values, { setSubmitting }) => {
        try {
            setLoading(true);
            await updateProfile(values);
            if (newPhoto) {
                const formData = new FormData();
                formData.append('photo', newPhoto);
                await api.post('/auth/profile/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            }
            toast.success('Profile updated');
            setNewPhoto(null);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Could not save changes');
        } finally {
            setSubmitting(false);
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (values, { setSubmitting, resetForm }) => {
        try {
            setLoading(true);
            await api.put('/auth/change-password', { currentPassword: values.currentPassword, newPassword: values.newPassword });
            toast.success('Password changed successfully');
            resetForm();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Incorrect password');
        } finally {
            setSubmitting(false);
            setLoading(false);
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

    const tabs = [
        { id: 'profile', label: 'My Profile', icon: <FiUser /> },
        { id: 'security', label: 'Security', icon: <FiShield />, adminOnly: true },
        { id: 'notifications', label: 'Notifications', icon: <FiBell /> },
    ];

    const filteredTabs = tabs.filter(tab => !tab.adminOnly || user?.role === 'admin');

    return (
        <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="p-8 space-y-10 min-h-screen"
        >
            {/* Header */}
            <header className="pb-2 border-b border-slate-200 dark:border-slate-800">
                <motion.div variants={itemVariants} className="flex items-center space-x-2 text-primary-600 font-bold uppercase tracking-[0.2em] text-[10px] mb-2">
                     <span className="w-8 h-px bg-primary-600"></span>
                     <span>Settings</span>
                </motion.div>
                <motion.h1 variants={itemVariants} className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">
                    Account Settings
                </motion.h1>
                <motion.p variants={itemVariants} className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
                    Manage your profile information and account security.
                </motion.p>
            </header>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Navigation Sidebar */}
                <motion.aside variants={itemVariants} className="lg:w-80 shrink-0">
                    <div className="card !rounded-[2.5rem] p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm sticky top-8">
                        <div className="space-y-2">
                            {filteredTabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full group flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300 ${activeTab === tab.id 
                                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25 scale-[1.02]' 
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className={`text-xl ${activeTab === tab.id ? 'text-white' : 'text-slate-400 group-hover:text-primary-500'} transition-colors`}>
                                            {tab.icon}
                                        </span>
                                        <span className="text-xs font-black uppercase tracking-widest">{tab.label}</span>
                                    </div>
                                    <FiChevronRight className={`transition-transform duration-300 ${activeTab === tab.id ? 'translate-x-1' : 'opacity-0'}`} />
                                </button>
                            ))}
                        </div>


                    </div>
                </motion.aside>

                {/* Content Area */}
                <motion.main variants={itemVariants} className="flex-1 min-w-0">
                    <div className="card !rounded-[3rem] p-10 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm min-h-[600px] relative overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                {activeTab === 'profile' && (
                                    <div className="space-y-12">
                                        <header>
                                            <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Profile Details</h2>
                                            <p className="text-slate-500 text-sm mt-1">Update your name, email, and phone number.</p>
                                        </header>

                                        {/* Profile Photo */}
                                        <div className="flex flex-col sm:flex-row items-center gap-8 p-8 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                            <div className="relative group">
                                                <div className="h-32 w-32 rounded-[2.5rem] bg-gradient-to-br from-primary-500 to-indigo-600 p-1 shadow-xl shadow-primary-500/10">
                                                    <div className="h-full w-full rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900 flex items-center justify-center">
                                                        {photoPreview ? <img src={photoPreview} alt="U" className="h-full w-full object-cover" /> : <FiUser className="text-slate-300" size={48} />}
                                                    </div>
                                                </div>
                                                <label htmlFor="photo-upload" className="absolute -bottom-2 -right-2 p-3 bg-primary-600 text-white rounded-2xl shadow-lg cursor-pointer hover:bg-primary-700 transition-all hover:scale-110 active:scale-95 border-4 border-white dark:border-slate-900">
                                                    <FiCamera />
                                                </label>
                                                <input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                                            </div>
                                            <div className="space-y-4 text-center sm:text-left">
                                                <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">{user?.role} ACCOUNT</h3>
                                                <p className="text-xs text-slate-500 max-w-xs font-medium">Recommended: Square image, max 5MB. Please use a clear photo of yourself.</p>
                                                <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                                                    <button onClick={handlePhotoRemove} className="px-4 py-2 border border-rose-200 dark:border-rose-900/30 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors">Remove Photo</button>
                                                </div>
                                            </div>
                                        </div>

                                        <Formik
                                            initialValues={{ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', address: user?.address || '' }}
                                            validationSchema={profileValidationSchema}
                                            onSubmit={handleProfileSubmit}
                                            enableReinitialize
                                        >
                                            {({ isSubmitting }) => (
                                                <Form className="space-y-8">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Full Name</label>
                                                            <div className="relative group">
                                                                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                                                                <Field name="name" className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all font-medium text-slate-800 dark:text-white" />
                                                            </div>
                                                            <ErrorMessage name="name" component="p" className="text-[10px] font-bold text-rose-500 ml-1" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Address</label>
                                                            <div className="relative group">
                                                                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                                                                <Field name="email" className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all font-medium text-slate-800 dark:text-white" />
                                                            </div>
                                                            <ErrorMessage name="email" component="p" className="text-[10px] font-bold text-rose-500 ml-1" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Phone Number</label>
                                                            <div className="relative group">
                                                                <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                                                                <Field name="phone" className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all font-medium text-slate-800 dark:text-white" />
                                                            </div>
                                                            <ErrorMessage name="phone" component="p" className="text-[10px] font-bold text-rose-500 ml-1" />
                                                        </div>
                                                        <div className="md:col-span-2 space-y-2">
                                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Address</label>
                                                            <div className="relative group">
                                                                <FiMapPin className="absolute left-4 top-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                                                                <Field as="textarea" rows="3" name="address" className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all font-medium text-slate-800 dark:text-white resize-none" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                                                        <button type="submit" disabled={isSubmitting || loading} className="px-10 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl shadow-xl shadow-primary-500/20 font-black text-xs uppercase tracking-widest transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-3">
                                                            {loading ? <LoadingSpinner size="sm" color="white" inline /> : <FiSave className="stroke-[3px]" />}
                                                            Save Changes
                                                        </button>
                                                    </div>
                                                </Form>
                                            )}
                                        </Formik>
                                    </div>
                                )}

                                {activeTab === 'security' && (
                                    <div className="space-y-12">
                                        <header>
                                            <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Security</h2>
                                            <p className="text-slate-500 text-sm mt-1">Change your password here.</p>
                                        </header>

                                        <Formik
                                            initialValues={{ currentPassword: '', newPassword: '', confirmPassword: '' }}
                                            validationSchema={passwordValidationSchema}
                                            onSubmit={handlePasswordSubmit}
                                        >
                                            {({ isSubmitting }) => (
                                                <Form className="space-y-8 max-w-xl">
                                                    <div className="space-y-6">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Current Password</label>
                                                            <div className="relative group">
                                                                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
                                                                <Field name="currentPassword" type="password" className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-rose-500/5 focus:border-rose-500 transition-all font-medium text-slate-800 dark:text-white" />
                                                            </div>
                                                            <ErrorMessage name="currentPassword" component="p" className="text-[10px] font-bold text-rose-500 ml-1" />
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">New Password</label>
                                                                <Field name="newPassword" type="password" className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-rose-500/5 focus:border-rose-500 transition-all font-medium text-slate-800 dark:text-white" />
                                                                <ErrorMessage name="newPassword" component="p" className="text-[10px] font-bold text-rose-500 ml-1" />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Confirm Password</label>
                                                                <Field name="confirmPassword" type="password" className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-rose-500/5 focus:border-rose-500 transition-all font-medium text-slate-800 dark:text-white" />
                                                                <ErrorMessage name="confirmPassword" component="p" className="text-[10px] font-bold text-rose-500 ml-1" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                                                        <button type="submit" disabled={isSubmitting || loading} className="px-10 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl shadow-xl shadow-rose-500/20 font-black text-xs uppercase tracking-widest transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-3">
                                                            <FiShield className="stroke-[3px]" />
                                                            Update Password
                                                        </button>
                                                    </div>
                                                </Form>
                                            )}
                                        </Formik>

                                        <div className="p-8 rounded-[2.5rem] bg-amber-500/5 border border-amber-500/10 flex items-start gap-6">
                                            <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-600">
                                                <FiAlertCircle size={24} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-amber-700 uppercase tracking-widest mb-2">Security Tips</h4>
                                                <ul className="text-xs text-amber-600/80 font-bold space-y-2 leading-relaxed">
                                                    <li>• STRONG PASSWORD: Mix letters, numbers, and symbols.</li>
                                                    <li>• REGULAR UPDATES: Change your password every few months.</li>
                                                    <li>• UNIQUE PASSWORD: Do not use the same password for other sites.</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'notifications' && (
                                    <div className="space-y-12">
                                        <header>
                                            <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Notification Preferences</h2>
                                            <p className="text-slate-500 text-sm mt-1">Control how you receive alerts and updates.</p>
                                        </header>

                                        <Formik
                                            initialValues={{ 
                                                notificationSettings: {
                                                    email: user?.notificationSettings?.email ?? true,
                                                    push: user?.notificationSettings?.push ?? true,
                                                    sms: user?.notificationSettings?.sms ?? false
                                                }
                                            }}
                                            onSubmit={handleProfileSubmit}
                                            enableReinitialize
                                        >
                                            {({ values, setFieldValue, isSubmitting }) => (
                                                <Form className="space-y-8 max-w-2xl">
                                                    <div className="space-y-4">
                                                        {[
                                                            { id: 'email', label: 'Email Notifications', desc: 'Receive daily reports and donation alerts via email.', icon: <FiMail /> },
                                                            { id: 'push', label: 'Push Notifications', desc: 'Get real-time browser alerts for critical updates.', icon: <FiBell /> },
                                                            { id: 'sms', label: 'SMS Alerts', desc: 'Secure emergency notifications via text message.', icon: <FiPhone /> },
                                                        ].map((item) => (
                                                            <div key={item.id} className="group flex items-center justify-between p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-primary-500/30 transition-all">
                                                                <div className="flex items-center gap-6">
                                                                    <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl text-slate-400 group-hover:text-primary-500 transition-colors shadow-sm">
                                                                        {item.icon}
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{item.label}</h4>
                                                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{item.desc}</p>
                                                                    </div>
                                                                </div>
                                                                <label className="relative inline-flex items-center cursor-pointer scale-90">
                                                                    <input 
                                                                        type="checkbox" 
                                                                        className="sr-only peer"
                                                                        checked={values.notificationSettings?.[item.id] || false}
                                                                        onChange={(e) => setFieldValue(`notificationSettings.${item.id}`, e.target.checked)}
                                                                    />
                                                                    <div className="w-14 h-8 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-600"></div>
                                                                </label>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="flex justify-end pt-8 border-t border-slate-100 dark:border-slate-800">
                                                        <button type="submit" disabled={isSubmitting || loading} className="px-10 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl shadow-xl shadow-primary-500/20 font-black text-xs uppercase tracking-widest transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-3">
                                                            {loading ? <LoadingSpinner size="sm" color="white" inline /> : <FiSave className="stroke-[3px]" />}
                                                            Save Preferences
                                                        </button>
                                                    </div>
                                                </Form>
                                            )}
                                        </Formik>
                                    </div>
                                )}

                            </motion.div>
                        </AnimatePresence>
                    </div>
                </motion.main>
            </div>
        </motion.div>
    );
};

export default Settings;
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import { 
    FiUser, FiMail, FiPhone, FiMapPin, FiLock,
    FiSave, FiCamera, FiAlertCircle, FiShield,
    FiBell, FiMoon, FiGlobe, FiDatabase
} from 'react-icons/fi';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Settings = () => {
    const { user, updateProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const [photoPreview, setPhotoPreview] = useState(null);
    const [newPhoto, setNewPhoto] = useState(null);

    const profileValidationSchema = Yup.object({
        name: Yup.string()
            .required('Name is required')
            .min(3, 'Name must be at least 3 characters'),
        email: Yup.string()
            .required('Email is required')
            .email('Invalid email format'),
        phone: Yup.string()
            .matches(/^[0-9]{10}$/, 'Phone must be 10 digits')
            .required('Phone number is required'),
        address: Yup.string()
    });

    const passwordValidationSchema = Yup.object({
        currentPassword: Yup.string()
            .required('Current password is required'),
        newPassword: Yup.string()
            .required('New password is required')
            .min(6, 'Password must be at least 6 characters'),
        confirmPassword: Yup.string()
            .required('Please confirm password')
            .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
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
                toast.error('Please select an image file');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image must be less than 5MB');
                return;
            }
            
            setNewPhoto(file);
            
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleProfileSubmit = async (values, { setSubmitting }) => {
        try {
            setLoading(true);
            
            // Update profile info
            await updateProfile(values);
            
            // Upload photo if changed
            if (newPhoto) {
                const formData = new FormData();
                formData.append('photo', newPhoto);
                
                await api.post('/auth/profile/photo', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
            }
            
            toast.success('Profile updated successfully');
            setNewPhoto(null);
        } catch (error) {
            console.error('Error:', error);
            toast.error(error.response?.data?.message || 'Error updating profile');
        } finally {
            setSubmitting(false);
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (values, { setSubmitting, resetForm }) => {
        try {
            setLoading(true);
            
            await api.put('/auth/change-password', {
                currentPassword: values.currentPassword,
                newPassword: values.newPassword
            });
            
            toast.success('Password changed successfully');
            resetForm();
        } catch (error) {
            console.error('Error:', error);
            toast.error(error.response?.data?.message || 'Error changing password');
        } finally {
            setSubmitting(false);
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
                    <p className="text-gray-600">Manage your account settings and preferences</p>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                    {/* Sidebar */}
                    <div className="md:w-64">
                        <div className="bg-white rounded-xl shadow-md p-4">
                            <nav className="space-y-1">
                                <button
                                    onClick={() => setActiveTab('profile')}
                                    className={`w-full flex items-center px-4 py-3 rounded-lg transition ${
                                        activeTab === 'profile'
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <FiUser className="mr-3 h-5 w-5" />
                                    Profile Information
                                </button>
                                <button
                                    onClick={() => setActiveTab('security')}
                                    className={`w-full flex items-center px-4 py-3 rounded-lg transition ${
                                        activeTab === 'security'
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <FiLock className="mr-3 h-5 w-5" />
                                    Security
                                </button>
                                <button
                                    onClick={() => setActiveTab('notifications')}
                                    className={`w-full flex items-center px-4 py-3 rounded-lg transition ${
                                        activeTab === 'notifications'
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <FiBell className="mr-3 h-5 w-5" />
                                    Notifications
                                </button>
                                <button
                                    onClick={() => setActiveTab('preferences')}
                                    className={`w-full flex items-center px-4 py-3 rounded-lg transition ${
                                        activeTab === 'preferences'
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <FiGlobe className="mr-3 h-5 w-5" />
                                    Preferences
                                </button>
                                {user?.role === 'admin' && (
                                    <button
                                        onClick={() => setActiveTab('system')}
                                        className={`w-full flex items-center px-4 py-3 rounded-lg transition ${
                                            activeTab === 'system'
                                                ? 'bg-blue-50 text-blue-700'
                                                : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        <FiDatabase className="mr-3 h-5 w-5" />
                                        System
                                    </button>
                                )}
                            </nav>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                        <div className="bg-white rounded-xl shadow-md p-6">
                            {/* Profile Tab */}
                            {activeTab === 'profile' && (
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-800 mb-6">Profile Information</h2>
                                    
                                    {/* Profile Photo */}
                                    <div className="flex flex-col items-center mb-8">
                                        <div className="relative mb-4">
                                            <div className="h-32 w-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gradient-to-r from-blue-100 to-blue-200">
                                                {photoPreview ? (
                                                    <img 
                                                        src={photoPreview} 
                                                        alt={user?.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center">
                                                        <FiUser className="h-16 w-16 text-blue-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <label
                                                htmlFor="photo-upload"
                                                className="absolute bottom-2 right-2 bg-blue-600 text-white p-3 rounded-full cursor-pointer hover:bg-blue-700 transition shadow-lg"
                                            >
                                                <FiCamera className="h-5 w-5" />
                                            </label>
                                            <input
                                                id="photo-upload"
                                                type="file"
                                                accept="image/*"
                                                onChange={handlePhotoChange}
                                                className="hidden"
                                            />
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            Click the camera icon to update your profile photo
                                        </p>
                                    </div>

                                    <Formik
                                        initialValues={{
                                            name: user?.name || '',
                                            email: user?.email || '',
                                            phone: user?.phone || '',
                                            address: user?.address || ''
                                        }}
                                        validationSchema={profileValidationSchema}
                                        onSubmit={handleProfileSubmit}
                                        enableReinitialize
                                    >
                                        {({ isSubmitting }) => (
                                            <Form className="space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Full Name *
                                                        </label>
                                                        <Field
                                                            type="text"
                                                            name="name"
                                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                        />
                                                        <ErrorMessage name="name">
                                                            {msg => <div className="text-red-500 text-sm mt-2">{msg}</div>}
                                                        </ErrorMessage>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Email Address *
                                                        </label>
                                                        <div className="relative">
                                                            <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                                            <Field
                                                                type="email"
                                                                name="email"
                                                                className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                            />
                                                        </div>
                                                        <ErrorMessage name="email">
                                                            {msg => <div className="text-red-500 text-sm mt-2">{msg}</div>}
                                                        </ErrorMessage>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Phone Number *
                                                        </label>
                                                        <div className="relative">
                                                            <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                                            <Field
                                                                type="tel"
                                                                name="phone"
                                                                className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                            />
                                                        </div>
                                                        <ErrorMessage name="phone">
                                                            {msg => <div className="text-red-500 text-sm mt-2">{msg}</div>}
                                                        </ErrorMessage>
                                                    </div>

                                                    <div className="md:col-span-2">
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Address
                                                        </label>
                                                        <div className="relative">
                                                            <FiMapPin className="absolute left-3 top-3 text-gray-400" />
                                                            <Field
                                                                as="textarea"
                                                                name="address"
                                                                rows="3"
                                                                className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex justify-end">
                                                    <button
                                                        type="submit"
                                                        disabled={isSubmitting || loading}
                                                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition font-medium disabled:opacity-50 flex items-center"
                                                    >
                                                        {loading ? (
                                                            <>
                                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                                                Saving...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <FiSave className="mr-2" />
                                                                Save Changes
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </Form>
                                        )}
                                    </Formik>
                                </div>
                            )}

                            {/* Security Tab */}
                            {activeTab === 'security' && (
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                                        <FiShield className="mr-2" />
                                        Security Settings
                                    </h2>

                                    <div className="mb-8">
                                        <h3 className="text-lg font-medium text-gray-800 mb-4">Change Password</h3>
                                        <Formik
                                            initialValues={{
                                                currentPassword: '',
                                                newPassword: '',
                                                confirmPassword: ''
                                            }}
                                            validationSchema={passwordValidationSchema}
                                            onSubmit={handlePasswordSubmit}
                                        >
                                            {({ isSubmitting }) => (
                                                <Form className="space-y-6 max-w-md">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Current Password *
                                                        </label>
                                                        <Field
                                                            type="password"
                                                            name="currentPassword"
                                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                            placeholder="Enter current password"
                                                        />
                                                        <ErrorMessage name="currentPassword">
                                                            {msg => <div className="text-red-500 text-sm mt-2">{msg}</div>}
                                                        </ErrorMessage>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            New Password *
                                                        </label>
                                                        <Field
                                                            type="password"
                                                            name="newPassword"
                                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                            placeholder="Enter new password"
                                                        />
                                                        <ErrorMessage name="newPassword">
                                                            {msg => <div className="text-red-500 text-sm mt-2">{msg}</div>}
                                                        </ErrorMessage>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Minimum 6 characters
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Confirm New Password *
                                                        </label>
                                                        <Field
                                                            type="password"
                                                            name="confirmPassword"
                                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                            placeholder="Confirm new password"
                                                        />
                                                        <ErrorMessage name="confirmPassword">
                                                            {msg => <div className="text-red-500 text-sm mt-2">{msg}</div>}
                                                        </ErrorMessage>
                                                    </div>

                                                    <div className="flex justify-end">
                                                        <button
                                                            type="submit"
                                                            disabled={isSubmitting || loading}
                                                            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition font-medium disabled:opacity-50 flex items-center"
                                                        >
                                                            {loading ? (
                                                                <>
                                                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                                                    Updating...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <FiLock className="mr-2" />
                                                                    Change Password
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </Form>
                                            )}
                                        </Formik>
                                    </div>

                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                                        <div className="flex items-start">
                                            <FiAlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                                            <div>
                                                <h4 className="font-medium text-yellow-800">Security Tips</h4>
                                                <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                                                    <li>• Use a strong password with mix of letters, numbers, and symbols</li>
                                                    <li>• Never share your password with anyone</li>
                                                    <li>• Change your password regularly</li>
                                                    <li>• Log out from shared devices</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Notifications Tab */}
                            {activeTab === 'notifications' && (
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                                        <FiBell className="mr-2" />
                                        Notification Preferences
                                    </h2>

                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="font-medium text-gray-800">Email Notifications</p>
                                                <p className="text-sm text-gray-600">Receive updates via email</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="font-medium text-gray-800">Daily Report Reminders</p>
                                                <p className="text-sm text-gray-600">Get reminders to submit daily reports</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="font-medium text-gray-800">Attendance Alerts</p>
                                                <p className="text-sm text-gray-600">Get notified when attendance is not marked</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Preferences Tab */}
                            {activeTab === 'preferences' && (
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                                        <FiGlobe className="mr-2" />
                                        Application Preferences
                                    </h2>

                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="font-medium text-gray-800">Dark Mode</p>
                                                <p className="text-sm text-gray-600">Switch to dark theme</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Items Per Page
                                            </label>
                                            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                                <option>10</option>
                                                <option>20</option>
                                                <option>50</option>
                                                <option>100</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Default Dashboard
                                            </label>
                                            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                                <option>Overview Dashboard</option>
                                                <option>Children Dashboard</option>
                                                <option>Reports Dashboard</option>
                                                <option>Analytics Dashboard</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* System Tab (Admin Only) */}
                            {activeTab === 'system' && user?.role === 'admin' && (
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                                        <FiDatabase className="mr-2" />
                                        System Settings
                                    </h2>

                                    <div className="space-y-6">
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <h3 className="font-medium text-gray-800 mb-4">Backup & Restore</h3>
                                            <div className="space-y-3">
                                                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                                                    Create Backup
                                                </button>
                                                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition ml-3">
                                                    Restore Backup
                                                </button>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <h3 className="font-medium text-gray-800 mb-4">System Logs</h3>
                                            <div className="space-y-2">
                                                <p className="text-sm text-gray-600">Last backup: Never</p>
                                                <p className="text-sm text-gray-600">System version: 1.0.0</p>
                                                <p className="text-sm text-gray-600">Database size: 25 MB</p>
                                            </div>
                                            <button className="mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                                                View System Logs
                                            </button>
                                        </div>

                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                            <div className="flex items-start">
                                                <FiAlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
                                                <div>
                                                    <h4 className="font-medium text-red-800">Danger Zone</h4>
                                                    <p className="text-sm text-red-700 mt-1">
                                                        These actions are irreversible. Please proceed with caution.
                                                    </p>
                                                    <button className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                                                        Reset System Data
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import {
    FiUser, FiMail, FiPhone, FiMapPin, FiBriefcase,
    FiChevronLeft, FiSave, FiCalendar, FiClock,
    FiAward, FiAlertCircle
} from 'react-icons/fi';
import { TbCurrencyRupee } from 'react-icons/tb';
import api from '../../utils/api';

const validationSchema = Yup.object({
    // User Account Information
    userData: Yup.object({
        name: Yup.string()
            .required('Name is required')
            .min(3, 'Name must be at least 3 characters'),
        email: Yup.string()
            .required('Email is required')
            .email('Invalid email format'),
        password: Yup.string()
            .required('Password is required')
            .min(6, 'Password must be at least 6 characters'),
        phone: Yup.string()
            .matches(/^[0-9]{10}$/, 'Phone must be 10 digits')
            .required('Phone number is required'),
        address: Yup.string()
    }),
    // Staff Profile Information
    staffData: Yup.object({
        department: Yup.string()
            .required('Department is required'),
        designation: Yup.string()
            .required('Designation is required'),
        qualification: Yup.string(),
        experience: Yup.number()
            .min(0, 'Experience cannot be negative')
            .max(50, 'Experience cannot exceed 50 years'),
        salary: Yup.number()
            .min(0, 'Salary cannot be negative'),
        shift: Yup.string(),
        workingDays: Yup.array(),
        maxChildrenCapacity: Yup.number()
            .min(1, 'Capacity must be at least 1')
            .max(20, 'Capacity cannot exceed 20'),
        emergencyContact: Yup.object({
            name: Yup.string(),
            relationship: Yup.string(),
            phone: Yup.string()
                .matches(/^[0-9]{10}$/, 'Phone must be 10 digits')
        })
    })
});

const AddStaff = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const departments = [
        { value: 'caretaker', label: 'Caretaker' },
        { value: 'teacher', label: 'Teacher' },
        { value: 'cook', label: 'Cook' },
        { value: 'doctor', label: 'Doctor' },
        { value: 'administrator', label: 'Administrator' },
        { value: 'security', label: 'Security' },
        { value: 'other', label: 'Other' }
    ];

    const shifts = [
        { value: 'morning', label: 'Morning (6 AM - 2 PM)' },
        { value: 'afternoon', label: 'Afternoon (2 PM - 10 PM)' },
        { value: 'evening', label: 'Evening (10 PM - 6 AM)' },
        { value: 'flexible', label: 'Flexible' }
    ];

    const weekDays = [
        { value: 'monday', label: 'Monday' },
        { value: 'tuesday', label: 'Tuesday' },
        { value: 'wednesday', label: 'Wednesday' },
        { value: 'thursday', label: 'Thursday' },
        { value: 'friday', label: 'Friday' },
        { value: 'saturday', label: 'Saturday' },
        { value: 'sunday', label: 'Sunday' }
    ];

    const initialValues = {
        userData: {
            name: '',
            email: '',
            password: '',
            phone: '',
            address: ''
        },
        staffData: {
            department: '',
            designation: '',
            qualification: '',
            experience: 0,
            salary: 0,
            shift: 'morning',
            workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            maxChildrenCapacity: 10,
            emergencyContact: {
                name: '',
                relationship: '',
                phone: ''
            }
        }
    };

    const handleSubmit = async (values, { setSubmitting, resetForm }) => {
        try {
            setLoading(true);

            // Flatten the nested data structure for the API to match controller expectation
            const payload = {
                ...values.userData,
                ...values.staffData
            };

            const response = await api.post('/staff', payload);

            toast.success('Staff member added successfully!');
            resetForm();
            navigate('/staff');
        } catch (error) {
            console.error('Error:', error);
            const errorMessage = error.response?.data?.message || 'Error adding staff member';
            const errors = error.response?.data?.errors;

            if (errors && Array.isArray(errors)) {
                errors.forEach(err => toast.error(err));
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setSubmitting(false);
            setLoading(false);
        }
    };

    return (
        <div className="p-6 min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
            <div className="max-w-6xl mx-auto">
                {/* Header with Breadcrumbs */}
                <div className="mb-8">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                        <button
                            onClick={() => navigate('/staff')}
                            className="flex items-center text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                            <FiChevronLeft className="mr-1" />
                            Back to Staff List
                        </button>
                        <span className="mx-2">/</span>
                        <span className="text-gray-800 dark:text-white font-medium">Add New Staff Member</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Add New Staff Member</h1>
                    <p className="text-gray-600 dark:text-gray-400">Create a new staff account and profile</p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-slate-700">
                    <Formik
                        initialValues={initialValues}
                        validationSchema={validationSchema}
                        onSubmit={handleSubmit}
                    >
                        {({ isSubmitting, values, setFieldValue }) => (
                            <Form className="space-y-8">
                                {/* Account Information */}
                                <div className="border-b dark:border-slate-700 pb-8">
                                    <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white flex items-center">
                                        <FiUser className="mr-3" />
                                        Account Information
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Full Name */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Full Name *
                                            </label>
                                            <Field
                                                type="text"
                                                name="userData.name"
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-gray-900 dark:text-white"
                                                placeholder="Enter full name"
                                            />
                                            <ErrorMessage name="userData.name">
                                                {msg => <div className="text-red-500 text-sm mt-2 flex items-center">
                                                    <FiAlertCircle className="mr-1" /> {msg}
                                                </div>}
                                            </ErrorMessage>
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Email Address *
                                            </label>
                                            <div className="relative">
                                                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                                                <Field
                                                    type="email"
                                                    name="userData.email"
                                                    className="pl-10 w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-gray-900 dark:text-white"
                                                    placeholder="staff@example.com"
                                                />
                                            </div>
                                            <ErrorMessage name="userData.email">
                                                {msg => <div className="text-red-500 text-sm mt-2">{msg}</div>}
                                            </ErrorMessage>
                                        </div>

                                        {/* Password */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Password *
                                            </label>
                                            <Field
                                                type="password"
                                                name="userData.password"
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-gray-900 dark:text-white"
                                                placeholder="••••••••"
                                            />
                                            <ErrorMessage name="userData.password">
                                                {msg => <div className="text-red-500 text-sm mt-2">{msg}</div>}
                                            </ErrorMessage>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Minimum 6 characters
                                            </p>
                                        </div>

                                        {/* Phone */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Phone Number *
                                            </label>
                                            <div className="relative">
                                                <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                                                <Field
                                                    type="tel"
                                                    name="userData.phone"
                                                    className="pl-10 w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-gray-900 dark:text-white"
                                                    placeholder="9876543210"
                                                />
                                            </div>
                                            <ErrorMessage name="userData.phone">
                                                {msg => <div className="text-red-500 text-sm mt-2">{msg}</div>}
                                            </ErrorMessage>
                                        </div>

                                        {/* Address */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Address
                                            </label>
                                            <div className="relative">
                                                <FiMapPin className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                                                <Field
                                                    as="textarea"
                                                    name="userData.address"
                                                    rows="3"
                                                    className="pl-10 w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-gray-900 dark:text-white"
                                                    placeholder="Complete address"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Professional Information */}
                                <div className="border-b dark:border-slate-700 pb-8">
                                    <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white flex items-center">
                                        <FiBriefcase className="mr-3" />
                                        Professional Information
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Department */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Department *
                                            </label>
                                            <Field
                                                as="select"
                                                name="staffData.department"
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-gray-900 dark:text-white"
                                            >
                                                <option value="" className="dark:bg-slate-900">Select Department</option>
                                                {departments.map(dept => (
                                                    <option key={dept.value} value={dept.value} className="dark:bg-slate-900">{dept.label}</option>
                                                ))}
                                            </Field>
                                            <ErrorMessage name="staffData.department">
                                                {msg => <div className="text-red-500 text-sm mt-2">{msg}</div>}
                                            </ErrorMessage>
                                        </div>

                                        {/* Designation */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Designation *
                                            </label>
                                            <Field
                                                type="text"
                                                name="staffData.designation"
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-gray-900 dark:text-white"
                                                placeholder="e.g., Senior Caretaker"
                                            />
                                            <ErrorMessage name="staffData.designation">
                                                {msg => <div className="text-red-500 text-sm mt-2">{msg}</div>}
                                            </ErrorMessage>
                                        </div>

                                        {/* Qualification */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                <FiAward className="inline mr-2" />
                                                Qualification
                                            </label>
                                            <Field
                                                type="text"
                                                name="staffData.qualification"
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-gray-900 dark:text-white"
                                                placeholder="e.g., B.Ed, Diploma"
                                            />
                                        </div>

                                        {/* Experience */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                <FiClock className="inline mr-2" />
                                                Experience (Years)
                                            </label>
                                            <Field
                                                type="number"
                                                name="staffData.experience"
                                                min="0"
                                                max="50"
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-gray-900 dark:text-white"
                                            />
                                        </div>

                                        {/* Salary */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                <TbCurrencyRupee className="inline mr-2" />
                                                Monthly Salary
                                            </label>
                                            <Field
                                                type="number"
                                                name="staffData.salary"
                                                min="0"
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-gray-900 dark:text-white"
                                                placeholder="0"
                                            />
                                        </div>

                                        {/* Shift */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Shift
                                            </label>
                                            <Field
                                                as="select"
                                                name="staffData.shift"
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-gray-900 dark:text-white"
                                            >
                                                {shifts.map(shift => (
                                                    <option key={shift.value} value={shift.value} className="dark:bg-slate-900">{shift.label}</option>
                                                ))}
                                            </Field>
                                        </div>

                                        {/* Working Days */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                                Working Days
                                            </label>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                {weekDays.map(day => (
                                                    <label key={day.value} className="flex items-center p-3 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition">
                                                        <Field
                                                            type="checkbox"
                                                            name="staffData.workingDays"
                                                            value={day.value}
                                                            className="h-4 w-4 text-primary-600 dark:bg-slate-900 focus:ring-primary-500 border-gray-300 dark:border-slate-600 rounded"
                                                            checked={values.staffData.workingDays?.includes(day.value)}
                                                            onChange={(e) => {
                                                                const checked = e.target.checked;
                                                                const currentDays = values.staffData.workingDays || [];
                                                                if (checked) {
                                                                    setFieldValue('staffData.workingDays', [...currentDays, day.value]);
                                                                } else {
                                                                    setFieldValue('staffData.workingDays', currentDays.filter(d => d !== day.value));
                                                                }
                                                            }}
                                                        />
                                                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{day.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Children Capacity */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Maximum Children Capacity
                                            </label>
                                            <Field
                                                type="number"
                                                name="staffData.maxChildrenCapacity"
                                                min="1"
                                                max="20"
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-gray-900 dark:text-white"
                                            />
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Maximum number of children this staff can handle
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Emergency Contact */}
                                <div className="border-b dark:border-slate-700 pb-8">
                                    <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white flex items-center">
                                        <FiPhone className="mr-3" />
                                        Emergency Contact (Optional)
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Contact Name
                                            </label>
                                            <Field
                                                type="text"
                                                name="staffData.emergencyContact.name"
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-gray-900 dark:text-white"
                                                placeholder="Emergency contact name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Relationship
                                            </label>
                                            <Field
                                                type="text"
                                                name="staffData.emergencyContact.relationship"
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-gray-900 dark:text-white"
                                                placeholder="e.g., Spouse, Parent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Phone Number
                                            </label>
                                            <Field
                                                type="tel"
                                                name="staffData.emergencyContact.phone"
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-gray-900 dark:text-white"
                                                placeholder="10-digit phone number"
                                            />
                                            <ErrorMessage name="staffData.emergencyContact.phone">
                                                {msg => <div className="text-red-500 text-sm mt-2">{msg}</div>}
                                            </ErrorMessage>
                                        </div>
                                    </div>
                                </div>

                                {/* Important Notes */}
                                <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-slate-700/50 dark:to-slate-600/50 rounded-lg p-6 border border-primary-200 dark:border-slate-600">
                                    <div className="flex items-start">
                                        <FiAlertCircle className="h-5 w-5 text-primary-600 dark:text-primary-400 mt-0.5 mr-3 flex-shrink-0" />
                                        <div>
                                            <h3 className="font-semibold text-primary-800 dark:text-primary-100 mb-2">Important Information</h3>
                                            <ul className="text-sm text-primary-700 dark:text-gray-300 space-y-1">
                                                <li>• Employee ID will be auto-generated upon creation</li>
                                                <li>• Staff member will receive an email with login credentials</li>
                                                <li>• Default password can be changed after first login</li>
                                                <li>• Working days can be modified later in staff settings</li>
                                                <li>• Emergency contact details are optional but recommended</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Actions */}
                                <div className="flex justify-end space-x-4 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/staff')}
                                        className="px-8 py-3 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || loading}
                                        className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                                Adding Staff...
                                            </>
                                        ) : (
                                            <>
                                                <FiSave className="mr-2" />
                                                Add Staff Member
                                            </>
                                        )}
                                    </button>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </div>
            </div>
        </div>
    );
};

export default AddStaff;
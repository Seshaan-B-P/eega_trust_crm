import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import {
    FiUser, FiCalendar, FiPhone, FiMapPin, FiUpload,
    FiChevronLeft, FiSave, FiUsers, FiAlertCircle, FiActivity, FiX
} from 'react-icons/fi';
import elderlyService from '../../services/elderlyService';
import userService from '../../services/userService';

const validationSchema = Yup.object({
    name: Yup.string()
        .required('Name is required')
        .min(3, 'Name must be at least 3 characters'),
    dateOfBirth: Yup.date()
        .required('Date of birth is required')
        .max(new Date(), 'Date cannot be in future'),
    gender: Yup.string()
        .required('Gender is required')
        .oneOf(['Male', 'Female', 'Other'], 'Invalid gender'),
    status: Yup.string()
        .required('Status is required'),
    medicalHistory: Yup.string(),
    allergies: Yup.string(),
    dietaryRestrictions: Yup.string(),
    specialNeeds: Yup.string(),
    assignedStaff: Yup.string(),
    emergencyContact: Yup.object({
        name: Yup.string().required('Emergency contact name is required'),
        relationship: Yup.string().required('Relationship is required'),
        phone: Yup.string()
            .required('Phone number is required')
            .matches(/^[0-9]{10}$/, 'Phone must be 10 digits'),
        address: Yup.string()
    })
});

const ElderlyForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [initialValues, setInitialValues] = useState({
        name: '',
        dateOfBirth: '',
        gender: '',
        status: 'Active',
        medicalHistory: '',
        allergies: '',
        dietaryRestrictions: '',
        specialNeeds: 'None',
        assignedStaff: '',
        emergencyContact: {
            name: '',
            relationship: '',
            phone: '',
            address: ''
        }
    });

    useEffect(() => {
        fetchStaff();
        if (id) {
            fetchElderlyDetails();
        }
    }, [id]);

    const fetchStaff = async () => {
        try {
            const response = await userService.getAvailableStaff();
            let data = [];
            if (Array.isArray(response)) {
                data = response;
            } else if (Array.isArray(response.data)) {
                data = response.data;
            } else if (response.data && Array.isArray(response.data.data)) {
                data = response.data.data;
            } else if (response.success && Array.isArray(response.data)) {
                data = response.data;
            }
            setStaffList(data || []);
        } catch (err) {
            console.error('Failed to fetch staff:', err);
            toast.error('Failed to load staff list');
        }
    };

    const fetchElderlyDetails = async () => {
        try {
            setLoading(true);
            const response = await elderlyService.getElderlyById(id);
            const data = response.data;

            setInitialValues({
                name: data.name || '',
                dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '',
                gender: data.gender || '',
                status: data.status || 'Active',
                medicalHistory: data.medicalConditions?.map(m => m.condition || m.notes).join(', ') || '',
                allergies: data.allergies?.join(', ') || '',
                dietaryRestrictions: data.dietaryRestrictions?.join(', ') || '',
                specialNeeds: data.specialNeeds || 'None',
                assignedStaff: data.assignedStaff?._id || data.assignedStaff || '',
                emergencyContact: {
                    name: data.emergencyContact?.name || '',
                    relationship: data.emergencyContact?.relationship || '',
                    phone: data.emergencyContact?.phone || '',
                    address: data.emergencyContact?.address || ''
                }
            });
            if (data.photo) {
                setPhotoPreview(data.photo);
            }
        } catch (err) {
            console.error('Failed to fetch elderly details:', err);
            toast.error('Failed to load resident details');
            navigate('/elderly');
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoChange = (event, setFieldValue) => {
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
            setFieldValue('photo', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePhotoRemove = async (setFieldValue) => {
        try {
            // In edit mode (id exists), check if there's an existing photo on server
            if (id && photoPreview && !photoPreview.startsWith('data:')) {
                if (window.confirm('Remove this photo permanently from the server?')) {
                    await elderlyService.deletePhoto(id);
                    toast.success('Photo removed from server');
                } else {
                    return;
                }
            }

            // Clear local states
            setPhotoPreview(null);
            setFieldValue('photo', null);

            // Reset file input
            const input = document.getElementById('photo-upload');
            if (input) input.value = '';

        } catch (error) {
            console.error('Error removing photo:', error);
            toast.error('Error removing photo');
        }
    };

    const handleSubmit = async (values, { setSubmitting }) => {
        try {
            setLoading(true);
            const { photo, ...restValues } = values;

            const payload = {
                ...restValues,
                age: calculateAge(values.dateOfBirth),
                allergies: values.allergies ? values.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
                dietaryRestrictions: values.dietaryRestrictions ? values.dietaryRestrictions.split(',').map(s => s.trim()).filter(Boolean) : [],
                medicalConditions: values.medicalHistory ? [{
                    condition: values.medicalHistory,
                    diagnosedDate: new Date(),
                    notes: 'Added via form'
                }] : [],
                assignedStaff: values.assignedStaff === '' ? null : values.assignedStaff
            };

            let response;
            if (id) {
                response = await elderlyService.updateElderly(id, payload);
                toast.success('Resident updated successfully');
            } else {
                response = await elderlyService.createElderly(payload);
                toast.success('Resident added successfully');
            }

            // Handle photo upload
            if (photo) {
                const formData = new FormData();
                formData.append('photo', photo);
                const targetId = id || response.data?._id || response._id;

                if (targetId) {
                    await elderlyService.uploadPhoto(targetId, formData);
                }
            }

            navigate('/elderly');
        } catch (error) {
            console.error('Error saving record:', error);
            toast.error(error.response?.data?.message || 'Error saving record');
        } finally {
            setSubmitting(false);
            setLoading(false);
        }
    };

    const calculateAge = (dob) => {
        if (!dob) return 0;
        const birthDate = new Date(dob);
        const difference = Date.now() - birthDate.getTime();
        const ageDate = new Date(difference);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    return (
        <div className="p-6 min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                        <button
                            onClick={() => navigate('/elderly')}
                            className="flex items-center text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                        >
                            <FiChevronLeft className="mr-1" />
                            Back to Elderly List
                        </button>
                        <span className="mx-2">/</span>
                        <span className="text-gray-800 dark:text-white font-medium">{id ? 'Edit Resident' : 'Add New Resident'}</span>
                    </div>
                    <div className="flex items-center">
                        <div className="h-14 w-14 bg-gradient-to-r from-primary-100 to-primary-200 dark:from-primary-900/40 dark:to-primary-800/20 rounded-xl flex items-center justify-center mr-4 shadow-inner border border-primary-200 dark:border-primary-700/30">
                            <FiUser className="h-7 w-7 text-primary-500 dark:text-primary-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-white tracking-tight">{id ? 'Edit Resident' : 'Add New Resident'}</h1>
                            <p className="text-gray-600 dark:text-gray-400">{id ? 'Update resident information' : 'Register a new elderly resident'}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100 dark:border-slate-700 transition-colors duration-300">
                            <Formik
                                initialValues={initialValues}
                                validationSchema={validationSchema}
                                onSubmit={handleSubmit}
                                enableReinitialize
                            >
                                {({ isSubmitting, values: formData, setFieldValue }) => (
                                    <Form className="space-y-10">

                                        {/* Photo Upload */}
                                        <div className="border-b border-gray-100 dark:border-slate-700 pb-10">
                                            <h2 className="text-xl font-bold mb-8 text-gray-800 dark:text-white flex items-center">
                                                <span className="w-1.5 h-6 bg-primary-600 rounded-full mr-3"></span>
                                                Profile Photo
                                            </h2>
                                            <div className="flex flex-col items-center">
                                                <div className="relative mb-6">
                                                    <div className="h-44 w-44 rounded-full border-4 border-white dark:border-slate-700 shadow-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-700 flex items-center justify-center">
                                                        {photoPreview ? (
                                                            <img
                                                                src={photoPreview}
                                                                alt="Preview"
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <FiUser className="h-20 w-20 text-gray-300 dark:text-slate-600" />
                                                        )}
                                                    </div>
                                                    <label
                                                        htmlFor="photo-upload"
                                                        className="absolute bottom-2 right-2 bg-primary-600 text-white p-3.5 rounded-full cursor-pointer hover:bg-primary-700 transition-all shadow-xl hover:scale-110 active:scale-95 border-4 border-white dark:border-slate-800"
                                                    >
                                                        <FiUpload className="h-5 w-5" />
                                                    </label>
                                                    <input
                                                        id="photo-upload"
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handlePhotoChange(e, setFieldValue)}
                                                        className="hidden"
                                                    />
                                                    {photoPreview && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handlePhotoRemove(setFieldValue)}
                                                            className="absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition shadow-lg border-4 border-white dark:border-slate-800"
                                                            title="Remove Photo"
                                                        >
                                                            <FiX className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-xs">
                                                    Upload a high-quality photo. JPG or PNG formats only. Max size 5MB.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Basic Information */}
                                        <div className="border-b border-gray-100 dark:border-slate-700 pb-10">
                                            <h2 className="text-xl font-bold mb-8 text-gray-800 dark:text-white flex items-center">
                                                <span className="w-1.5 h-6 bg-primary-600 rounded-full mr-3"></span>
                                                Basic Information
                                            </h2>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Full Name *</label>
                                                    <Field
                                                        type="text"
                                                        name="name"
                                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-gray-900 dark:text-white uppercase placeholder-gray-400"
                                                        placeholder="e.g. JOHN DOE"
                                                    />
                                                    <ErrorMessage name="name" component="div" className="text-red-500 text-xs mt-2 font-medium flex items-center px-1"><FiAlertCircle className="mr-1" /> </ErrorMessage>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Date of Birth *</label>
                                                    <Field
                                                        type="date"
                                                        name="dateOfBirth"
                                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-gray-900 dark:text-white"
                                                    />
                                                    <ErrorMessage name="dateOfBirth" component="div" className="text-red-500 text-xs mt-2 font-medium flex items-center px-1"><FiAlertCircle className="mr-1" /> </ErrorMessage>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Gender *</label>
                                                    <div className="flex space-x-6">
                                                        {['Male', 'Female', 'Other'].map(g => (
                                                            <label key={g} className="flex items-center cursor-pointer group">
                                                                <div className="relative flex items-center">
                                                                    <Field type="radio" name="gender" value={g} className="sr-only" />
                                                                    <div className={`w-5 h-5 rounded-full border-2 border-gray-300 dark:border-slate-600 flex items-center justify-center mr-2 group-hover:border-primary-500 transition-colors ${formData.gender === g ? 'border-primary-500 dark:border-primary-500' : ''}`}>
                                                                        {formData.gender === g && <div className="w-2.5 h-2.5 rounded-full bg-primary-600"></div>}
                                                                    </div>
                                                                    <span className={`text-sm font-medium transition-colors ${formData.gender === g ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700'}`}>{g}</span>
                                                                </div>
                                                            </label>
                                                        ))}
                                                    </div>
                                                    <ErrorMessage name="gender" component="div" className="text-red-500 text-xs mt-2 font-medium flex items-center px-1"><FiAlertCircle className="mr-1" /> </ErrorMessage>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Status *</label>
                                                    <div className="relative">
                                                        <Field
                                                            as="select"
                                                            name="status"
                                                            className="w-full appearance-none px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-gray-900 dark:text-white pr-10"
                                                        >
                                                            <option value="Active" className="dark:bg-slate-900">Active</option>
                                                            <option value="Inactive" className="dark:bg-slate-900">Inactive</option>
                                                            <option value="Hospitalized" className="dark:bg-slate-900">Hospitalized</option>
                                                            <option value="Deceased" className="dark:bg-slate-900">Deceased</option>
                                                            <option value="Transferred" className="dark:bg-slate-900">Transferred</option>
                                                        </Field>
                                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Health & Care */}
                                        <div className="border-b border-gray-100 dark:border-slate-700 pb-10">
                                            <h2 className="text-xl font-bold mb-8 text-gray-800 dark:text-white flex items-center">
                                                <span className="w-1.5 h-6 bg-red-500 rounded-full mr-3"></span>
                                                Health & Care
                                            </h2>
                                            <div className="space-y-8">
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Medical History / Conditions</label>
                                                    <Field
                                                        as="textarea"
                                                        name="medicalHistory"
                                                        rows="4"
                                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-gray-900 dark:text-white placeholder-gray-400"
                                                        placeholder="Please list any chronic conditions or recently diagnosed medical issues..."
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Dietary Restrictions</label>
                                                        <Field
                                                            type="text"
                                                            name="dietaryRestrictions"
                                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-gray-900 dark:text-white placeholder-gray-400"
                                                            placeholder="e.g. Low Salt, Diabetic, No Dairy"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Allergies</label>
                                                        <Field
                                                            type="text"
                                                            name="allergies"
                                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-gray-900 dark:text-white placeholder-gray-400"
                                                            placeholder="e.g. Peanuts, Penicillin, Dust"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Special Needs</label>
                                                    <div className="relative">
                                                        <Field
                                                            as="select"
                                                            name="specialNeeds"
                                                            className="w-full appearance-none px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-gray-900 dark:text-white pr-10"
                                                        >
                                                            <option value="None" className="dark:bg-slate-900">None (Independent)</option>
                                                            <option value="Wheelchair" className="dark:bg-slate-900">Wheelchair User</option>
                                                            <option value="Walker" className="dark:bg-slate-900">Uses Walker / Cane</option>
                                                            <option value="Bedridden" className="dark:bg-slate-900">Bedridden / High Support</option>
                                                            <option value="Oxygen" className="dark:bg-slate-900">Requires Oxygen Support</option>
                                                        </Field>
                                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Emergency Contact */}
                                        <div className="border-b border-gray-100 dark:border-slate-700 pb-10">
                                            <h2 className="text-xl font-bold mb-8 text-gray-800 dark:text-white flex items-center">
                                                <span className="w-1.5 h-6 bg-green-500 rounded-full mr-3"></span>
                                                Emergency Contact
                                            </h2>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Contact Name *</label>
                                                    <Field
                                                        type="text"
                                                        name="emergencyContact.name"
                                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-gray-900 dark:text-white uppercase placeholder-gray-400"
                                                        placeholder="NAME OF PRIMARY CONTACT"
                                                    />
                                                    <ErrorMessage name="emergencyContact.name" component="div" className="text-red-500 text-xs mt-2 font-medium flex items-center px-1"><FiAlertCircle className="mr-1" /> </ErrorMessage>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Relationship *</label>
                                                    <Field
                                                        type="text"
                                                        name="emergencyContact.relationship"
                                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-gray-900 dark:text-white placeholder-gray-400"
                                                        placeholder="e.g. SON, DAUGHTER, GUARDIAN"
                                                    />
                                                    <ErrorMessage name="emergencyContact.relationship" component="div" className="text-red-500 text-xs mt-2 font-medium flex items-center px-1"><FiAlertCircle className="mr-1" /> </ErrorMessage>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Phone Number *</label>
                                                    <div className="relative">
                                                        <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                        <Field
                                                            type="tel"
                                                            name="emergencyContact.phone"
                                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-gray-900 dark:text-white"
                                                            placeholder="10-digit primary number"
                                                        />
                                                    </div>
                                                    <ErrorMessage name="emergencyContact.phone" component="div" className="text-red-500 text-xs mt-2 font-medium flex items-center px-1"><FiAlertCircle className="mr-1" /> </ErrorMessage>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Address</label>
                                                    <div className="relative">
                                                        <FiMapPin className="absolute left-3 top-4 text-gray-400" />
                                                        <Field
                                                            as="textarea"
                                                            name="emergencyContact.address"
                                                            rows="1"
                                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-gray-900 dark:text-white placeholder-gray-400"
                                                            placeholder="Current residential address"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Staff Assignment */}
                                        <div className="pb-4">
                                            <h2 className="text-xl font-bold mb-8 text-gray-800 dark:text-white flex items-center">
                                                <span className="w-1.5 h-6 bg-purple-500 rounded-full mr-3"></span>
                                                Staff Assignment
                                            </h2>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Assign Primary Caretaker</label>
                                                    <div className="relative">
                                                        <Field
                                                            as="select"
                                                            name="assignedStaff"
                                                            className="w-full appearance-none px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-gray-900 dark:text-white pr-10"
                                                        >
                                                            <option value="" className="dark:bg-slate-900">-- No Assignment --</option>
                                                            {staffList.map(staff => (
                                                                <option key={staff._id} value={staff.user?._id || staff._id} className="dark:bg-slate-900">
                                                                    {staff.user?.name || staff.name}
                                                                </option>
                                                            ))}
                                                        </Field>
                                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 flex items-center bg-gray-50 dark:bg-slate-900/50 p-2 rounded-lg border border-gray-100 dark:border-slate-700/50">
                                                        <FiActivity className="mr-1.5" />
                                                        Current Calculated Age: <span className="font-bold text-primary-600 dark:text-primary-400 ml-1">{calculateAge(formData.dateOfBirth)} Years</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col-reverse md:flex-row justify-end gap-4 pt-6">
                                            <button
                                                type="button"
                                                onClick={() => navigate('/elderly')}
                                                className="w-full md:w-auto px-10 py-3.5 border border-gray-300 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all font-bold text-gray-600 dark:text-gray-300 text-sm active:scale-95"
                                            >
                                                Discard Changes
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isSubmitting || loading}
                                                className="w-full md:w-auto px-12 py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all font-bold flex items-center justify-center shadow-xl shadow-primary-500/25 disabled:opacity-50 disabled:shadow-none active:scale-95"
                                            >
                                                {loading ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FiSave className="mr-2.5 h-5 w-5" />
                                                        {id ? 'Update Record' : 'Create Resident'}
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                    </Form>
                                )}
                            </Formik>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-8">
                        {/* Guidelines */}
                        <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-6 text-white shadow-xl shadow-primary-500/20">
                            <h3 className="font-bold text-lg mb-4 flex items-center">
                                <FiAlertCircle className="mr-2" />
                                Guidelines
                            </h3>
                            <ul className="space-y-4">
                                {[
                                    'Ensure full legal name is used.',
                                    'Verify date of birth with ID.',
                                    'Provide clear medical history.',
                                    'Emergency contact must be reachable 24/7.'
                                ].map((step, i) => (
                                    <li key={i} className="flex items-start text-sm leading-relaxed opacity-90">
                                        <span className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0 mt-0.5">{i + 1}</span>
                                        {step}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Recent Staff */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-slate-700 transition-colors">
                            <h3 className="font-bold text-gray-800 dark:text-white mb-5 flex items-center">
                                <FiUsers className="mr-2 text-primary-500" />
                                Available Staff
                            </h3>
                            <div className="space-y-5">
                                {staffList.slice(0, 4).length > 0 ? (
                                    staffList.slice(0, 4).map(staff => (
                                        <div key={staff._id} className="flex items-center group cursor-default">
                                            <div className="h-11 w-11 bg-primary-50 dark:bg-slate-900 rounded-xl flex items-center justify-center mr-4 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 transition-colors">
                                                <span className="font-bold text-primary-600 dark:text-primary-400">
                                                    {(staff.user?.name || staff.name)?.charAt(0)}
                                                </span>
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="font-bold text-gray-800 dark:text-white text-sm truncate">{staff.user?.name || staff.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                                    {staff.designation || 'Staff'}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500 text-center py-4">No staff records found</p>
                                )}
                                {staffList.length > 4 && (
                                    <p className="text-xs text-primary-600 dark:text-primary-400 font-bold text-center hover:underline cursor-pointer">
                                        View all {staffList.length} staff members
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Quick Navigation */}
                        <div className="bg-gray-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-gray-100 dark:border-slate-800">
                            <h3 className="font-bold text-gray-800 dark:text-white mb-4 text-sm">Navigation</h3>
                            <div className="grid grid-cols-1 gap-3">
                                <button
                                    onClick={() => navigate('/elderly')}
                                    className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-primary-500 transition-all group"
                                >
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-primary-600 transition-colors">Resident Directory</span>
                                    <FiChevronLeft className="rotate-180 h-4 w-4 text-gray-400" />
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ElderlyForm;
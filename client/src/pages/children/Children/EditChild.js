import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import {
    FiUser, FiCalendar, FiPhone, FiMapPin, FiUpload,
    FiChevronLeft, FiSave, FiUsers, FiAlertCircle, FiTrash2
} from 'react-icons/fi';
import api from '../../../utils/api';
import LoadingSpinner from '../../../components/LoadingSpinner';

const validationSchema = Yup.object({
    name: Yup.string()
        .required('Name is required')
        .min(3, 'Name must be at least 3 characters'),
    dateOfBirth: Yup.date()
        .required('Date of birth is required')
        .max(new Date(), 'Date cannot be in future'),
    gender: Yup.string()
        .required('Gender is required')
        .oneOf(['male', 'female', 'other'], 'Invalid gender'),
    background: Yup.string()
        .required('Background information is required')
        .min(10, 'Background must be at least 10 characters'),
    medicalHistory: Yup.string(),
    allergies: Yup.string(),
    bloodGroup: Yup.string()
        .oneOf(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', null], 'Invalid blood group'),
    status: Yup.string()
        .oneOf(['active', 'discharged', 'transferred'], 'Invalid status'),
    guardianInfo: Yup.object({
        name: Yup.string(),
        relationship: Yup.string()
            .oneOf(['mother', 'father', 'grandparent', 'uncle', 'aunt', 'guardian', 'other', null]),
        phone: Yup.string()
            .matches(/^[0-9]{10}$/, 'Phone must be 10 digits'),
        address: Yup.string()
    })
});

const EditChild = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [child, setChild] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [newPhoto, setNewPhoto] = useState(null);
    const [availableStaff, setAvailableStaff] = useState([]);

    useEffect(() => {
        fetchChildData();
        fetchAvailableStaff();
    }, [id]);

    const fetchChildData = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/children/${id}`);
            setChild(response.data.child);
            if (response.data.child.photo) {
                setPhotoPreview(response.data.child.photo);
            }
        } catch (error) {
            toast.error('Error loading child data');
            navigate('/children');
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableStaff = async () => {
        try {
            const response = await api.get('/staff/available');
            setAvailableStaff(response.data.data || []);
        } catch (error) {
            console.error('Error fetching staff:', error);
        }
    };



    const handleSubmit = async (values, { setSubmitting }) => {
        try {
            setUpdating(true);

            // Update child information
            // Exclude photo from update payload
            const { photo, ...updateValues } = values;
            await api.put(`/children/${id}`, updateValues);

            // Upload new photo if changed
            if (newPhoto) {
                const formData = new FormData();
                formData.append('photo', newPhoto);

                await api.post(`/children/${id}/photo`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
            }

            toast.success('Child updated successfully!');
            navigate(`/children/${id}`);
        } catch (error) {
            console.error('Error:', error);
            const errorMessage = error.response?.data?.message || 'Error updating child';
            const errors = error.response?.data?.errors;

            if (errors && Array.isArray(errors)) {
                errors.forEach(err => toast.error(err));
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setSubmitting(false);
            setUpdating(false);
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

            setNewPhoto(file);
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
            // If there's an existing photo on the server, remove it
            if (child.photo && !newPhoto) {
                if (window.confirm('Remove this photo permanently from the server?')) {
                    await api.delete(`/children/${id}/photo`);
                    toast.success('Photo removed from server');
                } else {
                    return;
                }
            }

            // Clear local states
            setPhotoPreview(null);
            setNewPhoto(null);
            setFieldValue('photo', null);

            // Reset file input
            const input = document.getElementById('photo-upload');
            if (input) input.value = '';

        } catch (error) {
            console.error('Error removing photo:', error);
            toast.error('Error removing photo');
        }
    };

    const handleDischarge = async () => {
        if (window.confirm(`Are you sure you want to discharge ${child?.name}? This action cannot be undone.`)) {
            try {
                await api.delete(`/children/${id}`);
                toast.success('Child discharged successfully');
                navigate('/children');
            } catch (error) {
                toast.error('Error discharging child');
            }
        }
    };

    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
    const relationships = [
        { value: 'mother', label: 'Mother' },
        { value: 'father', label: 'Father' },
        { value: 'grandparent', label: 'Grandparent' },
        { value: 'uncle', label: 'Uncle' },
        { value: 'aunt', label: 'Aunt' },
        { value: 'guardian', label: 'Guardian' },
        { value: 'other', label: 'Other' }
    ];

    if (loading) {
        return <LoadingSpinner message="Loading child data..." />;
    }

    if (!child) {
        return (
            <div className="p-6 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Child not found</h3>
                <button
                    onClick={() => navigate('/children')}
                    className="text-primary-600 hover:text-primary-800"
                >
                    Back to Children List
                </button>
            </div>
        );
    }

    const initialValues = {
        name: child.name || '',
        dateOfBirth: child.dateOfBirth ? new Date(child.dateOfBirth).toISOString().split('T')[0] : '',
        gender: child.gender || '',
        background: child.background || '',
        medicalHistory: child.medicalHistory || '',
        allergies: child.allergies || '',
        bloodGroup: child.bloodGroup || '',
        status: child.status || 'active',
        assignedStaff: child.assignedStaff?._id || child.assignedStaff || '',
        guardianInfo: {
            name: child.guardianInfo?.name || '',
            relationship: child.guardianInfo?.relationship || '',
            phone: child.guardianInfo?.phone || '',
            address: child.guardianInfo?.address || ''
        }
    };

    return (
        <div className="p-6 min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <button
                                onClick={() => navigate(`/children/${id}`)}
                                className="flex items-center text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                            >
                                <FiChevronLeft className="mr-1" />
                                Back to Details
                            </button>
                            <span className="mx-2">/</span>
                            <span className="text-gray-800 dark:text-white font-medium">Edit Child</span>
                        </div>
                        {(child.status === 'active' || child.status === 'transferred') && (
                            <button
                                onClick={handleDischarge}
                                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                            >
                                <FiTrash2 className="mr-2" />
                                Delete / Discharge
                            </button>
                        )}
                    </div>
                    <div className="flex items-center">
                        <div className="h-16 w-16 bg-gradient-to-r from-primary-100 to-primary-200 dark:from-slate-700 dark:to-slate-600 rounded-full flex items-center justify-center mr-4">
                            {photoPreview ? (
                                <img
                                    src={photoPreview}
                                    alt={child.name}
                                    className="h-16 w-16 rounded-full object-cover"
                                />
                            ) : (
                                <FiUser className="h-8 w-8 text-primary-400" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{child.name}</h1>
                            <p className="text-gray-600 dark:text-gray-400">Edit child information and details</p>
                            <div className="flex items-center mt-2">
                                <span className="text-sm font-mono bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-300 px-2 py-1 rounded mr-3">
                                    ID: {child.childId}
                                </span>
                                <span className={`text-sm px-3 py-1 rounded-full ${child.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-400'}`}>
                                    {child.status}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-slate-700">
                            <Formik
                                initialValues={initialValues}
                                validationSchema={validationSchema}
                                onSubmit={handleSubmit}
                                enableReinitialize
                            >
                                {({ isSubmitting, values, setFieldValue }) => (
                                    <Form className="space-y-8">
                                        {/* Photo Upload */}
                                        <div className="border-b dark:border-slate-700 pb-8">
                                            <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">
                                                Profile Photo
                                            </h2>
                                            <div className="flex flex-col items-center">
                                                <div className="relative mb-4">
                                                    <div className="h-40 w-40 rounded-full border-4 border-white dark:border-slate-700 shadow-lg overflow-hidden bg-gradient-to-r from-primary-100 to-primary-200 dark:from-slate-700 dark:to-slate-600">
                                                        {photoPreview ? (
                                                            <img
                                                                src={photoPreview}
                                                                alt="Preview"
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center">
                                                                <FiUser className="h-20 w-20 text-primary-400 dark:text-slate-500" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <label
                                                        htmlFor="photo-upload"
                                                        className="absolute bottom-2 right-2 bg-primary-600 text-white p-3 rounded-full cursor-pointer hover:bg-primary-700 transition shadow-lg"
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
                                                            className="absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition shadow-lg border-2 border-white dark:border-slate-800"
                                                            title="Remove Photo"
                                                        >
                                                            <FiAlertCircle className="rotate-45 h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                                                    Click the upload button to change photo
                                                </p>
                                            </div>
                                        </div>

                                        {/* Basic Information */}
                                        <div className="border-b dark:border-slate-700 pb-8">
                                            <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">
                                                Basic Information
                                            </h2>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Name */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Full Name *
                                                    </label>
                                                    <Field
                                                        type="text"
                                                        name="name"
                                                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-gray-900 dark:text-white"
                                                    />
                                                    <ErrorMessage name="name">
                                                        {msg => <div className="text-red-500 text-sm mt-2">{msg}</div>}
                                                    </ErrorMessage>
                                                </div>

                                                {/* Date of Birth */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Date of Birth *
                                                    </label>
                                                    <Field
                                                        type="date"
                                                        name="dateOfBirth"
                                                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-gray-900 dark:text-white"
                                                    />
                                                    <ErrorMessage name="dateOfBirth">
                                                        {msg => <div className="text-red-500 text-sm mt-2">{msg}</div>}
                                                    </ErrorMessage>
                                                </div>

                                                {/* Gender */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Gender *
                                                    </label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {['male', 'female', 'other'].map(gender => (
                                                            <label key={gender} className="flex items-center dark:text-gray-300">
                                                                <Field
                                                                    type="radio"
                                                                    name="gender"
                                                                    value={gender}
                                                                    className="h-4 w-4 text-primary-600 dark:bg-slate-900"
                                                                />
                                                                <span className="ml-2 text-sm capitalize">{gender}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                    <ErrorMessage name="gender">
                                                        {msg => <div className="text-red-500 text-sm mt-2">{msg}</div>}
                                                    </ErrorMessage>
                                                </div>

                                                {/* Blood Group */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Blood Group
                                                    </label>
                                                    <Field
                                                        as="select"
                                                        name="bloodGroup"
                                                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-gray-900 dark:text-white"
                                                    >
                                                        <option value="" className="dark:bg-slate-900">Select Blood Group</option>
                                                        {bloodGroups.map(group => (
                                                            <option key={group} value={group} className="dark:bg-slate-900">{group}</option>
                                                        ))}
                                                    </Field>
                                                </div>

                                                {/* Status */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Status *
                                                    </label>
                                                    <Field
                                                        as="select"
                                                        name="status"
                                                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-gray-900 dark:text-white"
                                                    >
                                                        <option value="active" className="dark:bg-slate-900">Active</option>
                                                        <option value="discharged" className="dark:bg-slate-900">Discharged</option>
                                                        <option value="transferred" className="dark:bg-slate-900">Transferred</option>
                                                    </Field>
                                                </div>

                                                {/* Assigned Staff */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                                        <FiUsers className="mr-2" />
                                                        Assign Caretaker/Staff
                                                    </label>
                                                    <Field
                                                        as="select"
                                                        name="assignedStaff"
                                                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-gray-900 dark:text-white"
                                                    >
                                                        <option value="" className="dark:bg-slate-900">Select Staff (Optional)</option>
                                                        {availableStaff.map(staff => (
                                                            <option key={staff._id} value={staff.user?._id || staff.user} className="dark:bg-slate-900">
                                                                {staff.user?.name || 'Staff'} ({staff.designation})
                                                            </option>
                                                        ))}
                                                    </Field>
                                                    <p className="mt-1 text-xs text-gray-500">Assign a staff member to look after this child</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Background & Medical */}
                                        <div className="border-b dark:border-slate-700 pb-8">
                                            <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">
                                                Background & Medical Information
                                            </h2>
                                            <div className="space-y-6">
                                                {/* Background */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Background / History *
                                                    </label>
                                                    <Field
                                                        as="textarea"
                                                        name="background"
                                                        rows="4"
                                                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-gray-900 dark:text-white"
                                                    />
                                                    <ErrorMessage name="background">
                                                        {msg => <div className="text-red-500 text-sm mt-2">{msg}</div>}
                                                    </ErrorMessage>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {/* Medical History */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                            Medical History
                                                        </label>
                                                        <Field
                                                            as="textarea"
                                                            name="medicalHistory"
                                                            rows="4"
                                                            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-gray-900 dark:text-white"
                                                        />
                                                    </div>

                                                    {/* Allergies */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                            Allergies
                                                        </label>
                                                        <Field
                                                            as="textarea"
                                                            name="allergies"
                                                            rows="4"
                                                            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-gray-900 dark:text-white"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Guardian Information */}
                                        <div className="border-b dark:border-slate-700 pb-8">
                                            <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">
                                                Guardian Information
                                            </h2>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Guardian Name */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Guardian Name
                                                    </label>
                                                    <Field
                                                        type="text"
                                                        name="guardianInfo.name"
                                                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-gray-900 dark:text-white"
                                                    />
                                                </div>

                                                {/* Relationship */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Relationship
                                                    </label>
                                                    <Field
                                                        as="select"
                                                        name="guardianInfo.relationship"
                                                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-gray-900 dark:text-white"
                                                    >
                                                        <option value="" className="dark:bg-slate-900">Select Relationship</option>
                                                        {relationships.map(rel => (
                                                            <option key={rel.value} value={rel.value} className="dark:bg-slate-900">{rel.label}</option>
                                                        ))}
                                                    </Field>
                                                </div>

                                                {/* Phone */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Phone Number
                                                    </label>
                                                    <Field
                                                        type="tel"
                                                        name="guardianInfo.phone"
                                                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-gray-900 dark:text-white"
                                                    />
                                                    <ErrorMessage name="guardianInfo.phone">
                                                        {msg => <div className="text-red-500 text-sm mt-2">{msg}</div>}
                                                    </ErrorMessage>
                                                </div>

                                                {/* Address */}
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Address
                                                    </label>
                                                    <Field
                                                        as="textarea"
                                                        name="guardianInfo.address"
                                                        rows="3"
                                                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-gray-900 dark:text-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Form Actions */}
                                        <div className="flex justify-end space-x-4 pt-8">
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/children/${id}`)}
                                                className="px-8 py-3 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition font-medium text-gray-700 dark:text-gray-300"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isSubmitting || updating}
                                                className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                            >
                                                {updating ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                                        Updating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FiSave className="mr-2" />
                                                        Update Child
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </Form>
                                )}
                            </Formik>
                        </div>
                    </div>

                    {/* Sidebar - Child Info & Actions */}
                    <div className="lg:col-span-1">
                        {/* Child Information */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 mb-6 border border-gray-100 dark:border-slate-700">
                            <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Child Information</h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Child ID</p>
                                    <p className="font-medium text-gray-800 dark:text-white font-mono">{child.childId}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Age</p>
                                    <p className="font-medium text-gray-800 dark:text-white">{child.age || 'N/A'} years</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Admission Date</p>
                                    <p className="font-medium text-gray-800 dark:text-white">
                                        {new Date(child.dateOfAdmission).toLocaleDateString('en-IN')}
                                    </p>
                                </div>
                                {child.dischargeDate && (
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Discharge Date</p>
                                        <p className="font-medium text-gray-800 dark:text-white">
                                            {new Date(child.dischargeDate).toLocaleDateString('en-IN')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 mb-6 border border-gray-100 dark:border-slate-700">
                            <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Recent Activity</h3>
                            <div className="space-y-3">
                                <div className="p-3 bg-primary-50 dark:bg-slate-900/50 rounded-lg">
                                    <p className="text-sm font-medium text-primary-800 dark:text-primary-400">Last Updated</p>
                                    <p className="text-xs text-primary-600 dark:text-primary-300">
                                        {child.updatedAt ? new Date(child.updatedAt).toLocaleString() : 'N/A'}
                                    </p>
                                </div>
                                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <p className="text-sm font-medium text-green-800 dark:text-green-400">Created By</p>
                                    <p className="text-xs text-green-600 dark:text-green-300">{child.createdBy?.name || 'Admin'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-slate-700">
                            <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <button
                                    onClick={() => navigate(`/reports/add?child=${id}`)}
                                    className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                                >
                                    <p className="font-medium text-gray-800 dark:text-white">Add Daily Report</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Record today's activities</p>
                                </button>
                                <button
                                    onClick={() => navigate(`/attendance/mark?child=${id}`)}
                                    className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                                >
                                    <p className="font-medium text-gray-800 dark:text-white">Mark Attendance</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Record attendance</p>
                                </button>
                                <button
                                    onClick={() => navigate(`/children/${id}`)}
                                    className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                                >
                                    <p className="font-medium text-gray-800 dark:text-white">View Details</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">See full profile</p>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditChild;
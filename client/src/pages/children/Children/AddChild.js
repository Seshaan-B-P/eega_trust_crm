import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import {
    FiUser, FiCalendar, FiPhone, FiMapPin, FiUpload,
    FiChevronLeft, FiSave, FiUsers, FiAlertCircle
} from 'react-icons/fi';
import api from '../../../utils/api';
import LoadingSpinner from '../../../components/LoadingSpinner';


const validationSchema = Yup.object({
    name: Yup.string()
        .required('Name is required')
        .min(3, 'Name must be at least 3 characters')
        .max(100, 'Name must be less than 100 characters'),
    dateOfBirth: Yup.date()
        .required('Date of birth is required')
        .max(new Date(), 'Date cannot be in future')
        .test('age', 'Child must be under 18 years', function (value) {
            const today = new Date();
            const birthDate = new Date(value);
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();

            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return age < 18;
        }),
    gender: Yup.string()
        .required('Gender is required')
        .oneOf(['male', 'female', 'other'], 'Invalid gender'),
    background: Yup.string()
        .required('Background information is required')
        .min(10, 'Background must be at least 10 characters'),
    medicalHistory: Yup.string()
        .max(500, 'Medical history must be less than 500 characters'),
    allergies: Yup.string()
        .max(200, 'Allergies must be less than 200 characters'),
    bloodGroup: Yup.string()
        .oneOf(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', null], 'Invalid blood group'),
    guardianInfo: Yup.object({
        name: Yup.string()
            .max(100, 'Name must be less than 100 characters'),
        relationship: Yup.string()
            .oneOf(['mother', 'father', 'grandparent', 'uncle', 'aunt', 'guardian', 'other', null]),
        phone: Yup.string()
            .matches(/^[0-9]{10}$/, 'Phone must be 10 digits'),
        address: Yup.string()
            .max(200, 'Address must be less than 200 characters')
    })
});

const AddChild = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [availableStaff, setAvailableStaff] = useState([]);

    useEffect(() => {
        fetchAvailableStaff();
    }, []);

    const fetchAvailableStaff = async () => {
        try {
            const response = await api.get('/staff/available');
            setAvailableStaff(response.data.data || []);
        } catch (error) {
            console.error('Error fetching staff:', error);
        }
    };

    const initialValues = {
        name: '',
        dateOfBirth: '',
        gender: '',
        background: '',
        medicalHistory: '',
        allergies: '',
        bloodGroup: '',
        assignedStaff: '',
        guardianInfo: {
            name: '',
            relationship: '',
            phone: '',
            address: ''
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

    const handleSubmit = async (values, { setSubmitting, resetForm }) => {
        try {
            setLoading(true);

            // Sanitize values to handle empty strings for optional fields
            // Sanitize values to handle empty strings for optional fields
            // Exclude photo from initial create request as it's handled separately
            const { photo, ...restValues } = values;
            const cleanedValues = {
                ...restValues,
                guardianInfo: {
                    ...values.guardianInfo,
                    relationship: values.guardianInfo.relationship || null
                }
            };

            const response = await api.post('/children', cleanedValues);

            // If photo was selected, upload it
            if (photo) {
                const formData = new FormData();
                formData.append('photo', photo);

                try {
                    // response.data contains the JSON body { success, message, child }
                    const targetId = response.data?.child?._id || response.data?.child?.id || response.data?.data?._id || response.data?._id;
                    console.log('Detected created child ID for photo upload:', targetId);
                    if (targetId) {
                        const uploadResponse = await api.post(`/children/${targetId}/photo`, formData, {
                            headers: {
                                'Content-Type': 'multipart/form-data'
                            }
                        });
                        console.log('Photo upload response:', uploadResponse.data);
                    } else {
                        console.error('Child ID not found in response body:', response.data);
                    }
                } catch (uploadError) {
                    console.error('Error uploading photo:', uploadError);
                }
            }

            toast.success('Child added successfully!');
            resetForm();
            setPhotoPreview(null);
            navigate('/children');
        } catch (error) {
            console.error('Error:', error);
            const errorMessage = error.response?.data?.message || 'Error adding child';
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

    const handlePhotoChange = (event, setFieldValue) => {
        const file = event.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('Please select an image file');
                return;
            }

            // Validate file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image must be less than 5MB');
                return;
            }

            setFieldValue('photo', file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="p-6 min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
            <div className="max-w-6xl mx-auto">
                {/* Header with Breadcrumbs */}
                <div className="mb-8">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                        <button
                            onClick={() => navigate('/children')}
                            className="flex items-center text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                            <FiChevronLeft className="mr-1" />
                            Back to Children
                        </button>
                        <span className="mx-2">/</span>
                        <span className="text-gray-800 dark:text-white font-medium">Add New Child</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Add New Child</h1>
                    <p className="text-gray-600 dark:text-gray-400">Register a new child in the orphanage</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-slate-700">
                            <Formik
                                initialValues={initialValues}
                                validationSchema={validationSchema}
                                onSubmit={handleSubmit}
                            >
                                {({ isSubmitting, values, setFieldValue }) => (
                                    <Form className="space-y-8">
                                        {/* Photo Upload */}
                                        <div className="border-b dark:border-slate-700 pb-8">
                                            <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white flex items-center">
                                                <FiUser className="mr-3" />
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
                                                            onClick={() => {
                                                                setPhotoPreview(null);
                                                                setFieldValue('photo', null);
                                                                // Also reset the file input if needed
                                                                const input = document.getElementById('photo-upload');
                                                                if (input) input.value = '';
                                                            }}
                                                            className="absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition shadow-lg border-2 border-white dark:border-slate-800"
                                                            title="Remove Photo"
                                                        >
                                                            <FiAlertCircle className="rotate-45 h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                                                    Upload a clear photo of the child (optional)
                                                    <br />
                                                    Max size: 5MB • JPG, PNG, GIF
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
                                                        placeholder="Enter child's full name"
                                                    />
                                                    <ErrorMessage name="name">
                                                        {msg => <div className="text-red-500 text-sm mt-2 flex items-center">
                                                            <FiAlertCircle className="mr-1" /> {msg}
                                                        </div>}
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
                                                        {msg => <div className="text-red-500 text-sm mt-2 flex items-center">
                                                            <FiAlertCircle className="mr-1" /> {msg}
                                                        </div>}
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
                                                                    className="h-4 w-4 text-primary-600 dark:bg-slate-900 dark:border-slate-700"
                                                                />
                                                                <span className="ml-2 text-sm capitalize">{gender}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                    <ErrorMessage name="gender">
                                                        {msg => <div className="text-red-500 text-sm mt-2 flex items-center">
                                                            <FiAlertCircle className="mr-1" /> {msg}
                                                        </div>}
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
                                                    <p className="mt-1 text-xs text-gray-500">Assign a staff member or leave blank for auto-assignment based on workload</p>
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
                                                        placeholder="Describe child's background, how they came to the orphanage, family situation..."
                                                    />
                                                    <ErrorMessage name="background">
                                                        {msg => <div className="text-red-500 text-sm mt-2 flex items-center">
                                                            <FiAlertCircle className="mr-1" /> {msg}
                                                        </div>}
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
                                                            placeholder="Any medical conditions, past illnesses, surgeries..."
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
                                                            placeholder="List any allergies (food, medicine, environmental)..."
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Guardian Information */}
                                        <div className="border-b dark:border-slate-700 pb-8">
                                            <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white flex items-center">
                                                <FiPhone className="mr-3" />
                                                Guardian Information (Optional)
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
                                                        placeholder="Guardian's full name"
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
                                                        placeholder="10-digit phone number"
                                                    />
                                                    <ErrorMessage name="guardianInfo.phone">
                                                        {msg => <div className="text-red-500 text-sm mt-2 flex items-center">
                                                            <FiAlertCircle className="mr-1" /> {msg}
                                                        </div>}
                                                    </ErrorMessage>
                                                </div>

                                                {/* Address */}
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                                        <FiMapPin className="mr-2" />
                                                        Address
                                                    </label>
                                                    <Field
                                                        as="textarea"
                                                        name="guardianInfo.address"
                                                        rows="3"
                                                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-gray-900 dark:text-white"
                                                        placeholder="Complete address with city, state, and pin code"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Form Actions */}
                                        <div className="flex justify-end space-x-4 pt-8">
                                            <button
                                                type="button"
                                                onClick={() => navigate('/children')}
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
                                                        Adding Child...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FiSave className="mr-2" />
                                                        Add Child
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </Form>
                                )}
                            </Formik>
                        </div>
                    </div>

                    {/* Sidebar - Guidelines & Stats */}
                    <div className="lg:col-span-1">
                        {/* Guidelines */}
                        <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-slate-800/50 dark:to-slate-800 rounded-xl p-6 mb-6 border border-primary-200 dark:border-slate-700">
                            <h3 className="font-semibold text-primary-800 dark:text-primary-400 mb-4 flex items-center">
                                <FiAlertCircle className="mr-2" />
                                Important Guidelines
                            </h3>
                            <ul className="space-y-3">
                                <li className="flex items-start">
                                    <span className="h-2 w-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                    <span className="text-sm text-primary-700 dark:text-slate-300">Fields marked with * are required</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="h-2 w-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                    <span className="text-sm text-primary-700 dark:text-slate-300">Child ID will be auto-generated</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="h-2 w-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                    <span className="text-sm text-primary-700 dark:text-slate-300">Age is calculated automatically</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="h-2 w-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                    <span className="text-sm text-primary-700 dark:text-slate-300">Guardian info can be updated later</span>
                                </li>
                            </ul>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-slate-700">
                            <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <button
                                    onClick={() => navigate('/attendance/mark')}
                                    className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                                >
                                    <p className="font-medium text-gray-800 dark:text-white">Mark Attendance</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Mark today's attendance quickly</p>
                                </button>
                                <button
                                    onClick={() => navigate('/reports/add')}
                                    className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                                >
                                    <p className="font-medium text-gray-800 dark:text-white">Add Daily Report</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Create daily health report</p>
                                </button>
                                <button
                                    onClick={() => navigate('/staff/add')}
                                    className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                                >
                                    <p className="font-medium text-gray-800 dark:text-white">Add Staff Member</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Register new staff</p>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddChild;
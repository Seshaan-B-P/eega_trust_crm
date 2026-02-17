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
    assignedStaff: Yup.string(),
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
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [photoPreview, setPhotoPreview] = useState(null);

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            const response = await api.get('/staff/available');
            setStaffList(response.data.data || []);
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
            const cleanedValues = {
                ...values,
                assignedStaff: values.assignedStaff || null,
                guardianInfo: {
                    ...values.guardianInfo,
                    relationship: values.guardianInfo.relationship || null
                }
            };

            const response = await api.post('/children', cleanedValues);

            // If photo was selected, upload it
            if (photoPreview) {
                const formData = new FormData();
                formData.append('photo', photoPreview);

                try {
                    await api.post(`/children/${response.data.data._id}/photo`, formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    });
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
        <div className="p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header with Breadcrumbs */}
                <div className="mb-8">
                    <div className="flex items-center text-sm text-gray-600 mb-4">
                        <button
                            onClick={() => navigate('/children')}
                            className="flex items-center text-blue-600 hover:text-blue-800"
                        >
                            <FiChevronLeft className="mr-1" />
                            Back to Children
                        </button>
                        <span className="mx-2">/</span>
                        <span className="text-gray-800 font-medium">Add New Child</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">Add New Child</h1>
                    <p className="text-gray-600">Register a new child in the orphanage</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <Formik
                                initialValues={initialValues}
                                validationSchema={validationSchema}
                                onSubmit={handleSubmit}
                            >
                                {({ isSubmitting, values, setFieldValue }) => (
                                    <Form className="space-y-8">
                                        {/* Photo Upload */}
                                        <div className="border-b pb-8">
                                            <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center">
                                                <FiUser className="mr-3" />
                                                Profile Photo
                                            </h2>
                                            <div className="flex flex-col items-center">
                                                <div className="relative mb-4">
                                                    <div className="h-40 w-40 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gradient-to-r from-blue-100 to-blue-200">
                                                        {photoPreview ? (
                                                            <img
                                                                src={photoPreview}
                                                                alt="Preview"
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center">
                                                                <FiUser className="h-20 w-20 text-blue-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <label
                                                        htmlFor="photo-upload"
                                                        className="absolute bottom-2 right-2 bg-blue-600 text-white p-3 rounded-full cursor-pointer hover:bg-blue-700 transition shadow-lg"
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
                                                </div>
                                                <p className="text-sm text-gray-500 text-center">
                                                    Upload a clear photo of the child (optional)
                                                    <br />
                                                    Max size: 5MB • JPG, PNG, GIF
                                                </p>
                                            </div>
                                        </div>

                                        {/* Basic Information */}
                                        <div className="border-b pb-8">
                                            <h2 className="text-xl font-semibold mb-6 text-gray-800">
                                                Basic Information
                                            </h2>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Name */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Full Name *
                                                    </label>
                                                    <Field
                                                        type="text"
                                                        name="name"
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Date of Birth *
                                                    </label>
                                                    <Field
                                                        type="date"
                                                        name="dateOfBirth"
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                    />
                                                    <ErrorMessage name="dateOfBirth">
                                                        {msg => <div className="text-red-500 text-sm mt-2 flex items-center">
                                                            <FiAlertCircle className="mr-1" /> {msg}
                                                        </div>}
                                                    </ErrorMessage>
                                                </div>

                                                {/* Gender */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Gender *
                                                    </label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {['male', 'female', 'other'].map(gender => (
                                                            <label key={gender} className="flex items-center">
                                                                <Field
                                                                    type="radio"
                                                                    name="gender"
                                                                    value={gender}
                                                                    className="h-4 w-4 text-blue-600"
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
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Blood Group
                                                    </label>
                                                    <Field
                                                        as="select"
                                                        name="bloodGroup"
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                    >
                                                        <option value="">Select Blood Group</option>
                                                        {bloodGroups.map(group => (
                                                            <option key={group} value={group}>{group}</option>
                                                        ))}
                                                    </Field>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Background & Medical */}
                                        <div className="border-b pb-8">
                                            <h2 className="text-xl font-semibold mb-6 text-gray-800">
                                                Background & Medical Information
                                            </h2>
                                            <div className="space-y-6">
                                                {/* Background */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Background / History *
                                                    </label>
                                                    <Field
                                                        as="textarea"
                                                        name="background"
                                                        rows="4"
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Medical History
                                                        </label>
                                                        <Field
                                                            as="textarea"
                                                            name="medicalHistory"
                                                            rows="4"
                                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                            placeholder="Any medical conditions, past illnesses, surgeries..."
                                                        />
                                                    </div>

                                                    {/* Allergies */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Allergies
                                                        </label>
                                                        <Field
                                                            as="textarea"
                                                            name="allergies"
                                                            rows="4"
                                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                            placeholder="List any allergies (food, medicine, environmental)..."
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Guardian Information */}
                                        <div className="border-b pb-8">
                                            <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center">
                                                <FiPhone className="mr-3" />
                                                Guardian Information (Optional)
                                            </h2>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Guardian Name */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Guardian Name
                                                    </label>
                                                    <Field
                                                        type="text"
                                                        name="guardianInfo.name"
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                        placeholder="Guardian's full name"
                                                    />
                                                </div>

                                                {/* Relationship */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Relationship
                                                    </label>
                                                    <Field
                                                        as="select"
                                                        name="guardianInfo.relationship"
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                    >
                                                        <option value="">Select Relationship</option>
                                                        {relationships.map(rel => (
                                                            <option key={rel.value} value={rel.value}>{rel.label}</option>
                                                        ))}
                                                    </Field>
                                                </div>

                                                {/* Phone */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Phone Number
                                                    </label>
                                                    <Field
                                                        type="tel"
                                                        name="guardianInfo.phone"
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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
                                                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                                                        <FiMapPin className="mr-2" />
                                                        Address
                                                    </label>
                                                    <Field
                                                        as="textarea"
                                                        name="guardianInfo.address"
                                                        rows="3"
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                        placeholder="Complete address with city, state, and pin code"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Staff Assignment */}
                                        <div>
                                            <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center">
                                                <FiUsers className="mr-3" />
                                                Staff Assignment
                                            </h2>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Assign to Staff (Optional)
                                                    </label>
                                                    <Field
                                                        as="select"
                                                        name="assignedStaff"
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                    >
                                                        <option value="">Select Staff Member</option>
                                                        {staffList.map(staff => (
                                                            <option key={staff._id} value={staff.user?._id}>
                                                                {staff.user?.name} ({staff.employeeId}) - {staff.assignedChildrenCount}/{staff.maxChildrenCapacity} children
                                                            </option>
                                                        ))}
                                                    </Field>
                                                    <p className="text-sm text-gray-500 mt-2">
                                                        Assigning a staff member helps in daily monitoring and reporting
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Form Actions */}
                                        <div className="flex justify-end space-x-4 pt-8">
                                            <button
                                                type="button"
                                                onClick={() => navigate('/children')}
                                                className="px-8 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isSubmitting || loading}
                                                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 mb-6 border border-blue-200">
                            <h3 className="font-semibold text-blue-800 mb-4 flex items-center">
                                <FiAlertCircle className="mr-2" />
                                Important Guidelines
                            </h3>
                            <ul className="space-y-3">
                                <li className="flex items-start">
                                    <span className="h-2 w-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                    <span className="text-sm text-blue-700">Fields marked with * are required</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="h-2 w-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                    <span className="text-sm text-blue-700">Child ID will be auto-generated</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="h-2 w-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                    <span className="text-sm text-blue-700">Age is calculated automatically</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="h-2 w-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                    <span className="text-sm text-blue-700">Guardian info can be updated later</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="h-2 w-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                    <span className="text-sm text-blue-700">Staff assignment can be changed anytime</span>
                                </li>
                            </ul>
                        </div>

                        {/* Available Staff */}
                        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                            <h3 className="font-semibold text-gray-800 mb-4">Available Staff</h3>
                            <div className="space-y-4">
                                {staffList.slice(0, 3).map(staff => (
                                    <div key={staff._id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                                        <div className="h-10 w-10 bg-gradient-to-r from-green-100 to-green-200 rounded-full flex items-center justify-center mr-3">
                                            <span className="font-semibold text-green-600">
                                                {staff.user?.name?.charAt(0)}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-800">{staff.user?.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {staff.designation} • {staff.assignedChildrenCount}/{staff.maxChildrenCapacity} children
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {staffList.length > 3 && (
                                    <p className="text-sm text-gray-500 text-center">
                                        +{staffList.length - 3} more staff available
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Recent Additions */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h3 className="font-semibold text-gray-800 mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <button
                                    onClick={() => navigate('/attendance/mark')}
                                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                                >
                                    <p className="font-medium text-gray-800">Mark Attendance</p>
                                    <p className="text-sm text-gray-500">Mark today's attendance quickly</p>
                                </button>
                                <button
                                    onClick={() => navigate('/reports/add')}
                                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                                >
                                    <p className="font-medium text-gray-800">Add Daily Report</p>
                                    <p className="text-sm text-gray-500">Create daily health report</p>
                                </button>
                                <button
                                    onClick={() => navigate('/staff/add')}
                                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                                >
                                    <p className="font-medium text-gray-800">Add Staff Member</p>
                                    <p className="text-sm text-gray-500">Register new staff</p>
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
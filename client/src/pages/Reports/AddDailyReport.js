import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import { 
    FiUser, FiCalendar, FiActivity, FiHeart,
    FiChevronLeft, FiSave, FiAlertCircle, FiPlus,
    FiTrash2
} from 'react-icons/fi';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const validationSchema = Yup.object({
    child: Yup.string()
        .required('Please select a child'),
    date: Yup.date()
        .required('Date is required')
        .max(new Date(), 'Date cannot be in future'),
    healthStatus: Yup.object({
        overall: Yup.string()
            .required('Health status is required'),
        temperature: Yup.number()
            .min(35, 'Temperature must be at least 35°C')
            .max(42, 'Temperature cannot exceed 42°C'),
        symptoms: Yup.array(),
        medication: Yup.string()
    }),
    morningMeal: Yup.string()
        .oneOf(['good', 'average', 'poor', 'skipped', null]),
    afternoonMeal: Yup.string()
        .oneOf(['good', 'average', 'poor', 'skipped', null]),
    eveningMeal: Yup.string()
        .oneOf(['good', 'average', 'poor', 'skipped', null]),
    behavior: Yup.string()
        .oneOf(['excellent', 'good', 'average', 'needs_attention', null]),
    activities: Yup.array(),
    specialNotes: Yup.string()
        .max(500, 'Special notes must be less than 500 characters')
});

const AddDailyReport = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const preselectedChildId = queryParams.get('child');

    const [children, setChildren] = useState([]);
    const [selectedChild, setSelectedChild] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetchingChildren, setFetchingChildren] = useState(true);

    useEffect(() => {
        fetchAssignedChildren();
    }, []);

    useEffect(() => {
        if (preselectedChildId && children.length > 0) {
            const child = children.find(c => c._id === preselectedChildId);
            setSelectedChild(child);
        }
    }, [preselectedChildId, children]);

    const fetchAssignedChildren = async () => {
        try {
            setFetchingChildren(true);
            const response = await api.get('/children?status=active');
            setChildren(response.data.data || []);
        } catch (error) {
            toast.error('Error fetching children');
            console.error('Error:', error);
        } finally {
            setFetchingChildren(false);
        }
    };

    const initialValues = {
        child: preselectedChildId || '',
        date: new Date().toISOString().split('T')[0],
        healthStatus: {
            overall: 'good',
            temperature: '',
            symptoms: [],
            medication: ''
        },
        morningMeal: '',
        afternoonMeal: '',
        eveningMeal: '',
        behavior: 'good',
        activities: [],
        specialNotes: ''
    };

    const healthOptions = [
        { value: 'excellent', label: 'Excellent', color: 'text-green-600 bg-green-100' },
        { value: 'good', label: 'Good', color: 'text-blue-600 bg-blue-100' },
        { value: 'fair', label: 'Fair', color: 'text-yellow-600 bg-yellow-100' },
        { value: 'poor', label: 'Poor', color: 'text-red-600 bg-red-100' }
    ];

    const mealOptions = [
        { value: 'good', label: 'Good', color: 'text-green-600' },
        { value: 'average', label: 'Average', color: 'text-yellow-600' },
        { value: 'poor', label: 'Poor', color: 'text-red-600' },
        { value: 'skipped', label: 'Skipped', color: 'text-gray-600' }
    ];

    const behaviorOptions = [
        { value: 'excellent', label: 'Excellent', color: 'text-green-600 bg-green-100' },
        { value: 'good', label: 'Good', color: 'text-blue-600 bg-blue-100' },
        { value: 'average', label: 'Average', color: 'text-yellow-600 bg-yellow-100' },
        { value: 'needs_attention', label: 'Needs Attention', color: 'text-red-600 bg-red-100' }
    ];

    const commonSymptoms = [
        'Fever', 'Cough', 'Cold', 'Headache', 'Stomachache',
        'Vomiting', 'Diarrhea', 'Rash', 'Fatigue', 'Injury'
    ];

    const handleSubmit = async (values, { setSubmitting, resetForm }) => {
        try {
            setLoading(true);
            
            const response = await api.post('/reports', values);
            
            toast.success('Daily report added successfully!');
            resetForm();
            navigate('/reports');
        } catch (error) {
            console.error('Error:', error);
            const errorMessage = error.response?.data?.message || 'Error adding daily report';
            
            if (errorMessage.includes('already exists')) {
                toast.error('Report already exists for this child today');
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setSubmitting(false);
            setLoading(false);
        }
    };

    if (fetchingChildren) {
        return <LoadingSpinner message="Loading children..." />;
    }

    return (
        <div className="p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center text-sm text-gray-600 mb-4">
                        <button
                            onClick={() => navigate('/reports')}
                            className="flex items-center text-blue-600 hover:text-blue-800"
                        >
                            <FiChevronLeft className="mr-1" />
                            Back to Reports
                        </button>
                        <span className="mx-2">/</span>
                        <span className="text-gray-800 font-medium">Add Daily Report</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">Add Daily Report</h1>
                    <p className="text-gray-600">Record daily health, meal, and activity information</p>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                    <Formik
                        initialValues={initialValues}
                        validationSchema={validationSchema}
                        onSubmit={handleSubmit}
                    >
                        {({ isSubmitting, values, setFieldValue }) => (
                            <Form className="space-y-8">
                                {/* Child Selection */}
                                <div className="border-b pb-8">
                                    <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center">
                                        <FiUser className="mr-3" />
                                        Child Information
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Select Child *
                                            </label>
                                            <Field
                                                as="select"
                                                name="child"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                onChange={(e) => {
                                                    const childId = e.target.value;
                                                    setFieldValue('child', childId);
                                                    const child = children.find(c => c._id === childId);
                                                    setSelectedChild(child);
                                                }}
                                            >
                                                <option value="">Select a child</option>
                                                {children.map(child => (
                                                    <option key={child._id} value={child._id}>
                                                        {child.name} ({child.childId})
                                                    </option>
                                                ))}
                                            </Field>
                                            <ErrorMessage name="child">
                                                {msg => <div className="text-red-500 text-sm mt-2">{msg}</div>}
                                            </ErrorMessage>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Report Date *
                                            </label>
                                            <Field
                                                type="date"
                                                name="date"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                            />
                                            <ErrorMessage name="date">
                                                {msg => <div className="text-red-500 text-sm mt-2">{msg}</div>}
                                            </ErrorMessage>
                                        </div>
                                    </div>
                                    {selectedChild && (
                                        <div className="mt-4 p-4 bg-blue-50 rounded-lg flex items-center">
                                            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                                                <span className="font-semibold text-blue-600 text-lg">
                                                    {selectedChild.name.charAt(0)}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">{selectedChild.name}</p>
                                                <p className="text-sm text-gray-600">
                                                    ID: {selectedChild.childId} • Age: {selectedChild.age} years
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Health Status */}
                                <div className="border-b pb-8">
                                    <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center">
                                        <FiHeart className="mr-3" />
                                        Health Status
                                    </h2>
                                    <div className="space-y-6">
                                        {/* Overall Health */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                                Overall Health *
                                            </label>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                {healthOptions.map(option => (
                                                    <label
                                                        key={option.value}
                                                        className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition ${
                                                            values.healthStatus.overall === option.value
                                                                ? `${option.color} border-blue-500`
                                                                : 'border-gray-200 hover:border-blue-300'
                                                        }`}
                                                    >
                                                        <Field
                                                            type="radio"
                                                            name="healthStatus.overall"
                                                            value={option.value}
                                                            className="hidden"
                                                        />
                                                        <span className="font-medium">{option.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                            <ErrorMessage name="healthStatus.overall">
                                                {msg => <div className="text-red-500 text-sm mt-2">{msg}</div>}
                                            </ErrorMessage>
                                        </div>

                                        {/* Temperature */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Body Temperature (°C)
                                                </label>
                                                <Field
                                                    type="number"
                                                    name="healthStatus.temperature"
                                                    step="0.1"
                                                    min="35"
                                                    max="42"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                    placeholder="36.5"
                                                />
                                                <ErrorMessage name="healthStatus.temperature">
                                                    {msg => <div className="text-red-500 text-sm mt-2">{msg}</div>}
                                                </ErrorMessage>
                                            </div>

                                            {/* Medication */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Medication
                                                </label>
                                                <Field
                                                    type="text"
                                                    name="healthStatus.medication"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                    placeholder="Any medication given"
                                                />
                                            </div>
                                        </div>

                                        {/* Symptoms */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                                Symptoms
                                            </label>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                {commonSymptoms.map(symptom => (
                                                    <label key={symptom} className="flex items-center p-2 border border-gray-200 rounded hover:bg-gray-50">
                                                        <Field
                                                            type="checkbox"
                                                            name="healthStatus.symptoms"
                                                            value={symptom}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                            onChange={(e) => {
                                                                const checked = e.target.checked;
                                                                const currentSymptoms = values.healthStatus.symptoms || [];
                                                                if (checked) {
                                                                    setFieldValue('healthStatus.symptoms', [...currentSymptoms, symptom]);
                                                                } else {
                                                                    setFieldValue('healthStatus.symptoms', currentSymptoms.filter(s => s !== symptom));
                                                                }
                                                            }}
                                                        />
                                                        <span className="ml-2 text-sm text-gray-700">{symptom}</span>
                                                    </label>
                                                ))}
                                            </div>
                                            <Field
                                                type="text"
                                                name="healthStatus.otherSymptoms"
                                                className="mt-3 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                placeholder="Other symptoms (comma separated)"
                                                onChange={(e) => {
                                                    const otherSymptoms = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                                                    const currentSymptoms = values.healthStatus.symptoms || [];
                                                    setFieldValue('healthStatus.symptoms', [...currentSymptoms, ...otherSymptoms]);
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Meal Attendance */}
                                <div className="border-b pb-8">
                                    <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center">
                                        <FiActivity className="mr-3" />
                                        Meal Attendance
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {['morningMeal', 'afternoonMeal', 'eveningMeal'].map((meal, index) => (
                                            <div key={meal}>
                                                <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                                                    {meal.replace('Meal', '')} Meal
                                                </label>
                                                <Field
                                                    as="select"
                                                    name={meal}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                >
                                                    <option value="">Not recorded</option>
                                                    {mealOptions.map(option => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </Field>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Behavior */}
                                <div className="border-b pb-8">
                                    <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center">
                                        <FiActivity className="mr-3" />
                                        Behavior & Activities
                                    </h2>
                                    <div className="space-y-6">
                                        {/* Behavior */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                                Behavior
                                            </label>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                {behaviorOptions.map(option => (
                                                    <label
                                                        key={option.value}
                                                        className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition ${
                                                            values.behavior === option.value
                                                                ? `${option.color} border-blue-500`
                                                                : 'border-gray-200 hover:border-blue-300'
                                                        }`}
                                                    >
                                                        <Field
                                                            type="radio"
                                                            name="behavior"
                                                            value={option.value}
                                                            className="hidden"
                                                        />
                                                        <span className="font-medium">{option.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Activities */}
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Activities
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const activities = values.activities || [];
                                                        setFieldValue('activities', [
                                                            ...activities,
                                                            { activity: '', duration: '', remarks: '' }
                                                        ]);
                                                    }}
                                                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                                                >
                                                    <FiPlus className="mr-1" />
                                                    Add Activity
                                                </button>
                                            </div>
                                            <div className="space-y-3">
                                                {(values.activities || []).map((activity, index) => (
                                                    <div key={index} className="flex items-start space-x-3">
                                                        <div className="flex-1 grid grid-cols-3 gap-3">
                                                            <Field
                                                                type="text"
                                                                name={`activities[${index}].activity`}
                                                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                                placeholder="Activity name"
                                                            />
                                                            <Field
                                                                type="text"
                                                                name={`activities[${index}].duration`}
                                                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                                placeholder="Duration"
                                                            />
                                                            <Field
                                                                type="text"
                                                                name={`activities[${index}].remarks`}
                                                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                                placeholder="Remarks"
                                                            />
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const activities = values.activities.filter((_, i) => i !== index);
                                                                setFieldValue('activities', activities);
                                                            }}
                                                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
                                                        >
                                                            <FiTrash2 className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Special Notes */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Special Notes
                                    </label>
                                    <Field
                                        as="textarea"
                                        name="specialNotes"
                                        rows="4"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                        placeholder="Any additional observations, concerns, or special notes..."
                                    />
                                    <ErrorMessage name="specialNotes">
                                        {msg => <div className="text-red-500 text-sm mt-2">{msg}</div>}
                                    </ErrorMessage>
                                </div>

                                {/* Form Actions */}
                                <div className="flex justify-end space-x-4 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/reports')}
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
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <FiSave className="mr-2" />
                                                Save Report
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

export default AddDailyReport;
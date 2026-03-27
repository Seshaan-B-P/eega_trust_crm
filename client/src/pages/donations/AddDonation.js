import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import {
    FiUser, FiCalendar, FiPhone, FiMapPin,
    FiMessageSquare, FiSave, FiChevronLeft, FiTag
} from 'react-icons/fi';
import { TbCurrencyRupee } from 'react-icons/tb';
import api from '../../utils/api';

const validationSchema = Yup.object({
    donorName: Yup.string()
        .required('Donor name is required')
        .min(2, 'Name must be at least 2 characters'),
    donorEmail: Yup.string()
        .email('Invalid email address'),
    donorPhone: Yup.string()
        .required('Phone number is required')
        .matches(/^[0-9]{10}$/, 'Phone must be 10 digits'),
    amount: Yup.number()
        .required('Amount is required')
        .min(1, 'Amount must be greater than 0'),
    donationType: Yup.string()
        .required('Donation type is required'),
    purpose: Yup.string()
        .required('Purpose is required'),
    paymentMethod: Yup.string(),
    transactionId: Yup.string(),
    date: Yup.date()
        .required('Date is required')
        .max(new Date(), 'Date cannot be in future'),
    description: Yup.string(),
    isAnonymous: Yup.boolean()
});

const AddDonation = () => {
    const navigate = useNavigate();

    const initialValues = {
        donorName: '',
        donorEmail: '',
        donorPhone: '',
        donorAddress: {
            street: '',
            city: '',
            state: '',
            pincode: '',
            country: 'India'
        },
        amount: '',
        donationType: 'cash', // Default
        purpose: 'general', // Default
        paymentMethod: 'cash',
        transactionId: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        isAnonymous: false
    };

    const handleSubmit = async (values, { setSubmitting }) => {
        try {
            await api.post('/donations', values);
            toast.success('Donation added successfully');
            navigate('/donations');
        } catch (error) {
            console.error('Error adding donation:', error);
            toast.error(error.response?.data?.message || 'Error adding donation');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-6 min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/donations')}
                        className="flex items-center text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 mb-4 transition-colors"
                    >
                        <FiChevronLeft className="mr-1" />
                        Back to Donations
                    </button>
                    <div className="flex items-center">
                        <div className="h-12 w-12 bg-secondary-100 dark:bg-slate-800 rounded-full flex items-center justify-center mr-4 border border-secondary-200 dark:border-slate-700">
                            <TbCurrencyRupee className="h-6 w-6 text-secondary-600 dark:text-secondary-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Record New Donation</h1>
                            <p className="text-gray-600 dark:text-gray-400">Enter details of the donation received</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-slate-700">
                    <Formik
                        initialValues={initialValues}
                        validationSchema={validationSchema}
                        onSubmit={handleSubmit}
                    >
                        {({ values, isSubmitting }) => (
                            <Form className="space-y-8">

                                {/* Donor Details */}
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center border-b dark:border-slate-700 pb-2">
                                        <FiUser className="mr-2" /> Donor Information
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Donor Name *</label>
                                            <Field
                                                type="text"
                                                name="donorName"
                                                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                                                placeholder="Enter donor name"
                                            />
                                            <ErrorMessage name="donorName" component="div" className="text-red-500 text-sm mt-1" />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Anonymous Donation?</label>
                                            <div className="flex items-center mt-2">
                                                <Field type="checkbox" name="isAnonymous" className="h-4 w-4 text-primary-600 dark:bg-slate-900 border-gray-300 dark:border-slate-700 rounded focus:ring-primary-500" />
                                                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Mark as Anonymous</span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number *</label>
                                            <Field
                                                type="tel"
                                                name="donorPhone"
                                                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                                                placeholder="10-digit number"
                                            />
                                            <ErrorMessage name="donorPhone" component="div" className="text-red-500 text-sm mt-1" />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                                            <Field
                                                type="email"
                                                name="donorEmail"
                                                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                                                placeholder="Optional"
                                            />
                                            <ErrorMessage name="donorEmail" component="div" className="text-red-500 text-sm mt-1" />
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Field type="text" name="donorAddress.street" placeholder="Street Address" className="px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white" />
                                            <Field type="text" name="donorAddress.city" placeholder="City" className="px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white" />
                                            <Field type="text" name="donorAddress.state" placeholder="State" className="px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white" />
                                            <Field type="text" name="donorAddress.pincode" placeholder="Pincode" className="px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white" />
                                        </div>
                                    </div>
                                </div>

                                {/* Donation Details */}
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center border-b dark:border-slate-700 pb-2">
                                        <TbCurrencyRupee className="mr-2" /> Donation Details
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount (₹) *</label>
                                            <Field
                                                type="number"
                                                name="amount"
                                                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                                                placeholder="0.00"
                                            />
                                            <ErrorMessage name="amount" component="div" className="text-red-500 text-sm mt-1" />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date *</label>
                                            <Field
                                                type="date"
                                                name="date"
                                                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Donation Type *</label>
                                            <Field
                                                as="select"
                                                name="donationType"
                                                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                                            >
                                                <option value="cash" className="dark:bg-slate-900">Cash</option>
                                                <option value="cheque" className="dark:bg-slate-900">Cheque</option>
                                                <option value="online" className="dark:bg-slate-900">Online Transfer</option>
                                                <option value="goods" className="dark:bg-slate-900">Goods (In-kind)</option>
                                                <option value="other" className="dark:bg-slate-900">Other</option>
                                            </Field>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Mode</label>
                                            <Field
                                                as="select"
                                                name="paymentMethod"
                                                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                                            >
                                                <option value="cash" className="dark:bg-slate-900">Cash</option>
                                                <option value="card" className="dark:bg-slate-900">Card</option>
                                                <option value="upi" className="dark:bg-slate-900">UPI</option>
                                                <option value="netbanking" className="dark:bg-slate-900">Net Banking</option>
                                                <option value="cheque" className="dark:bg-slate-900">Cheque</option>
                                                <option value="other" className="dark:bg-slate-900">Other</option>
                                            </Field>
                                        </div>

                                        {values.donationType !== 'cash' && values.donationType !== 'goods' && (
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Transaction ID / Cheque #</label>
                                                <Field
                                                    type="text"
                                                    name="transactionId"
                                                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                                                    placeholder="Reference Number"
                                                />
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Purpose *</label>
                                            <Field
                                                as="select"
                                                name="purpose"
                                                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                                            >
                                                <option value="general" className="dark:bg-slate-900">General Fund</option>
                                                <option value="education" className="dark:bg-slate-900">Education</option>
                                                <option value="medical" className="dark:bg-slate-900">Medical</option>
                                                <option value="food" className="dark:bg-slate-900">Food</option>
                                                <option value="shelter" className="dark:bg-slate-900">Shelter</option>
                                                <option value="festival" className="dark:bg-slate-900">Festival / Event</option>
                                                <option value="emergency" className="dark:bg-slate-900">Emergency</option>
                                            </Field>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes / Description</label>
                                        <Field
                                            as="textarea"
                                            name="description"
                                            rows="3"
                                            className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                                            placeholder="Any additional details..."
                                        />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end space-x-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/donations')}
                                        className="px-6 py-2 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium flex items-center disabled:opacity-50 shadow-lg"
                                    >
                                        <FiSave className="mr-2" />
                                        Save Donation
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

export default AddDonation;

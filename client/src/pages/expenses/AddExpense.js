import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import {
    FiCalendar, FiMessageSquare, FiSave, FiChevronLeft, FiTag, FiShoppingBag, FiCreditCard
} from 'react-icons/fi';
import { TbCurrencyRupee } from 'react-icons/tb';
import api from '../../utils/api';

const validationSchema = Yup.object({
    amount: Yup.number()
        .required('Amount is required')
        .min(1, 'Amount must be greater than 0'),
    category: Yup.string()
        .required('Category is required'),
    paymentMethod: Yup.string()
        .required('Payment method is required'),
    date: Yup.date()
        .required('Date is required')
        .max(new Date(), 'Date cannot be in future'),
    description: Yup.string()
        .required('Description is required')
        .min(5, 'Description should be at least 5 characters'),
    vendorName: Yup.string()
});

const AddExpense = () => {
    const navigate = useNavigate();

    const initialValues = {
        amount: '',
        category: 'other',
        paymentMethod: 'cash',
        date: new Date().toISOString().split('T')[0],
        vendorName: '',
        description: '',
        status: 'paid'
    };

    const handleSubmit = async (values, { setSubmitting }) => {
        try {
            await api.post('/expenses', values);
            toast.success('Expense recorded successfully');
            navigate('/expenses');
        } catch (error) {
            console.error('Error adding expense:', error);
            toast.error(error.response?.data?.message || 'Error adding expense');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-6 min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/expenses')}
                        className="flex items-center text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 mb-4 transition-colors"
                    >
                        <FiChevronLeft className="mr-1" />
                        Back to Expenses
                    </button>
                    <div className="flex items-center">
                        <div className="h-12 w-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mr-4 border border-red-200 dark:border-red-800/50">
                            <TbCurrencyRupee className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Record New Expense</h1>
                            <p className="text-gray-600 dark:text-gray-400">Enter details of the trust expenditure</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-slate-700">
                    <Formik
                        initialValues={initialValues}
                        validationSchema={validationSchema}
                        onSubmit={handleSubmit}
                    >
                        {({ isSubmitting }) => (
                            <Form className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Amount Section */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                            <TbCurrencyRupee className="mr-2" /> Amount (₹) *
                                        </label>
                                        <Field
                                            type="number"
                                            name="amount"
                                            className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                                            placeholder="0.00"
                                        />
                                        <ErrorMessage name="amount" component="div" className="text-red-500 text-sm mt-1" />
                                    </div>

                                    {/* Date Section */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                            <FiCalendar className="mr-2" /> Date *
                                        </label>
                                        <Field
                                            type="date"
                                            name="date"
                                            className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                                        />
                                        <ErrorMessage name="date" component="div" className="text-red-500 text-sm mt-1" />
                                    </div>

                                    {/* Category Section */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                            <FiTag className="mr-2" /> Category *
                                        </label>
                                        <Field
                                            as="select"
                                            name="category"
                                            className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                                        >
                                            <option value="" className="dark:bg-slate-900">Select Category</option>
                                            <option value="food" className="dark:bg-slate-900">Food & Groceries</option>
                                            <option value="medical" className="dark:bg-slate-900">Medical & Healthcare</option>
                                            <option value="education" className="dark:bg-slate-900">Education & Supplies</option>
                                            <option value="utilities" className="dark:bg-slate-900">Utilities (Water/Elec)</option>
                                            <option value="maintenance" className="dark:bg-slate-900">Maintenance & Repair</option>
                                            <option value="staff" className="dark:bg-slate-900">Staff Related</option>
                                            <option value="salary" className="dark:bg-slate-900">Salary & Wages</option>
                                            <option value="other" className="dark:bg-slate-900">Other Expenses</option>
                                        </Field>
                                        <ErrorMessage name="category" component="div" className="text-red-500 text-sm mt-1" />
                                    </div>

                                    {/* Payment Method Section */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                            <FiCreditCard className="mr-2" /> Payment Mode *
                                        </label>
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
                                        <ErrorMessage name="paymentMethod" component="div" className="text-red-500 text-sm mt-1" />
                                    </div>

                                    {/* Vendor Section */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                            <FiShoppingBag className="mr-2" /> Vendor Name
                                        </label>
                                        <Field
                                            type="text"
                                            name="vendorName"
                                            className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                                            placeholder="Where was this spent?"
                                        />
                                    </div>

                                    {/* Description Section */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                            <FiMessageSquare className="mr-2" /> Description *
                                        </label>
                                        <Field
                                            as="textarea"
                                            name="description"
                                            rows="3"
                                            className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                                            placeholder="What was this for?"
                                        />
                                        <ErrorMessage name="description" component="div" className="text-red-500 text-sm mt-1" />
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-4 pt-6 border-t dark:border-slate-700">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/expenses')}
                                        className="px-6 py-2 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-8 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-bold flex items-center disabled:opacity-50 shadow-lg shadow-red-500/20"
                                    >
                                        <FiSave className="mr-2" />
                                        Save Expense
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

export default AddExpense;

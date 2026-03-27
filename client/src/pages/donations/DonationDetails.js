import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
    FiChevronLeft, FiPrinter, FiCheckCircle, FiMail,
    FiUser, FiCalendar, FiTag, FiCreditCard
} from 'react-icons/fi';
import { TbCurrencyRupee } from 'react-icons/tb';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const DonationDetails = () => {
    const { user } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();
    const [donation, setDonation] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDonationDetails();
    }, [id]);

    const fetchDonationDetails = async () => {
        try {
            const response = await api.get(`/donations/${id}`);
            setDonation(response.data.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching details:', error);
            toast.error('Failed to load donation details');
            navigate('/donations');
        }
    };

    const handleGenerateReceipt = async () => {
        try {
            const response = await api.post(`/donations/${id}/generate-receipt`);
            toast.success('Receipt generated');
            if (response.data.data.receiptUrl) {
                const fullUrl = response.data.data.receiptUrl.startsWith('http') 
                    ? response.data.data.receiptUrl 
                    : `http://localhost:5000${response.data.data.receiptUrl}`;
                window.open(fullUrl, '_blank');
            }
            fetchDonationDetails();
        } catch (error) {
            toast.error('Error generating receipt');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!donation) return null;

    return (
        <div className="p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8 flex justify-between items-center">
                    <button
                        onClick={() => navigate('/donations')}
                        className="flex items-center text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                    >
                        <FiChevronLeft className="mr-1" />
                        Back to List
                    </button>
                    <div className="space-x-3">
                        {user?.role === 'admin' && donation.status === 'verified' && (
                            <button
                                onClick={handleGenerateReceipt}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center transition-colors"
                            >
                                <FiPrinter className="mr-2" />
                                Generate Receipt
                            </button>
                        )}
                        {donation.receiptGenerated && (
                            <a
                                href={donation.receiptUrl.startsWith('http') ? donation.receiptUrl : `http://localhost:5000${donation.receiptUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 flex items-center border border-gray-200 dark:border-slate-700 transition-colors"
                            >
                                <FiPrinter className="mr-2" />
                                View Receipt
                            </a>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-slate-700 transition-colors">
                    <div className="border-b dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 p-6 flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
                                Donation #{donation.donationId}
                                <span className={`ml-3 px-3 py-1 rounded-full text-sm font-medium border dark:bg-opacity-20 transition-colors
                                    ${donation.status === 'verified' ? 'bg-green-100 text-green-800 border-green-200' :
                                        donation.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
                                    {donation.status}
                                </span>
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">
                                Received on {new Date(donation.date).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Amount</p>
                            <p className="text-3xl font-bold text-green-600 dark:text-green-400 transition-colors">
                                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(donation.amount)}
                            </p>
                        </div>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                                <FiUser className="mr-2 text-primary-500" /> Donor Details
                            </h3>
                            <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-4 space-y-3 border border-gray-100 dark:border-slate-700/50 transition-colors">
                                <p className="text-gray-700 dark:text-gray-300"><span className="font-medium text-gray-900 dark:text-white">Name:</span> {donation.donorName} {donation.isAnonymous && '(Anonymous)'}</p>
                                <p className="text-gray-700 dark:text-gray-300"><span className="font-medium text-gray-900 dark:text-white">Phone:</span> {donation.donorPhone}</p>
                                <p className="text-gray-700 dark:text-gray-300"><span className="font-medium text-gray-900 dark:text-white">Email:</span> {donation.donorEmail || 'N/A'}</p>
                                <p className="text-gray-700 dark:text-gray-300"><span className="font-medium text-gray-900 dark:text-white">Address:</span> {donation.donorAddress ?
                                    `${donation.donorAddress.street || ''}, ${donation.donorAddress.city || ''}` : 'N/A'}</p>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                                <TbCurrencyRupee className="mr-2 text-secondary-500" /> Payment Info
                            </h3>
                            <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-4 space-y-3 border border-gray-100 dark:border-slate-700/50 transition-colors">
                                <p className="text-gray-700 dark:text-gray-300"><span className="font-medium text-gray-900 dark:text-white">Type:</span> <span className="capitalize">{donation.donationType}</span></p>
                                <p className="text-gray-700 dark:text-gray-300"><span className="font-medium text-gray-900 dark:text-white">Method:</span> <span className="capitalize">{donation.paymentMethod}</span></p>
                                {donation.transactionId && (
                                    <p className="text-gray-700 dark:text-gray-300"><span className="font-medium text-gray-900 dark:text-white">Reference / Cheque:</span> {donation.transactionId}</p>
                                )}
                                <p className="text-gray-700 dark:text-gray-300"><span className="font-medium text-gray-900 dark:text-white">Purpose:</span> <span className="capitalize">{donation.purpose}</span></p>
                            </div>
                        </div>

                        {donation.description && (
                            <div className="md:col-span-2">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Notes</h3>
                                <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-900/50 p-4 rounded-lg border border-gray-100 dark:border-slate-700/50 transition-colors">{donation.description}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DonationDetails;

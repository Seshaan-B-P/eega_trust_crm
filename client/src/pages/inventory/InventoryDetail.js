import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    FiPackage, FiArrowLeft, FiClock, FiPlus, FiMinus,
    FiAlertCircle, FiUser, FiCalendar, FiCheckCircle,
    FiAlertTriangle, FiActivity
} from 'react-icons/fi';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

const InventoryDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stockAction, setStockAction] = useState({
        type: 'in',
        quantity: '',
        reason: ''
    });

    useEffect(() => {
        fetchItemDetails();
    }, [id]);

    const fetchItemDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/inventory/${id}`);
            setItem(response.data.data.item);
            setLogs(response.data.data.logs);
        } catch (error) {
            toast.error('Error fetching item details');
            navigate('/inventory');
        } finally {
            setLoading(false);
        }
    };

    const handleStockUpdate = async (e) => {
        e.preventDefault();
        if (!stockAction.quantity || stockAction.quantity <= 0) {
            return toast.error('Please enter a valid quantity');
        }
        if (!stockAction.reason) {
            return toast.error('Please provide a reason for the update');
        }

        try {
            const response = await api.patch(`/inventory/${id}/stock`, {
                ...stockAction,
                quantity: Number(stockAction.quantity)
            });
            toast.success('Stock updated successfully');
            setStockAction({ type: 'in', quantity: '', reason: '' });
            fetchItemDetails();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error updating stock');
        }
    };

    if (loading) return <LoadingSpinner />;
    if (!item) return null;

    return (
        <div className="p-6 space-y-8 animate-fade-in">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/inventory')} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                    <FiArrowLeft className="h-6 w-6" />
                </button>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{item.name}</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Item Info Card */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-8">
                        <div className="flex justify-between items-start mb-6">
                            <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-xl text-primary-600 dark:text-primary-400">
                                <FiPackage className="h-10 w-10" />
                            </div>
                            <div className="text-right">
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${item.quantity <= item.minThreshold
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-green-100 text-green-700'
                                    }`}>
                                    {item.quantity} {item.unit} available
                                </span>
                                <p className="text-xs text-gray-400 mt-2 italic">Min Threshold: {item.minThreshold} {item.unit}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                            <div>
                                <p className="text-sm text-gray-400 font-medium tracking-wide uppercase">Category</p>
                                <p className="mt-1 font-semibold text-gray-800 dark:text-gray-100 capitalize">{item.category}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400 font-medium tracking-wide uppercase">Location</p>
                                <p className="mt-1 font-semibold text-gray-800 dark:text-gray-100">{item.location || 'Not specified'}</p>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-sm text-gray-400 font-medium tracking-wide uppercase">Description</p>
                                <p className="mt-1 text-gray-600 dark:text-gray-400">{item.description || 'No description provided.'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Stock History */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-8">
                        <div className="flex items-center gap-2 mb-6">
                            <FiClock className="text-primary-500" />
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Stock History</h2>
                        </div>
                        <div className="space-y-4">
                            {logs.map((log) => (
                                <div key={log._id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-700">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${log.type === 'in' ? 'bg-green-100 text-green-600' :
                                            log.type === 'out' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                            }`}>
                                            {log.type === 'in' ? <FiPlus /> : log.type === 'out' ? <FiMinus /> : <FiAlertCircle />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800 dark:text-gray-100">{log.reason}</p>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                <span className="flex items-center gap-1"><FiUser className="h-3 w-3" /> {log.performedBy.name}</span>
                                                <span className="flex items-center gap-1"><FiCalendar className="h-3 w-3" /> {new Date(log.date).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`font-bold text-lg ${log.type === 'in' ? 'text-green-600' :
                                        log.type === 'out' ? 'text-red-600' : 'text-blue-600'
                                        }`}>
                                        {log.type === 'in' ? '+' : ''}{log.quantity}
                                    </div>
                                </div>
                            ))}
                            {logs.length === 0 && <p className="text-center text-gray-400 py-4">No transactions recorded yet.</p>}
                        </div>
                    </div>
                </div>

                {/* Quick Stock Update Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-primary-100 dark:border-slate-700 p-6 sticky top-24">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
                            <FiActivity className="text-primary-500" /> Update Stock
                        </h3>
                        <form onSubmit={handleStockUpdate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Transaction Type</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['in', 'out', 'adjustment'].map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setStockAction({ ...stockAction, type: t })}
                                            className={`py-2 text-xs font-bold rounded-lg border-2 transition-all capitalize ${stockAction.type === t
                                                ? 'bg-primary-500 text-white border-primary-500 shadow-md'
                                                : 'bg-white dark:bg-slate-700 text-gray-500 border-gray-100 dark:border-slate-600 hover:border-primary-100'
                                                }`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Quantity ({item.unit})</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-slate-600 dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    placeholder="Enter amount..."
                                    value={stockAction.quantity}
                                    onChange={(e) => setStockAction({ ...stockAction, quantity: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Reason</label>
                                <textarea
                                    className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-slate-600 dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
                                    placeholder="e.g. Donation, Daily Kitchen Use..."
                                    rows="3"
                                    value={stockAction.reason}
                                    onChange={(e) => setStockAction({ ...stockAction, reason: e.target.value })}
                                ></textarea>
                            </div>
                            <button type="submit" className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-900/20 transition-all flex items-center justify-center gap-2 mt-4">
                                <FiCheckCircle /> Confirm Update
                            </button>
                        </form>
                    </div>

                    {/* Low Stock Warning Card */}
                    {item.quantity <= item.minThreshold && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-6 text-amber-800 dark:text-amber-200">
                            <div className="flex items-center gap-3 mb-2 font-bold">
                                <FiAlertTriangle className="h-5 w-5" /> Stock Warning
                            </div>
                            <p className="text-sm">This item is below the minimum threshold. Consider replenishing it soon.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InventoryDetail;

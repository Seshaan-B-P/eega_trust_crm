import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiPackage, FiArrowLeft, FiSave, FiInfo, FiHash, FiMapPin, FiTrash2 } from 'react-icons/fi';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';

const EditInventoryItem = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        category: 'food',
        quantity: 0,
        unit: '',
        minThreshold: 10,
        location: '',
        description: ''
    });

    useEffect(() => {
        fetchItemDetails();
    }, [id]);

    const fetchItemDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/inventory/${id}`);
            const item = response.data.data.item;
            setFormData({
                name: item.name,
                category: item.category,
                quantity: item.quantity,
                unit: item.unit,
                minThreshold: item.minThreshold,
                location: item.location || '',
                description: item.description || ''
            });
        } catch (error) {
            toast.error('Error fetching item details');
            navigate('/inventory');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: (name === 'quantity' || name === 'minThreshold') ? Number(value) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            await api.put(`/inventory/${id}`, formData);
            toast.success('Inventory item updated successfully');
            navigate('/inventory');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error updating item');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this item? This will also remove its history.')) return;

        try {
            await api.delete(`/inventory/${id}`);
            toast.success('Item deleted successfully');
            navigate('/inventory');
        } catch (error) {
            toast.error('Error deleting item');
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="p-6 max-w-4xl mx-auto animate-fade-in-up">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/inventory')} className="p-2 hover:bg-white/50 dark:hover:bg-slate-700 rounded-full transition-all">
                        <FiArrowLeft className="h-6 w-6" />
                    </button>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                        Edit Inventory Item
                    </h1>
                </div>
                <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-4 py-2 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold rounded-xl transition-all"
                >
                    <FiTrash2 /> Delete Item
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
                    <div className="bg-secondary-500 p-1"></div>
                    <div className="p-8 space-y-8">
                        {/* Section: Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                                    <FiPackage className="text-primary-500" /> Item Name *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 dark:bg-slate-700 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                                    placeholder="e.g. Sona Masuri Rice"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                                    <FiInfo className="text-primary-500" /> Category
                                </label>
                                <select
                                    name="category"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 dark:bg-slate-700 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all dark:text-white"
                                    value={formData.category}
                                    onChange={handleChange}
                                >
                                    <option value="food" className="dark:bg-slate-900">Food</option>
                                    <option value="medicine" className="dark:bg-slate-900">Medicine</option>
                                    <option value="hygiene" className="dark:bg-slate-900">Hygiene</option>
                                    <option value="office" className="dark:bg-slate-900">Office</option>
                                    <option value="other" className="dark:bg-slate-900">Other</option>
                                </select>
                            </div>
                        </div>

                        {/* Section: Stock Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-50 dark:border-slate-700/50">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                                    <FiHash className="text-secondary-500" /> Current Stock
                                </label>
                                <input
                                    type="number"
                                    name="quantity"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 dark:bg-slate-700 focus:ring-4 focus:ring-secondary-500/10 outline-none transition-all"
                                    value={formData.quantity}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                                    Unit (e.g. KG, PKT) *
                                </label>
                                <input
                                    type="text"
                                    name="unit"
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 dark:bg-slate-700 focus:ring-4 focus:ring-secondary-500/10 outline-none transition-all"
                                    placeholder="Unit"
                                    value={formData.unit}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 text-amber-600">
                                    Low Stock Threshold
                                </label>
                                <input
                                    type="number"
                                    name="minThreshold"
                                    className="w-full px-4 py-3 rounded-xl border border-amber-100 dark:border-slate-600 dark:bg-slate-700 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all"
                                    value={formData.minThreshold}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Section: Additional Details */}
                        <div className="space-y-6 pt-4 border-t border-gray-50 dark:border-slate-700/50">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                                    <FiMapPin className="text-red-500" /> Storage Location
                                </label>
                                <input
                                    type="text"
                                    name="location"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 dark:bg-slate-700 focus:ring-4 focus:ring-red-500/10 outline-none transition-all"
                                    placeholder="Warehouse A, Shelf 3..."
                                    value={formData.location}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Description</label>
                                <textarea
                                    name="description"
                                    rows="4"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 dark:bg-slate-700 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all resize-none"
                                    placeholder="Additional notes about this item..."
                                    value={formData.description}
                                    onChange={handleChange}
                                ></textarea>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => navigate('/inventory')}
                        className="flex-1 py-4 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 font-bold rounded-2xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-[2] py-4 bg-secondary-600 hover:bg-secondary-700 text-white font-bold rounded-2xl shadow-xl shadow-secondary-900/40 transform hover:-translate-y-1 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving ? 'Updating...' : <><FiSave /> Update Item</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditInventoryItem;

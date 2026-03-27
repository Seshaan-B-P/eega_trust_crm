import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    FiPackage, FiPlus, FiSearch, FiFilter, FiAlertTriangle,
    FiArrowUp, FiArrowDown, FiEdit2, FiInfo, FiRefreshCw, FiGrid, FiActivity
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const InventoryList = () => {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    useEffect(() => {
        fetchInventory();
    }, [categoryFilter]);

    const fetchInventory = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/inventory?category=${categoryFilter}&search=${searchTerm}`);
            setItems(response.data.data);
        } catch (error) {
            toast.error('Error fetching inventory');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchInventory();
    };

    const getStockStatus = (item) => {
        if (item.quantity === 0) return { label: 'Depleted', color: 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400' };
        if (item.quantity <= item.minThreshold) return { label: 'Low Reserve', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400' };
        return { label: 'Optimized', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400' };
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="p-8 space-y-10 min-h-screen"
        >
            {/* Header Section */}
            <header className="pb-4 border-b border-slate-200 dark:border-slate-800">
                <motion.div variants={itemVariants} className="flex items-center space-x-2 text-primary-600 font-bold uppercase tracking-[0.2em] text-[10px] mb-2">
                     <span className="w-8 h-px bg-primary-600"></span>
                     <span>Inventory</span>
                </motion.div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <motion.h1 variants={itemVariants} className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">
                            Stock Control
                        </motion.h1>
                        <motion.p variants={itemVariants} className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
                            Manage and track items in storage.
                        </motion.p>
                    </div>
                    <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={fetchInventory}
                            className="p-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-primary-600 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95"
                        >
                            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                        </button>
                        {(user?.role === 'admin' || user?.role === 'staff') && (
                            <Link
                                to="/inventory/add"
                                className="flex items-center bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-2xl shadow-lg shadow-primary-500/25 font-black text-xs uppercase tracking-widest transition-all hover:-translate-y-1 active:scale-95"
                            >
                                <FiPlus className="mr-2 stroke-[3px]" />
                                Add Item
                            </Link>
                        )}
                    </motion.div>
                </div>
            </header>

            {/* Quick Stats Grid */}
            <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Items', value: items.length || 0, icon: <FiPackage />, color: 'from-blue-600 to-indigo-700', shadow: 'shadow-blue-500/20' },
                    { label: 'Low Stock', value: items.filter(i => i.quantity <= i.minThreshold).length, icon: <FiAlertTriangle />, color: 'from-rose-500 to-red-600', shadow: 'shadow-rose-500/20' },
                    { label: 'Item Movement', value: 'High', icon: <FiActivity />, color: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/20' },
                    { label: 'Categories', value: new Set(items.map(i => i.category)).size, icon: <FiGrid />, color: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/20' },
                ].map((stat, idx) => (
                    <motion.div key={idx} variants={itemVariants} className={`relative p-6 rounded-[2rem] bg-gradient-to-br ${stat.color} shadow-lg ${stat.shadow} overflow-hidden group`}>
                         <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
                             {React.cloneElement(stat.icon, { size: 80 })}
                        </div>
                        <div className="relative z-10">
                            <div className="p-3 bg-white/20 rounded-2xl w-fit backdrop-blur-md mb-4 text-white">
                                {stat.icon}
                            </div>
                            <p className="text-white/70 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
                            <h3 className="text-2xl font-black text-white mt-1">{stat.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Search & Filter Toolbar */}
            <motion.div variants={itemVariants} className="card !rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-6">
                    <form onSubmit={handleSearch} className="flex-1 relative group">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Identify inventory items..."
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.25rem] focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all font-medium text-slate-800 dark:text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </form>
                    <div className="flex gap-3">
                        <select
                            className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.25rem] focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all font-bold text-xs uppercase tracking-widest text-slate-600 dark:text-slate-300 min-w-[200px]"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            <option value="all">All Categories</option>
                            <option value="food">Food & Staples</option>
                            <option value="medicine">Pharmaceuticals</option>
                            <option value="hygiene">Sanitation Items</option>
                            <option value="office">Administrative Supplies</option>
                            <option value="other">General Assets</option>
                        </select>
                        <button 
                            onClick={fetchInventory}
                            className="px-8 py-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-[1.25rem] font-bold text-xs uppercase tracking-widest transition-all"
                        >
                            Filter Results
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Inventory Detail Table */}
            <motion.div variants={itemVariants} className="card !rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="py-24"><LoadingSpinner message="Synchronizing Asset Ledger..." /></div>
                    ) : (
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-800">
                                    <th className="px-8 py-6 text-left">Item Details</th>
                                    <th className="px-8 py-6 text-left">Category</th>
                                    <th className="px-8 py-6 text-left">Current Stock</th>
                                    <th className="px-8 py-6 text-left">Stock Status</th>
                                    <th className="px-8 py-6 text-left">Last Updated</th>
                                    <th className="px-8 py-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                <AnimatePresence mode="popLayout">
                                    {items.map((item) => (
                                        <motion.tr 
                                            key={item._id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all duration-300"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center space-x-4">
                                                    <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-primary-600 border border-white dark:border-slate-700 shadow-sm">
                                                        <FiPackage size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{item.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-widest truncate max-w-[150px]">{item.location || 'Central Vault'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="inline-flex px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-tighter border border-slate-200 dark:border-slate-700">
                                                    {item.category}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-lg font-black text-slate-800 dark:text-white tracking-tighter group-hover:scale-105 transition-transform origin-left">
                                                    {item.quantity} <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.unit}</span>
                                                </p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`inline-flex px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${getStockStatus(item).color}`}>
                                                    {getStockStatus(item).label}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest italic">{new Date(item.lastUpdated).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <Link to={`/inventory/${item._id}`} className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-primary-600 hover:text-white rounded-xl transition-all shadow-sm">
                                                        <FiInfo className="w-4 h-4" />
                                                    </Link>
                                                    {(user?.role === 'admin' || user?.role === 'staff') && (
                                                        <Link to={`/inventory/edit/${item._id}`} className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm">
                                                            <FiEdit2 className="w-4 h-4" />
                                                        </Link>
                                                    )}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    )}
                </div>
                
                {items.length === 0 && !loading && (
                    <div className="p-24 text-center">
                        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <FiPackage className="h-10 w-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">No Items Found</h3>
                        <p className="text-slate-500 mt-2 max-w-sm mx-auto font-medium">No assets matching the current filtration parameters were identified.</p>
                        <button
                            onClick={() => {setCategoryFilter('all'); setSearchTerm('');}}
                            className="mt-8 px-8 py-3 bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary-500/25 transition-all active:scale-95"
                        >
                            Reset Parameters
                        </button>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

export default InventoryList;

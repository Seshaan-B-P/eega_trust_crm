import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    FiHome,
    FiUsers,
    FiUser,
    FiFileText,
    FiCalendar,
    FiSettings,
    FiLogOut,
    FiHeart,
    FiGift,
    FiShoppingBag,
    FiBox
} from 'react-icons/fi';
import logo from '../assets/logo.jpg';

import { motion } from 'framer-motion';

const Sidebar = () => {
    const { user, logout } = useAuth();

    const adminMenu = [
        { path: '/dashboard', label: 'Dashboard', icon: <FiHome /> },
        { path: '/children', label: 'Children', icon: <FiUsers /> },
        { path: '/elderly', label: 'Elderly', icon: <FiHeart /> },
        { path: '/staff', label: 'Staff', icon: <FiUser /> },
        { path: '/donations', label: 'Donations', icon: <FiGift /> },
        { path: '/expenses', label: 'Expenses', icon: <FiShoppingBag /> },
        { path: '/inventory', label: 'Inventory', icon: <FiBox /> },
        { path: '/reports', label: 'Daily Reports', icon: <FiFileText /> },
        { path: '/settings', label: 'Settings', icon: <FiSettings /> },
    ];

    const staffMenu = [
        { path: '/dashboard', label: 'Dashboard', icon: <FiHome /> },
        { path: '/children', label: 'Children', icon: <FiUsers /> },
        { path: '/elderly', label: 'Elderly', icon: <FiHeart /> },
        { path: '/inventory', label: 'Inventory', icon: <FiBox /> },
        { path: '/donations', label: 'Donations', icon: <FiGift /> },
        { path: '/reports', label: 'Daily Reports', icon: <FiFileText /> },
        { path: '/settings', label: 'Settings', icon: <FiSettings /> },
    ];

    const menuItems = user?.role === 'admin' ? adminMenu : staffMenu;

    return (
        <div className="h-screen w-64 bg-slate-900 dark:bg-slate-950 text-white flex flex-col relative overflow-hidden shadow-2xl border-r border-slate-800 transition-colors duration-500">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-40 h-40 bg-primary-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-40 h-40 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
            </div>

            {/* Logo Area */}
            <div className="relative z-10 p-6 flex items-center space-x-3 border-b border-slate-800/50 backdrop-blur-md bg-slate-900/40">
                <motion.div 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white p-1.5 rounded-xl shadow-lg shadow-primary-900/20"
                >
                    <img src={logo} alt="EEGA Trust" className="h-8 w-8 rounded-lg" />
                </motion.div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        EEGA Trust
                    </h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">CRM Portal</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="relative z-10 flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
                <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 opacity-70">
                    Main Menu
                </p>
                {menuItems.map((item, index) => (
                    <motion.div
                        key={item.path}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <NavLink
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group ${isActive
                                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/40 backdrop-blur-sm font-semibold'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                }`
                            }
                        >
                            <span className={`text-xl transition-transform duration-300 group-hover:scale-110 ${location.pathname === item.path ? 'scale-110' : ''}`}>
                                {item.icon}
                            </span>
                            <span className="text-sm tracking-wide">{item.label}</span>
                        </NavLink>
                    </motion.div>
                ))}
            </nav>

            {/* User Profile & Logout */}
            <div className="relative z-10 p-4 border-t border-slate-800/50 bg-slate-950/50 backdrop-blur-xl">
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center p-2.5 rounded-2xl bg-white/5 border border-white/5 mb-3 group hover:bg-white/10 transition-colors cursor-pointer"
                >
                    <div className="h-10 w-10 bg-gradient-to-br from-primary-400 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg overflow-hidden group-hover:ring-2 ring-primary-500/50 transition-all">
                        {user?.profileImage ? (
                            <img
                                src={user.profileImage}
                                alt={user?.name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <span className="font-bold text-sm text-white">{user?.name?.charAt(0) || 'U'}</span>
                        )}
                    </div>
                    <div className="ml-3 overflow-hidden flex-1">
                        <p className="text-sm font-semibold text-white truncate group-hover:text-primary-300 transition-colors uppercase tracking-tight">{user?.name}</p>
                        <p className="text-[10px] text-slate-400 truncate capitalize font-medium">{user?.role} Access</p>
                    </div>
                </motion.div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={logout}
                    className="flex items-center justify-center space-x-2 w-full px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300 font-semibold border border-red-500/20"
                >
                    <FiLogOut className="h-4 w-4" />
                    <span className="text-sm">Sign Out</span>
                </motion.button>
            </div>
        </div>
    );
};

export default Sidebar;
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiMenu, FiX, FiSearch, FiBell, FiUser,
    FiSettings, FiLogOut, FiHome, FiUsers,
    FiHeart, FiUserPlus, FiShoppingBag, FiFileText,
    FiCalendar, FiArrowRight, FiLoader
} from 'react-icons/fi';
import { TbCurrencyRupee } from 'react-icons/tb';
import { useAuth } from '../context/AuthContext';
import NotificationCenter from './NotificationCenter';
import api from '../utils/api';

const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
    const searchRef = useRef(null);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length >= 2) {
                try {
                    setIsSearching(true);
                    setSearchDropdownOpen(true);
                    const response = await api.get(`/search?query=${searchQuery}`);
                    setSearchResults(response.data.results);
                } catch (error) {
                    console.error('Search error:', error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults(null);
                setSearchDropdownOpen(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Click outside to close search
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setSearchDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleResultClick = (link) => {
        setSearchQuery('');
        setSearchDropdownOpen(false);
        navigate(link);
    };

    // Navigation items based on user role
    const getNavigationItems = () => {
        const commonItems = [
            { name: 'Dashboard', path: '/dashboard', icon: FiHome },
            { name: 'Children', path: '/children', icon: FiUsers },
            { name: 'Elderly', path: '/elderly', icon: FiHeart },
        ];

        const adminItems = [
            { name: 'Staff', path: '/staff', icon: FiUserPlus },
            { name: 'Donations', path: '/donations', icon: TbCurrencyRupee },
            { name: 'Expenses', path: '/expenses', icon: FiShoppingBag },
            { name: 'Reports', path: '/reports', icon: FiFileText },
            { name: 'Attendance', path: '/attendance', icon: FiCalendar },
        ];

        const staffItems = [
            { name: 'My Assignments', path: '/assignments', icon: FiCalendar },
            { name: 'Reports', path: '/reports', icon: FiFileText },
        ];

        if (user?.role === 'admin') {
            return [...commonItems, ...adminItems];
        } else if (user?.role === 'staff') {
            return [...commonItems, ...staffItems];
        }
        return commonItems;
    };

    const navigationItems = getNavigationItems();

    // Check if a path is active
    const isActivePath = (path) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    return (
        <>
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden transition-opacity duration-500"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 shadow-2xl transform 
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) z-50 md:hidden flex flex-col
            `}>
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">EEGA Trust</h2>
                        <p className="text-[10px] text-primary-600 font-bold uppercase tracking-widest mt-1">{user?.role} Portal</p>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <FiX className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                    </button>
                </div>

                {/* Mobile Navigation */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                    {navigationItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = isActivePath(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`
                                    flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 font-semibold text-sm
                                    ${isActive
                                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }
                                `}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <Icon className={`mr-4 h-5 w-5 ${isActive ? 'text-primary-600' : 'text-slate-400'}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={logout}
                        className="flex items-center justify-center w-full px-4 py-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold text-sm hover:bg-red-100 transition-colors"
                    >
                        <FiLogOut className="mr-2 h-5 w-5" />
                        Sign Out
                    </button>
                </div>
            </div>

            <header className="sticky top-0 z-30 glass border-b border-slate-200/50 dark:border-slate-800/50 transition-all duration-500">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Left Section - Mobile Menu Button & Title */}
                        <div className="flex-1 flex items-center">
                            {/* Mobile menu button */}
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="md:hidden p-2 -ml-2 mr-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 shadow-sm transition-all"
                            >
                                <FiMenu className="h-6 w-6" />
                            </motion.button>

                            {/* Page Title (Breadcrumb style) */}
                            <div className="hidden md:flex flex-col">
                                <motion.h2
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight"
                                >
                                    {location.pathname === '/dashboard' ? 'Overview' :
                                        location.pathname.split('/')[1]?.charAt(0).toUpperCase() + location.pathname.split('/')[1]?.slice(1) || 'Dashboard'}
                                </motion.h2>
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.6 }}
                                    className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5"
                                >
                                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                </motion.span>
                            </div>
                        </div>

                        {/* Search Bar (Desktop) - Center Aligned */}
                        <div className="hidden lg:flex flex-1 justify-center relative" ref={searchRef}>
                            <div className="relative group w-full max-w-md">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                    {isSearching ? (
                                        <FiLoader className="h-4 w-4 text-primary-500 animate-spin" />
                                    ) : (
                                        <FiSearch className="h-4 w-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                                    )}
                                </div>
                                <input
                                    type="text"
                                    placeholder="Quick search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => searchQuery.length >= 2 && setSearchDropdownOpen(true)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Escape') setSearchDropdownOpen(false);
                                    }}
                                    className="input-field px-12 !py-3.5 text-sm !rounded-2xl bg-slate-100/50 dark:bg-slate-800/50 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 w-full text-center"
                                />
                            </div>

                            {/* Search Results Dropdown */}
                            <AnimatePresence>
                                {searchDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 5 }}
                                        className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50 max-h-[480px] overflow-y-auto custom-scrollbar"
                                    >
                                        {!searchResults ? (
                                            <div className="p-8 text-center">
                                                <div className="animate-pulse flex flex-col items-center">
                                                    <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-full mb-3" />
                                                    <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded mb-2" />
                                                    <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded opacity-50" />
                                                </div>
                                            </div>
                                        ) : (Object.values(searchResults).every(arr => arr.length === 0)) ? (
                                            <div className="p-10 text-center">
                                                <div className="h-16 w-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                    <FiSearch className="h-6 w-6 text-slate-300" />
                                                </div>
                                                <p className="text-sm font-bold text-slate-800 dark:text-white">No results found</p>
                                                <p className="text-xs text-slate-400 mt-1">Try a different keyword</p>
                                            </div>
                                        ) : (
                                            <div className="p-2 space-y-4 py-4">
                                                {['children', 'elderly', 'staff'].map(type => (
                                                    searchResults[type]?.length > 0 && (
                                                        <div key={type}>
                                                            <div className="px-4 py-2">
                                                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                                                                    {type === 'children' ? 'Children Records' : type === 'elderly' ? 'Elderly Residents' : 'Staff Members'}
                                                                </h3>
                                                            </div>
                                                            <div className="space-y-1">
                                                                {searchResults[type].map(result => (
                                                                    <button
                                                                        key={result.id}
                                                                        onClick={() => handleResultClick(result.link)}
                                                                        className="w-full flex items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-800 group rounded-2xl transition-all"
                                                                    >
                                                                        <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-700 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-600">
                                                                            {result.image ? (
                                                                                <img src={result.image} alt="" className="h-full w-full object-cover" />
                                                                            ) : (
                                                                                <div className="h-full w-full flex items-center justify-center text-xs font-bold text-slate-400">
                                                                                    {result.title.charAt(0)}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="ml-3 text-left flex-1 min-w-0">
                                                                            <p className="text-sm font-bold text-slate-800 dark:text-white truncate group-hover:text-primary-600 transition-colors">
                                                                                {result.title}
                                                                            </p>
                                                                            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 truncate uppercase tracking-tighter">
                                                                                {result.subtitle}
                                                                            </p>
                                                                        </div>
                                                                        <FiArrowRight className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all" />
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )
                                                ))}
                                            </div>
                                        )}

                                        <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 text-center">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center">
                                                Press <span className="mx-1 px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-[9px]">ESC</span> to close
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Right Section - Notifications & Profile */}
                        <div className="flex-1 flex items-center justify-end space-x-3 md:space-x-5">
                            {/* Notifications */}
                            <NotificationCenter />

                            <div className="h-10 w-px bg-slate-200 dark:bg-slate-800 hidden md:block"></div>

                            {/* Profile Dropdown */}
                            <div className="relative">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                                    className="flex items-center space-x-3 focus:outline-none group p-1.5 rounded-2xl bg-white dark:bg-slate-800 hover:shadow-md transition-all border border-slate-100 dark:border-slate-700"
                                >
                                    <div className="h-9 w-9 bg-primary-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-primary-500/30 overflow-hidden text-xs">
                                        {user?.profileImage ? (
                                            <img
                                                src={user.profileImage}
                                                alt={user?.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            user?.name?.charAt(0) || 'U'
                                        )}
                                    </div>
                                    <div className="hidden sm:block text-left mr-1">
                                        <p className="text-sm font-bold text-slate-800 dark:text-white leading-none capitalize">{user?.name}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 leading-none">{user?.role}</p>
                                    </div>
                                </motion.button>

                                {/* Profile Dropdown Menu */}
                                {showProfileMenu && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setShowProfileMenu(false)}
                                        ></div>
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl z-20 border border-slate-100 dark:border-slate-800 overflow-hidden"
                                        >
                                            <div className="p-5 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
                                                <p className="font-bold text-slate-900 dark:text-white truncate text-base">{user?.name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">{user?.email}</p>
                                            </div>
                                            <div className="p-2.5">
                                                <button
                                                    onClick={() => navigate('/settings')}
                                                    className="flex items-center w-full px-4 py-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-primary-900/10 hover:text-primary-600 rounded-xl transition-all font-bold"
                                                >
                                                    <FiUser className="mr-3 h-4 w-4 text-primary-500" />
                                                    My Profile
                                                </button>
                                                <button
                                                    onClick={() => navigate('/settings')}
                                                    className="flex items-center w-full px-4 py-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-primary-900/10 hover:text-primary-600 rounded-xl transition-all font-bold"
                                                >
                                                    <FiSettings className="mr-3 h-4 w-4 text-primary-500" />
                                                    Settings
                                                </button>
                                                <div className="h-px bg-slate-100 dark:bg-slate-800 my-2 mx-4"></div>
                                                <button
                                                    onClick={logout}
                                                    className="flex items-center w-full px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all font-bold"
                                                >
                                                    <FiLogOut className="mr-3 h-4 w-4" />
                                                    Sign Out
                                                </button>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        </>
    );
};

export default Header;
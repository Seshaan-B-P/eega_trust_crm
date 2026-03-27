import React, { useState, useEffect, useRef } from 'react';
import { FiBell, FiCheck, FiCheckCircle, FiFileText, FiUser, FiInfo, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import moment from 'moment';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationCenter = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications');
            setNotifications(response.data.data);
            setUnreadCount(response.data.data.filter(n => !n.isRead).length);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            fetchNotifications();
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.patch('/notifications/read-all');
            fetchNotifications();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleNotificationClick = (notification) => {
        markAsRead(notification._id);
        setIsOpen(false);

        // Navigation logic based on notification type
        if (notification.type === 'donation' && notification.data?.donationId) {
            navigate(`/donations/${notification.data.donationId}`);
        } else if (notification.type === 'report' && notification.data?.reportId) {
            navigate(`/reports/${notification.data.reportId}`);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'donation': return <div className="p-2 bg-emerald-500/10 rounded-xl"><FiCheckCircle className="text-emerald-500 w-4 h-4" /></div>;
            case 'report': return <div className="p-2 bg-blue-500/10 rounded-xl"><FiFileText className="text-blue-500 w-4 h-4" /></div>;
            case 'child': return <div className="p-2 bg-purple-500/10 rounded-xl"><FiUser className="text-purple-500 w-4 h-4" /></div>;
            default: return <div className="p-2 bg-slate-500/10 rounded-xl"><FiInfo className="text-slate-500 w-4 h-4" /></div>;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2.5 rounded-2xl transition-all duration-300 ${isOpen ? 'bg-primary-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'}`}
            >
                <FiBell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-black text-white bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute right-0 mt-4 w-96 bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden origin-top-right"
                    >
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
                            <div>
                                <h3 className="font-black text-slate-800 dark:text-white text-lg">Notifications</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{unreadCount} New Alerts</p>
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="px-3 py-1.5 text-[10px] bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-colors flex items-center uppercase tracking-tighter"
                                >
                                    <FiCheck className="mr-1" /> Mark Read
                                </button>
                            )}
                        </div>

                        <div className="max-h-[32rem] overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FiBell className="w-8 h-8 text-slate-300 dark:text-slate-500" />
                                    </div>
                                    <p className="font-bold text-slate-400 dark:text-slate-500">All caught up!</p>
                                    <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1 uppercase font-black">No new notifications</p>
                                </div>
                            ) : (
                                <div className="p-2 space-y-1">
                                    {notifications.map((n, idx) => (
                                        <motion.div
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            key={n._id}
                                            onClick={() => handleNotificationClick(n)}
                                            className={`group p-4 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-300 relative ${!n.isRead ? 'bg-primary-50/20 dark:bg-primary-900/5' : ''}`}
                                        >
                                            <div className="flex gap-4">
                                                <div className="flex-shrink-0 transition-transform duration-300 group-hover:scale-110">{getIcon(n.type)}</div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <p className={`text-sm tracking-tight truncate ${!n.isRead ? 'font-black text-slate-950 dark:text-white' : 'font-bold text-slate-600 dark:text-slate-300'}`}>
                                                            {n.title}
                                                        </p>
                                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex-shrink-0 ml-2">
                                                            {moment(n.createdAt).fromNow(true)}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                                                        {n.message}
                                                    </p>
                                                </div>
                                                {!n.isRead && (
                                                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-500 rounded-full"></div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {notifications.length > 0 && (
                            <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-700/50 text-center">
                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                    End of updates
                                </span>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationCenter;

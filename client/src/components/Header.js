import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiBell, FiSearch, FiUser, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const notifications = [];

    const unreadCount = notifications.filter(n => n.unread).length;

    return (
        <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Left Section - Mobile Menu Button & Search */}
                    <div className="flex items-center">
                        {/* Mobile menu button */}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none"
                        >
                            {sidebarOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
                        </button>

                        {/* Search */}
                        <div className="ml-4 relative max-w-md w-full hidden md:block">
                            <div className="relative">
                                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    type="text"
                                    placeholder="Search children, staff, reports..."
                                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Section - Notifications & Profile */}
                    <div className="flex items-center space-x-4">
                        {/* Notifications */}
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="p-2 rounded-full text-gray-500 hover:text-gray-600 hover:bg-gray-100 relative"
                            >
                                <FiBell className="h-6 w-6" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            {showNotifications && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowNotifications(false)}
                                    ></div>
                                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-20 border border-gray-200">
                                        <div className="p-4 border-b border-gray-200">
                                            <h3 className="font-semibold text-gray-800">Notifications</h3>
                                            <p className="text-sm text-gray-600">{unreadCount} unread</p>
                                        </div>
                                        <div className="max-h-96 overflow-y-auto">
                                            {notifications.map(notification => (
                                                <div
                                                    key={notification.id}
                                                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${notification.unread ? 'bg-blue-50' : ''}`}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-medium text-gray-800">{notification.title}</p>
                                                            <p className="text-sm text-gray-500">{notification.time}</p>
                                                        </div>
                                                        {notification.unread && (
                                                            <span className="h-2 w-2 bg-blue-500 rounded-full mt-2"></span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="p-4 border-t border-gray-200">
                                            <button
                                                onClick={() => navigate('/notifications')}
                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium w-full text-center"
                                            >
                                                View all notifications
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Profile Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="flex items-center space-x-3 focus:outline-none"
                            >
                                <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                                    {user?.name?.charAt(0) || 'U'}
                                </div>
                                <div className="hidden md:block text-left">
                                    <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                                    <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                                </div>
                            </button>

                            {/* Profile Dropdown Menu */}
                            {showProfileMenu && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowProfileMenu(false)}
                                    ></div>
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-20 border border-gray-200">
                                        <div className="p-4 border-b border-gray-200">
                                            <p className="font-medium text-gray-800">{user?.name}</p>
                                            <p className="text-sm text-gray-500">{user?.email}</p>
                                        </div>
                                        <div className="py-2">
                                            <button
                                                onClick={() => navigate('/settings')}
                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                <FiUser className="mr-3 h-5 w-5" />
                                                Profile Settings
                                            </button>
                                            <button
                                                onClick={logout}
                                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                            >
                                                <FiLogOut className="mr-3 h-5 w-5" />
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
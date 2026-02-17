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
    FiLogOut
} from 'react-icons/fi';

const Sidebar = () => {
    const { user, logout } = useAuth();

    const adminMenu = [
        { path: '/dashboard', label: 'Dashboard', icon: <FiHome /> },
        { path: '/children', label: 'Children', icon: <FiUsers /> },
        { path: '/staff', label: 'Staff', icon: <FiUser /> },
        { path: '/reports', label: 'Daily Reports', icon: <FiFileText /> },
        { path: '/attendance', label: 'Attendance', icon: <FiCalendar /> },
        { path: '/settings', label: 'Settings', icon: <FiSettings /> },
    ];

    const staffMenu = [
        { path: '/dashboard', label: 'Dashboard', icon: <FiHome /> },
        { path: '/children', label: 'Children', icon: <FiUsers /> },
        { path: '/reports', label: 'Daily Reports', icon: <FiFileText /> },
        { path: '/attendance', label: 'Attendance', icon: <FiCalendar /> },
        { path: '/settings', label: 'Settings', icon: <FiSettings /> },
    ];

    const menuItems = user?.role === 'admin' ? adminMenu : staffMenu;

    return (
        <div className="h-screen w-64 bg-gradient-to-b from-blue-900 to-indigo-900 text-white flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-blue-800">
                <div className="flex items-center space-x-3">
                    <div className="bg-white p-2 rounded-lg">
                        <FiUsers className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">EEGA Trust</h1>
                        <p className="text-sm text-blue-200">CRM System</p>
                    </div>
                </div>
            </div>

            {/* User Info */}
            <div className="p-4 border-b border-blue-800">
                <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-blue-700 rounded-full flex items-center justify-center">
                        <span className="font-semibold">{user?.name?.charAt(0) || 'U'}</span>
                    </div>
                    <div>
                        <p className="font-medium">{user?.name || 'User'}</p>
                        <p className="text-sm text-blue-200 capitalize">{user?.role || 'Staff'}</p>
                    </div>
                </div>
            </div>

            {/* Menu */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                                isActive
                                    ? 'bg-blue-700 text-white'
                                    : 'hover:bg-blue-800 text-blue-100'
                            }`
                        }
                    >
                        <span className="text-lg">{item.icon}</span>
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Logout Button */}
            <div className="p-4 border-t border-blue-800">
                <button
                    onClick={logout}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-red-600 w-full transition-colors"
                >
                    <FiLogOut />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
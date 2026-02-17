import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    FiUsers, FiActivity, FiDollarSign, FiCalendar,
    FiUserPlus, FiFileText, FiCheckCircle, FiAlertCircle,
    FiTrendingUp, FiBarChart2, FiClock, FiHeart
} from 'react-icons/fi';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
} from 'chart.js';

ChartJS.register(
    CategoryScale, LinearScale, BarElement, Title, Tooltip,
    Legend, ArcElement, PointElement, LineElement
);

const Dashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        children: { total: 0, active: 0 },
        staff: { total: 0, active: 0 },
        reports: { today: 0, total: 0 },
        attendance: { today: 0, percentage: 0 }
    });
    const [recentChildren, setRecentChildren] = useState([]);
    const [recentReports, setRecentReports] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch children stats
            const childrenRes = await api.get('/children/stats/overview');

            // Fetch staff stats
            const staffRes = await api.get('/staff/stats/overview');

            // Fetch report stats
            const reportsRes = await api.get('/reports/stats/overview');

            // Fetch attendance stats
            const attendanceRes = await api.get('/attendance/stats/overview');

            console.log('Dashboard Data:', {
                children: childrenRes.data,
                staff: staffRes.data,
                reports: reportsRes.data,
                attendance: attendanceRes.data
            });

            setStats({
                children: {
                    total: childrenRes.data.stats?.total || 0,
                    active: childrenRes.data.stats?.active || 0
                },
                staff: {
                    total: staffRes.data.data?.total || 0,
                    active: staffRes.data.data?.active || 0
                },
                reports: {
                    today: reportsRes.data.data?.todayReports || 0,
                    total: reportsRes.data.data?.totalReports || 0
                },
                attendance: {
                    today: attendanceRes.data.data?.today || 0,
                    percentage: attendanceRes.data.data?.percentage || 0
                }
            });

            // Set recent children
            setRecentChildren(childrenRes.data.children || []);

            // Set recent reports
            setRecentReports(reportsRes.data.reports || []); // Updated to match expected API structure

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            title: 'Total Children',
            value: stats.children.total,
            icon: <FiUsers className="h-6 w-6" />,
            color: 'from-blue-500 to-blue-600',
            link: '/children',
            change: '+0%'
        },
        ...(user?.role === 'admin' ? [{
            title: 'Active Staff',
            value: stats.staff.active,
            icon: <FiUsers className="h-6 w-6" />,
            color: 'from-green-500 to-green-600',
            link: '/staff',
            change: '+2%'
        }] : []),
        {
            title: "Today's Reports",
            value: stats.reports.today,
            icon: <FiFileText className="h-6 w-6" />,
            color: 'from-purple-500 to-purple-600',
            link: '/reports',
            change: '+12%'
        },
        {
            title: 'Attendance %',
            value: `${stats.attendance.percentage}%`,
            icon: <FiCheckCircle className="h-6 w-6" />,
            color: 'from-yellow-500 to-yellow-600',
            link: '/attendance',
            change: '+3%'
        }
    ];

    const quickActions = [
        {
            title: 'Add New Child',
            description: 'Register a new child',
            icon: <FiUserPlus className="h-6 w-6" />,
            link: '/children/add',
            color: 'bg-blue-500'
        },
        {
            title: 'Mark Attendance',
            description: 'Record today\'s attendance',
            icon: <FiCheckCircle className="h-6 w-6" />,
            link: '/attendance/mark',
            color: 'bg-green-500'
        },
        {
            title: 'Add Daily Report',
            description: 'Create health report',
            icon: <FiFileText className="h-6 w-6" />,
            link: '/reports/add',
            color: 'bg-purple-500'
        },
        {
            title: 'View Analytics',
            description: 'See detailed reports',
            icon: <FiBarChart2 className="h-6 w-6" />,
            link: '/analytics',
            color: 'bg-yellow-500'
        }
    ];

    // Chart data
    const attendanceChartData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                label: 'Attendance %',
                data: [0, 0, 0, 0, 0, 0, 0], // Replaced hardcoded data
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true
            }
        ]
    };

    const healthChartData = {
        labels: ['Excellent', 'Good', 'Fair', 'Poor'],
        datasets: [
            {
                data: [0, 0, 0, 0], // Replaced hardcoded data
                backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(250, 204, 21, 0.8)',
                    'rgba(239, 68, 68, 0.8)'
                ],
                borderWidth: 1
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100
            }
        }
    };

    if (loading) {
        return <LoadingSpinner message="Loading dashboard..." />;
    }

    return (
        <div className="p-6">
            {/* Welcome Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">
                    Welcome back, {user?.name}!
                </h1>
                <p className="text-gray-600">
                    Here's what's happening with EEGA Trust today.
                    <span className="ml-2 text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        {new Date().toLocaleDateString('en-IN', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </span>
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((card, index) => (
                    <Link
                        key={index}
                        to={card.link}
                        className={`bg-gradient-to-br ${card.color} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm opacity-90">{card.title}</p>
                                <p className="text-3xl font-bold mt-2">{card.value}</p>
                                <div className="flex items-center mt-2">
                                    <FiTrendingUp className="mr-1" />
                                    <span className="text-sm opacity-80">{card.change}</span>
                                </div>
                            </div>
                            <div className="bg-white bg-opacity-20 p-3 rounded-full">
                                {card.icon}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Attendance Chart */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">Weekly Attendance</h3>
                            <p className="text-sm text-gray-600">Last 7 days trend</p>
                        </div>
                        <FiCalendar className="h-6 w-6 text-blue-500" />
                    </div>
                    <div className="h-64">
                        <Line data={attendanceChartData} options={chartOptions} />
                    </div>
                </div>

                {/* Health Status Chart */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">Health Status</h3>
                            <p className="text-sm text-gray-600">Distribution of health reports</p>
                        </div>
                        <FiHeart className="h-6 w-6 text-green-500" />
                    </div>
                    <div className="h-64">
                        <Pie data={healthChartData} options={chartOptions} />
                    </div>
                </div>
            </div>

            {/* Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-6">Quick Actions</h3>
                        <div className="space-y-4">
                            {quickActions.map((action, index) => (
                                <Link
                                    key={index}
                                    to={action.link}
                                    className="flex items-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition group"
                                >
                                    <div className={`${action.color} p-3 rounded-lg mr-4 text-white`}>
                                        {action.icon}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-800 group-hover:text-blue-600">
                                            {action.title}
                                        </p>
                                        <p className="text-sm text-gray-500">{action.description}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Children */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-800">Recent Admissions</h3>
                            <Link to="/children" className="text-sm text-blue-600 hover:text-blue-800">
                                View All
                            </Link>
                        </div>
                        <div className="space-y-4">
                            {recentChildren.slice(0, 5).map((child) => (
                                <div key={child._id} className="flex items-center p-3 hover:bg-gray-50 rounded-lg">
                                    <div className="h-10 w-10 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center mr-4">
                                        <span className="font-semibold text-blue-600">
                                            {child.name?.charAt(0)}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-800">{child.name}</p>
                                        <div className="text-sm text-gray-500 flex items-center">
                                            <span className="mr-3">ID: {child.childId}</span>
                                            <span>Age: {child.age}</span>
                                        </div>
                                    </div>
                                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                                        New
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Reports */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-800">Recent Reports</h3>
                            <Link to="/reports" className="text-sm text-blue-600 hover:text-blue-800">
                                View All
                            </Link>
                        </div>
                        <div className="space-y-4">
                            {recentReports.length > 0 ? (
                                recentReports.map((report) => (
                                    <div key={report._id} className="p-3 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg">
                                        <div className="flex items-center justify-between">
                                            <p className="font-medium text-gray-800">Daily Health Report</p>
                                            <span className="text-xs text-gray-500">
                                                {new Date(report.date).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {report.child?.name} - Health: {report.healthStatus?.overall}
                                        </p>
                                        <div className="flex items-center mt-2">
                                            <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center mr-2">
                                                <FiCheckCircle className="h-3 w-3 text-green-600" />
                                            </div>
                                            <span className="text-xs text-green-600">
                                                {report.specialNotes || 'No issues reported'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-center py-4">No recent reports</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Alerts & Notifications */}
            <div className="mt-8 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl shadow-md p-6 border border-yellow-200">
                <div className="flex items-center mb-4">
                    <FiAlertCircle className="h-6 w-6 text-yellow-600 mr-3" />
                    <h3 className="text-lg font-semibold text-yellow-800">Attention Needed</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-yellow-200">
                        <div className="flex items-center">
                            <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                                <FiAlertCircle className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-800">Health Alerts</p>
                                <p className="text-sm text-gray-600">0 children need attention</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-yellow-200">
                        <div className="flex items-center">
                            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                <FiClock className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-800">Pending Reports</p>
                                <p className="text-sm text-gray-600">
                                    {Math.max(0, stats.children.active - stats.reports.today)} daily reports due
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-yellow-200">
                        <div className="flex items-center">
                            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                <FiUsers className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-800">Unassigned Children</p>
                                <p className="text-sm text-gray-600">0 children need staff</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
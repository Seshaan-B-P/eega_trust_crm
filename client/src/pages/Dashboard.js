import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    FiUsers, FiActivity, FiCalendar,
    FiUserPlus, FiFileText, FiCheckCircle, FiAlertCircle,
    FiTrendingUp, FiBarChart2, FiClock, FiHeart, FiArrowRight, FiShoppingBag, FiBox
} from 'react-icons/fi';
import { TbCurrencyRupee } from 'react-icons/tb';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useTheme } from '../context/ThemeContext';
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
import { motion } from 'framer-motion';

ChartJS.register(
    CategoryScale, LinearScale, BarElement, Title, Tooltip,
    Legend, ArcElement, PointElement, LineElement
);

const Dashboard = () => {
    const { user } = useAuth();
    const { theme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        children: { total: 0, active: 0 },
        elderly: { total: 0, active: 0, bySpecialNeeds: [] },
        staff: { total: 0, active: 0 },
        reports: { today: 0, total: 0 },
        reports: { today: 0, total: 0 },
        donations: { total: 0, thisMonth: 0 },
        expenses: { total: 0, thisMonth: 0 },
        inventory: { totalItems: 0, lowStockItems: 0 }
    });
    const [recentChildren, setRecentChildren] = useState([]);
    const [recentElderly, setRecentElderly] = useState([]);
    const [recentReports, setRecentReports] = useState([]);
    const [healthData, setHealthData] = useState({
        excellent: 0,
        good: 0,
        fair: 0,
        poor: 0
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const childrenRes = await api.get('/children/stats/overview');
            let elderlyRes = { data: { data: { total: 0, active: 0, bySpecialNeeds: [] } } };
            try { elderlyRes = await api.get('/elderly/stats'); } catch (e) { }
            const staffRes = await api.get('/staff/stats/overview');
            const reportsRes = await api.get('/reports/stats/overview');
            let healthRes = { data: { data: { excellent: 0, good: 0, fair: 0, poor: 0 } } };
            try { healthRes = await api.get('/health/stats/distribution'); } catch (e) { }
            let recentElderlyRes = { data: { data: [] } };
            try { recentElderlyRes = await api.get('/elderly?limit=5&sort=-createdAt'); } catch (e) { }

            let donationsRes = { data: { data: { totals: { totalAmount: 0 }, thisMonth: { amount: 0 } } } };
            let expensesRes = { data: { data: { total: { totalAmount: 0 }, thisMonth: { totalAmount: 0 } } } };

            if (user?.role === 'admin') {
                try {
                    donationsRes = await api.get('/donations/stats');
                    expensesRes = await api.get('/expenses/stats');
                } catch (e) { }
            }

            let inventoryRes = { data: { data: { totalItems: 0, lowStockItems: 0 } } };
            try { inventoryRes = await api.get('/inventory/stats/summary'); } catch (e) { }

            setStats({
                children: {
                    total: childrenRes.data.stats?.total || 0,
                    active: childrenRes.data.stats?.active || 0
                },
                elderly: {
                    total: elderlyRes.data.stats?.total || 0,
                    active: elderlyRes.data.stats?.active || 0,
                    hospitalized: elderlyRes.data.stats?.hospitalized || 0,
                    deceased: elderlyRes.data.stats?.deceased || 0
                },
                staff: {
                    total: staffRes.data.data?.total || 0,
                    active: staffRes.data.data?.active || 0
                },
                reports: {
                    today: reportsRes.data.data?.todayReports || 0,
                    total: reportsRes.data.data?.totalReports || 0
                },
                donations: {
                    total: donationsRes.data.data?.totals?.totalAmount || 0,
                    thisMonth: donationsRes.data.data?.thisMonth?.amount || 0
                },
                expenses: {
                    total: expensesRes.data.data?.total?.totalAmount || 0,
                    thisMonth: expensesRes.data.data?.thisMonth?.totalAmount || 0
                },
                inventory: {
                    totalItems: inventoryRes.data.data?.totalItems || 0,
                    lowStockItems: inventoryRes.data.data?.lowStockItems || 0
                }
            });

            setRecentChildren(childrenRes.data.children || []);
            setRecentElderly(recentElderlyRes.data.elderly || []);
            setRecentReports(reportsRes.data.reports || []);
            setHealthData(healthRes.data.data);

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
            color: 'from-blue-600 to-indigo-700',
            link: '/children',
            change: '+5%',
            shadow: 'shadow-blue-500/20'
        },
        {
            title: 'Total Elderly',
            value: stats.elderly.total,
            icon: <FiHeart className="h-6 w-6" />,
            color: 'from-rose-500 to-pink-600',
            link: '/elderly',
            change: '+2%',
            shadow: 'shadow-rose-500/20'
        },
        ...(user?.role === 'admin' ? [{
            title: 'Active Staff',
            value: stats.staff.active,
            icon: <FiUsers className="h-6 w-6" />,
            color: 'from-amber-500 to-orange-600',
            link: '/staff',
            change: 'Stable',
            shadow: 'shadow-amber-500/20'
        }] : []),
        {
            title: "Today's Reports",
            value: stats.reports.today,
            icon: <FiFileText className="h-6 w-6" />,
            color: 'from-violet-500 to-purple-600',
            link: '/reports',
            change: 'Updated',
            shadow: 'shadow-violet-500/20'
        },
        ...(user?.role === 'admin' ? [
            {
                title: 'Monthly Cash Flow',
                value: `₹${(stats.donations.thisMonth - stats.expenses.thisMonth).toLocaleString('en-IN')}`,
                icon: <TbCurrencyRupee className="h-6 w-6" />,
                color: 'from-emerald-500 to-teal-600',
                link: '/donations',
                change: 'Net Growth',
                shadow: 'shadow-emerald-500/20'
            },
            {
                title: 'Low Stock Alerts',
                value: stats.inventory.lowStockItems,
                icon: <FiBox className="h-6 w-6" />,
                color: 'from-red-500 to-rose-600',
                link: '/inventory',
                change: 'Needs attention',
                shadow: 'shadow-red-500/20'
            }
        ] : [])
    ];

    const quickActions = [
        { title: 'Add Child', description: 'Register new', icon: <FiUserPlus />, link: '/children/add', color: 'bg-blue-500' },
        { title: 'Add Elderly', description: 'Register new', icon: <FiHeart />, link: '/elderly/add', color: 'bg-rose-500' },
        { title: 'Staff Attendance', description: 'Mark today', icon: <FiCheckCircle />, link: '/attendance/staff/mark', color: 'bg-cyan-500', adminOnly: true },
        { title: 'Daily Report', description: 'Update status', icon: <FiFileText />, link: '/reports/add', color: 'bg-violet-500' },
        ...(user?.role === 'admin' ? [
            { title: 'Donation', description: 'New receipt', icon: <FiHeart />, link: '/donations/add', color: 'bg-emerald-500' },
            { title: 'Expense', description: 'Log spending', icon: <FiShoppingBag />, link: '/expenses/add', color: 'bg-orange-500' }
        ] : [])
    ];

    const healthChartData = {
        labels: ['Excellent', 'Good', 'Fair', 'Poor'],
        datasets: [{
            data: [healthData.excellent, healthData.good, healthData.fair, healthData.poor],
            backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
            hoverOffset: 15,
            borderWidth: 0,
        }]
    };


    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: theme === 'dark' ? '#cbd5e1' : '#475569',
                    padding: 20,
                    usePointStyle: true,
                    pointStyle: 'circle'
                }
            },
            tooltip: {
                backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                titleColor: theme === 'dark' ? '#f8fafc' : '#1e293b',
                bodyColor: theme === 'dark' ? '#cbd5e1' : '#475569',
                borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                borderWidth: 1
            }
        }
    };

    if (loading) return <LoadingSpinner message="Loading..." />;

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
            className="space-y-8"
        >
            {/* Header Section */}
            <header className="relative p-8 rounded-[2.5rem] bg-slate-900 overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary-600/20 to-transparent"></div>
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl animate-pulse"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1">
                        <motion.div variants={itemVariants} className="flex items-center space-x-2 text-primary-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-2">
                            <span className="w-8 h-px bg-primary-400"></span>
                            <span>Today</span>
                        </motion.div>
                        <motion.h1 variants={itemVariants} className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                            Hello, {user?.name.split(' ')[0]} <span className="animate-wave inline-block">👋</span>
                        </motion.h1>
                        <motion.p variants={itemVariants} className="text-slate-400 mt-3 text-lg max-w-lg font-medium">
                            Everything is working well. Here are the details for today.
                        </motion.p>
                    </div>

                    <motion.div variants={itemVariants} className="flex flex-col items-end">
                        <div className="bg-white/5 border border-white/10 backdrop-blur-md p-4 rounded-2xl text-right">
                            <p className="text-white font-bold text-lg">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}</p>
                            <p className="text-slate-400 text-sm font-medium uppercase tracking-widest mt-1">{new Date().toLocaleDateString('en-IN', { weekday: 'long' })}</p>
                        </div>
                    </motion.div>
                </div>
            </header>

            {/* Stats Grid */}
            <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card, idx) => (
                    <motion.div key={idx} variants={itemVariants}>
                        <Link
                            to={card.link}
                            className={`group relative block p-6 rounded-3xl bg-gradient-to-br ${card.color} ${card.shadow} shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden`}
                        >
                            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
                                {React.cloneElement(card.icon, { size: 120 })}
                            </div>
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="p-3 bg-white/20 rounded-2xl w-fit backdrop-blur-md mb-6">
                                    {card.icon}
                                </div>
                                <p className="text-white/70 text-xs font-bold uppercase tracking-widest">{card.title}</p>
                                <h3 className="text-3xl font-black text-white mt-1">{card.value}</h3>
                                <div className="mt-8 flex items-center text-[10px] font-bold text-white/90 bg-white/10 w-fit px-3 py-1.5 rounded-full backdrop-blur-sm">
                                    <FiTrendingUp className="mr-1.5" />
                                    {card.change}
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </motion.div>

            {/* Quick Actions */}
            <section>
                <motion.h3 variants={itemVariants} className="text-sm font-black text-slate-800 dark:text-white mb-6 flex items-center uppercase tracking-widest">
                    <span className="w-2 h-6 bg-primary-600 rounded-full mr-3"></span>
                    Quick Actions
                </motion.h3>
                <motion.div variants={containerVariants} className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                    {quickActions.filter(action => !action.adminOnly || user?.role === 'admin').map((action, idx) => (
                        <motion.div key={idx} variants={itemVariants} className="h-full">
                            <Link to={action.link} className="card card-hover p-4 flex flex-col items-center text-center justify-center space-y-3 !rounded-[2rem] h-full shadow-sm hover:shadow-xl transition-all border border-slate-100 dark:border-slate-800">
                                <div className={`${action.color} p-4 rounded-2xl text-white shadow-lg`}>
                                    {action.icon}
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-slate-800 dark:text-white">{action.title}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-tight">{action.description}</p>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-10">
                {/* Left Column - Charts */}
                <div className="lg:col-span-8 space-y-8">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <motion.div variants={itemVariants} className="card p-8 !rounded-[2.5rem] shadow-sm">
                            <h4 className="text-lg font-black text-slate-800 dark:text-white mb-6">Health Summary</h4>
                            <div className="h-64 relative">
                                <Pie data={healthChartData} options={pieOptions} />
                            </div>
                        </motion.div>
                        <motion.div variants={itemVariants} className="card p-8 !rounded-[2.5rem] shadow-sm">
                            <h4 className="text-lg font-black text-slate-800 dark:text-white mb-6">Type of Care</h4>
                            <div className="h-64 relative">
                                <Pie data={{ ...healthChartData, labels: ['Medical', 'Routine', 'Special', 'Other'], datasets: [{ ...healthChartData.datasets[0], backgroundColor: ['#ec4899', '#8b5cf6', '#3b82f6', '#f97316'] }] }} options={pieOptions} />
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Right Column - Recent Activity */}
                <div className="lg:col-span-4 space-y-8">
                    <motion.div variants={itemVariants} className="card !bg-primary-600 p-8 !rounded-[2.5rem] text-white shadow-xl shadow-primary-900/40 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <h4 className="font-black text-lg">Recent Updates</h4>
                            <FiActivity className="text-white/50" />
                        </div>
                        <div className="space-y-6 relative z-10">
                            {recentReports.slice(0, 3).map((report, idx) => (
                                <div key={idx} className="flex space-x-4 border-l-2 border-white/20 pl-4 py-1">
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">{new Date(report.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                        <p className="text-sm font-bold truncate">
                                            {report.child?.name || report.elderly?.name || 'Someone'}
                                        </p>
                                        <p className="text-[10px] text-white/50 mt-1 line-clamp-2">{report.behavior}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-bold uppercase tracking-tighter">{report.healthStatus?.overall}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Link to="/reports" className="block w-full text-center py-3 bg-white/10 hover:bg-white/20 transition-colors rounded-2xl mt-8 text-[10px] font-black uppercase tracking-widest relative z-10">
                            View All Logs
                        </Link>
                    </motion.div>

                </div>
            </div>
        </motion.div>
    );
};

export default Dashboard;
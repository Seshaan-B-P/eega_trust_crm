import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
// Children
import ChildrenList from './pages/children/Children/ChildrenList';
import AddChild from './pages/children/Children/AddChild';
import EditChild from './pages/children/Children/EditChild';
import ChildDetails from './pages/children/Children/ChildDetails';

// Add imports for your new components
import ElderlyList from './components/elderly/ElderlyList';
import ElderlyForm from './components/elderly/ElderlyForm';
import ElderlyProfile from './components/elderly/ElderlyProfile';

// Staff
import StaffList from './pages/Staff/StaffList';
import AddStaff from './pages/Staff/AddStaff';
import StaffDetails from './pages/Staff/StaffDetails';
import EditStaff from './pages/Staff/EditStaff';

// Reports
import DailyReports from './pages/Reports/DailyReports';
import AddDailyReport from './pages/Reports/AddDailyReport';
import ReportDetails from './pages/Reports/ReportDetails';

// Attendance
import Attendance from './pages/Attendance/Attendance';
import AttendanceDetails from './pages/Attendance/AttendanceDetails';
import AttendanceMark from './pages/Attendance/AttendanceMark';
import StaffAttendanceMark from './pages/Attendance/StaffAttendanceMark';
import AttendanceReport from './pages/Attendance/AttendanceReport';
import StaffAttendanceReport from './pages/Attendance/StaffAttendanceReport';

// Donations
import DonationList from './pages/donations/DonationList';
import AddDonation from './pages/donations/AddDonation';
import DonationDetails from './pages/donations/DonationDetails';

// Expenses
import ExpenseList from './pages/expenses/ExpenseList';
import AddExpense from './pages/expenses/AddExpense';

// Inventory
import InventoryList from './pages/inventory/InventoryList';
import InventoryDetail from './pages/inventory/InventoryDetail';
import AddInventoryItem from './pages/inventory/AddInventoryItem';
import EditInventoryItem from './pages/inventory/EditInventoryItem';

import Settings from './pages/Settings';

import ErrorBoundary from './components/ErrorBoundary';
function App() {
    return (
        <ErrorBoundary>
            <ThemeProvider>
                <AuthProvider>
                    <Router>
                        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
                            <Toaster position="top-right" />

                            <Routes>

                                {/* Public Route */}
                                <Route path="/login" element={<Login />} />

                                {/* Protected Routes */}
                                <Route element={<ProtectedRoute />}>
                                    <Route element={<Layout />}>

                                        <Route path="/" element={<Navigate to="/dashboard" />} />
                                        <Route path="/dashboard" element={<Dashboard />} />

                                        {/* Children */}
                                        <Route path="/children" element={<ChildrenList />} />
                                        <Route path="/children/add" element={<AddChild />} />
                                        <Route path="/children/:id" element={<ChildDetails />} />
                                        <Route path="/children/:id/edit" element={<EditChild />} />

                                        {/* Staff */}
                                        <Route path="/staff" element={<StaffList />} />
                                        <Route path="/staff/add" element={<AddStaff />} />
                                        <Route path="/staff/:id" element={<StaffDetails />} />
                                        <Route path="/staff/:id/edit" element={<EditStaff />} />

                                        {/* Existing routes */}

                                        {/* New elderly routes */}
                                        <Route path="/elderly" element={<ElderlyList />} />

                                        <Route path="/elderly/add" element={<ElderlyForm />} />

                                        <Route path="/elderly/edit/:id" element={<ElderlyForm />} />

                                        <Route path="/elderly/:id" element={<ElderlyProfile />} />

                                        {/* Reports */}
                                        <Route path="/reports" element={<DailyReports />} />
                                        <Route path="/reports/add" element={<AddDailyReport />} />
                                        <Route path="/reports/:id" element={<ReportDetails />} />

                                        {/* Attendance */}
                                        <Route path="/attendance/staff/mark" element={
                                            <AdminRoute>
                                                <StaffAttendanceMark />
                                            </AdminRoute>
                                        } />
                                        <Route path="/attendance/staff/report" element={
                                            <AdminRoute>
                                                <StaffAttendanceReport />
                                            </AdminRoute>
                                        } />

                                        {/* Donation Routes */}
                                        <Route path="/donations" element={<DonationList />} />
                                        <Route path="/donations/add" element={<AddDonation />} />
                                        <Route path="/donations/:id" element={<DonationDetails />} />

                                        {/* Expense Routes */}
                                        <Route path="/expenses" element={
                                            <AdminRoute>
                                                <ExpenseList />
                                            </AdminRoute>
                                        } />
                                        <Route path="/expenses/add" element={
                                            <AdminRoute>
                                                <AddExpense />
                                            </AdminRoute>
                                        } />

                                        {/* Inventory Routes */}
                                        <Route path="/inventory" element={<InventoryList />} />
                                        <Route path="/inventory/add" element={<AddInventoryItem />} />
                                        <Route path="/inventory/edit/:id" element={<EditInventoryItem />} />
                                        <Route path="/inventory/:id" element={<InventoryDetail />} />

                                        <Route path="/settings" element={<Settings />} />

                                    </Route>
                                </Route>

                                {/* Fallback */}
                                <Route path="*" element={<Navigate to="/dashboard" />} />

                            </Routes>

                        </div>
                    </Router>
                </AuthProvider>
            </ThemeProvider>
        </ErrorBoundary>
    );
}


export default App;
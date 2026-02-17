import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
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

// Staff
import StaffList from './pages/Staff/StaffList';
import AddStaff from './pages/Staff/AddStaff';
import StaffDetails from './pages/Staff/StaffDetails';

// Reports
import DailyReports from './pages/Reports/DailyReports';
import AddDailyReport from './pages/Reports/AddDailyReport';
import ReportDetails from './pages/Reports/ReportDetails';

// Attendance
import Attendance from './pages/Attendance/Attendance';
import AttendanceMark from './pages/Attendance/AttendanceMark';

import Settings from './pages/Settings';

import ErrorBoundary from './components/ErrorBoundary';

function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <Router>
                    <div className="min-h-screen bg-gray-50">
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

                                    {/* Reports */}
                                    <Route path="/reports" element={<DailyReports />} />
                                    <Route path="/reports/add" element={<AddDailyReport />} />
                                    <Route path="/reports/:id" element={<ReportDetails />} />

                                    {/* Attendance */}
                                    <Route path="/attendance" element={<Attendance />} />
                                    <Route path="/attendance/mark" element={<AttendanceMark />} />

                                    <Route path="/settings" element={<Settings />} />

                                </Route>
                            </Route>

                            {/* Fallback */}
                            <Route path="*" element={<Navigate to="/dashboard" />} />

                        </Routes>

                    </div>
                </Router>
            </AuthProvider>
        </ErrorBoundary>
    );
}


export default App;
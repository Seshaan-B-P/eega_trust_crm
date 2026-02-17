import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiLogIn } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        console.log('Login attempt for:', formData.email);
        const result = await login(formData.email, formData.password);
        console.log('Login result:', result);

        if (result.success) {
            console.log('Navigating to dashboard...');
            // alert('Login success! Redirecting...'); // Temporary debug
            navigate('/dashboard');
        } else {
            console.error('Login failed:', result.error);
            alert('Login failed: ' + result.error);
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="bg-blue-100 p-3 rounded-full">
                            <FiLogIn className="h-8 w-8 text-blue-600" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">EEGA Trust CRM</h1>
                    <p className="text-gray-600">Sign in to your account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiMail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                placeholder="admin@eega.com"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiLock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>

                    <div className="text-center text-sm text-gray-600">
                        <p className="mb-2">
                            <strong>Demo Credentials:</strong>
                        </p>
                        <p className="text-left bg-gray-50 p-3 rounded-lg">
                            <span className="font-semibold">Admin:</span> admin@eega.com / admin123<br />
                            <span className="font-semibold">Staff:</span> staff@eega.com / staff123
                        </p>
                    </div>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-gray-600">
                        Forgot password? <span className="text-blue-600 cursor-pointer">Contact admin</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
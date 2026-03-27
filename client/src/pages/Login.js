import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock } from 'react-icons/fi';
import logo from '../assets/logo.jpg';
import { toast } from 'react-hot-toast';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const { login, forgotPassword } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const result = await login(formData.email, formData.password);

        if (result.success) {
            navigate('/dashboard');
        } else {
            // Error is handled inside login() via toast
        }

        setLoading(false);
    };

    const handleForgotPassword = async () => {
        if (!formData.email) {
            toast.error('Please enter your email address first.');
            return;
        }

        setLoading(true);
        const result = await forgotPassword(formData.email);
        
        if (result.success) {
            // Success message is handled inside forgotPassword() via toast
        } else {
            // Error is handled inside forgotPassword() or api interceptor
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-600/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
            
            <div className="w-full max-w-md bg-white/5 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] border border-white/10 dark:border-slate-700/30 p-10 relative z-10 transition-all duration-500 hover:shadow-primary-500/10 hover:border-white/20">
                {/* Logo */}
                <div className="flex flex-col items-center mb-10">
                    <div className="h-20 w-20 bg-white/10 backdrop-blur-md p-3 rounded-2xl shadow-inner border border-white/20 mb-4 flex items-center justify-center group overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <img src={logo} alt="Logo" className="h-full object-contain relative z-10 transition-transform duration-500 group-hover:scale-110" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                        EEGA <span className="text-primary-400">Trust</span>
                    </h2>
                    <p className="text-slate-400 text-sm font-medium mt-2 tracking-wide uppercase">Sign in to your account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email */}
                    <div className="space-y-2">
                        <label className="text-[13px] font-semibold text-slate-300 ml-1 tracking-wide">Email Address</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary-400 transition-colors">
                                <FiMail className="h-5 w-5" />
                            </div>
                            <input
                                type="email"
                                required
                                className="block w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 text-white rounded-2xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 transition-all outline-none text-sm font-medium placeholder:text-slate-600 shadow-inner"
                                placeholder="name@eega.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center ml-1">
                            <label className="text-[13px] font-semibold text-slate-300 tracking-wide">Password</label>
                            <button 
                                type="button" 
                                onClick={handleForgotPassword}
                                className="text-xs font-bold text-primary-400 hover:text-primary-300 transition-colors"
                                disabled={loading}
                            >
                                Forgot?
                            </button>
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary-400 transition-colors">
                                <FiLock className="h-5 w-5" />
                            </div>
                            <input
                                type="password"
                                required
                                className="block w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 text-white rounded-2xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 transition-all outline-none text-sm font-medium placeholder:text-slate-600 shadow-inner"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`
                            w-full py-4 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 text-white rounded-2xl font-bold text-sm shadow-[0_4px_20px_-5px_rgba(59,130,246,0.5)] transition-all active:scale-[0.98] flex items-center justify-center relative overflow-hidden group
                            ${loading ? 'opacity-70 cursor-not-allowed' : ''}
                        `}
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        {loading ? (
                            <div className="flex items-center space-x-2 relative z-10">
                                <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                                <span>Securing access...</span>
                            </div>
                        ) : (
                            <span className="relative z-10">Sign In</span>
                        )}
                    </button>
                </form>

                <div className="mt-10 pt-10 border-t border-white/10 text-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        EEGA TRUST CRM &bull; SECURE PORTAL
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
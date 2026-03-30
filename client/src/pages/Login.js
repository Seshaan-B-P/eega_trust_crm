import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiShield, FiCheckCircle } from 'react-icons/fi';
import logo from '../assets/logo.jpg';
import heroImage from '../assets/login-hero.png';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login, forgotPassword } = useAuth();
    const navigate = useNavigate();

    // Prevent body scroll when login page is active
    React.useEffect(() => {
        const originalHtmlOverflow = document.documentElement.style.overflow;
        const originalBodyOverflow = document.body.style.overflow;
        const originalBodyPosition = document.body.style.position;

        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';

        return () => {
            document.documentElement.style.overflow = originalHtmlOverflow;
            document.body.style.overflow = originalBodyOverflow;
            document.body.style.position = originalBodyPosition;
            document.body.style.width = '';
            document.body.style.height = '';
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const result = await login(formData.email, formData.password);

        if (result.success) {
            navigate('/dashboard');
        }
        setLoading(false);
    };

    const handleForgotPassword = async () => {
        if (!formData.email) {
            toast.error('Please enter your email address first.');
            return;
        }

        setLoading(true);
        await forgotPassword(formData.email);
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 w-full h-full grid lg:grid-cols-2 bg-[#020617] text-white selection:bg-primary-500/30 overflow-hidden font-jakarta z-[9999] touch-none select-none overscroll-none">
            {/* Nuclear Scroll Lock */}
            <style dangerouslySetInnerHTML={{
                __html: `
                html, body { 
                    overflow: hidden !important; 
                    height: 100% !important; 
                    width: 100% !important; 
                    position: fixed !important;
                    touch-action: none !important;
                    -ms-touch-action: none !important;
                }
                *::-webkit-scrollbar { display: none !important; }
                * { -ms-overflow-style: none !important; scrollbar-width: none !important; }
            `}} />


            {/* Left Column: Visual Brand Story */}
            <motion.div
                initial={{ opacity: 0, x: -60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="hidden lg:flex relative overflow-hidden group h-full"
            >
                {/* Hero Asset Layer */}
                <div className="absolute inset-0 z-0">
                    <img
                        src={heroImage}
                        alt="Eega Trust Community"
                        className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-[10s] ease-out brightness-100 mix-blend-luminosity grayscale-[0.2]"
                    />
                    {/* Multi-layered Vignettes for Depth */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/20 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#020617]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(112,125,247,0.15),transparent_70%)]" />
                </div>

                {/* Content Layer */}
                <div className="relative z-10 flex flex-col justify-end p-20 w-full">
                    <motion.div
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                    >
                        <div className="flex items-center gap-4 mb-8">


                        </div>
                        <h1 className="text-7xl font-black tracking-tighter mb-8 leading-[0.9] drop-shadow-2xl">
                            EEGA <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary-400 to-blue-600">TRUST</span>
                        </h1>
                        <p className="text-slate-400 text-xl max-w-lg leading-relaxed font-semibold italic opacity-80 mb-12">
                            "Transforming lives through compassion and precision management."
                        </p>

                        {/* Features Preview */}
                        <div className="flex gap-6">
                            {[
                                { icon: <FiShield />, label: 'Secure Access' },
                                { icon: <FiCheckCircle />, label: 'Verified Credentials' }
                            ].map((f, i) => (
                                <div key={i} className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                                    <span className="text-primary-500 text-lg">{f.icon}</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest">{f.label}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            {/* Right Column: Secure Form Interface */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                className="flex flex-col justify-center items-center p-6 lg:p-10 relative bg-[#020617] h-full overflow-y-auto scrollbar-hide"
            >
                {/* Mobile Background Context */}
                <div className="lg:hidden absolute inset-0 z-0 opacity-20">
                    <img src={heroImage} alt="B" className="w-full h-full object-cover blur-3xl scale-125" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#020617]" />
                </div>

                {/* Animated Light Artifacts */}
                <div className="absolute top-[-5%] left-[-10%] w-[50%] h-[50%] bg-primary-600/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '3s' }} />

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="w-full max-w-md relative z-10"
                >
                    {/* Branding for Desktop Header */}
                    <div className="mb-8 lg:mb-10 flex flex-col items-center lg:items-start">
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            className="h-20 w-20 bg-white/10 p-2 rounded-3xl border border-white/20 shadow-2xl mb-6 backdrop-blur-3xl overflow-hidden group"
                        >
                            <img src={logo} alt="Logo" className="w-full h-full object-contain mix-blend-normal group-hover:scale-110 transition-transform duration-500" />
                        </motion.div>
                        <h2 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">Welcome Back</h2>
                        <div className="h-1 w-12 bg-primary-500 rounded-full opacity-50 mb-3" />
                        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Secure Gateway Authorization</p>
                    </div>

                    {/* Authenticator Card */}
                    <div className="bg-white/[0.03] backdrop-blur-[40px] p-8 lg:p-10 rounded-[3.5rem] border border-white/10 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.8)] relative group/card">
                        {/* Interactive hover glow */}
                        <div className="absolute -inset-[1px] bg-gradient-to-br from-primary-500/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity rounded-[3.5rem] z-0 pointer-events-none" />

                        <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8 relative z-10">
                            {/* Identity Input */}
                            <div className="space-y-4">
                                <label className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-300 tracking-[0.25em] ml-2">
                                    <FiMail className="text-primary-500 scale-125" />
                                    Account email
                                </label>
                                <div className="relative group">
                                    <input
                                        type="email"
                                        required
                                        className="w-full px-8 py-5 bg-black/60 border border-white/10 text-slate-100 rounded-[2rem] focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500/50 transition-all outline-none font-semibold placeholder:text-slate-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] group-hover:border-white/20"
                                        placeholder="user@eegatrust.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Security Key Input */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center px-2">
                                    <label className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-300 tracking-[0.25em]">
                                        <FiLock className="text-primary-500 scale-125" />
                                        Password
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleForgotPassword}
                                        className="text-[10px] font-black uppercase text-primary-500 hover:text-primary-400 transition-all tracking-widest hover:translate-x-1"
                                        disabled={loading}
                                    >
                                        Forget Password?
                                    </button>
                                </div>
                                <div className="relative group">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="w-full px-8 py-5 bg-black/60 border border-white/10 text-slate-100 rounded-[2rem] focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500/50 transition-all outline-none font-semibold placeholder:text-slate-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] group-hover:border-white/20"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                    <div className="absolute right-6 top-0 bottom-0 flex items-center">
                                        <motion.button
                                            type="button"
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="p-1 text-slate-500 hover:text-white transition-colors flex items-center justify-center"
                                        >
                                            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                        </motion.button>
                                    </div>
                                </div>
                            </div>

                            {/* Authorization Trigger */}
                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileHover={!loading ? { scale: 1.02, y: -2 } : {}}
                                whileTap={!loading ? { scale: 0.98 } : {}}
                                className={`
                                    w-full py-6 bg-gradient-to-br from-primary-600 to-indigo-700 hover:from-primary-500 hover:to-indigo-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-[0_24px_48px_-12px_rgba(37,99,235,0.6)] transition-all flex items-center justify-center gap-4 group relative overflow-hidden
                                    ${loading ? 'opacity-70 cursor-not-allowed shadow-none' : ''}
                                `}
                            >
                                <AnimatePresence mode="wait">
                                    {loading ? (
                                        <motion.div
                                            key="loading"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex items-center gap-3 relative z-10"
                                        >
                                            <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                                            <span>Allocating Stream...</span>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="idle"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex items-center gap-3 relative z-10"
                                        >
                                            <FiShield className="stroke-[3px]" />
                                            <span>Login</span>
                                            <FiArrowRight className="group-hover:translate-x-2 transition-transform stroke-[3px]" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                            </motion.button>
                        </form>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Login;
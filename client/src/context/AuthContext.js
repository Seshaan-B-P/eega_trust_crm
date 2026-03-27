import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchUserProfile();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUserProfile = async () => {
        try {
            const response = await api.get('/auth/profile');
            setUser(response.data.user);
            setIsAuthenticated(true);
        } catch (error) {
            localStorage.removeItem('token');
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user } = response.data;
            
            localStorage.setItem('token', token);
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            setUser(user);
            setIsAuthenticated(true);
            toast.success('Login successful!');
            
            return { success: true };
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login failed');
            return { success: false, error: error.response?.data?.message };
        }
    };

    const register = async (userData) => {
        try {
            const response = await api.post('/auth/register', userData);
            toast.success('Registration successful!');
            return { success: true, data: response.data };
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
            return { success: false, error: error.response?.data?.message };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
        setIsAuthenticated(false);
        toast.success('Logged out successfully');
        window.location.href = '/login';
    };

const updateProfile = async (data) => {
    try {
        const response = await api.put('/auth/profile', data);
        setUser(response.data.user);
        toast.success('Profile updated successfully');
        return { success: true };
    } catch (error) {
        toast.error(error.response?.data?.message || 'Update failed');
        return { success: false };
    }
};

const forgotPassword = async (email) => {
    try {
        const response = await api.post('/auth/forgot-password', { email });
        toast.success(response.data.message);
        return { success: true, message: response.data.message };
    } catch (error) {
        // toast.error is already handled by api interceptor if response exists
        return { success: false, message: error.response?.data?.message || 'Connection failed' };
    }
};

const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    forgotPassword
};

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
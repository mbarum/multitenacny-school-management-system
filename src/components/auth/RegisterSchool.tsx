
import React, { useState } from 'react';
import * as api from '../../services/api';
import { useData } from '../../contexts/DataContext';

const RegisterSchool: React.FC = () => {
    const { handleLogin, addNotification } = useData();
    const [formData, setFormData] = useState({
        schoolName: '',
        adminName: '',
        adminEmail: '',
        password: '',
        phone: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const { user, token } = await api.registerSchool(formData);
            handleLogin(user, token);
            addNotification('School registered successfully! Welcome to Saaslink.', 'success');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="bg-primary-600 p-6 text-center">
                    <h2 className="text-2xl font-bold text-white">Register Your School</h2>
                    <p className="text-primary-100 mt-2">Start your 14-day free trial</p>
                </div>
                
                <form onSubmit={handleSubmit} className="p-8 space-y-4">
                    {error && <div className="bg-red-50 text-red-600 p-3 rounded text-sm">{error}</div>}
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700">School Name</label>
                        <input name="schoolName" value={formData.schoolName} onChange={handleChange} required className="mt-1 block w-full p-2 border rounded-md" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Admin Name</label>
                            <input name="adminName" value={formData.adminName} onChange={handleChange} required className="mt-1 block w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Phone</label>
                            <input name="phone" value={formData.phone} onChange={handleChange} required className="mt-1 block w-full p-2 border rounded-md" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Admin Email</label>
                        <input type="email" name="adminEmail" value={formData.adminEmail} onChange={handleChange} required className="mt-1 block w-full p-2 border rounded-md" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Password</label>
                        <input type="password" name="password" value={formData.password} onChange={handleChange} required className="mt-1 block w-full p-2 border rounded-md" minLength={8} />
                    </div>

                    <button type="submit" disabled={isLoading} className="w-full py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 transition">
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                    </button>
                    
                    <p className="text-center text-sm text-slate-600 mt-4">
                        Already have an account? <a href="/login" className="text-primary-600 font-semibold hover:underline">Login here</a>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default RegisterSchool;

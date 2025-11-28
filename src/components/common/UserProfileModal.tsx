
import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { useData } from '../../contexts/DataContext';

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
    const { currentUser, updateUserProfile, uploadUserAvatar, addNotification } = useData();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (currentUser) {
            setName(currentUser.name);
            setEmail(currentUser.email);
            setAvatarUrl(currentUser.avatarUrl || 'https://i.pravatar.cc/150');
        }
    }, [currentUser, isOpen]);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const formData = new FormData();
            formData.append('file', e.target.files[0]);
            try {
                const res = await uploadUserAvatar(formData);
                setAvatarUrl(res.avatarUrl);
                addNotification('Avatar updated successfully', 'success');
            } catch (error) {
                addNotification('Failed to upload avatar', 'error');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password && password !== confirmPassword) {
            addNotification('Passwords do not match', 'error');
            return;
        }

        try {
            await updateUserProfile({
                name,
                // Email updates might be restricted by backend for security, but we send it
                // Password will be hashed by backend if provided
                password: password || undefined,
            });
            addNotification('Profile updated successfully', 'success');
            onClose();
        } catch (error) {
            addNotification('Failed to update profile', 'error');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="My Profile" size="md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col items-center mb-4">
                    <div className="relative cursor-pointer group" onClick={handleAvatarClick}>
                        <img 
                            src={avatarUrl} 
                            alt="Profile" 
                            className="w-24 h-24 rounded-full object-cover border-2 border-slate-200 group-hover:opacity-75 transition-opacity"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">Change</span>
                        </div>
                    </div>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleFileChange}
                    />
                    <p className="text-sm text-slate-500 mt-2">{currentUser?.role}</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700">Full Name</label>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        className="mt-1 block w-full p-2 border border-slate-300 rounded-md" 
                        required 
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700">Email Address</label>
                    <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        className="mt-1 block w-full p-2 border border-slate-300 rounded-md bg-slate-100" 
                        readOnly 
                    />
                    <p className="text-xs text-slate-500 mt-1">Email cannot be changed directly.</p>
                </div>

                <div className="pt-4 border-t border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-800 mb-2">Change Password</h4>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-700">New Password</label>
                            <input 
                                type="password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                className="mt-1 block w-full p-2 border border-slate-300 rounded-md" 
                                placeholder="Leave blank to keep current"
                                minLength={8}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700">Confirm Password</label>
                            <input 
                                type="password" 
                                value={confirmPassword} 
                                onChange={(e) => setConfirmPassword(e.target.value)} 
                                className="mt-1 block w-full p-2 border border-slate-300 rounded-md" 
                                placeholder="Confirm new password"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button 
                        type="submit" 
                        className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700"
                    >
                        Save Changes
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default UserProfileModal;

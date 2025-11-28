
import React, { useState, useEffect, useRef } from 'react';
import { Role } from '../../types';
import { useData } from '../../contexts/DataContext';
import UserProfileModal from '../common/UserProfileModal';

const Header: React.FC = () => {
    const { currentUser, announcements, handleLogout, setActiveView, setIsMobileSidebarOpen } = useData();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    
    const menuRef = useRef<HTMLDivElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);

    if (!currentUser) return null;
    
    const recentAnnouncementsCount = announcements.filter(a => {
        const announcementDate = new Date(a.date);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return announcementDate > sevenDaysAgo;
    }).length;
    
    const recentAnnouncements = announcements
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuRef, notificationsRef]);

    const handleViewAll = () => {
        let view = 'communication'; // default for Admin/Accountant
        if (currentUser.role === Role.Teacher) view = 'teacher_communication';
        if (currentUser.role === Role.Parent) view = 'parent_announcements';
        setActiveView(view);
        setIsNotificationsOpen(false);
    }

    return (
        <>
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 -mb-px">
                        {/* Hamburger menu for mobile */}
                        <div className="lg:hidden">
                            <button onClick={() => setIsMobileSidebarOpen(true)} className="text-slate-500 hover:text-slate-600">
                                <span className="sr-only">Open sidebar</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                        {/* Welcome message - hidden on mobile to give space */}
                        <div className="hidden sm:block">
                            <h1 className="text-2xl font-bold text-primary-800">Welcome, {currentUser.name.split(' ')[0]}!</h1>
                        </div>

                        <div className="flex items-center space-x-4">
                            {/* Notification Bell */}
                            <div className="relative" ref={notificationsRef}>
                                <button 
                                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                    className="p-2 text-slate-500 rounded-full hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                </button>
                                {recentAnnouncementsCount > 0 && (
                                    <span className="absolute top-0 right-0 block h-5 w-5 transform -translate-y-1/2 translate-x-1/2 rounded-full ring-2 ring-white bg-red-500 text-white text-xs flex items-center justify-center">
                                        {recentAnnouncementsCount}
                                    </span>
                                )}
                                {isNotificationsOpen && (
                                    <div className="origin-top-right absolute right-0 mt-2 w-80 max-w-sm rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                                        <div className="px-4 py-2 border-b border-slate-200">
                                            <h3 className="font-semibold text-slate-800 text-sm">Recent Announcements</h3>
                                        </div>
                                        <ul className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                                            {recentAnnouncements.length > 0 ? recentAnnouncements.map(ann => (
                                                <li key={ann.id}>
                                                    <a href="#" onClick={(e) => { e.preventDefault(); handleViewAll(); }} className="block p-3 hover:bg-slate-50">
                                                        <p className="font-semibold text-slate-800 text-sm truncate">{ann.title}</p>
                                                        <p className="text-xs text-slate-500 mt-1 truncate">{ann.content}</p>
                                                        <p className="text-xs text-slate-400 mt-1">{new Date(ann.date).toLocaleDateString()}</p>
                                                    </a>
                                                </li>
                                            )) : (
                                                <li className="p-4 text-center text-sm text-slate-500">
                                                    No recent announcements.
                                                </li>
                                            )}
                                        </ul>
                                        <div className="border-t border-slate-200">
                                            <a href="#" onClick={(e) => {e.preventDefault(); handleViewAll();}} className="block text-center py-2 px-4 text-sm font-medium text-primary-600 hover:bg-slate-50">
                                                View All
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* User Avatar and Dropdown */}
                            <div className="relative" ref={menuRef}>
                                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                                    <img className="h-10 w-10 rounded-full object-cover" src={currentUser.avatarUrl || 'https://i.pravatar.cc/150'} alt="User avatar" />
                                </button>
                                {isMenuOpen && (
                                    <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                                        <div className="px-4 py-3 border-b border-slate-200">
                                            <p className="text-sm font-semibold text-slate-900 truncate">{currentUser.name}</p>
                                            <p className="text-sm text-slate-500 truncate">{currentUser.email}</p>
                                        </div>
                                        <a
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setIsProfileModalOpen(true);
                                                setIsMenuOpen(false);
                                            }}
                                            className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            My Profile
                                        </a>
                                        <a
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleLogout();
                                                setIsMenuOpen(false);
                                            }}
                                            className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            Logout
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            <UserProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
        </>
    );
};

export default Header;

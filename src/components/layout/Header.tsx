
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Sun, Moon, Globe } from 'lucide-react';
import { Role, SubscriptionStatus } from '../../types';
import { useData } from '../../contexts/DataContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import LanguageSelector from '../landing/LanguageSelector';
import UserProfileModal from '../common/UserProfileModal';
import { useQuery } from '@tanstack/react-query';
import * as api from '../../services/api';

const Header: React.FC = () => {
    const { currentUser, handleLogout, setActiveView, setIsMobileSidebarOpen } = useData();
    const { theme, toggleTheme, isDarkMode } = useTheme();
    const { t, language, setLanguage } = useLanguage();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    
    const menuRef = useRef<HTMLDivElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);

    // Queries for Announcements and pending schools (for SuperAdmin)
    const { data: announcements = [] } = useQuery({ 
        queryKey: ['announcements'], 
        queryFn: api.findAllAnnouncements,
        enabled: !!currentUser
    });

    const { data: schools = [] } = useQuery({ 
        queryKey: ['super-schools'], 
        queryFn: api.getAllSchools,
        enabled: currentUser?.role === Role.SuperAdmin 
    });

    if (!currentUser) return null;
    
    const displayName = currentUser.name || 'Account';
    
    const recentAnnouncementsCount = announcements.filter((a: any) => {
        const announcementDate = new Date(a.date);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return announcementDate > sevenDaysAgo;
    }).length;
    
    const pendingApprovalCount = useMemo(() => {
        const list = Array.isArray(schools) ? schools : (Array.isArray((schools as any)?.data) ? (schools as any).data : []);
        return list.filter((s: any) => 
            s.subscription?.status === SubscriptionStatus.PENDING_APPROVAL || 
            s.subscription?.status === SubscriptionStatus.PENDING_PAYMENT
        ).length;
    }, [schools]);

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

    return (
        <>
            {/* Global Warning Banner for SuperAdmin */}
            {currentUser.role === Role.SuperAdmin && pendingApprovalCount > 0 && (
                <div className="bg-slate-900 dark:bg-slate-950 text-white px-4 py-2 flex items-center justify-center gap-4 animate-fade-in-down relative z-[100] border-b border-slate-800">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">
                        {t('header.notice.superAdmin', 'System Notice: {count} new applications are awaiting manual financial verification.').replace('{count}', String(pendingApprovalCount))}
                    </p>
                    <button 
                        onClick={() => setActiveView('super_admin_dashboard')} 
                        className="text-[10px] font-black uppercase tracking-widest text-primary-400 hover:text-white transition-colors underline underline-offset-4"
                    >
                        {t('header.processQueue', 'Process Queue')}
                    </button>
                </div>
            )}

            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm transition-colors duration-200">
                <div className="px-4 sm:px-6">
                    <div className="flex justify-between items-center h-16 -mb-px">
                        <div className="lg:hidden">
                            <button 
                                onClick={() => setIsMobileSidebarOpen(true)} 
                                className="text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 -ml-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                                aria-label={t('header.openSidebar', 'Open sidebar')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                                {t('header.greeting', 'Hello')}, <span className="text-primary-600 dark:text-primary-400">{displayName.split(' ')[0]}</span>
                            </h1>
                        </div>

                        <div className="flex items-center space-x-2 sm:space-x-3">
                            {/* Global Language Switcher */}
                            <LanguageSelector variant="header" />

                            {/* Global Theme Toggle Button */}
                            <button
                                id="header-theme-toggle"
                                type="button"
                                onClick={toggleTheme}
                                className="p-2 sm:px-2.5 sm:py-2 rounded-xl text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/30 flex items-center gap-1.5 border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 shadow-xs"
                                title={isDarkMode ? t('header.theme.titleLight', 'Switch to light mode') : t('header.theme.titleDark', 'Switch to dark mode')}
                                aria-label={isDarkMode ? t('header.theme.titleLight', 'Switch to light mode') : t('header.theme.titleDark', 'Switch to dark mode')}
                            >
                                {isDarkMode ? (
                                    <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400 transition-transform duration-300 hover:rotate-45" />
                                ) : (
                                    <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600 transition-transform duration-300 hover:-rotate-12" />
                                )}
                                <span className="hidden md:inline text-xs font-semibold text-slate-600 dark:text-slate-300">
                                    {isDarkMode ? t('header.theme.light', 'Light') : t('header.theme.dark', 'Dark')}
                                </span>
                            </button>

                            <div className="relative" ref={notificationsRef}>
                                <button 
                                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                    className="p-2 sm:p-2.5 text-slate-500 dark:text-slate-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                                    aria-label={t('header.notifications', 'Notifications')}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                </button>
                                {(recentAnnouncementsCount > 0) && (
                                    <span className="absolute top-1 right-1 block h-5 w-5 transform -translate-y-1/2 translate-x-1/2 rounded-full ring-2 ring-white dark:ring-slate-900 bg-red-600 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                                        {recentAnnouncementsCount}
                                    </span>
                                )}
                            </div>
                            
                            <div className="relative h-8 border-l border-slate-200 dark:border-slate-800 hidden sm:block"></div>

                            <div className="relative" ref={menuRef}>
                                <button 
                                    onClick={() => setIsMenuOpen(!isMenuOpen)} 
                                    className="flex items-center gap-3 p-1 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all focus:outline-none"
                                >
                                    <div className="text-right hidden md:block">
                                        <p className="text-xs font-black text-slate-800 dark:text-slate-100 leading-none">{displayName}</p>
                                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">{currentUser.role}</p>
                                    </div>
                                    <img className="h-10 w-10 rounded-xl object-cover border-2 border-white dark:border-slate-700 shadow-md" src={currentUser.avatarUrl || `https://i.pravatar.cc/150?u=${currentUser.email}`} alt="Avatar" />
                                </button>
                                {isMenuOpen && (
                                    <div className="origin-top-right absolute right-0 mt-3 w-64 rounded-2xl shadow-2xl py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ring-1 ring-black ring-opacity-5 focus:outline-none animate-fade-in-down overflow-hidden">
                                        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('header.activeAccount', 'Active Account')}</p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate mt-1">{currentUser.email}</p>
                                        </div>
                                        <div className="p-2 space-y-1">
                                            {/* Language Selector inside Menu */}
                                            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                                                <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                                                    <span className="flex items-center gap-1.5">
                                                        <Globe className="w-3.5 h-3.5 text-primary-500" />
                                                        {t('header.language', 'Language')}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase">
                                                        {language}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setLanguage('en')}
                                                        className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center ${
                                                            language === 'en'
                                                                ? 'bg-primary-600 text-white shadow-xs'
                                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                        }`}
                                                    >
                                                        🇬🇧 EN
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setLanguage('sw')}
                                                        className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center ${
                                                            language === 'sw'
                                                                ? 'bg-primary-600 text-white shadow-xs'
                                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                        }`}
                                                    >
                                                        🇰🇪 SW
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setLanguage('fr')}
                                                        className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center ${
                                                            language === 'fr'
                                                                ? 'bg-primary-600 text-white shadow-xs'
                                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                        }`}
                                                    >
                                                        🇫🇷 FR
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Quick Theme Option in Menu */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    toggleTheme();
                                                }}
                                                className="flex w-full items-center justify-between px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors group"
                                            >
                                                <span className="flex items-center">
                                                    {isDarkMode ? (
                                                        <Sun className="h-5 w-5 mr-3 text-amber-400" />
                                                    ) : (
                                                        <Moon className="h-5 w-5 mr-3 text-slate-400 group-hover:text-indigo-600" />
                                                    )}
                                                    {t('header.theme.mode', 'Theme Mode')}
                                                </span>
                                                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
                                                    {isDarkMode ? t('header.theme.dark', 'Dark') : t('header.theme.light', 'Light')}
                                                </span>
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setIsProfileModalOpen(true);
                                                    setIsMenuOpen(false);
                                                }}
                                                className="flex w-full items-center px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-primary-50 dark:hover:bg-slate-800 hover:text-primary-700 dark:hover:text-primary-400 rounded-xl transition-colors group"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-slate-400 group-hover:text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                {t('header.profileSettings', 'Profile Settings')}
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleLogout();
                                                    setIsMenuOpen(false);
                                                }}
                                                className="flex w-full items-center px-4 py-3 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors group"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-red-400 group-hover:text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                </svg>
                                                {t('header.signOut', 'Sign Out')}
                                            </button>
                                        </div>
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

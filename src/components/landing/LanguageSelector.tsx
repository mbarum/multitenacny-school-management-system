import React, { useState, useRef, useEffect } from 'react';
import { useLanguage, SupportedLanguage } from '../../contexts/LanguageContext';
import { Globe, ChevronDown, Check } from 'lucide-react';

interface LanguageSelectorProps {
    className?: string;
    variant?: 'dark' | 'light' | 'header';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ className = '', variant = 'light' }) => {
    const { language, setLanguage, t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const languages: { code: SupportedLanguage; label: string; flag: string; short: string }[] = [
        { code: 'en', label: 'English', flag: '🇬🇧', short: 'EN' },
        { code: 'sw', label: 'Kiswahili', flag: '🇰🇪', short: 'SW' },
        { code: 'fr', label: 'Français', flag: '🇫🇷', short: 'FR' },
    ];

    const currentLang = languages.find((l) => l.code === language) || languages[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    if (variant === 'header') {
        return (
            <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
                <button
                    id="header-language-switcher-btn"
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 sm:px-3 sm:py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/30 flex items-center gap-1.5 border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 shadow-xs"
                    aria-label={t('header.selectLanguage', 'Select Interface Language')}
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                    title={t('header.selectLanguage', 'Select Interface Language')}
                >
                    <Globe className="w-4 h-4 text-primary-500 shrink-0" />
                    <span className="text-xs font-bold tracking-wide flex items-center gap-1">
                        <span>{currentLang.flag}</span>
                        <span className="hidden sm:inline">{currentLang.short}</span>
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <div 
                        className="origin-top-right absolute right-0 mt-2 w-44 rounded-2xl shadow-xl py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ring-1 ring-black/5 focus:outline-none z-50 animate-fade-in-down overflow-hidden"
                        role="menu"
                        aria-orientation="vertical"
                    >
                        <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            {t('header.language', 'Language')}
                        </div>
                        {languages.map((item) => {
                            const isSelected = item.code === language;
                            return (
                                <button
                                    key={item.code}
                                    type="button"
                                    onClick={() => {
                                        setLanguage(item.code);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold transition-colors ${
                                        isSelected
                                            ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-bold'
                                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                    role="menuitem"
                                >
                                    <span className="flex items-center gap-2">
                                        <span className="text-sm">{item.flag}</span>
                                        <span>{item.label}</span>
                                    </span>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400 shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    const isDark = variant === 'dark';

    return (
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-xl text-xs font-semibold ${
            isDark 
                ? 'bg-slate-900 border border-slate-700 text-slate-200' 
                : 'bg-white border border-slate-200 text-slate-700 shadow-sm'
        } ${className}`}>
            <Globe className="w-3.5 h-3.5 text-primary-500 shrink-0" />
            <select
                id="global-language-selector"
                aria-label="Select Interface Language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                className={`bg-transparent text-xs font-bold focus:outline-none cursor-pointer pr-1 ${
                    isDark ? 'text-white' : 'text-slate-800'
                }`}
            >
                {languages.map((l) => (
                    <option 
                        key={l.code} 
                        value={l.code} 
                        className="bg-white text-slate-900 font-medium"
                    >
                        {l.flag} {l.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default LanguageSelector;


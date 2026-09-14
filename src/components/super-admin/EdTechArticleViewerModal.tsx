import React, { useState, useEffect, useRef } from 'react';
import { 
    X, Video, FileText, Image as ImageIcon, Download, ExternalLink, 
    Calendar, Clock, User, Tag, Sparkles, BookOpen, Play, Pause, Square,
    CheckCircle2, Share2, Printer, Bookmark, Heart, Copy, Check,
    Volume2, VolumeX, Maximize2, Minimize2, ChevronRight, MessageSquare,
    Eye, Sliders, ArrowLeft, ArrowUpRight
} from 'lucide-react';
import { EdTechArticle, ArticleMediaItem } from '../../types';

interface EdTechArticleViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    article: EdTechArticle | null;
}

type ReaderTheme = 'light' | 'sepia' | 'dark';
type FontSize = 'sm' | 'base' | 'lg' | 'xl';

export const EdTechArticleViewerModal: React.FC<EdTechArticleViewerModalProps> = ({
    isOpen,
    onClose,
    article
}) => {
    // Reader Customization State
    const [theme, setTheme] = useState<ReaderTheme>('light');
    const [fontSize, setFontSize] = useState<FontSize>('base');
    const [scrollProgress, setScrollProgress] = useState<number>(0);
    const [isZenMode, setIsZenMode] = useState<boolean>(false);
    const [showSettings, setShowSettings] = useState<boolean>(false);
    const [showShareMenu, setShowShareMenu] = useState<boolean>(false);
    const [copySuccess, setCopySuccess] = useState<boolean>(false);

    // Audio Narration State (SpeechSynthesis)
    const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
    const [isPaused, setIsPaused] = useState<boolean>(false);
    const [speechSupported, setSpeechSupported] = useState<boolean>(false);

    // User Engagement State
    const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
    const [isLiked, setIsLiked] = useState<boolean>(false);
    const [likesCount, setLikesCount] = useState<number>(0);

    // Media and Active Section States
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<'content' | 'video' | 'downloads' | 'visuals'>('content');

    const contentContainerRef = useRef<HTMLDivElement>(null);
    const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

    // Check Speech Synthesis Support
    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            setSpeechSupported(true);
        }
    }, []);

    // Sync engagement with localStorage when article changes
    useEffect(() => {
        if (!article) return;

        try {
            const savedBookmarks = JSON.parse(localStorage.getItem('saaslink_bookmarks') || '[]');
            setIsBookmarked(savedBookmarks.includes(article.id));

            const savedLikes = JSON.parse(localStorage.getItem('saaslink_likes') || '[]');
            setIsLiked(savedLikes.includes(article.id));
            setLikesCount((article.viewsCount ? Math.floor(article.viewsCount / 12) : 28) + (savedLikes.includes(article.id) ? 1 : 0));
        } catch {
            // fallback
            setLikesCount(32);
        }

        // Reset scroll position and speech
        if (contentContainerRef.current) {
            contentContainerRef.current.scrollTop = 0;
            setScrollProgress(0);
        }
        stopAudio();
    }, [article]);

    // Handle ESC key to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (selectedImage) {
                    setSelectedImage(null);
                } else if (showSettings) {
                    setShowSettings(false);
                } else if (showShareMenu) {
                    setShowShareMenu(false);
                } else if (isOpen) {
                    handleClose();
                }
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            // Prevent body background scroll on mobile
            document.body.style.overflow = 'hidden';
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, selectedImage, showSettings, showShareMenu]);

    // Scroll progress tracker
    const handleScroll = () => {
        if (!contentContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = contentContainerRef.current;
        const totalScrollable = scrollHeight - clientHeight;
        if (totalScrollable <= 0) {
            setScrollProgress(0);
            return;
        }
        const progress = Math.min(100, Math.max(0, (scrollTop / totalScrollable) * 100));
        setScrollProgress(progress);
    };

    // Close & Cleanup
    const handleClose = () => {
        stopAudio();
        onClose();
    };

    // Text-To-Speech Controls
    const startAudio = () => {
        if (!speechSupported || !article) return;

        if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
            setIsPaused(false);
            setIsSpeaking(true);
            return;
        }

        window.speechSynthesis.cancel();

        const fullText = [
            article.title,
            `By ${article.author}, ${article.authorRole}`,
            'Executive Takeaway:',
            article.excerpt,
            ...(article.learningObjectives || []),
            ...(article.content || [])
        ].join('. ');

        const utterance = new SpeechSynthesisUtterance(fullText);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.lang = 'en-US';

        utterance.onstart = () => {
            setIsSpeaking(true);
            setIsPaused(false);
        };

        utterance.onend = () => {
            setIsSpeaking(false);
            setIsPaused(false);
        };

        utterance.onerror = () => {
            setIsSpeaking(false);
            setIsPaused(false);
        };

        speechRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    };

    const pauseAudio = () => {
        if (!speechSupported) return;
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
            window.speechSynthesis.pause();
            setIsPaused(true);
        }
    };

    const stopAudio = () => {
        if (!speechSupported) return;
        if (window.speechSynthesis.speaking || window.speechSynthesis.paused) {
            window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
        setIsPaused(false);
    };

    // Toggle Bookmark
    const toggleBookmark = () => {
        if (!article) return;
        try {
            const saved = JSON.parse(localStorage.getItem('saaslink_bookmarks') || '[]');
            let next: string[];
            if (saved.includes(article.id)) {
                next = saved.filter((id: string) => id !== article.id);
                setIsBookmarked(false);
            } else {
                next = [...saved, article.id];
                setIsBookmarked(true);
            }
            localStorage.setItem('saaslink_bookmarks', JSON.stringify(next));
        } catch (e) {
            setIsBookmarked(!isBookmarked);
        }
    };

    // Toggle Like
    const toggleLike = () => {
        if (!article) return;
        try {
            const saved = JSON.parse(localStorage.getItem('saaslink_likes') || '[]');
            let next: string[];
            if (saved.includes(article.id)) {
                next = saved.filter((id: string) => id !== article.id);
                setIsLiked(false);
                setLikesCount(prev => Math.max(0, prev - 1));
            } else {
                next = [...saved, article.id];
                setIsLiked(true);
                setLikesCount(prev => prev + 1);
            }
            localStorage.setItem('saaslink_likes', JSON.stringify(next));
        } catch (e) {
            setIsLiked(!isLiked);
            setLikesCount(prev => (isLiked ? prev - 1 : prev + 1));
        }
    };

    // Copy Article Deep-Link
    const handleCopyLink = () => {
        if (!article) return;
        const url = `${window.location.origin}${window.location.pathname}#edtech-${article.id}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2500);
        });
    };

    // Share via WhatsApp
    const handleWhatsAppShare = () => {
        if (!article) return;
        const url = `${window.location.origin}${window.location.pathname}#edtech-${article.id}`;
        const text = encodeURIComponent(`*${article.title}*\n\nRead this educational insight on SaasLink:\n${url}`);
        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    };

    // Share via Web Share API
    const handleNativeShare = async () => {
        if (!article) return;
        const url = `${window.location.origin}${window.location.pathname}#edtech-${article.id}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: article.title,
                    text: article.excerpt,
                    url: url
                });
            } catch {
                setShowShareMenu(true);
            }
        } else {
            setShowShareMenu(true);
        }
    };

    // Download PDF helper
    const handleDownload = (item: ArticleMediaItem) => {
        const link = document.createElement('a');
        link.href = item.url;
        link.download = item.fileName || `${item.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // YouTube Embed Helper
    const isYouTubeUrl = (url: string) => {
        return url.includes('youtube.com') || url.includes('youtu.be');
    };

    const getYouTubeEmbedUrl = (url: string) => {
        if (url.includes('embed')) return url;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) 
            ? `https://www.youtube.com/embed/${match[2]}?autoplay=1` 
            : url;
    };

    if (!isOpen || !article) return null;

    const videos = (article.media || []).filter(m => m.type === 'VIDEO');
    const pdfs = (article.media || []).filter(m => m.type === 'PDF');
    const images = (article.media || []).filter(m => m.type === 'IMAGE');

    // Theme Color Palettes
    const themeStyles = {
        light: {
            container: 'bg-white text-slate-800',
            header: 'bg-white/95 text-slate-900 border-slate-200 backdrop-blur-md',
            headerBanner: 'bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white',
            bodyText: 'text-slate-700',
            callout: 'bg-primary-50/80 border-primary-200 text-slate-900',
            calloutAccent: 'text-primary-800',
            metaBadge: 'bg-slate-100 text-slate-700 border-slate-200',
            card: 'bg-slate-50 border-slate-200 text-slate-900',
            navPillActive: 'bg-slate-900 text-white shadow-sm',
            navPillInactive: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
            footer: 'bg-slate-50 border-slate-200 text-slate-600'
        },
        sepia: {
            container: 'bg-[#FAF7F0] text-[#3E3832]',
            header: 'bg-[#FAF7F0]/95 text-[#2C2723] border-[#E8E0D2] backdrop-blur-md',
            headerBanner: 'bg-[#2E2822] text-[#FAF7F0]',
            bodyText: 'text-[#3E3832]',
            callout: 'bg-[#F3ECE0] border-[#E2D6C3] text-[#2C2723]',
            calloutAccent: 'text-[#8C5D33]',
            metaBadge: 'bg-[#EDE4D5] text-[#5C5247] border-[#DFD5C4]',
            card: 'bg-[#F5EFE6] border-[#E4D9CA] text-[#2C2723]',
            navPillActive: 'bg-[#3E3832] text-[#FAF7F0] shadow-sm',
            navPillInactive: 'bg-[#EDE4D5] hover:bg-[#E4D9CA] text-[#5C5247]',
            footer: 'bg-[#F3ECE0] border-[#E4D9CA] text-[#6E6357]'
        },
        dark: {
            container: 'bg-slate-950 text-slate-200',
            header: 'bg-slate-950/95 text-slate-100 border-slate-800 backdrop-blur-md',
            headerBanner: 'bg-slate-900 text-white border-b border-slate-800',
            bodyText: 'text-slate-300',
            callout: 'bg-slate-900/90 border-slate-800 text-slate-100',
            calloutAccent: 'text-primary-400',
            metaBadge: 'bg-slate-900 text-slate-300 border-slate-800',
            card: 'bg-slate-900 border-slate-800 text-slate-200',
            navPillActive: 'bg-primary-600 text-white shadow-sm',
            navPillInactive: 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800',
            footer: 'bg-slate-900/60 border-slate-800 text-slate-400'
        }
    };

    const currentTheme = themeStyles[theme];

    // Typography Size Mappings
    const fontStyles = {
        sm: 'text-sm leading-relaxed',
        base: 'text-base leading-relaxed',
        lg: 'text-lg leading-relaxed',
        xl: 'text-xl leading-relaxed'
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reader-article-title"
        >
            {/* Reading Progress Indicator Bar (Fixed at top of screen) */}
            <div className="fixed top-0 left-0 right-0 h-1 z-60 bg-slate-200/40">
                <div 
                    className="h-full bg-gradient-to-r from-primary-600 via-indigo-600 to-emerald-500 transition-all duration-150"
                    style={{ width: `${scrollProgress}%` }}
                />
            </div>

            {/* Main Reader Surface (Full-screen on mobile, centered ergonomic canvas on tablet/desktop) */}
            <div 
                className={`
                    w-full h-full md:h-[94vh] flex flex-col overflow-hidden transition-all duration-300
                    ${isZenMode 
                        ? 'max-w-6xl md:rounded-3xl shadow-2xl border-0 md:border border-slate-800' 
                        : 'max-w-4xl md:rounded-3xl shadow-2xl border-0 md:border border-slate-200/80'
                    }
                    ${currentTheme.container}
                `}
            >
                {/* 1. TOP INTERACTIVE APP BAR (Sticky on all devices) */}
                <header className={`sticky top-0 z-40 px-4 sm:px-6 py-3 border-b flex items-center justify-between gap-3 ${currentTheme.header}`}>
                    <div className="flex items-center gap-2 min-w-0">
                        <button
                            onClick={handleClose}
                            className="p-2 -ml-1.5 rounded-xl hover:bg-slate-500/10 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1 text-xs font-bold shrink-0"
                            aria-label="Back to previous page"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Back</span>
                        </button>

                        <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block"></div>

                        <div className="truncate">
                            <span className="text-[11px] font-black uppercase tracking-wider text-primary-600 dark:text-primary-400 block truncate">
                                {article.category}
                            </span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate hidden md:block max-w-[280px]">
                                {article.title}
                            </span>
                        </div>
                    </div>

                    {/* Action Toolbar */}
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                        {/* Audio Narrator (Text-to-Speech) */}
                        {speechSupported && (
                            <div className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-0.5">
                                {!isSpeaking ? (
                                    <button
                                        onClick={startAudio}
                                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-primary-600 transition-colors"
                                        title="Listen to this article with AI speech synthesis"
                                    >
                                        <Volume2 className="w-3.5 h-3.5 text-primary-600" />
                                        <span className="hidden sm:inline">Listen</span>
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-1 px-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1"></span>
                                        {isPaused ? (
                                            <button 
                                                onClick={startAudio}
                                                className="p-1 text-slate-600 hover:text-primary-600"
                                                title="Resume reading"
                                            >
                                                <Play className="w-3.5 h-3.5" />
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={pauseAudio}
                                                className="p-1 text-slate-600 hover:text-primary-600"
                                                title="Pause reading"
                                            >
                                                <Pause className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        <button 
                                            onClick={stopAudio}
                                            className="p-1 text-rose-500 hover:text-rose-700"
                                            title="Stop reading"
                                        >
                                            <Square className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Appearance / Font / Theme Modal Toggle */}
                        <div className="relative">
                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className={`p-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 ${
                                    showSettings ? 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300' : 'hover:bg-slate-500/10 text-slate-600 dark:text-slate-400'
                                }`}
                                title="Reader appearance and text settings"
                                aria-label="Text and reading appearance settings"
                            >
                                <Sliders className="w-4 h-4" />
                                <span className="hidden lg:inline">Display</span>
                            </button>

                            {/* Appearance Dropdown Popover */}
                            {showSettings && (
                                <div className="absolute right-0 mt-2 w-64 p-4 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 z-50 text-slate-900 dark:text-white animate-in fade-in zoom-in-95">
                                    <div className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
                                        Reading Atmosphere
                                    </div>

                                    {/* Themes */}
                                    <div className="grid grid-cols-3 gap-2 mb-4">
                                        <button
                                            onClick={() => setTheme('light')}
                                            className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                                                theme === 'light' 
                                                    ? 'border-primary-600 bg-slate-50 ring-2 ring-primary-500/20 text-slate-900' 
                                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className="w-4 h-4 rounded-full border border-slate-300 bg-white"></div>
                                            <span>Default</span>
                                        </button>

                                        <button
                                            onClick={() => setTheme('sepia')}
                                            className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                                                theme === 'sepia' 
                                                    ? 'border-[#8C5D33] bg-[#F5EFE6] ring-2 ring-[#8C5D33]/20 text-[#3E3832]' 
                                                    : 'border-[#E4D9CA] bg-[#FAF7F0] text-[#5C5247]'
                                            }`}
                                        >
                                            <div className="w-4 h-4 rounded-full bg-[#FAF7F0] border border-[#D5C4AC]"></div>
                                            <span>Sepia</span>
                                        </button>

                                        <button
                                            onClick={() => setTheme('dark')}
                                            className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                                                theme === 'dark' 
                                                    ? 'border-primary-500 bg-slate-800 ring-2 ring-primary-500/20 text-white' 
                                                    : 'border-slate-700 bg-slate-900 text-slate-400'
                                            }`}
                                        >
                                            <div className="w-4 h-4 rounded-full bg-slate-950 border border-slate-600"></div>
                                            <span>Dark</span>
                                        </button>
                                    </div>

                                    {/* Font Size Adjuster */}
                                    <div className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                                        Text Size
                                    </div>
                                    <div className="flex items-center justify-between p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                        {(['sm', 'base', 'lg', 'xl'] as FontSize[]).map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => setFontSize(size)}
                                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                                                    fontSize === size 
                                                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                                                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                                }`}
                                            >
                                                {size === 'sm' ? 'A-' : size === 'base' ? 'A' : size === 'lg' ? 'A+' : 'A++'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Zen / Focus Mode Toggle (Desktop only) */}
                        <button
                            onClick={() => setIsZenMode(!isZenMode)}
                            className="hidden md:flex p-2 rounded-xl hover:bg-slate-500/10 text-slate-600 dark:text-slate-400 transition-colors"
                            title={isZenMode ? "Exit wide view" : "Wide reading canvas"}
                        >
                            {isZenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </button>

                        {/* Social Share Menu */}
                        <div className="relative">
                            <button
                                onClick={handleNativeShare}
                                className="p-2 rounded-xl hover:bg-slate-500/10 text-slate-600 dark:text-slate-400 transition-colors"
                                title="Share article"
                            >
                                <Share2 className="w-4 h-4" />
                            </button>

                            {showShareMenu && (
                                <div className="absolute right-0 mt-2 w-56 p-3 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 z-50 text-slate-900 dark:text-white animate-in fade-in zoom-in-95">
                                    <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
                                        Share Article
                                    </div>
                                    <div className="space-y-1">
                                        <button
                                            onClick={handleWhatsAppShare}
                                            className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition"
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                            <span>Share on WhatsApp</span>
                                        </button>
                                        <button
                                            onClick={handleCopyLink}
                                            className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
                                        >
                                            {copySuccess ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                                            <span>{copySuccess ? 'Link Copied!' : 'Copy Direct Link'}</span>
                                        </button>
                                        <button
                                            onClick={() => window.print()}
                                            className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
                                        >
                                            <Printer className="w-4 h-4" />
                                            <span>Print / Save as PDF</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Interactive Bookmark Button */}
                        <button
                            onClick={toggleBookmark}
                            className={`p-2 rounded-xl transition-colors ${
                                isBookmarked 
                                    ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/30' 
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-500/10'
                            }`}
                            title={isBookmarked ? "Saved in reading binder" : "Save for offline review"}
                        >
                            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                        </button>

                        {/* Close Modal Cross */}
                        <button
                            onClick={handleClose}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                            aria-label="Close article reader"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {/* 2. SCROLLABLE ARTICLE BODY CONTAINER */}
                <div 
                    ref={contentContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto custom-scrollbar"
                >
                    {/* Hero Header Area */}
                    <div className={`p-6 sm:p-10 md:p-12 relative ${currentTheme.headerBanner}`}>
                        <div className="max-w-3xl mx-auto space-y-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="px-3 py-1 bg-primary-500/30 text-primary-200 text-xs font-black uppercase tracking-wider rounded-lg border border-primary-500/40">
                                    {article.category}
                                </span>
                                {article.featured && (
                                    <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 text-xs font-bold rounded-lg border border-amber-500/30 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" />
                                        <span>Featured Advisory</span>
                                    </span>
                                )}
                                <span className="text-xs text-slate-400 flex items-center gap-1.5 ml-auto">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{article.readTime}</span>
                                    <span>&bull;</span>
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>{article.date}</span>
                                </span>
                            </div>

                            <h1 
                                id="reader-article-title" 
                                className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight tracking-tight"
                            >
                                {article.title}
                            </h1>

                            {/* Author Credentials Card */}
                            <div className="pt-4 border-t border-white/15 flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-3">
                                    {article.authorAvatar ? (
                                        <img 
                                            src={article.authorAvatar} 
                                            alt={article.author} 
                                            className="w-11 h-11 rounded-full object-cover ring-2 ring-primary-500/60 shadow"
                                        />
                                    ) : (
                                        <div className="w-11 h-11 rounded-full bg-slate-800 border border-slate-700 text-primary-400 font-black text-base flex items-center justify-center">
                                            {article.author.charAt(0)}
                                        </div>
                                    )}
                                    <div>
                                        <div className="text-sm font-bold text-white flex items-center gap-1.5">
                                            <span>{article.author}</span>
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Verified Author"></span>
                                        </div>
                                        <div className="text-xs text-slate-300">{article.authorRole}</div>
                                    </div>
                                </div>

                                {/* Like and Views counter */}
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={toggleLike}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                                            isLiked 
                                                ? 'bg-rose-500 text-white shadow' 
                                                : 'bg-white/10 hover:bg-white/20 text-slate-200'
                                        }`}
                                    >
                                        <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                                        <span>{likesCount} Helpful</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Jump Navigation Pill Bar */}
                    <div className="sticky top-0 z-30 px-4 sm:px-8 py-2.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setActiveSection('content')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition flex items-center gap-1.5 ${
                                activeSection === 'content' ? currentTheme.navPillActive : currentTheme.navPillInactive
                            }`}
                        >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Article Analysis</span>
                        </button>

                        {videos.length > 0 && (
                            <button
                                onClick={() => setActiveSection('video')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition flex items-center gap-1.5 ${
                                    activeSection === 'video' ? currentTheme.navPillActive : currentTheme.navPillInactive
                                }`}
                            >
                                <Video className="w-3.5 h-3.5" />
                                <span>Masterclass Videos ({videos.length})</span>
                            </button>
                        )}

                        {pdfs.length > 0 && (
                            <button
                                onClick={() => setActiveSection('downloads')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition flex items-center gap-1.5 ${
                                    activeSection === 'downloads' ? currentTheme.navPillActive : currentTheme.navPillInactive
                                }`}
                            >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Official Frameworks ({pdfs.length})</span>
                            </button>
                        )}

                        {images.length > 0 && (
                            <button
                                onClick={() => setActiveSection('visuals')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition flex items-center gap-1.5 ${
                                    activeSection === 'visuals' ? currentTheme.navPillActive : currentTheme.navPillInactive
                                }`}
                            >
                                <ImageIcon className="w-3.5 h-3.5" />
                                <span>Infographics ({images.length})</span>
                            </button>
                        )}
                    </div>

                    {/* Main Reading Flow */}
                    <div className="max-w-3xl mx-auto p-5 sm:p-8 md:p-10 space-y-8">
                        
                        {/* Cover Image */}
                        {article.coverImageUrl && (
                            <figure className="rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 max-h-96 relative">
                                <img 
                                    src={article.coverImageUrl} 
                                    alt={article.title} 
                                    className="w-full h-full object-cover"
                                />
                                <figcaption className="p-2.5 bg-slate-900/80 backdrop-blur-sm text-slate-300 text-[11px] text-center">
                                    Educational field practice & curriculum analysis — SaasLink Research Archive
                                </figcaption>
                            </figure>
                        )}

                        {/* Executive Summary Takeaway Callout */}
                        <section aria-label="Executive Takeaway" className={`p-5 sm:p-6 rounded-2xl border shadow-sm ${currentTheme.callout}`}>
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider mb-2">
                                <Sparkles className={`w-4 h-4 ${currentTheme.calloutAccent}`} />
                                <span className={currentTheme.calloutAccent}>Executive Takeaway for School Leadership</span>
                            </div>
                            <p className="text-base sm:text-lg font-medium leading-relaxed italic opacity-95">
                                "{article.excerpt}"
                            </p>
                        </section>

                        {/* Curriculum Competencies & Learning Objectives */}
                        {article.learningObjectives && article.learningObjectives.length > 0 && (
                            <section aria-label="Key Learning Objectives" className={`p-6 rounded-2xl border ${currentTheme.card}`}>
                                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white mb-3">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    <span>Curriculum Competencies & Assessment Outcomes</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                    {article.learningObjectives.map((obj, i) => (
                                        <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm leading-normal opacity-90">
                                            <span className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0 font-bold text-[11px] mt-0.5">
                                                {i + 1}
                                            </span>
                                            <span>{obj}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Full Narrative Content Paragraphs */}
                        <div className={`space-y-5 ${currentTheme.bodyText} ${fontStyles[fontSize]}`}>
                            {(article.content || []).map((paragraph, index) => (
                                <p key={index} className="leading-relaxed">
                                    {paragraph}
                                </p>
                            ))}
                        </div>

                        {/* Video Masterclasses Section */}
                        {videos.length > 0 && (
                            <section id="videos" className="pt-8 border-t border-slate-200 dark:border-slate-800 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
                                            <Video className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-black text-slate-900 dark:text-white">
                                                Instructional Video Masterclasses
                                            </h3>
                                            <p className="text-xs text-slate-500">
                                                Step-by-step video training for department heads and teachers
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6">
                                    {videos.map((vid) => (
                                        <div 
                                            key={vid.id} 
                                            className="bg-slate-900 text-white rounded-2xl overflow-hidden shadow-md border border-slate-800"
                                        >
                                            <div className="relative aspect-video bg-black flex items-center justify-center">
                                                {isYouTubeUrl(vid.url) ? (
                                                    <iframe
                                                        src={getYouTubeEmbedUrl(vid.url)}
                                                        title={vid.title}
                                                        className="w-full h-full border-0"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                    />
                                                ) : (
                                                    <video 
                                                        controls 
                                                        className="w-full h-full object-contain"
                                                        poster={vid.thumbnailUrl}
                                                    >
                                                        <source src={vid.url} type="video/mp4" />
                                                        <source src={vid.url} type="video/webm" />
                                                        Your browser does not support HTML5 video streaming.
                                                    </video>
                                                )}
                                            </div>
                                            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-sm font-bold text-white">
                                                            {vid.title}
                                                        </h4>
                                                        {vid.duration && (
                                                            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                                                                {vid.duration}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {vid.description && (
                                                        <p className="text-xs text-slate-400 mt-1">
                                                            {vid.description}
                                                        </p>
                                                    )}
                                                </div>

                                                {vid.caption && (
                                                    <div className="text-[11px] text-slate-400 italic">
                                                        {vid.caption}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Downloadable Official Documents & Circulars */}
                        {pdfs.length > 0 && (
                            <section id="downloads" className="pt-8 border-t border-slate-200 dark:border-slate-800 space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                                            Official Curriculum Frameworks & Policy Circulars
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            Download and print official regulatory frameworks
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {pdfs.map((pdf) => (
                                        <div 
                                            key={pdf.id}
                                            className={`p-4 rounded-2xl border shadow-sm flex flex-col justify-between group transition hover:border-rose-300 ${currentTheme.card}`}
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <div className="p-2 rounded-xl bg-rose-50 text-rose-600 group-hover:scale-105 transition-transform">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[10px] font-bold">
                                                        {pdf.fileSize || 'PDF Circular'}
                                                    </span>
                                                </div>
                                                <h4 className="text-xs font-bold leading-snug mb-1">
                                                    {pdf.title}
                                                </h4>
                                                {pdf.description && (
                                                    <p className="text-[11px] opacity-75 line-clamp-2 mb-3">
                                                        {pdf.description}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2">
                                                <span className="text-[10px] opacity-60 truncate max-w-[120px]">
                                                    {pdf.fileName || 'circular.pdf'}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <a
                                                        href={pdf.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-200 bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 rounded-lg transition-colors flex items-center gap-1"
                                                    >
                                                        <ExternalLink className="w-3 h-3" />
                                                        <span>View</span>
                                                    </a>
                                                    <button
                                                        onClick={() => handleDownload(pdf)}
                                                        className="px-3 py-1 text-[11px] font-bold text-white bg-slate-900 dark:bg-primary-600 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
                                                    >
                                                        <Download className="w-3 h-3" />
                                                        <span>Download</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Infographics & Diagrams */}
                        {images.length > 0 && (
                            <section id="visuals" className="pt-8 border-t border-slate-200 dark:border-slate-800 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                                            <ImageIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-black text-slate-900 dark:text-white">
                                                Infographics, Assessment Rubrics & Diagrams
                                            </h3>
                                            <p className="text-xs text-slate-500">
                                                Tap any diagram to enlarge in full-resolution lightbox
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {images.map((img) => (
                                        <div 
                                            key={img.id}
                                            onClick={() => setSelectedImage(img.url)}
                                            className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:shadow-lg transition cursor-pointer group bg-slate-100 dark:bg-slate-900"
                                        >
                                            <div className="aspect-video relative overflow-hidden">
                                                <img 
                                                    src={img.url} 
                                                    alt={img.title} 
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                                <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <span className="px-3 py-1 rounded-full bg-slate-900/90 text-white text-xs font-bold flex items-center gap-1">
                                                        <Maximize2 className="w-3 h-3" />
                                                        Enlarge
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-3 bg-white dark:bg-slate-900">
                                                <div className="text-xs font-bold text-slate-900 dark:text-white">
                                                    {img.title}
                                                </div>
                                                {img.caption && (
                                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                                        {img.caption}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Curriculum Keywords */}
                        {article.tags && article.tags.length > 0 && (
                            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 flex-wrap">
                                <Tag className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-xs font-bold text-slate-500">Keywords:</span>
                                {article.tags.map((t, idx) => (
                                    <span 
                                        key={idx} 
                                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium"
                                    >
                                        #{t}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Institutional Publisher Citation */}
                        <div className={`p-5 rounded-2xl border text-xs leading-relaxed ${currentTheme.footer}`}>
                            <div className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-primary-600" />
                                Published by SaasLink Technologies Ltd Editorial Board
                            </div>
                            <div>
                                Educational Research & Assessment Division &bull; Westlands, Nairobi, Kenya. For institutional training, school fee automation audits, or CBC software deployment, call <a href="tel:0720935895" className="font-bold text-primary-600 hover:underline">0720935895</a> or email <a href="mailto:editor@saaslink.co.ke" className="font-bold text-primary-600 hover:underline">editor@saaslink.co.ke</a>.
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. BOTTOM ERGONOMIC MOBILE DOCK (Always easy to touch on phone) */}
                <footer className={`px-4 py-3 border-t flex items-center justify-between gap-3 shrink-0 ${currentTheme.header}`}>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <span>{Math.round(scrollProgress)}% read</span>
                        <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden hidden sm:block">
                            <div 
                                className="h-full bg-primary-600 rounded-full transition-all"
                                style={{ width: `${scrollProgress}%` }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleWhatsAppShare}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                        >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Share</span>
                        </button>

                        <button
                            onClick={handleClose}
                            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold transition shadow-sm"
                        >
                            Done Reading
                        </button>
                    </div>
                </footer>
            </div>

            {/* LIGHTBOX FOR ENLARGING INFOGRAPHICS */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 z-70 bg-black/95 flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-150"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="max-w-5xl max-h-[92vh] relative" onClick={e => e.stopPropagation()}>
                        <img 
                            src={selectedImage} 
                            alt="Enlarged curriculum diagram" 
                            className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl mx-auto" 
                        />
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute -top-3 -right-3 text-white bg-slate-800 p-2.5 rounded-full hover:bg-slate-700 shadow-lg"
                            aria-label="Close image preview"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EdTechArticleViewerModal;

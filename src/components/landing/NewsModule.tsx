import React, { useState, useEffect } from 'react';
import { 
    Video, FileText, Image as ImageIcon, Sparkles, BookOpen, 
    Clock, User, Download, ExternalLink, Play, CheckCircle2,
    Calendar, ArrowRight, Filter, Eye
} from 'lucide-react';
import { EdTechArticle, ArticleMediaItem } from '../../types';
import * as api from '../../services/api';
import { initialEdTechArticles } from '../../data/edtechNewsData';
import { EdTechArticleViewerModal } from '../super-admin/EdTechArticleViewerModal';

export const NewsModule: React.FC = () => {
    const [articles, setArticles] = useState<EdTechArticle[]>(initialEdTechArticles);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [selectedArticle, setSelectedArticle] = useState<EdTechArticle | null>(null);

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                const data = await api.getEdTechArticles({ status: 'PUBLISHED' });
                if (data && data.length > 0) {
                    setArticles(data);
                }
            } catch (err) {
                console.warn('Using local EdTech articles fallback:', err);
            }
        };

        fetchArticles();
    }, []);

    // Extract unique categories
    const categories = ['ALL', ...Array.from(new Set(articles.map(a => a.category)))];

    // Filter published articles
    const publishedArticles = articles.filter(a => a.status !== 'DRAFT');
    const filteredArticles = publishedArticles.filter(art => {
        if (selectedCategory === 'ALL') return true;
        return art.category === selectedCategory;
    });

    return (
        <section id="news" className="py-20 bg-slate-50 border-t border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-100 text-primary-800 text-xs font-black uppercase tracking-wider rounded-full mb-3">
                        <Sparkles className="w-3.5 h-3.5 text-primary-600" />
                        EdTech Insights & Learning Resources
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                        EdTech News, CBC Guidelines & School Leadership
                    </h2>
                    <p className="mt-4 text-base sm:text-lg text-slate-600">
                        Authoritative practical analysis on curriculum transitions, automated school accounting, and statutory data protection from the SaasLink Technologies Ltd editorial team. Enriched with instructional videos, downloadable PDF circulars, and visual infographics.
                    </p>

                    {/* Category Filter Pills */}
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                                    selectedCategory === cat
                                        ? 'bg-slate-900 text-white shadow-sm'
                                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                                {cat === 'ALL' ? 'All Topics' : cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* News Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {filteredArticles.map((art) => {
                        const artVideos = (art.media || []).filter(m => m.type === 'VIDEO');
                        const artPdfs = (art.media || []).filter(m => m.type === 'PDF');
                        const artImages = (art.media || []).filter(m => m.type === 'IMAGE');

                        return (
                            <article
                                key={art.id}
                                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group overflow-hidden"
                            >
                                <div>
                                    {/* Cover Image Banner if present */}
                                    {art.coverImageUrl && (
                                        <div className="h-48 w-full overflow-hidden relative bg-slate-100">
                                            <img 
                                                src={art.coverImageUrl} 
                                                alt={art.title} 
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                            <div className="absolute top-3 left-3 flex gap-2">
                                                <span className="px-2.5 py-1 bg-slate-900/80 backdrop-blur-md text-white font-bold text-[11px] rounded-lg">
                                                    {art.category}
                                                </span>
                                                {art.featured && (
                                                    <span className="px-2.5 py-1 bg-amber-500 text-slate-950 font-black text-[11px] rounded-lg flex items-center gap-1 shadow-sm">
                                                        <Sparkles className="w-3 h-3" />
                                                        Featured
                                                    </span>
                                                )}
                                            </div>

                                            {/* Media count pills on cover */}
                                            <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
                                                {artVideos.length > 0 && (
                                                    <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold flex items-center gap-1 shadow">
                                                        <Video className="w-3 h-3" />
                                                        <span>Video</span>
                                                    </span>
                                                )}
                                                {artPdfs.length > 0 && (
                                                    <span className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold flex items-center gap-1 shadow">
                                                        <FileText className="w-3 h-3" />
                                                        <span>PDF</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-6 sm:p-8">
                                        {!art.coverImageUrl && (
                                            <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                                                <span className="px-2.5 py-1 bg-primary-50 text-primary-700 font-bold rounded-md">
                                                    {art.category}
                                                </span>
                                                <span>{art.date} &bull; {art.readTime}</span>
                                            </div>
                                        )}

                                        {art.coverImageUrl && (
                                            <div className="text-xs text-slate-400 mb-2 flex items-center gap-2">
                                                <span>{art.date}</span>
                                                <span>&bull;</span>
                                                <span>{art.readTime}</span>
                                            </div>
                                        )}

                                        <h3 className="text-xl font-black text-slate-900 group-hover:text-primary-600 transition-colors leading-snug mb-3">
                                            {art.title}
                                        </h3>

                                        <p className="text-sm text-slate-600 leading-relaxed mb-4 line-clamp-3">
                                            {art.excerpt}
                                        </p>

                                        {/* Media preview chips */}
                                        {(artVideos.length > 0 || artPdfs.length > 0 || artImages.length > 0) && (
                                            <div className="flex flex-wrap items-center gap-2 mb-4 pt-2 border-t border-slate-100">
                                                {artVideos.map((v) => (
                                                    <span 
                                                        key={v.id} 
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[11px] font-semibold border border-indigo-100"
                                                    >
                                                        <Play className="w-3 h-3 fill-current" />
                                                        <span className="truncate max-w-[150px]">{v.title}</span>
                                                    </span>
                                                ))}

                                                {artPdfs.map((p) => (
                                                    <span 
                                                        key={p.id} 
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-[11px] font-semibold border border-rose-100"
                                                    >
                                                        <FileText className="w-3 h-3" />
                                                        <span className="truncate max-w-[150px]">{p.fileName || p.title}</span>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="px-6 sm:px-8 pb-6 pt-2 border-t border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        {art.authorAvatar ? (
                                            <img 
                                                src={art.authorAvatar} 
                                                alt={art.author} 
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                                                {art.author.charAt(0)}
                                            </div>
                                        )}
                                        <div className="text-xs">
                                            <div className="font-bold text-slate-900">{art.author}</div>
                                            <div className="text-slate-500 text-[10px] truncate max-w-[170px]">
                                                {art.authorRole}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setSelectedArticle(art)}
                                        className="text-xs font-black uppercase tracking-wider text-primary-600 hover:text-primary-700 flex items-center gap-1.5 group-hover:translate-x-1 transition-transform"
                                    >
                                        <span>Read & Learn</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>

            {/* Read Article & Media Viewer Modal */}
            <EdTechArticleViewerModal
                isOpen={Boolean(selectedArticle)}
                onClose={() => setSelectedArticle(null)}
                article={selectedArticle}
            />
        </section>
    );
};

export default NewsModule;

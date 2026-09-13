import React, { useState, useEffect } from 'react';
import { 
    Newspaper, Plus, Search, Filter, Edit3, Trash2, Eye, 
    Video, FileText, Image as ImageIcon, Sparkles, Star, CheckCircle,
    Clock, User, RefreshCw, AlertCircle, ExternalLink, Download,
    BookOpen, Layers, Check, X
} from 'lucide-react';
import { EdTechArticle, ArticleMediaItem } from '../../types';
import * as api from '../../services/api';
import { EdTechArticleEditorModal } from './EdTechArticleEditorModal';
import { EdTechArticleViewerModal } from './EdTechArticleViewerModal';

export const EdTechNewsManager: React.FC = () => {
    const [articles, setArticles] = useState<EdTechArticle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');
    
    // Modals
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingArticle, setEditingArticle] = useState<EdTechArticle | null>(null);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [viewingArticle, setViewingArticle] = useState<EdTechArticle | null>(null);
    
    // Notification / Toast
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Delete confirmation modal state
    const [articleToDelete, setArticleToDelete] = useState<EdTechArticle | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadArticles = async () => {
        setIsLoading(true);
        try {
            const data = await api.getEdTechArticles();
            setArticles(data);
        } catch (err: any) {
            console.error('Failed to load articles:', err);
            showFeedback('error', 'Could not load EdTech articles. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadArticles();
    }, []);

    const showFeedback = (type: 'success' | 'error', message: string) => {
        setFeedback({ type, message });
        setTimeout(() => {
            setFeedback(null);
        }, 4000);
    };

    // Save handler (create or update)
    const handleSaveArticle = async (articleData: Partial<EdTechArticle>) => {
        try {
            if (articleData.id) {
                const updated = await api.updateEdTechArticle(articleData.id, articleData);
                setArticles(prev => prev.map(a => a.id === updated.id ? updated : a));
                showFeedback('success', `Updated "${updated.title}" successfully.`);
            } else {
                const created = await api.createEdTechArticle(articleData);
                setArticles(prev => [created, ...prev]);
                showFeedback('success', `Published new article "${created.title}".`);
            }
        } catch (err: any) {
            console.error('Failed to save article:', err);
            throw new Error(err.message || 'Error saving article to server');
        }
    };

    // Toggle publish/draft
    const handleToggleStatus = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const updated = await api.toggleEdTechArticleStatus(id);
            setArticles(prev => prev.map(a => a.id === updated.id ? updated : a));
            showFeedback('success', `Article marked as ${updated.status}.`);
        } catch (err) {
            showFeedback('error', 'Failed to update article status.');
        }
    };

    // Toggle featured
    const handleToggleFeatured = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const updated = await api.toggleEdTechArticleFeatured(id);
            setArticles(prev => prev.map(a => a.id === updated.id ? updated : a));
            showFeedback('success', updated.featured ? 'Featured on landing page.' : 'Removed from featured list.');
        } catch (err) {
            showFeedback('error', 'Failed to toggle featured status.');
        }
    };

    // Delete handler
    const confirmDelete = async () => {
        if (!articleToDelete) return;
        setIsDeleting(true);
        try {
            await api.deleteEdTechArticle(articleToDelete.id);
            setArticles(prev => prev.filter(a => a.id !== articleToDelete.id));
            showFeedback('success', `Deleted article "${articleToDelete.title}".`);
            setArticleToDelete(null);
        } catch (err) {
            showFeedback('error', 'Failed to delete article.');
        } finally {
            setIsDeleting(false);
        }
    };

    // Compute metrics
    const totalArticles = articles.length;
    const publishedCount = articles.filter(a => a.status === 'PUBLISHED').length;
    const draftCount = articles.filter(a => a.status === 'DRAFT').length;
    
    // Media counts
    let totalVideos = 0;
    let totalPdfs = 0;
    let totalImages = 0;
    articles.forEach(art => {
        (art.media || []).forEach(m => {
            if (m.type === 'VIDEO') totalVideos++;
            if (m.type === 'PDF') totalPdfs++;
            if (m.type === 'IMAGE') totalImages++;
        });
    });

    // Unique categories
    const categories = ['ALL', ...Array.from(new Set(articles.map(a => a.category)))];

    // Filtered articles
    const filteredArticles = articles.filter(art => {
        const matchesQuery = 
            art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            art.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
            art.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (art.tags || []).some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory = selectedCategory === 'ALL' || art.category === selectedCategory;
        const matchesStatus = selectedStatus === 'ALL' || art.status === selectedStatus;

        return matchesQuery && matchesCategory && matchesStatus;
    });

    return (
        <div className="space-y-8">
            {/* Feedback Banner */}
            {feedback && (
                <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-200 ${
                    feedback.type === 'success' 
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                        : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}>
                    <div className="flex items-center gap-2">
                        {feedback.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                        <span>{feedback.message}</span>
                    </div>
                    <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-700">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Metrics Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3.5 rounded-2xl bg-indigo-50 text-indigo-700">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xs font-black uppercase tracking-wider text-slate-400">Total EdTech Articles</div>
                        <div className="text-2xl font-black text-slate-900 mt-0.5">{totalArticles}</div>
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2 font-medium">
                            <span className="text-emerald-700 font-bold">{publishedCount} Published</span>
                            <span>&bull;</span>
                            <span className="text-amber-700 font-bold">{draftCount} Drafts</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3.5 rounded-2xl bg-primary-50 text-primary-700">
                        <Video className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xs font-black uppercase tracking-wider text-slate-400">Video Masterclasses</div>
                        <div className="text-2xl font-black text-slate-900 mt-0.5">{totalVideos}</div>
                        <div className="text-[11px] text-slate-500 mt-1 font-medium">
                            Attached streaming tutorials & demos
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-700">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xs font-black uppercase tracking-wider text-slate-400">Official PDF Circulars</div>
                        <div className="text-2xl font-black text-slate-900 mt-0.5">{totalPdfs}</div>
                        <div className="text-[11px] text-slate-500 mt-1 font-medium">
                            KNEC guidelines & policy documents
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-700">
                        <ImageIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xs font-black uppercase tracking-wider text-slate-400">Infographics & Charts</div>
                        <div className="text-2xl font-black text-slate-900 mt-0.5">{totalImages}</div>
                        <div className="text-[11px] text-slate-500 mt-1 font-medium">
                            Pedagogical diagrams & rubrics
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Action Bar & Filter Controls */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50">
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                        <div className="relative w-full sm:w-80">
                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search articles, authors, tags..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white rounded-2xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                            />
                        </div>

                        {/* Category Dropdown */}
                        <div className="w-full sm:w-auto flex items-center gap-2">
                            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full sm:w-auto px-3 py-2.5 bg-white rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>
                                        {cat === 'ALL' ? 'All Categories' : cat}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div className="w-full sm:w-auto">
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value as any)}
                                className="w-full sm:w-auto px-3 py-2.5 bg-white rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="PUBLISHED">Published Only</option>
                                <option value="DRAFT">Drafts Only</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                        <button
                            onClick={loadArticles}
                            title="Refresh articles"
                            className="p-2.5 bg-white hover:bg-slate-100 text-slate-600 rounded-2xl border border-slate-200 transition-colors"
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>

                        <button
                            onClick={() => {
                                setEditingArticle(null);
                                setIsEditorOpen(true);
                            }}
                            className="px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-all flex items-center gap-2 shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Create New Article</span>
                        </button>
                    </div>
                </div>

                {/* Articles List / Grid */}
                {isLoading ? (
                    <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
                        <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                        <span>Loading EdTech articles & learning resources...</span>
                    </div>
                ) : filteredArticles.length === 0 ? (
                    <div className="py-20 text-center text-slate-500 text-xs flex flex-col items-center gap-3">
                        <Newspaper className="w-12 h-12 text-slate-300" />
                        <span className="font-bold text-slate-700 text-sm">No EdTech articles found</span>
                        <p className="max-w-md text-slate-500">
                            No articles match your current search query or filter criteria. Click "Create New Article" to compose an article with videos, PDFs, and pictures.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredArticles.map((art) => {
                            const artVideos = (art.media || []).filter(m => m.type === 'VIDEO');
                            const artPdfs = (art.media || []).filter(m => m.type === 'PDF');
                            const artImages = (art.media || []).filter(m => m.type === 'IMAGE');

                            return (
                                <div 
                                    key={art.id}
                                    className="p-6 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
                                >
                                    {/* Article Left Info */}
                                    <div className="flex items-start gap-4 flex-1 min-w-0">
                                        {/* Cover Image Preview */}
                                        <div className="w-24 h-24 sm:w-28 sm:h-24 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 relative group">
                                            {art.coverImageUrl ? (
                                                <img 
                                                    src={art.coverImageUrl} 
                                                    alt={art.title} 
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                    <BookOpen className="w-6 h-6" />
                                                </div>
                                            )}
                                            {art.featured && (
                                                <div className="absolute top-1.5 left-1.5 p-1 rounded-md bg-amber-500 text-white shadow-sm" title="Featured on landing page">
                                                    <Star className="w-3 h-3 fill-current" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Details */}
                                        <div className="space-y-1.5 min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-primary-50 text-primary-700 border border-primary-200">
                                                    {art.category}
                                                </span>
                                                <button
                                                    onClick={(e) => handleToggleStatus(art.id, e)}
                                                    className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                                                        art.status === 'PUBLISHED'
                                                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                                                            : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                                                    }`}
                                                >
                                                    {art.status}
                                                </button>
                                                <span className="text-[11px] text-slate-400">
                                                    {art.date} &bull; {art.readTime}
                                                </span>
                                            </div>

                                            <h3 className="text-base font-bold text-slate-900 leading-snug truncate">
                                                {art.title}
                                            </h3>

                                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                                {art.excerpt}
                                            </p>

                                            <div className="flex flex-wrap items-center gap-3 pt-1">
                                                <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="font-bold text-slate-700">{art.author}</span>
                                                    <span className="hidden sm:inline">({art.authorRole})</span>
                                                </div>

                                                {/* Enriched Media Badges */}
                                                <div className="flex items-center gap-1.5 ml-auto">
                                                    {artVideos.length > 0 && (
                                                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-[10px] font-bold flex items-center gap-1">
                                                            <Video className="w-3 h-3" />
                                                            <span>{artVideos.length} Video{artVideos.length > 1 ? 's' : ''}</span>
                                                        </span>
                                                    )}
                                                    {artPdfs.length > 0 && (
                                                        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[10px] font-bold flex items-center gap-1">
                                                            <FileText className="w-3 h-3" />
                                                            <span>{artPdfs.length} PDF{artPdfs.length > 1 ? 's' : ''}</span>
                                                        </span>
                                                    )}
                                                    {artImages.length > 0 && (
                                                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold flex items-center gap-1">
                                                            <ImageIcon className="w-3 h-3" />
                                                            <span>{artImages.length} Image{artImages.length > 1 ? 's' : ''}</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                                        <button
                                            onClick={(e) => handleToggleFeatured(art.id, e)}
                                            className={`p-2 rounded-xl border transition-all ${
                                                art.featured 
                                                    ? 'bg-amber-50 text-amber-600 border-amber-300 hover:bg-amber-100' 
                                                    : 'bg-white text-slate-400 border-slate-200 hover:text-amber-500 hover:bg-slate-50'
                                            }`}
                                            title={art.featured ? 'Remove from featured' : 'Mark as featured headline'}
                                        >
                                            <Star className={`w-4 h-4 ${art.featured ? 'fill-current' : ''}`} />
                                        </button>

                                        <button
                                            onClick={() => {
                                                setViewingArticle(art);
                                                setIsViewerOpen(true);
                                            }}
                                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                                            title="Preview enriched article"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            <span>Read & Play</span>
                                        </button>

                                        <button
                                            onClick={() => {
                                                setEditingArticle(art);
                                                setIsEditorOpen(true);
                                            }}
                                            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                                            title="Edit article & upload media"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                            <span>Edit Media</span>
                                        </button>

                                        <button
                                            onClick={() => setArticleToDelete(art)}
                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-200 transition-colors"
                                            title="Delete article"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Editor Modal */}
            <EdTechArticleEditorModal
                isOpen={isEditorOpen}
                onClose={() => {
                    setIsEditorOpen(false);
                    setEditingArticle(null);
                }}
                onSave={handleSaveArticle}
                article={editingArticle}
            />

            {/* Viewer Modal */}
            <EdTechArticleViewerModal
                isOpen={isViewerOpen}
                onClose={() => {
                    setIsViewerOpen(false);
                    setViewingArticle(null);
                }}
                article={viewingArticle}
            />

            {/* Delete Confirmation Modal */}
            {articleToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-slate-900">Delete EdTech Article?</h3>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                Are you sure you want to delete <span className="font-bold text-slate-800">"{articleToDelete.title}"</span>? All attached videos, PDFs, and infographics will be unlinked from the public portal.
                            </p>
                        </div>
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                onClick={() => setArticleToDelete(null)}
                                disabled={isDeleting}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

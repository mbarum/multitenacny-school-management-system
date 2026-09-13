import React, { useState, useEffect } from 'react';
import { 
    X, Upload, Video, FileText, Image as ImageIcon, Plus, Trash2, 
    Eye, Check, AlertCircle, Play, FileDown, Sparkles, HelpCircle,
    Calendar, Clock, User, Tag, BookOpen, Layers
} from 'lucide-react';
import { EdTechArticle, ArticleMediaItem, ArticleMediaType } from '../../types';
import { optimizeImage } from '../../utils/imageOptimizer';

interface EdTechArticleEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (articleData: Partial<EdTechArticle>) => Promise<void>;
    article?: EdTechArticle | null;
}

const DEFAULT_CATEGORIES = [
    'CBC Curriculum',
    'School Finance',
    'Legal & Policy',
    'Academic Administration',
    'STEM & Robotics',
    'EdTech & AI Innovation',
    'Teacher Professional Development',
    'Special Needs Education'
];

export const EdTechArticleEditorModal: React.FC<EdTechArticleEditorModalProps> = ({
    isOpen,
    onClose,
    onSave,
    article
}) => {
    const isEditing = Boolean(article && article.id);

    // Form fields
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('CBC Curriculum');
    const [customCategory, setCustomCategory] = useState('');
    const [isCustomCategory, setIsCustomCategory] = useState(false);
    const [author, setAuthor] = useState('SaasLink Editorial Team');
    const [authorRole, setAuthorRole] = useState('Senior Curriculum & EdTech Specialist');
    const [authorAvatar, setAuthorAvatar] = useState('');
    const [readTime, setReadTime] = useState('5 min read');
    const [status, setStatus] = useState<'PUBLISHED' | 'DRAFT'>('PUBLISHED');
    const [featured, setFeatured] = useState(false);
    const [coverImageUrl, setCoverImageUrl] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [contentParagraphs, setContentParagraphs] = useState<string[]>(['']);
    const [learningObjectives, setLearningObjectives] = useState<string[]>(['']);
    const [tagsString, setTagsString] = useState('');
    
    // Media management
    const [mediaItems, setMediaItems] = useState<ArticleMediaItem[]>([]);
    const [activeMediaTab, setActiveMediaTab] = useState<ArticleMediaType>('VIDEO');
    
    // New media sub-form
    const [mediaTitle, setMediaTitle] = useState('');
    const [mediaUrl, setMediaUrl] = useState('');
    const [mediaCaption, setMediaCaption] = useState('');
    const [mediaDescription, setMediaDescription] = useState('');
    const [mediaDuration, setMediaDuration] = useState('');
    const [mediaFileName, setMediaFileName] = useState('');
    const [mediaFileSize, setMediaFileSize] = useState('');
    const [isUploadingMedia, setIsUploadingMedia] = useState(false);
    const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);

    // Saving state
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Populate when article changes
    useEffect(() => {
        if (article) {
            setTitle(article.title || '');
            if (DEFAULT_CATEGORIES.includes(article.category)) {
                setCategory(article.category);
                setIsCustomCategory(false);
            } else {
                setCategory('OTHER');
                setCustomCategory(article.category || '');
                setIsCustomCategory(true);
            }
            setAuthor(article.author || '');
            setAuthorRole(article.authorRole || '');
            setAuthorAvatar(article.authorAvatar || '');
            setReadTime(article.readTime || '4 min read');
            setStatus(article.status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED');
            setFeatured(Boolean(article.featured));
            setCoverImageUrl(article.coverImageUrl || '');
            setExcerpt(article.excerpt || '');
            setContentParagraphs(article.content && article.content.length > 0 ? article.content : ['']);
            setLearningObjectives(article.learningObjectives && article.learningObjectives.length > 0 ? article.learningObjectives : ['']);
            setTagsString((article.tags || []).join(', '));
            setMediaItems(article.media ? [...article.media] : []);
        } else {
            // Reset for new article
            setTitle('');
            setCategory('CBC Curriculum');
            setIsCustomCategory(false);
            setCustomCategory('');
            setAuthor('SaasLink Editorial Board');
            setAuthorRole('Senior Curriculum Specialist & Policy Advisor');
            setAuthorAvatar('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150');
            setReadTime('4 min read');
            setStatus('PUBLISHED');
            setFeatured(false);
            setCoverImageUrl('https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=1000');
            setExcerpt('');
            setContentParagraphs(['']);
            setLearningObjectives(['']);
            setTagsString('CBC Framework, Junior Secondary, School Management');
            setMediaItems([]);
        }
        setErrorMessage(null);
    }, [article, isOpen]);

    if (!isOpen) return null;

    // Helper: format file size
    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    // Handle generic file upload (images, videos, PDFs)
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, mediaType: ArticleMediaType) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingMedia(true);
        setUploadFeedback(`Processing ${file.name}...`);

        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result as string;
            setMediaUrl(dataUrl);
            setMediaFileName(file.name);
            setMediaFileSize(formatBytes(file.size));
            if (!mediaTitle) {
                // Auto-generate title from filename
                const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
                setMediaTitle(cleanName);
            }
            setIsUploadingMedia(false);
            setUploadFeedback(`Loaded ${file.name} (${formatBytes(file.size)})`);
        };
        reader.onerror = () => {
            setIsUploadingMedia(false);
            setUploadFeedback('Error reading file. Please try again or provide a direct URL.');
        };
        reader.readAsDataURL(file);
    };

    // Handle cover image upload
    const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const optimized = await optimizeImage(file, { preset: 'cover', maxWidth: 1280, maxHeight: 720 });
            setCoverImageUrl(optimized.dataUrl);
            setUploadFeedback(`Cover photo resized (${optimized.formattedStats})`);
        } catch {
            const reader = new FileReader();
            reader.onload = () => {
                setCoverImageUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Add media item to the article list
    const handleAddMediaItem = () => {
        if (!mediaUrl.trim() && !mediaFileName) {
            alert('Please select a file to upload or enter a media URL.');
            return;
        }

        const newItem: ArticleMediaItem = {
            id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            type: activeMediaTab,
            title: mediaTitle.trim() || `${activeMediaTab} Resource ${mediaItems.length + 1}`,
            url: mediaUrl.trim(),
            fileName: mediaFileName || (activeMediaTab === 'PDF' ? 'Document.pdf' : undefined),
            fileSize: mediaFileSize || undefined,
            duration: activeMediaTab === 'VIDEO' ? (mediaDuration.trim() || '04:30') : undefined,
            caption: mediaCaption.trim() || undefined,
            description: mediaDescription.trim() || undefined,
            thumbnailUrl: activeMediaTab === 'VIDEO' 
                ? 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600'
                : undefined
        };

        setMediaItems([...mediaItems, newItem]);
        // Reset subform
        setMediaTitle('');
        setMediaUrl('');
        setMediaCaption('');
        setMediaDescription('');
        setMediaDuration('');
        setMediaFileName('');
        setMediaFileSize('');
        setUploadFeedback(null);
    };

    const handleRemoveMediaItem = (id: string) => {
        setMediaItems(mediaItems.filter(item => item.id !== id));
    };

    // Handle paragraph modifications
    const handleParagraphChange = (index: number, value: string) => {
        const updated = [...contentParagraphs];
        updated[index] = value;
        setContentParagraphs(updated);
    };

    const handleAddParagraph = () => {
        setContentParagraphs([...contentParagraphs, '']);
    };

    const handleRemoveParagraph = (index: number) => {
        if (contentParagraphs.length === 1) {
            setContentParagraphs(['']);
            return;
        }
        setContentParagraphs(contentParagraphs.filter((_, i) => i !== index));
    };

    // Handle learning objectives modifications
    const handleObjectiveChange = (index: number, value: string) => {
        const updated = [...learningObjectives];
        updated[index] = value;
        setLearningObjectives(updated);
    };

    const handleAddObjective = () => {
        setLearningObjectives([...learningObjectives, '']);
    };

    const handleRemoveObjective = (index: number) => {
        if (learningObjectives.length === 1) {
            setLearningObjectives(['']);
            return;
        }
        setLearningObjectives(learningObjectives.filter((_, i) => i !== index));
    };

    // Submit handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!title.trim()) {
            setErrorMessage('Article title is mandatory.');
            return;
        }

        if (!excerpt.trim()) {
            setErrorMessage('Please provide a brief excerpt or summary for the article card.');
            return;
        }

        const validParagraphs = contentParagraphs.map(p => p.trim()).filter(Boolean);
        if (validParagraphs.length === 0) {
            setErrorMessage('Article must contain at least one content paragraph.');
            return;
        }

        const finalCategory = isCustomCategory && customCategory.trim() 
            ? customCategory.trim() 
            : category;

        const parsedTags = tagsString
            .split(',')
            .map(t => t.trim())
            .filter(Boolean);

        const validObjectives = learningObjectives
            .map(o => o.trim())
            .filter(Boolean);

        setIsSaving(true);
        try {
            await onSave({
                ...(article ? { id: article.id, slug: article.slug } : {}),
                title: title.trim(),
                category: finalCategory,
                author: author.trim(),
                authorRole: authorRole.trim(),
                authorAvatar: authorAvatar.trim() || undefined,
                readTime: readTime.trim() || '4 min read',
                status,
                featured,
                coverImageUrl: coverImageUrl.trim() || undefined,
                excerpt: excerpt.trim(),
                content: validParagraphs,
                tags: parsedTags,
                learningObjectives: validObjectives,
                media: mediaItems,
                date: article?.date || new Date().toLocaleDateString('en-KE', { month: 'long', day: 'numeric', year: 'numeric' })
            });
            onClose();
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to save article. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
            <div 
                className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full my-8 overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
                role="dialog"
                aria-modal="true"
            >
                {/* Modal Header */}
                <div className="p-6 md:p-8 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary-600/20 text-primary-400 border border-primary-500/30">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black tracking-tight">
                                {isEditing ? 'Edit EdTech Article & Learning Resources' : 'Compose Enriched EdTech Article'}
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Enrich pedagogical articles with video tutorials, downloadable PDF circulars, and infographics for Kenyan school administrators.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body / Scrollable Form */}
                <form onSubmit={handleSubmit} className="overflow-y-auto p-6 md:p-8 space-y-8 flex-1 custom-scrollbar">
                    {errorMessage && (
                        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {/* SECTION 1: Essential Article Details */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <Layers className="w-4 h-4 text-primary-600" />
                            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                                1. Article Headline & Categorization
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">Article Title *</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Navigating the CBC Junior School Assessment Matrix: A Guide for Headteachers"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">Category *</label>
                                <select
                                    value={isCustomCategory ? 'OTHER' : category}
                                    onChange={(e) => {
                                        if (e.target.value === 'OTHER') {
                                            setIsCustomCategory(true);
                                        } else {
                                            setIsCustomCategory(false);
                                            setCategory(e.target.value);
                                        }
                                    }}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                                >
                                    {DEFAULT_CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                    <option value="OTHER">+ Custom Category...</option>
                                </select>
                                {isCustomCategory && (
                                    <input
                                        type="text"
                                        value={customCategory}
                                        onChange={(e) => setCustomCategory(e.target.value)}
                                        placeholder="Enter custom category..."
                                        className="w-full mt-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                                    />
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">Publication Status</label>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setStatus('PUBLISHED')}
                                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                                            status === 'PUBLISHED' 
                                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm' 
                                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                        }`}
                                    >
                                        Published
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStatus('DRAFT')}
                                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                                            status === 'DRAFT' 
                                                ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-sm' 
                                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                        }`}
                                    >
                                        Draft
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">Estimated Reading Time</label>
                                <input
                                    type="text"
                                    value={readTime}
                                    onChange={(e) => setReadTime(e.target.value)}
                                    placeholder="e.g. 5 min read"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>

                            <div className="space-y-1.5 flex flex-col justify-end">
                                <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs font-bold text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={featured}
                                        onChange={(e) => setFeatured(e.target.checked)}
                                        className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4"
                                    />
                                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                    <span>Feature on Landing Page Hero</span>
                                </label>
                            </div>
                        </div>

                        {/* Author credentials */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">Author Name</label>
                                <input
                                    type="text"
                                    value={author}
                                    onChange={(e) => setAuthor(e.target.value)}
                                    placeholder="e.g. Mary Nduta Mburu"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">Author Title & Credential</label>
                                <input
                                    type="text"
                                    value={authorRole}
                                    onChange={(e) => setAuthorRole(e.target.value)}
                                    placeholder="e.g. Senior Educational Consultant & Former KICD Specialist"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">Author Avatar (URL)</label>
                                <input
                                    type="text"
                                    value={authorAvatar}
                                    onChange={(e) => setAuthorAvatar(e.target.value)}
                                    placeholder="https://... image URL"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                        </div>

                        {/* Cover Image */}
                        <div className="space-y-1.5 pt-2">
                            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                                <span>Article Hero Cover Image</span>
                                <span className="text-[11px] text-slate-400">Upload or paste image URL</span>
                            </label>
                            <div className="flex flex-col sm:flex-row gap-3 items-center">
                                <input
                                    type="text"
                                    value={coverImageUrl}
                                    onChange={(e) => setCoverImageUrl(e.target.value)}
                                    placeholder="https://images.unsplash.com/... or upload local image"
                                    className="flex-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                                <label className="shrink-0 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5">
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>Browse Image...</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleCoverImageUpload}
                                    />
                                </label>
                            </div>
                            {coverImageUrl && (
                                <div className="mt-2 relative h-32 rounded-xl overflow-hidden border border-slate-200">
                                    <img 
                                        src={coverImageUrl} 
                                        alt="Cover preview" 
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLElement).style.display = 'none';
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Excerpt */}
                        <div className="space-y-1.5 pt-2">
                            <label className="text-xs font-bold text-slate-700">
                                Executive Summary / Card Excerpt * (Displayed on news cards)
                            </label>
                            <textarea
                                rows={2}
                                required
                                value={excerpt}
                                onChange={(e) => setExcerpt(e.target.value)}
                                placeholder="A concise 1-2 sentence preview summarizing the practical takeaway for schools..."
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>

                    {/* SECTION 2: Enriched Media Upload Suite (Videos, PDFs, Pictures) */}
                    <div className="space-y-4 bg-slate-50/80 p-5 rounded-2xl border border-slate-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-primary-600 text-white">
                                    <Upload className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                                        2. Media Attachments Suite
                                    </h3>
                                    <p className="text-[11px] text-slate-500">
                                        Attach videos, official PDF guidelines/circulars, and high-res infographics for enriched learning.
                                    </p>
                                </div>
                            </div>
                            <div className="text-xs font-bold text-slate-600 bg-white px-3 py-1 rounded-lg border border-slate-200">
                                {mediaItems.length} media attached
                            </div>
                        </div>

                        {/* Media Type Selector Tabs */}
                        <div className="flex border-b border-slate-200 gap-2">
                            <button
                                type="button"
                                onClick={() => setActiveMediaTab('VIDEO')}
                                className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all ${
                                    activeMediaTab === 'VIDEO'
                                        ? 'border-indigo-600 text-indigo-700'
                                        : 'border-transparent text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <Video className="w-3.5 h-3.5" />
                                <span>Instructional Video</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveMediaTab('PDF')}
                                className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all ${
                                    activeMediaTab === 'PDF'
                                        ? 'border-rose-600 text-rose-700'
                                        : 'border-transparent text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <FileText className="w-3.5 h-3.5" />
                                <span>PDF Document / Circular</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveMediaTab('IMAGE')}
                                className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all ${
                                    activeMediaTab === 'IMAGE'
                                        ? 'border-emerald-600 text-emerald-700'
                                        : 'border-transparent text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <ImageIcon className="w-3.5 h-3.5" />
                                <span>Picture / Infographic</span>
                            </button>
                        </div>

                        {/* Sub-form to Add Media Item */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-700">
                                        {activeMediaTab === 'VIDEO' && 'Video Title *'}
                                        {activeMediaTab === 'PDF' && 'Document Title (e.g. KNEC CBA Assessment Matrix 2026) *'}
                                        {activeMediaTab === 'IMAGE' && 'Infographic / Photo Caption *'}
                                    </label>
                                    <input
                                        type="text"
                                        value={mediaTitle}
                                        onChange={(e) => setMediaTitle(e.target.value)}
                                        placeholder={
                                            activeMediaTab === 'VIDEO' ? 'e.g. CBC Assessment Rubrics Video Masterclass' :
                                            activeMediaTab === 'PDF' ? 'e.g. Official Ministry CBA Circular No. 12.pdf' :
                                            'e.g. CBA Four-Tier Performance Spectrum'
                                        }
                                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                                    />
                                </div>

                                {activeMediaTab === 'VIDEO' && (
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-bold text-slate-700">Duration (e.g. 05:30)</label>
                                        <input
                                            type="text"
                                            value={mediaDuration}
                                            onChange={(e) => setMediaDuration(e.target.value)}
                                            placeholder="05:30"
                                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                                        />
                                    </div>
                                )}

                                {activeMediaTab === 'PDF' && (
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-bold text-slate-700">File Size (e.g. 2.4 MB)</label>
                                        <input
                                            type="text"
                                            value={mediaFileSize}
                                            onChange={(e) => setMediaFileSize(e.target.value)}
                                            placeholder="2.4 MB"
                                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Upload / URL Selector */}
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                                    <span>
                                        {activeMediaTab === 'VIDEO' && 'Video File or Stream URL'}
                                        {activeMediaTab === 'PDF' && 'PDF Document File or Web URL'}
                                        {activeMediaTab === 'IMAGE' && 'Image File or Photo URL'}
                                    </span>
                                    {uploadFeedback && (
                                        <span className="text-emerald-600 font-normal">{uploadFeedback}</span>
                                    )}
                                </label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="text"
                                        value={mediaUrl}
                                        onChange={(e) => setMediaUrl(e.target.value)}
                                        placeholder={
                                            activeMediaTab === 'VIDEO' ? 'Paste MP4 / WebM / YouTube URL or click Upload' :
                                            activeMediaTab === 'PDF' ? 'Paste PDF download URL or click Upload' :
                                            'Paste image URL or click Upload'
                                        }
                                        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                                    />
                                    <label className="px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-slate-800 transition-colors flex items-center gap-1.5 shrink-0">
                                        <Upload className="w-3.5 h-3.5" />
                                        <span>
                                            {isUploadingMedia ? 'Loading...' : `Upload ${activeMediaTab}`}
                                        </span>
                                        <input
                                            type="file"
                                            accept={
                                                activeMediaTab === 'VIDEO' ? 'video/mp4,video/webm,video/*' :
                                                activeMediaTab === 'PDF' ? 'application/pdf' :
                                                'image/*'
                                            }
                                            className="hidden"
                                            onChange={(e) => handleFileUpload(e, activeMediaTab)}
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Additional description */}
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-700">Resource Description / Pedagogy Note</label>
                                <input
                                    type="text"
                                    value={mediaDescription}
                                    onChange={(e) => setMediaDescription(e.target.value)}
                                    placeholder="Brief note on how teachers or school heads should utilize this resource..."
                                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                                />
                            </div>

                            {/* Quick Presets for Demo / Easy Seeding */}
                            <div className="pt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                                <span className="font-bold">Quick Samples:</span>
                                {activeMediaTab === 'VIDEO' && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMediaTitle('CBC Continuous Assessment Training Video');
                                                setMediaUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
                                                setMediaDuration('06:45');
                                                setMediaDescription('Instructional walkthrough on grading strands and performance levels.');
                                            }}
                                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                                        >
                                            + Sample CBC Video (MP4)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMediaTitle('Daraja M-Pesa Automated Reconciliation Demo');
                                                setMediaUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4');
                                                setMediaDuration('04:15');
                                                setMediaDescription('Live accounting demonstration of automatic C2B webhook ledger posting.');
                                            }}
                                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                                        >
                                            + Sample Finance Video (MP4)
                                        </button>
                                    </>
                                )}
                                {activeMediaTab === 'PDF' && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMediaTitle('KNEC Junior School CBA Guidelines & Scoring Descriptors 2026.pdf');
                                                setMediaUrl('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
                                                setMediaFileName('KNEC_CBA_Rubrics_2026.pdf');
                                                setMediaFileSize('2.4 MB');
                                                setMediaDescription('Standardized rubric matrix for formative and summative junior secondary assessment.');
                                            }}
                                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                                        >
                                            + Sample KNEC CBA Guideline PDF
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMediaTitle('ODPC Data Protection Compliance Self-Audit Checklist.pdf');
                                                setMediaUrl('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
                                                setMediaFileName('ODPC_School_Audit_Checklist.pdf');
                                                setMediaFileSize('1.5 MB');
                                                setMediaDescription('Official legal checklist for school boards acting as data controllers.');
                                            }}
                                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                                        >
                                            + Sample Legal Checklist PDF
                                        </button>
                                    </>
                                )}
                                {activeMediaTab === 'IMAGE' && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMediaTitle('Formative Assessment vs Summative Exam Flowchart');
                                                setMediaUrl('https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=800');
                                                setMediaCaption('Comparative schematic of learner competency progression over 3 terms.');
                                            }}
                                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                                        >
                                            + Sample Assessment Infographic
                                        </button>
                                    </>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={handleAddMediaItem}
                                className="w-full mt-2 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Attach This {activeMediaTab} to Article</span>
                            </button>
                        </div>

                        {/* List of Attached Media Items */}
                        {mediaItems.length > 0 && (
                            <div className="space-y-2 pt-2">
                                <div className="text-xs font-bold text-slate-700">Currently Attached Media:</div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {mediaItems.map((item) => (
                                        <div 
                                            key={item.id} 
                                            className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between gap-3 relative group"
                                        >
                                            <div className="flex items-start gap-2.5 overflow-hidden">
                                                <div className={`p-2 rounded-lg shrink-0 ${
                                                    item.type === 'VIDEO' ? 'bg-indigo-50 text-indigo-700' :
                                                    item.type === 'PDF' ? 'bg-rose-50 text-rose-700' :
                                                    'bg-emerald-50 text-emerald-700'
                                                }`}>
                                                    {item.type === 'VIDEO' && <Video className="w-4 h-4" />}
                                                    {item.type === 'PDF' && <FileText className="w-4 h-4" />}
                                                    {item.type === 'IMAGE' && <ImageIcon className="w-4 h-4" />}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <div className="text-xs font-bold text-slate-900 truncate">
                                                        {item.title}
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                                                        <span className="font-semibold uppercase tracking-wider">{item.type}</span>
                                                        {item.duration && <span>&bull; {item.duration}</span>}
                                                        {item.fileSize && <span>&bull; {item.fileSize}</span>}
                                                    </div>
                                                    {item.description && (
                                                        <p className="text-[10px] text-slate-600 truncate mt-1">
                                                            {item.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleRemoveMediaItem(item.id)}
                                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors shrink-0"
                                                title="Remove media item"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SECTION 3: Key Learning Objectives / Pedagogy Bullet Points */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                                    3. Learning Objectives & Key Takeaways
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddObjective}
                                className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Objective</span>
                            </button>
                        </div>
                        <p className="text-xs text-slate-500">
                            Clear learning competencies that teachers or principals will gain from reading and reviewing the attached resources.
                        </p>

                        <div className="space-y-2">
                            {learningObjectives.map((obj, idx) => (
                                <div key={idx} className="flex gap-2 items-center">
                                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                                        {idx + 1}
                                    </span>
                                    <input
                                        type="text"
                                        value={obj}
                                        onChange={(e) => handleObjectiveChange(idx, e.target.value)}
                                        placeholder={`Learning objective #${idx + 1}...`}
                                        className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveObjective(idx)}
                                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                                        title="Delete objective"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SECTION 4: Article Content Body */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary-600" />
                                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                                    4. Article Text Body (Paragraphs)
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddParagraph}
                                className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Paragraph</span>
                            </button>
                        </div>

                        <div className="space-y-3">
                            {contentParagraphs.map((para, idx) => (
                                <div key={idx} className="space-y-1 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-600">
                                        <span>Paragraph {idx + 1}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveParagraph(idx)}
                                            className="text-slate-400 hover:text-rose-600 p-1"
                                            title="Delete paragraph"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <textarea
                                        rows={3}
                                        value={para}
                                        onChange={(e) => handleParagraphChange(idx, e.target.value)}
                                        placeholder={`Enter text for paragraph ${idx + 1}...`}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SECTION 5: Tags & Indexing */}
                    <div className="space-y-2 border-t border-slate-100 pt-4">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-slate-500" />
                            <span>Keywords & Topic Tags (comma-separated)</span>
                        </label>
                        <input
                            type="text"
                            value={tagsString}
                            onChange={(e) => setTagsString(e.target.value)}
                            placeholder="e.g. CBC Framework, Junior Secondary, KNEC CBA, M-Pesa Daraja, School Governance"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    {/* Footer Actions inside form */}
                    <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="text-xs text-slate-500">
                            * Changes are saved live to the SaasLink database and immediately reflected on the public portal.
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSaving}
                                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        <span>{isEditing ? 'Save Article & Media' : 'Publish Article'}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

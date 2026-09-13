import React, { useState } from 'react';
import { 
    X, Video, FileText, Image as ImageIcon, Download, ExternalLink, 
    Calendar, Clock, User, Tag, Sparkles, BookOpen, Play, CheckCircle2,
    Share2, Printer
} from 'lucide-react';
import { EdTechArticle, ArticleMediaItem } from '../../types';

interface EdTechArticleViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    article: EdTechArticle | null;
}

export const EdTechArticleViewerModal: React.FC<EdTechArticleViewerModalProps> = ({
    isOpen,
    onClose,
    article
}) => {
    const [activeVideo, setActiveVideo] = useState<ArticleMediaItem | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    if (!isOpen || !article) return null;

    const videos = (article.media || []).filter(m => m.type === 'VIDEO');
    const pdfs = (article.media || []).filter(m => m.type === 'PDF');
    const images = (article.media || []).filter(m => m.type === 'IMAGE');

    // Helper to download PDF or media
    const handleDownload = (item: ArticleMediaItem) => {
        const link = document.createElement('a');
        link.href = item.url;
        link.download = item.fileName || `${item.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Helper to check if URL is YouTube or external embed
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <div 
                className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full my-8 overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
                role="dialog"
                aria-modal="true"
            >
                {/* Header Banner */}
                <div className="p-6 md:p-8 bg-slate-900 text-white relative border-b border-slate-800">
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
                        aria-label="Close article preview"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="px-3 py-1 bg-primary-500/20 text-primary-300 text-xs font-black uppercase tracking-wider rounded-lg border border-primary-500/30">
                            {article.category}
                        </span>
                        {article.featured && (
                            <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 text-xs font-bold rounded-lg border border-amber-500/30 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                <span>Featured Headline</span>
                            </span>
                        )}
                        <span className="text-xs text-slate-400 flex items-center gap-1.5 ml-auto mr-8">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{article.readTime}</span>
                            <span>&bull;</span>
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{article.date}</span>
                        </span>
                    </div>

                    <h1 className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tight max-w-3xl">
                        {article.title}
                    </h1>

                    <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                            {article.authorAvatar ? (
                                <img 
                                    src={article.authorAvatar} 
                                    alt={article.author} 
                                    className="w-10 h-10 rounded-full object-cover ring-2 ring-primary-500/50"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 text-primary-400 font-black text-sm flex items-center justify-center">
                                    {article.author.charAt(0)}
                                </div>
                            )}
                            <div>
                                <div className="text-sm font-bold text-white">{article.author}</div>
                                <div className="text-xs text-slate-400">{article.authorRole}</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => window.print()}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                            >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Print / PDF</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Article Content & Enriched Media */}
                <div className="overflow-y-auto p-6 md:p-10 space-y-8 flex-1 custom-scrollbar">
                    
                    {/* Cover Photo */}
                    {article.coverImageUrl && (
                        <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200 max-h-80 relative group">
                            <img 
                                src={article.coverImageUrl} 
                                alt={article.title} 
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {/* Excerpt Summary Box */}
                    <div className="p-5 rounded-2xl bg-primary-50/70 border border-primary-100 text-slate-800">
                        <div className="text-[11px] font-black uppercase tracking-wider text-primary-900 mb-1">
                            Executive Takeaway for School Leadership:
                        </div>
                        <p className="text-sm md:text-base font-medium leading-relaxed italic text-slate-700">
                            "{article.excerpt}"
                        </p>
                    </div>

                    {/* Key Learning Objectives */}
                    {article.learningObjectives && article.learningObjectives.length > 0 && (
                        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-900">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                <span>Curriculum Competencies & Learning Objectives</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                {article.learningObjectives.map((obj, i) => (
                                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700 leading-normal">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                        <span>{obj}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Article Paragraphs */}
                    <div className="space-y-4 text-slate-700 text-base leading-relaxed">
                        {(article.content || []).map((paragraph, index) => (
                            <p key={index}>{paragraph}</p>
                        ))}
                    </div>

                    {/* ENRICHED SECTION: Video Masterclasses & Tutorials */}
                    {videos.length > 0 && (
                        <div className="pt-6 border-t border-slate-200 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                                        <Video className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                                        Instructional Video Masterclasses ({videos.length})
                                    </h3>
                                </div>
                                <span className="text-xs text-slate-500">
                                    Stream or watch training clips
                                </span>
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
                                        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/80">
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
                        </div>
                    )}

                    {/* ENRICHED SECTION: Downloadable Official PDFs & Circulars */}
                    {pdfs.length > 0 && (
                        <div className="pt-6 border-t border-slate-200 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-rose-50 text-rose-700">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                                        Downloadable PDF Frameworks & Learning Circulars ({pdfs.length})
                                    </h3>
                                </div>
                                <span className="text-xs text-slate-500">
                                    Official curriculum & policy documents
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {pdfs.map((pdf) => (
                                    <div 
                                        key={pdf.id}
                                        className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-rose-300 shadow-sm transition-all flex flex-col justify-between group"
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div className="p-2 rounded-xl bg-rose-50 text-rose-600 group-hover:scale-105 transition-transform">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">
                                                    {pdf.fileSize || 'PDF Document'}
                                                </span>
                                            </div>
                                            <h4 className="text-xs font-bold text-slate-900 leading-snug mb-1">
                                                {pdf.title}
                                            </h4>
                                            {pdf.description && (
                                                <p className="text-[11px] text-slate-500 line-clamp-2 mb-3">
                                                    {pdf.description}
                                                </p>
                                            )}
                                        </div>

                                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                            <span className="text-[10px] text-slate-400 truncate max-w-[140px]">
                                                {pdf.fileName || 'document.pdf'}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <a
                                                    href={pdf.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                    <span>View</span>
                                                </a>
                                                <button
                                                    onClick={() => handleDownload(pdf)}
                                                    className="px-3 py-1 text-[11px] font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
                                                >
                                                    <Download className="w-3 h-3" />
                                                    <span>Download</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ENRICHED SECTION: Diagrams & Infographics */}
                    {images.length > 0 && (
                        <div className="pt-6 border-t border-slate-200 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                                        <ImageIcon className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                                        Infographics, Diagrams & Learning Visuals ({images.length})
                                    </h3>
                                </div>
                                <span className="text-xs text-slate-500">
                                    Click any image to enlarge
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {images.map((img) => (
                                    <div 
                                        key={img.id}
                                        onClick={() => setSelectedImage(img.url)}
                                        className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 hover:shadow-md transition-shadow cursor-pointer group"
                                    >
                                        <div className="aspect-video relative overflow-hidden bg-slate-100">
                                            <img 
                                                src={img.url} 
                                                alt={img.title} 
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                        <div className="p-3 bg-white">
                                            <div className="text-xs font-bold text-slate-900">
                                                {img.title}
                                            </div>
                                            {img.caption && (
                                                <div className="text-[11px] text-slate-500 mt-0.5">
                                                    {img.caption}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tags Footer */}
                    {article.tags && article.tags.length > 0 && (
                        <div className="pt-6 border-t border-slate-200 flex items-center gap-2 flex-wrap">
                            <Tag className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs font-bold text-slate-500">Curriculum Keywords:</span>
                            {article.tags.map((t, idx) => (
                                <span 
                                    key={idx} 
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium"
                                >
                                    #{t}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Institutional Research & Publisher Note */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 leading-relaxed">
                        <strong>Published by SaasLink Technologies Ltd:</strong> Educational Research & Continuous Assessment Practice Division, Nairobi, Kenya. For curriculum workshops, institutional licensing, or data governance audits, contact <strong>0720935895</strong> or email <strong>editor@saaslink.co.ke</strong>.
                    </div>
                </div>

                {/* Footer Modal Action */}
                <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
                    >
                        Close Reader
                    </button>
                </div>
            </div>

            {/* Lightbox for Enlarge Image */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="max-w-5xl max-h-[90vh] relative">
                        <img 
                            src={selectedImage} 
                            alt="Enlarged visual" 
                            className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl" 
                        />
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-2 right-2 text-white bg-black/60 p-2 rounded-full hover:bg-black"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

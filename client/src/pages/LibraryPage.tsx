import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, Library, Search, Plus, Filter, Download, Printer, BookOpen, Clock, User, Bookmark, ChevronRight, X, Edit, Trash2, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface BookType {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  category?: string;
  quantity: number;
  availableQuantity: number;
  location?: string;
}

const LibraryPage: React.FC = () => {
  const [books, setBooks] = useState<BookType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLendModalOpen, setIsLendModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BookType | null>(null);
  const [activeLendings, setActiveLendings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'collection' | 'lendings' | 'overdue'>('collection');
  const [lendData, setLendData] = useState({ studentId: '', dueDate: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'Textbook',
    quantity: 1,
    location: ''
  });

  useEffect(() => {
    fetchBooks();
    fetchLendings();
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const response = await api.get('/library/books');
      setBooks(response.data);
    } catch (error) {
      console.error('Failed to fetch books', error);
      toast.error('Could not load books');
    } finally {
      setLoading(false);
    }
  };

  const fetchLendings = async () => {
    try {
      const response = await api.get('/library/lendings/active');
      setActiveLendings(response.data);
    } catch (error) {
      console.error('Failed to fetch lendings', error);
    }
  };

  const handleReturnBook = async (lendingId: string) => {
    try {
      await api.post(`/library/return/${lendingId}`);
      toast.success('Book returned successfully');
      fetchLendings();
      fetchBooks();
    } catch (error) {
      toast.error('Failed to return book');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/library/books', formData);
      toast.success('Book added to collection');
      setIsModalOpen(false);
      setFormData({ title: '', author: '', isbn: '', category: 'Textbook', quantity: 1, location: '' });
      fetchBooks();
    } catch (error) {
      toast.error('Failed to add book');
    }
  };

  const handleLendBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;
    try {
      await api.post('/library/lend', {
        bookId: selectedBook.id,
        studentId: lendData.studentId,
        dueDate: lendData.dueDate || undefined
      });
      toast.success('Book successfully lent');
      setIsLendModalOpen(false);
      setLendData({ studentId: '', dueDate: '' });
      fetchBooks();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to lend book');
    }
  };

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.isbn?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50/30 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center space-x-2 text-rose-600 mb-2">
              <Library size={16} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Knowledge Repository</span>
            </div>
            <h1 className="text-5xl font-black text-gray-900 uppercase tracking-tighter italic">
              The <span className="text-rose-600">Library</span>
            </h1>
            <p className="text-gray-400 font-medium text-sm mt-4 max-w-md">
              Catalog and manage student-accessible literature, textbooks, and archival materials.
            </p>
          </div>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-black text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-800 transition-all shadow-xl shadow-gray-100 hover:scale-[1.02] active:scale-95 flex items-center gap-2"
          >
            <Plus className="w-3 h-3" />
            New Acquisition
          </button>
        </header>

        {/* Categories Bar */}
        <div className="flex overflow-x-auto space-x-4 mb-10 pb-2 no-scrollbar">
           {['All Materials', 'Textbooks', 'Fiction', 'Scientific', 'Biographies', 'History', 'Journals'].map((cat, i) => (
             <button 
              key={cat} 
              className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                i === 0 ? 'bg-rose-600 text-white shadow-lg shadow-rose-100' : 'bg-white text-gray-400 border border-gray-100 hover:border-gray-300'
              }`}
             >
               {cat}
             </button>
           ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Collection */}
          <div className="lg:col-span-3 space-y-6">
             <div className="bg-white border border-gray-100 rounded-3xl p-3 shadow-sm flex items-center mb-8">
                <div className="relative flex-1">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder={activeTab === 'collection' ? "Search by Title, Author or ISBN..." : "Search by Student ID or Book..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-14 pr-4 py-4 bg-transparent border-none focus:ring-0 text-sm font-bold placeholder:text-gray-300"
                  />
                </div>
                <div className="h-8 w-[1px] bg-gray-100 mx-4" />
                <button className="p-4 text-gray-400 hover:text-rose-600 transition-colors">
                  <Filter size={20} />
                </button>
             </div>

             {loading ? (
                <div className="flex flex-col items-center justify-center h-64">
                   <div className="w-10 h-10 border-4 border-rose-600/10 border-t-rose-600 rounded-full animate-spin mb-4" />
                   <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Scanning Catalog...</p>
                </div>
             ) : activeTab === 'collection' ? (
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {filteredBooks.map((book) => (
                    <motion.div 
                      key={book.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-rose-100/20 transition-all group overflow-hidden relative"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-all transform group-hover:rotate-6 shadow-sm">
                           <BookOpen size={24} />
                        </div>
                        <div className="bg-gray-50 px-3 py-1 rounded-full text-[9px] font-black uppercase text-gray-400 tracking-wider">
                           {book.category}
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-black text-gray-900 leading-tight mb-1 uppercase tracking-tight group-hover:text-rose-600 transition-colors">{book.title}</h3>
                      <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-6">By {book.author}</p>
                      
                      <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                        <div>
                          <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Inventory</p>
                          <p className="text-sm font-black text-gray-900 tabular-nums">
                            {book.availableQuantity} <span className="text-gray-300 font-bold">/ {book.quantity}</span>
                          </p>
                        </div>
                        <button 
                          onClick={() => {
                            setSelectedBook(book);
                            setIsLendModalOpen(true);
                          }}
                          className="p-2.5 bg-gray-900 text-white rounded-xl hover:bg-rose-600 transition-all transform hover:scale-110 active:scale-95 shadow-lg shadow-gray-200 group-hover:shadow-rose-200"
                        >
                          <Bookmark size={14} />
                        </button>
                      </div>
                      
                      {/* Artistic Accent */}
                      <div className="absolute -right-6 -bottom-6 opacity-[0.03] text-rose-600 transform rotate-12 group-hover:scale-125 transition-transform">
                        <Book size={120} />
                      </div>
                    </motion.div>
                  ))}
               </div>
             ) : (
                <div className="text-center py-20 text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                  Tab content currently under synchronization...
                </div>
             )}
          </div>

          {/* Sidebar / Quick Actions */}
          <div className="space-y-8">
             <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-gray-200">
                <Bookmark className="text-rose-500 mb-6" size={32} />
                <h4 className="text-2xl font-black italic tracking-tighter mb-4">Lending <span className="text-rose-500">Center</span></h4>
                <p className="text-xs text-gray-400 font-medium leading-relaxed mb-8 opacity-80 uppercase tracking-wider">
                  Process rapid check-outs, monitor returns, and handle late fee accruals digitally.
                </p>
                <div className="space-y-4">
                   <button 
                    onClick={() => setActiveTab('collection')}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all transform active:scale-95 flex items-center justify-center gap-2 ${activeTab === 'collection' ? 'bg-rose-600 text-white shadow-xl shadow-rose-900/40' : 'bg-white text-gray-900 hover:bg-gray-50'}`}
                   >
                     <Book size={14} />
                     Catalog
                   </button>
                   <button 
                    onClick={() => setActiveTab('lendings')}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 border ${activeTab === 'lendings' ? 'bg-rose-600 border-rose-600 text-white shadow-xl shadow-rose-900/40' : 'bg-white/10 border-white/5 hover:bg-white/20 text-white'}`}
                   >
                     <Check size={14} />
                     Active Lendings
                   </button>
                   <button 
                    onClick={() => setActiveTab('overdue')}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 border ${activeTab === 'overdue' ? 'bg-rose-600 border-rose-600 text-white shadow-xl shadow-rose-900/40' : 'bg-white/10 border-white/5 hover:bg-white/20 text-white'}`}
                   >
                     <Clock size={14} />
                     Overdue List
                   </button>
                </div>
             </div>

             <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
                <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Library Health</h5>
                <div className="space-y-6">
                   <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Circulation</p>
                      <span className="text-sm font-black italic text-rose-600">84%</span>
                   </div>
                   <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-600 w-[84%] rounded-full" />
                   </div>
                   <div className="pt-4 space-y-4">
                      <div className="flex items-center text-xs text-gray-400 font-bold uppercase tracking-wider">
                         <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                         <span>1,200 Books in Stock</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-400 font-bold uppercase tracking-wider">
                         <div className="w-2 h-2 rounded-full bg-orange-500 mr-2" />
                         <span>42 Overdue Returns</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Modal Add Book */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl"
              >
               <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-rose-50/30">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic">Register <span className="text-rose-600">Material</span></h3>
                    <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mt-1">Catalog Entry Form</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-rose-100 text-rose-400 rounded-2xl transition-all">
                    <X size={20} />
                  </button>
               </div>
               
               <form onSubmit={handleSubmit} className="p-10 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                       <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Book Title</label>
                       <input 
                        name="title"
                        required
                        value={formData.title}
                        onChange={handleInputChange}
                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-rose-600 font-bold text-gray-900 transition-all"
                        placeholder="e.g. Advanced Calculus"
                       />
                    </div>
                    <div>
                       <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Primary Author</label>
                       <input 
                        name="author"
                        required
                        value={formData.author}
                        onChange={handleInputChange}
                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-rose-600 font-bold text-gray-900 transition-all"
                        placeholder="Author Name"
                       />
                    </div>
                    <div>
                       <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">ISBN Number</label>
                       <input 
                        name="isbn"
                        value={formData.isbn}
                        onChange={handleInputChange}
                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-rose-600 font-bold text-gray-900 transition-all"
                        placeholder="Optional"
                       />
                    </div>
                    <div>
                       <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Category</label>
                       <select 
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-rose-600 font-bold text-gray-900 transition-all"
                       >
                         <option>Textbook</option>
                         <option>Fiction</option>
                         <option>Scientific</option>
                         <option>Reference</option>
                       </select>
                    </div>
                    <div>
                       <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Quantity</label>
                       <input 
                        type="number"
                        name="quantity"
                        min="1"
                        required
                        value={formData.quantity}
                        onChange={handleInputChange}
                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-rose-600 font-bold text-gray-900 transition-all"
                       />
                    </div>
                  </div>
                  
                  <div className="pt-6">
                    <button type="submit" className="w-full bg-rose-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-rose-200 hover:scale-[1.02] active:scale-95 transition-all">
                      Add to Collection
                    </button>
                  </div>
               </form>
            </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* Modal Lend Book */}
      <AnimatePresence>
        {isLendModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl"
              >
                  <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-rose-50/30">
                    <div>
                      <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic">Lend <span className="text-rose-600">Material</span></h3>
                      <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mt-1">{selectedBook?.title}</p>
                    </div>
                    <button onClick={() => setIsLendModalOpen(false)} className="p-3 hover:bg-rose-100 text-rose-400 rounded-2xl transition-all">
                      <X size={20} />
                    </button>
                  </div>
                  
                  <form onSubmit={handleLendBook} className="p-10 space-y-6">
                    <div className="space-y-4">
                       <div>
                          <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Student ID / Full ID</label>
                          <input 
                            required
                            type="text"
                            value={lendData.studentId}
                            onChange={(e) => setLendData({...lendData, studentId: e.target.value})}
                            className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-rose-600 font-bold text-gray-900 transition-all font-mono"
                            placeholder="STU-001..."
                          />
                       </div>
                       <div>
                          <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Return Due Date</label>
                          <input 
                            type="date"
                            value={lendData.dueDate}
                            onChange={(e) => setLendData({...lendData, dueDate: e.target.value})}
                            className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-rose-600 font-bold text-gray-900 transition-all"
                          />
                       </div>
                    </div>
                    
                    <div className="pt-6">
                      <button type="submit" className="w-full bg-gray-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-gray-200 hover:scale-[1.02] active:scale-95 transition-all">
                        Confirm Check-out
                      </button>
                    </div>
                  </form>
              </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LibraryPage;


import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { LibraryStatus, Book, NewBook } from '../../types';
import Modal from '../common/Modal';

const LibraryView: React.FC = () => {
    const { books, libraryTransactions, students, addBook, updateBook, deleteBook, issueBook, returnBook, addNotification } = useData();
    const [activeTab, setActiveTab] = useState<'catalog' | 'circulation' | 'history'>('catalog');
    
    // Catalog State
    const [searchTerm, setSearchTerm] = useState('');
    const [isBookModalOpen, setIsBookModalOpen] = useState(false);
    const [editingBook, setEditingBook] = useState<Book | null>(null);
    const [newBook, setNewBook] = useState<NewBook>({
        title: '', author: '', category: '', isbn: '', totalQuantity: 1, shelfLocation: ''
    });

    // Circulation State
    const [issueStudentId, setIssueStudentId] = useState('');
    const [issueBookId, setIssueBookId] = useState('');
    const [dueDate, setDueDate] = useState('');

    const filteredBooks = useMemo(() => {
        return books.filter(b => 
            b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
            b.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.isbn?.includes(searchTerm)
        );
    }, [books, searchTerm]);

    const activeLoans = useMemo(() => {
        return libraryTransactions.filter(t => t.status === LibraryStatus.BORROWED || t.status === LibraryStatus.OVERDUE);
    }, [libraryTransactions]);

    const handleSaveBook = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingBook) {
                await updateBook(editingBook.id, newBook);
                addNotification('Book updated successfully', 'success');
            } else {
                await addBook(newBook);
                addNotification('Book added successfully', 'success');
            }
            setIsBookModalOpen(false);
            setNewBook({ title: '', author: '', category: '', isbn: '', totalQuantity: 1, shelfLocation: '' });
        } catch (error) {
            addNotification('Failed to save book', 'error');
        }
    };

    const handleDeleteBook = async (id: string) => {
        if (window.confirm("Are you sure? This will delete the book from the catalog.")) {
            try {
                await deleteBook(id);
                addNotification('Book deleted', 'success');
            } catch (error) {
                addNotification('Cannot delete book with active transactions', 'error');
            }
        }
    };

    const handleIssueBook = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!issueStudentId || !issueBookId || !dueDate) {
            addNotification('Please fill all fields', 'error');
            return;
        }
        try {
            await issueBook({ studentId: issueStudentId, bookId: issueBookId, dueDate });
            addNotification('Book issued successfully', 'success');
            setIssueStudentId('');
            setIssueBookId('');
            setDueDate('');
        } catch (error: any) {
            addNotification(error.message || 'Failed to issue book', 'error');
        }
    };

    const handleReturnBook = async (transactionId: string) => {
        try {
            await returnBook(transactionId);
            addNotification('Book returned successfully', 'success');
        } catch (error) {
            addNotification('Failed to return book', 'error');
        }
    };

    const openBookModal = (book: Book | null = null) => {
        setEditingBook(book);
        if (book) {
            setNewBook({
                title: book.title,
                author: book.author,
                category: book.category,
                isbn: book.isbn || '',
                totalQuantity: book.totalQuantity,
                shelfLocation: book.shelfLocation || ''
            });
        } else {
            setNewBook({ title: '', author: '', category: '', isbn: '', totalQuantity: 1, shelfLocation: '' });
        }
        setIsBookModalOpen(true);
    };

    return (
        <div className="p-6 md:p-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Library Management</h2>
            <div className="border-b border-slate-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button onClick={() => setActiveTab('catalog')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'catalog' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Catalog</button>
                    <button onClick={() => setActiveTab('circulation')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'circulation' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Circulation Desk</button>
                    <button onClick={() => setActiveTab('history')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'history' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Transaction History</button>
                </nav>
            </div>

            {activeTab === 'catalog' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <input 
                            type="text" 
                            placeholder="Search books..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="p-2 border border-slate-300 rounded-lg w-1/3"
                        />
                        <button onClick={() => openBookModal()} className="px-4 py-2 bg-primary-600 text-white rounded-lg shadow-md hover:bg-primary-700">Add Book</button>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
                        <table className="w-full text-left table-auto">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-4 py-3 font-semibold text-slate-600">Title</th>
                                    <th className="px-4 py-3 font-semibold text-slate-600">Author</th>
                                    <th className="px-4 py-3 font-semibold text-slate-600">Category</th>
                                    <th className="px-4 py-3 font-semibold text-slate-600">Location</th>
                                    <th className="px-4 py-3 font-semibold text-slate-600 text-center">Available / Total</th>
                                    <th className="px-4 py-3 font-semibold text-slate-600 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBooks.map(book => (
                                    <tr key={book.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="px-4 py-2 font-medium text-slate-800">{book.title}</td>
                                        <td className="px-4 py-2 text-slate-600">{book.author}</td>
                                        <td className="px-4 py-2 text-slate-600">{book.category}</td>
                                        <td className="px-4 py-2 text-slate-600">{book.shelfLocation || '-'}</td>
                                        <td className="px-4 py-2 text-center">
                                            <span className={`font-bold ${book.availableQuantity > 0 ? 'text-green-600' : 'text-red-600'}`}>{book.availableQuantity}</span> / {book.totalQuantity}
                                        </td>
                                        <td className="px-4 py-2 text-center space-x-2">
                                            <button onClick={() => openBookModal(book)} className="text-blue-600 hover:underline">Edit</button>
                                            <button onClick={() => handleDeleteBook(book.id)} className="text-red-600 hover:underline">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredBooks.length === 0 && <tr><td colSpan={6} className="text-center py-4 text-slate-500">No books found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'circulation' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg h-fit">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Issue Book</h3>
                        <form onSubmit={handleIssueBook} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Student</label>
                                <select 
                                    value={issueStudentId} 
                                    onChange={(e) => setIssueStudentId(e.target.value)} 
                                    className="w-full p-2 border border-slate-300 rounded-md"
                                    required
                                >
                                    <option value="">Select Student</option>
                                    {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.admissionNumber})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Book</label>
                                <select 
                                    value={issueBookId} 
                                    onChange={(e) => setIssueBookId(e.target.value)} 
                                    className="w-full p-2 border border-slate-300 rounded-md"
                                    required
                                >
                                    <option value="">Select Book</option>
                                    {books.filter(b => b.availableQuantity > 0).map(b => <option key={b.id} value={b.id}>{b.title} (Qty: {b.availableQuantity})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Due Date</label>
                                <input 
                                    type="date" 
                                    value={dueDate} 
                                    onChange={(e) => setDueDate(e.target.value)} 
                                    className="w-full p-2 border border-slate-300 rounded-md"
                                    required
                                />
                            </div>
                            <button type="submit" className="w-full py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700">Issue Book</button>
                        </form>
                    </div>

                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Active Loans</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b">
                                        <th className="p-2">Book</th>
                                        <th className="p-2">Borrower</th>
                                        <th className="p-2">Issued</th>
                                        <th className="p-2">Due</th>
                                        <th className="p-2 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeLoans.map(t => {
                                        const isOverdue = new Date(t.dueDate) < new Date();
                                        return (
                                            <tr key={t.id} className="border-b">
                                                <td className="p-2 font-medium">{t.bookTitle}</td>
                                                <td className="p-2">{t.borrowerName}</td>
                                                <td className="p-2">{new Date(t.borrowDate).toLocaleDateString()}</td>
                                                <td className={`p-2 font-semibold ${isOverdue ? 'text-red-600' : 'text-slate-600'}`}>
                                                    {new Date(t.dueDate).toLocaleDateString()} {isOverdue && '(Overdue)'}
                                                </td>
                                                <td className="p-2 text-center">
                                                    <button 
                                                        onClick={() => handleReturnBook(t.id)} 
                                                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-xs font-semibold"
                                                    >
                                                        Return
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {activeLoans.length === 0 && <tr><td colSpan={5} className="text-center p-4 text-slate-500">No active loans.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'history' && (
                <div className="bg-white p-6 rounded-xl shadow-lg overflow-x-auto">
                    <table className="w-full text-left table-auto">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-4 py-3 font-semibold text-slate-600">Book</th>
                                <th className="px-4 py-3 font-semibold text-slate-600">Borrower</th>
                                <th className="px-4 py-3 font-semibold text-slate-600">Issued</th>
                                <th className="px-4 py-3 font-semibold text-slate-600">Returned</th>
                                <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {libraryTransactions.map(t => (
                                <tr key={t.id} className="border-b border-slate-100">
                                    <td className="px-4 py-2 font-medium">{t.bookTitle}</td>
                                    <td className="px-4 py-2">{t.borrowerName}</td>
                                    <td className="px-4 py-2">{new Date(t.borrowDate).toLocaleDateString()}</td>
                                    <td className="px-4 py-2">{t.returnDate ? new Date(t.returnDate).toLocaleDateString() : '-'}</td>
                                    <td className="px-4 py-2">
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            t.status === LibraryStatus.RETURNED ? 'bg-green-100 text-green-800' :
                                            t.status === LibraryStatus.OVERDUE ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                        }`}>{t.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal isOpen={isBookModalOpen} onClose={() => setIsBookModalOpen(false)} title={editingBook ? "Edit Book" : "Add New Book"}>
                <form onSubmit={handleSaveBook} className="space-y-4">
                    <input name="title" value={newBook.title} onChange={e => setNewBook({...newBook, title: e.target.value})} placeholder="Book Title" className="w-full p-2 border rounded" required />
                    <input name="author" value={newBook.author} onChange={e => setNewBook({...newBook, author: e.target.value})} placeholder="Author" className="w-full p-2 border rounded" required />
                    <div className="grid grid-cols-2 gap-4">
                        <input name="category" value={newBook.category} onChange={e => setNewBook({...newBook, category: e.target.value})} placeholder="Category (e.g. Fiction)" className="w-full p-2 border rounded" required />
                        <input name="isbn" value={newBook.isbn} onChange={e => setNewBook({...newBook, isbn: e.target.value})} placeholder="ISBN (Optional)" className="w-full p-2 border rounded" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-500">Total Copies</label>
                            <input type="number" name="totalQuantity" value={newBook.totalQuantity} onChange={e => setNewBook({...newBook, totalQuantity: parseInt(e.target.value)})} className="w-full p-2 border rounded" required min={1} />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500">Shelf Location</label>
                            <input name="shelfLocation" value={newBook.shelfLocation} onChange={e => setNewBook({...newBook, shelfLocation: e.target.value})} placeholder="e.g. A4" className="w-full p-2 border rounded" />
                        </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="submit" className="px-6 py-2 bg-primary-600 text-white rounded font-bold shadow hover:bg-primary-700">Save Book</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default LibraryView;

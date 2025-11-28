import React, { useState, useMemo } from 'react';
import type { Announcement, NewAnnouncement } from '../../../types';
import Modal from '../common/Modal';
import { useData } from '../../../contexts/DataContext';
import { sendBulkEmail } from '../../../services/emailService';


const CommunicationView: React.FC = () => {
    const { announcements, addAnnouncement, classes, students, currentUser, addNotification } = useData();
    const [activeTab, setActiveTab] = useState('announcement');
    
    // State for announcements
    const [announcementTitle, setAnnouncementTitle] = useState('');
    const [announcementContent, setAnnouncementContent] = useState('');
    const [announcementAudience, setAnnouncementAudience] = useState('all');

    // State for emails
    const [emailSubject, setEmailSubject] = useState('');
    const [emailContent, setEmailContent] = useState('');
    const [emailAudience, setEmailAudience] = useState('all');
    const [isSending, setIsSending] = useState(false);


    const sortedAnnouncements = useMemo(() => {
        return [...announcements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [announcements]);

    const handleSendAnnouncement = (e: React.FormEvent) => {
        e.preventDefault();
        if (!announcementTitle.trim() || !announcementContent.trim() || !currentUser) return;
        const newAnnouncement: NewAnnouncement = {
            title: announcementTitle,
            content: announcementContent,
            date: new Date().toISOString(),
            audience: announcementAudience,
            sentBy: currentUser.name,
        };
        addAnnouncement(newAnnouncement).then(() => {
            setAnnouncementTitle('');
            setAnnouncementContent('');
            setAnnouncementAudience('all');
            addNotification('Announcement sent successfully!', 'success');
            setActiveTab('history');
        });
    };
    
    const handleSendEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!emailSubject.trim() || !emailContent.trim()) {
            addNotification('Email subject and content cannot be empty.', 'error');
            return;
        }

        setIsSending(true);

        const recipients = students
            .filter(s => emailAudience === 'all' || s.classId === emailAudience)
            .map(s => s.guardianEmail)
            .filter((email, index, self) => email && self.indexOf(email) === index); // Get unique, non-empty emails

        if (recipients.length === 0) {
            addNotification('No recipients found for the selected audience.', 'info');
            setIsSending(false);
            return;
        }

        try {
            await sendBulkEmail(recipients, emailSubject, emailContent);
            addNotification(`Email successfully sent to ${recipients.length} guardians.`, 'success');
            setEmailSubject('');
            setEmailContent('');
            setEmailAudience('all');
        } catch (error) {
            addNotification('Failed to send email. Please try again.', 'error');
        } finally {
            setIsSending(false);
        }
    };


    return (
        <div className="p-6 md:p-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Communication Center</h2>
            <div className="border-b border-slate-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button onClick={() => setActiveTab('announcement')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'announcement' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>New Announcement</button>
                    <button onClick={() => setActiveTab('email')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'email' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Send Email</button>
                    <button onClick={() => setActiveTab('history')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'history' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>History</button>
                </nav>
            </div>

            {activeTab === 'announcement' && (
                <div className="bg-white p-6 rounded-xl shadow-lg max-w-2xl mx-auto">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Create Portal Announcement</h3>
                    <form onSubmit={handleSendAnnouncement} className="space-y-4">
                        <input type="text" value={announcementTitle} onChange={e => setAnnouncementTitle(e.target.value)} placeholder="Title" className="w-full p-2 border rounded" required />
                        <textarea value={announcementContent} onChange={e => setAnnouncementContent(e.target.value)} placeholder="Message content..." rows={8} className="w-full p-2 border rounded" required />
                        <select value={announcementAudience} onChange={e => setAnnouncementAudience(e.target.value)} className="w-full p-2 border rounded">
                            <option value="all">All Parents</option>
                            {classes.map(c => <option key={c.id} value={c.id}>Parents of {c.name}</option>)}
                        </select>
                        <div className="flex justify-end">
                            <button type="submit" className="px-6 py-2 bg-primary-600 text-white rounded-lg">Post Announcement</button>
                        </div>
                    </form>
                </div>
            )}
            
            {activeTab === 'email' && (
                 <div className="bg-white p-6 rounded-xl shadow-lg max-w-2xl mx-auto">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Compose Email</h3>
                    <form onSubmit={handleSendEmail} className="space-y-4">
                        <input type="text" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="Subject" className="w-full p-2 border rounded" required />
                        <textarea value={emailContent} onChange={e => setEmailContent(e.target.value)} placeholder="Email body..." rows={8} className="w-full p-2 border rounded" required />
                        <select value={emailAudience} onChange={e => setEmailAudience(e.target.value)} className="w-full p-2 border rounded">
                            <option value="all">All Parents</option>
                            {classes.map(c => <option key={c.id} value={c.id}>Parents of {c.name}</option>)}
                        </select>
                        <div className="flex justify-end">
                            <button type="submit" disabled={isSending} className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:bg-slate-400">
                                {isSending ? 'Sending...' : 'Send Email'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {activeTab === 'history' && (
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Announcement History</h3>
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                        {sortedAnnouncements.map(ann => (
                            <div key={ann.id} className="bg-slate-50 p-4 rounded-lg">
                                <div className="flex justify-between items-center text-sm text-slate-500 mb-1">
                                    <span className="font-semibold text-slate-800">{ann.title}</span>
                                    <span>{new Date(ann.date).toLocaleString()}</span>
                                </div>
                                <p className="text-xs text-slate-500">To: {ann.audience === 'all' ? 'All' : classes.find(c=>c.id === ann.audience)?.name} | By: {ann.sentBy}</p>
                                <p className="text-slate-700 text-sm mt-2">{ann.content}</p>
                            </div>
                        ))}
                         {sortedAnnouncements.length === 0 && <p className="text-center text-slate-500 pt-8">No announcements have been sent yet.</p>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommunicationView;
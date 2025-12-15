
import React, { useState, useMemo } from 'react';
import type { NewAnnouncement } from '../../types';
import { useData } from '../../contexts/DataContext';
import { useQuery } from '@tanstack/react-query';
import * as api from '../../services/api';

const TeacherCommunicationView: React.FC = () => {
    const { addAnnouncement, assignedClass, currentUser } = useData();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    const { data: announcements = [] } = useQuery({
        queryKey: ['announcements'],
        queryFn: () => api.findAllAnnouncements(),
    });

    if (!assignedClass || !currentUser) {
         return (
            <div className="p-8 text-center text-slate-500 bg-white rounded-xl shadow m-8">
                <h3 className="text-xl font-bold mb-2">No Class Assigned</h3>
                <p>You need to be assigned to a class to communicate with parents.</p>
            </div>
        );
    }

    const classAnnouncements = useMemo(() => {
        return announcements
            .filter((ann: any) => ann.audience === assignedClass.id)
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [announcements, assignedClass.id]);

    const handleSendAnnouncement = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            alert("Title and content cannot be empty.");
            return;
        }

        const newAnnouncement: NewAnnouncement = {
            title,
            content,
            date: new Date().toISOString(),
            audience: assignedClass.id,
            sentBy: currentUser.name,
        };

        addAnnouncement(newAnnouncement).then(() => {
            setTitle('');
            setContent('');
            alert("Announcement sent successfully.");
        });
    };

    return (
        <div className="p-6 md:p-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Class Communication</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-bold text-slate-700 mb-4">Send New Announcement to {assignedClass.name}</h3>
                    <form onSubmit={handleSendAnnouncement} className="space-y-4">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-slate-700">Title</label>
                            <input
                                type="text"
                                id="title"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="content" className="block text-sm font-medium text-slate-700">Message</label>
                            <textarea
                                id="content"
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                rows={5}
                                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"
                                required
                            />
                        </div>
                        <div className="text-right">
                            <button type="submit" className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700">
                                Send to Parents
                            </button>
                        </div>
                    </form>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-bold text-slate-700 mb-4">Announcement History</h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {classAnnouncements.length > 0 ? classAnnouncements.map((ann: any) => (
                            <div key={ann.id} className="bg-slate-50 p-4 rounded-lg">
                                <div className="flex justify-between items-center text-sm text-slate-500 mb-1">
                                    <span className="font-semibold text-slate-800">{ann.title}</span>
                                    <span>{new Date(ann.date).toLocaleDateString()}</span>
                                </div>
                                <p className="text-slate-700 text-sm">{ann.content}</p>
                            </div>
                        )) : (
                            <p className="text-center text-slate-500 pt-8">No announcements sent to this class yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherCommunicationView;

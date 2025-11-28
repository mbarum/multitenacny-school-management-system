
import React, { useMemo } from 'react';
import { useData } from '../../contexts/DataContext';

const ParentAnnouncementsView: React.FC = () => {
    const { announcements, parentChildren } = useData();
    
    const relevantAnnouncements = useMemo(() => {
        const childClassIds = new Set(parentChildren.map(child => child.classId));
        return announcements
            .filter(ann => ann.audience === 'all' || childClassIds.has(ann.audience))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [announcements, parentChildren]);

    return (
        <div className="p-6 md:p-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-6">School Announcements</h2>
            <div className="space-y-6">
                {relevantAnnouncements.length > 0 ? (
                    relevantAnnouncements.map(ann => (
                        <div key={ann.id} className="bg-white p-6 rounded-xl shadow-lg">
                            <div className="flex justify-between items-start">
                                <h3 className="text-xl font-bold text-slate-800">{ann.title}</h3>
                                <span className="text-sm text-slate-500">{new Date(ann.date).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-slate-500 mt-1">By: {ann.sentBy}</p>
                            <p className="mt-4 text-slate-700">{ann.content}</p>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 bg-white rounded-xl shadow-lg">
                        <p className="text-slate-500">There are no announcements at this time.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ParentAnnouncementsView;


import React, { useState, useMemo, useEffect } from 'react';
import type { TimetableEntry, SchoolClass, Subject, Staff } from '../types';
import { DayOfWeek } from '../types';
import Modal from '../components/common/Modal';
import { useData } from '../contexts/DataContext';

const TimetableView: React.FC = () => {
    const { timetableEntries, updateTimetable, classes, subjects, staff, classSubjectAssignments } = useData();
    const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);

    const timeSlots = ["08:00", "08:40", "09:20", "10:00", "10:30", "11:10", "11:50", "12:30", "14:00", "14:40", "15:20"];

    const timetableGrid = useMemo(() => {
        const grid: Record<string, Record<string, TimetableEntry | undefined>> = {};
        const classEntries = timetableEntries.filter(e => e.classId === selectedClassId);
        
        timeSlots.forEach(slot => {
            grid[slot] = {};
            Object.values(DayOfWeek).forEach(day => {
                grid[slot][day] = classEntries.find(e => e.startTime === slot && e.day === day);
            });
        });
        return grid;
    }, [selectedClassId, timetableEntries, timeSlots]);

    const handleSaveEntry = (formData: Omit<TimetableEntry, 'id'>) => {
        let updatedEntries;
        if (editingEntry) {
            updatedEntries = timetableEntries.map(e => e.id === editingEntry.id ? { ...editingEntry, ...formData } : e);
        } else {
            updatedEntries = [...timetableEntries, { ...formData, id: `tt-${Date.now()}` }];
        }
        updateTimetable(updatedEntries);
        setIsModalOpen(false);
    };

    return (
        <div className="p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800">Class Timetables</h2>
                <div className="flex items-center space-x-4">
                    <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="p-2 border rounded">
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <button onClick={() => { setEditingEntry(null); setIsModalOpen(true); }} className="px-4 py-2 bg-primary-600 text-white rounded-lg">Add Entry</button>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-slate-50">
                            <th className="p-2 border">Time</th>
                            {Object.values(DayOfWeek).map(day => <th key={day} className="p-2 border">{day}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {timeSlots.map(slot => (
                            <tr key={slot}>
                                <td className="p-2 border font-semibold">{slot}</td>
                                {Object.values(DayOfWeek).map(day => {
                                    const entry = timetableGrid[slot]?.[day];
                                    return (
                                        <td key={day} className="p-1 border text-center align-top h-20" onClick={() => entry && (setEditingEntry(entry), setIsModalOpen(true))}>
                                            {entry && <div className="bg-primary-100 p-2 rounded h-full cursor-pointer">
                                                <p className="font-bold text-primary-800">{subjects.find(s=>s.id === entry.subjectId)?.name}</p>
                                                <p className="text-sm text-slate-600">{staff.find(s=>s.id === entry.teacherId)?.name}</p>
                                            </div>}
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <TimetableEntryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveEntry} data={editingEntry} selectedClassId={selectedClassId} />}
        </div>
    );
};


const TimetableEntryModal: React.FC<any> = ({ isOpen, onClose, onSave, data, selectedClassId }) => {
    const { classes, subjects, staff, classSubjectAssignments } = useData();
    const [formData, setFormData] = useState({
        classId: data?.classId || selectedClassId,
        subjectId: data?.subjectId || '',
        teacherId: data?.teacherId || '',
        day: data?.day || DayOfWeek.Monday,
        startTime: data?.startTime || '08:00',
        endTime: data?.endTime || '08:40',
    });

    const subjectsForClass = useMemo(() => {
        return classSubjectAssignments.filter((a:any) => a.classId === formData.classId).map((a:any) => subjects.find((s:any) => s.id === a.subjectId)).filter(Boolean);
    }, [classSubjectAssignments, formData.classId, subjects]);

    useEffect(() => {
        const assignment = classSubjectAssignments.find((a:any) => a.classId === formData.classId && a.subjectId === formData.subjectId);
        if (assignment) {
            setFormData(prev => ({...prev, teacherId: assignment.teacherId}));
        }
    }, [formData.classId, formData.subjectId, classSubjectAssignments]);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        setFormData(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    return <Modal isOpen={isOpen} onClose={onClose} title={data ? "Edit Entry" : "Add Entry"}>
        <form onSubmit={e => {e.preventDefault(); onSave(formData)}} className="space-y-4">
            <select name="classId" value={formData.classId} onChange={handleChange} className="w-full p-2 border rounded"><option value="">Select Class</option>{classes.map((c:SchoolClass) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <select name="subjectId" value={formData.subjectId} onChange={handleChange} className="w-full p-2 border rounded"><option value="">Select Subject</option>{subjectsForClass.map((s:Subject) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
            <input type="text" value={staff.find((s:Staff) => s.id === formData.teacherId)?.name || 'Auto-assigned'} readOnly className="w-full p-2 border rounded bg-slate-100" />
            <select name="day" value={formData.day} onChange={handleChange} className="w-full p-2 border rounded">{Object.values(DayOfWeek).map(d => <option key={d} value={d}>{d}</option>)}</select>
            <div className="grid grid-cols-2 gap-4">
                <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} className="w-full p-2 border rounded" />
                <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} className="w-full p-2 border rounded" />
            </div>
            <div className="flex justify-end"><button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded">Save</button></div>
        </form>
    </Modal>
}

export default TimetableView;

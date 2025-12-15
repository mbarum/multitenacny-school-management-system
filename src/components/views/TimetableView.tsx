
import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TimetableEntry, SchoolClass, Subject, Staff } from '../../types';
import { DayOfWeek } from '../../types';
import Modal from '../common/Modal';
import { useData } from '../../contexts/DataContext';
import * as api from '../../services/api';

const TimetableView: React.FC = () => {
    const { addNotification } = useData();
    const queryClient = useQueryClient();
    
    // Queries
    const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: () => api.getClasses().then(res => Array.isArray(res) ? res : res.data) });
    const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: () => api.getSubjects().then(res => Array.isArray(res) ? res : res.data) });
    const { data: staff = [] } = useQuery({ queryKey: ['staff'], queryFn: () => api.getStaff() });
    const { data: timetableEntries = [] } = useQuery({ queryKey: ['timetable'], queryFn: () => api.findAllTimetableEntries() });
    const { data: assignments = [] } = useQuery({ queryKey: ['assignments'], queryFn: () => api.findAllAssignments() });

    const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);

    // Update selected class when classes load
    useEffect(() => {
        if (!selectedClassId && classes.length > 0) {
            setSelectedClassId(classes[0].id);
        }
    }, [classes, selectedClassId]);

    const timeSlots = ["08:00", "08:40", "09:20", "10:00", "10:30", "11:10", "11:50", "12:30", "14:00", "14:40", "15:20"];

    const timetableGrid = useMemo(() => {
        const grid: Record<string, Record<string, TimetableEntry | undefined>> = {};
        const classEntries = timetableEntries.filter((e: TimetableEntry) => e.classId === selectedClassId);
        
        timeSlots.forEach(slot => {
            grid[slot] = {};
            Object.values(DayOfWeek).forEach(day => {
                grid[slot][day] = classEntries.find((e: TimetableEntry) => e.startTime === slot && e.day === day);
            });
        });
        return grid;
    }, [selectedClassId, timetableEntries, timeSlots]);

    const mutation = useMutation({
        mutationFn: (entries: TimetableEntry[]) => api.updateTimetable(entries),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['timetable'] });
            setIsModalOpen(false);
            addNotification('Timetable updated', 'success');
        }
    });

    const handleSaveEntry = (formData: Omit<TimetableEntry, 'id'>) => {
        let updatedEntries;
        if (editingEntry) {
            updatedEntries = timetableEntries.map((e: TimetableEntry) => e.id === editingEntry.id ? { ...editingEntry, ...formData } : e);
        } else {
            updatedEntries = [...timetableEntries, { ...formData, id: `tt-${Date.now()}` }];
        }
        mutation.mutate(updatedEntries);
    };

    return (
        <div className="p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800">Class Timetables</h2>
                <div className="flex items-center space-x-4">
                    <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="p-2 border rounded">
                        {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
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
                                            {entry && <div className="bg-primary-100 p-2 rounded h-full cursor-pointer hover:bg-primary-200">
                                                <p className="font-bold text-primary-800">{subjects.find((s:any)=>s.id === entry.subjectId)?.name}</p>
                                                <p className="text-sm text-slate-600">{staff.find((s:any)=>s.id === entry.teacherId)?.name}</p>
                                            </div>}
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <TimetableEntryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveEntry} data={editingEntry} selectedClassId={selectedClassId} classes={classes} subjects={subjects} staff={staff} assignments={assignments} />}
        </div>
    );
};

const TimetableEntryModal: React.FC<any> = ({ isOpen, onClose, onSave, data, selectedClassId, classes, subjects, staff, assignments }) => {
    const [formData, setFormData] = useState({
        classId: data?.classId || selectedClassId,
        subjectId: data?.subjectId || '',
        teacherId: data?.teacherId || '',
        day: data?.day || DayOfWeek.Monday,
        startTime: data?.startTime || '08:00',
        endTime: data?.endTime || '08:40',
    });

    const subjectsForClass = useMemo(() => {
        return assignments.filter((a:any) => a.classId === formData.classId).map((a:any) => subjects.find((s:any) => s.id === a.subjectId)).filter(Boolean);
    }, [assignments, formData.classId, subjects]);

    useEffect(() => {
        const assignment = assignments.find((a:any) => a.classId === formData.classId && a.subjectId === formData.subjectId);
        if (assignment) {
            setFormData(prev => ({...prev, teacherId: assignment.teacherId}));
        }
    }, [formData.classId, formData.subjectId, assignments]);

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

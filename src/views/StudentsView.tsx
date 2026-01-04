
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '../components/common/Modal';
import type { Student, SchoolClass } from '../types';
import { StudentStatus } from '../types';
import { useData } from '../contexts/DataContext';
import Pagination from '../components/common/Pagination';
import Skeleton from '../components/common/Skeleton';
import Spinner from '../components/common/Spinner';
import * as api from '../services/api';

const DEFAULT_AVATAR = 'https://i.imgur.com/S5o7W44.png';

const StudentsView: React.FC = () => {
    const { addNotification, openIdCardModal } = useData();
    const queryClient = useQueryClient();

    // Registry State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClass, setSelectedClass] = useState('all');
    const [page, setPage] = useState(1);
    
    // UI State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Queries
    const { data: classes = [] } = useQuery({
        queryKey: ['classes'],
        queryFn: () => api.getClasses().then((res: any) => res.data || res)
    });

    const { data: registry, isLoading } = useQuery({
        queryKey: ['students', page, searchTerm, selectedClass],
        queryFn: () => api.getStudents({ 
            page, 
            limit: 12, 
            search: searchTerm || undefined, 
            classId: selectedClass !== 'all' ? selectedClass : undefined 
        }),
        placeholderData: (prev) => prev
    });

    const students = registry?.data || [];
    const totalPages = registry?.last_page || 1;

    // Mutations
    const enrollMutation = useMutation({
        mutationFn: api.createStudent,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            setIsAddModalOpen(false);
            addNotification('Student enrolled and billed successfully.', 'success');
            // Reset Form
            setNewStudent({
                name: '', classId: '', guardianName: '', guardianContact: '', 
                guardianEmail: '', guardianAddress: '', emergencyContact: '', dateOfBirth: ''
            });
        },
        onError: (err: any) => addNotification(err.message, 'error')
    });

    const purgeMutation = useMutation({
        mutationFn: api.deleteStudent,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            addNotification('Registry record purged.', 'success');
        }
    });

    const [newStudent, setNewStudent] = useState<any>({
        name: '', 
        classId: '', 
        guardianName: '', 
        guardianContact: '', 
        guardianEmail: '', 
        guardianAddress: '', // Fixed: Added missing field
        emergencyContact: '', // Fixed: Added missing field
        dateOfBirth: ''
    });

    const handleEnroll = (e: React.FormEvent) => {
        e.preventDefault();
        enrollMutation.mutate(newStudent);
    };

    return (
        <div className="p-6 md:p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Registry</h2>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Institutional Student Index</p>
                </div>
                <button onClick={() => setIsAddModalOpen(true)} className="px-6 py-3 bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary-600/30 hover:bg-primary-700 transition-all">
                    Enroll Scholar
                </button>
            </div>

            <div className="bg-white p-4 rounded-[2rem] shadow-xl border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    <input 
                        type="text" 
                        placeholder="Search by name or admission number..." 
                        value={searchTerm} 
                        onChange={e => { setSearchTerm(e.target.value); setPage(1); }} 
                        className="w-full pl-12 pr-4 py-3 border-none rounded-2xl focus:ring-0 font-bold text-slate-700 placeholder:text-slate-300"
                    />
                </div>
                <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setPage(1); }} className="w-full md:w-48 p-3 bg-slate-50 border-none rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500 outline-none">
                    <option value="all">All Grades</option>
                    {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-900 text-white">
                        <tr>
                            <th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest">Scholar Profile</th>
                            <th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest">Index #</th>
                            <th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest">Grade</th>
                            <th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest text-right">Balance</th>
                            <th className="px-8 py-5 font-black uppercase text-[10px] tracking-widest text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}><td colSpan={5} className="px-8 py-6"><Skeleton className="h-10 w-full" /></td></tr>
                            ))
                        ) : students.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-20 text-slate-300 font-black uppercase tracking-widest">No scholars found.</td></tr>
                        ) : students.map((s: Student) => (
                            <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                        <img src={s.profileImage || DEFAULT_AVATAR} className="h-12 w-12 rounded-2xl object-cover border-2 border-white shadow-md" />
                                        <div>
                                            <div className="font-black text-slate-800 text-lg leading-none">{s.name}</div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">{s.guardianName}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-5 font-mono text-xs font-black text-primary-600">{s.admissionNumber}</td>
                                <td className="px-8 py-5 font-bold text-slate-600">{s.class}</td>
                                <td className={`px-8 py-5 text-right font-black text-xl ${(s as any).balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {((s as any).balance || 0).toLocaleString()}
                                </td>
                                <td className="px-8 py-5 text-center space-x-2">
                                    <button onClick={() => openIdCardModal(s, 'student')} className="p-2 text-slate-300 hover:text-primary-600 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 012-2h2a2 2 0 012 2v1m-4 0h4m-4 5a2 2 0 100 4 2 2 0 000-4z"/></svg></button>
                                    <button onClick={() => {if(confirm('Purge from registry?')) purgeMutation.mutate(s.id)}} className="p-2 text-slate-300 hover:text-red-600 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Registry Enrollment" size="lg">
                <form onSubmit={handleEnroll} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Legal Name</label>
                            <input value={newStudent.name} onChange={e=>setNewStudent({...newStudent, name: e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold bg-slate-50 outline-none focus:border-primary-500" required/>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Grade</label>
                            <select value={newStudent.classId} onChange={e=>setNewStudent({...newStudent, classId: e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold bg-slate-50 outline-none focus:border-primary-500" required>
                                <option value="">Select Grade...</option>
                                {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date of Birth</label>
                        <input type="date" value={newStudent.dateOfBirth} onChange={e=>setNewStudent({...newStudent, dateOfBirth: e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold bg-slate-50 outline-none focus:border-primary-500" required/>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-6">Guardian & Emergency Details</h4>
                        <div className="grid grid-cols-2 gap-6">
                             <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Guardian Name</label>
                                <input value={newStudent.guardianName} onChange={e=>setNewStudent({...newStudent, guardianName: e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold bg-slate-50" required/>
                             </div>
                             <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                                <input value={newStudent.guardianContact} onChange={e=>setNewStudent({...newStudent, guardianContact: e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold bg-slate-50" required/>
                             </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6 mt-4">
                             <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                                <input type="email" value={newStudent.guardianEmail} onChange={e=>setNewStudent({...newStudent, guardianEmail: e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold bg-slate-50" required/>
                             </div>
                             <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Emergency Contact</label>
                                <input value={newStudent.emergencyContact} onChange={e=>setNewStudent({...newStudent, emergencyContact: e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold bg-slate-50" placeholder="Alternative Phone" required/>
                             </div>
                        </div>
                        <div className="space-y-1 mt-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Residential Address</label>
                            <input value={newStudent.guardianAddress} onChange={e=>setNewStudent({...newStudent, guardianAddress: e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold bg-slate-50" placeholder="e.g. Apartment, Estate, House #" required/>
                        </div>
                    </div>
                    <div className="flex justify-end pt-4 gap-4">
                        <button type="button" onClick={()=>setIsAddModalOpen(false)} className="px-8 py-4 font-black text-[10px] uppercase text-slate-400">Cancel</button>
                        <button type="submit" disabled={enrollMutation.isPending} className="px-12 py-4 bg-primary-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary-500/30">
                            {enrollMutation.isPending ? <Spinner /> : 'Complete Enrollment'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default StudentsView;

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  UserCheck, 
  Users, 
  Calendar, 
  MapPin, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronRight,
  ArrowRight,
  FileText
} from 'lucide-react';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  registrationNumber: string;
}

interface ClassLevel {
  id: string;
  name: string;
}

interface Section {
  id: string;
  name: string;
  classLevelId: string;
}

const AttendancePage: React.FC = () => {
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    try {
      const [classesRes, sectionsRes] = await Promise.all([
        api.get('/academics/class-levels'),
        api.get('/academics/sections'),
      ]);
      setClassLevels(classesRes.data);
      setSections(sectionsRes.data);
    } catch (error) {
      console.error('Failed to fetch metadata', error);
    }
  };

  const fetchStudents = async () => {
    if (!selectedClass || !selectedSection) {
      toast.error('Please select both Class and Section');
      return;
    }
    setLoading(true);
    try {
      const response = await api.get(`/students?classLevelId=${selectedClass}&sectionId=${selectedSection}`);
      setStudents(response.data);
      // Initialize attendance state
      const initialAttendance: Record<string, string> = {};
      response.data.forEach((s: Student) => {
        initialAttendance[s.id] = 'present';
      });
      setAttendance(initialAttendance);
    } catch (error) {
      console.error('Failed to fetch students', error);
      toast.error('Failed to load student roster');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const saveAttendance = async () => {
    setSubmitting(true);
    try {
      const payload = Object.entries(attendance).map(([studentId, status]) => ({
        studentId,
        status,
        date,
        classLevelId: selectedClass,
        sectionId: selectedSection,
      }));
      await api.post('/attendance/bulk', { records: payload });
      toast.success('Attendance records synchronized successfully');
    } catch (error) {
      console.error('Failed to save attendance', error);
      toast.error('Synchronization failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas pb-24 font-sans selection:bg-primary/10 selection:text-primary">
      <div className="max-w-7xl mx-auto px-8 pt-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
           <div>
              <div className="inline-flex items-center space-x-2 text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] mb-4">
                 <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                 <span>Attendance Terminal: ACTIVE</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-on-surface tracking-tighter leading-[0.9] mb-4 uppercase italic">
                Daily <span className="text-slate-300 dark:text-slate-700 block md:inline font-normal">Register</span>
              </h1>
              <p className="text-slate-500 text-sm font-bold tracking-tight">
                Authoritative record of student presence and academic participation.
              </p>
           </div>

           <div className="flex flex-wrap gap-4 items-end bg-surface border border-border-muted p-6 rounded-[2rem] shadow-sm">
              <div className="flex flex-col gap-2">
                 <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Target Date</label>
                 <input 
                  type="date" 
                  className="bg-canvas border border-border-muted rounded-xl px-4 py-2 text-[10px] font-black outline-none focus:ring-2 focus:ring-rose-500/20"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                 />
              </div>
              <div className="flex flex-col gap-2">
                 <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Class Level</label>
                 <select 
                  className="bg-canvas border border-border-muted rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-rose-500/20"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                 >
                    <option value="">Select Level</option>
                    {classLevels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
              </div>
              <div className="flex flex-col gap-2">
                 <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Section</label>
                 <select 
                  className="bg-canvas border border-border-muted rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-rose-500/20"
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  disabled={!selectedClass}
                 >
                    <option value="">Select Room</option>
                    {sections.filter(s => s.classLevelId === selectedClass).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                 </select>
              </div>
              <button 
                onClick={fetchStudents}
                disabled={loading}
                className="bg-slate-900 dark:bg-rose-600 text-white h-10 px-6 rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50"
              >
                {loading ? 'SCALING...' : 'LOAD ROSTER'}
              </button>
           </div>
        </header>

        <main>
           {students.length > 0 ? (
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-surface border border-border-muted rounded-[2.5rem] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] overflow-hidden"
             >
                <div className="p-8 border-b border-border-muted flex items-center justify-between">
                   <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center shadow-inner">
                         <Users size={20} />
                      </div>
                      <div>
                         <h3 className="text-lg font-black text-on-surface uppercase italic tracking-tighter leading-none mb-1">Class Roster</h3>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{students.length} Students Registered</p>
                      </div>
                   </div>
                   <div className="flex gap-2">
                       <span className="flex items-center gap-2 text-[9px] font-black text-emerald-500 uppercase tracking-widest px-4 py-1.5 bg-emerald-500/10 rounded-lg">
                          <CheckCircle2 size={12} />
                          {Object.values(attendance).filter(s => s === 'present').length} Present
                       </span>
                       <span className="flex items-center gap-2 text-[9px] font-black text-rose-500 uppercase tracking-widest px-4 py-1.5 bg-rose-500/10 rounded-lg">
                          <XCircle size={12} />
                          {Object.values(attendance).filter(s => s === 'absent').length} Absent
                       </span>
                   </div>
                </div>

                <div className="grid grid-cols-1 gap-px bg-border-muted/20">
                   {students.map((student, i) => (
                     <div key={student.id} className="bg-surface p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors group">
                        <div className="flex items-center gap-5 mb-4 sm:mb-0">
                           <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-400 flex items-center justify-center text-xs font-black uppercase italic group-hover:rotate-6 transition-transform">
                              {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                           </div>
                           <div>
                              <h4 className="text-sm font-black text-on-surface uppercase tracking-tight italic leading-none mb-1 group-hover:text-rose-600 transition-colors">{student.firstName} {student.lastName}</h4>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest tracking-tighter">{student.registrationNumber || `REG-${student.id.slice(0, 5)}`}</p>
                           </div>
                        </div>

                        <div className="flex p-1 bg-canvas border border-border-muted rounded-2xl">
                           {[
                             { id: 'present', label: 'Present', color: 'bg-emerald-500', text: 'text-emerald-500' },
                             { id: 'absent', label: 'Absent', color: 'bg-rose-500', text: 'text-rose-500' },
                             { id: 'late', label: 'Late', color: 'bg-amber-500', text: 'text-amber-500' }
                           ].map((status) => (
                             <button
                               key={status.id}
                               onClick={() => handleStatusChange(student.id, status.id)}
                               className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                 attendance[student.id] === status.id 
                                 ? `${status.color} text-white shadow-lg` 
                                 : 'text-slate-400 hover:text-slate-600'
                               }`}
                             >
                               {status.label}
                             </button>
                           ))}
                        </div>
                     </div>
                   ))}
                </div>

                <div className="p-10 bg-slate-50 dark:bg-slate-900/50 border-t border-border-muted flex flex-col md:flex-row justify-between items-center gap-8">
                   <div className="flex items-center gap-4 text-slate-400 max-w-sm">
                      <Clock size={16} />
                      <p className="text-[10px] font-bold uppercase tracking-widest leading-loose">
                         Once submitted, these records will be synchronized with the master academic database and parent portals.
                      </p>
                   </div>
                   <button 
                    onClick={saveAttendance}
                    disabled={submitting}
                    className="bg-slate-900 dark:bg-rose-600 text-white h-14 px-12 rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 group relative overflow-hidden"
                   >
                     {submitting ? (
                        'SYNCHRONIZING...'
                     ) : (
                       <>
                         Confirm & Synchronize
                         <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                            <ArrowRight size={14} />
                         </div>
                       </>
                     )}
                   </button>
                </div>
             </motion.div>
           ) : (
             <div className="h-96 flex flex-col items-center justify-center border border-dashed border-border-muted rounded-[3rem]">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center text-slate-300 mb-4 shadow-inner">
                   <FileText size={24} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic mb-1">Roster Empty</p>
                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em]">Select class and section to begin roll call</p>
             </div>
           )}
        </main>
      </div>
    </div>
  );
};

export default AttendancePage;

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
               <div className="inline-flex items-center space-x-2 text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                 <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                 <span>Student Attendance</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-on-surface tracking-tight mb-2">
                Daily Register
              </h1>
              <p className="text-slate-500 text-sm">
                Official record of student presence and academic participation.
              </p>
           </div>

           <div className="flex flex-wrap gap-4 items-end bg-surface border border-border-muted p-5 rounded-2xl shadow-sm">
              <div className="flex flex-col gap-1.5">
                 <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Target Date</label>
                 <input 
                  type="date" 
                  className="bg-canvas border border-border-muted rounded-lg px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                 />
              </div>
              <div className="flex flex-col gap-1.5">
                 <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Class Level</label>
                 <select 
                  className="bg-canvas border border-border-muted rounded-lg px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                 >
                    <option value="">Select Level</option>
                    {classLevels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
              </div>
              <div className="flex flex-col gap-1.5">
                 <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Section</label>
                 <select 
                  className="bg-canvas border border-border-muted rounded-lg px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20"
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
                className="bg-primary text-white h-10 px-6 rounded-lg font-bold text-xs tracking-wider flex items-center gap-2 hover:bg-primary-dark transition-all shadow-sm disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load Roster'}
              </button>
           </div>
        </header>

        <main>
           {students.length > 0 ? (
             <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-surface border border-border-muted rounded-xl shadow-sm overflow-hidden"
             >
                <div className="p-6 border-b border-border-muted flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                         <Users size={18} />
                      </div>
                      <div>
                         <h3 className="text-lg font-bold text-on-surface">Class Roster</h3>
                         <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{students.length} Students</p>
                      </div>
                   </div>
                   <div className="flex gap-2">
                       <span className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-wider px-3 py-1 bg-emerald-50 rounded-lg">
                          <CheckCircle2 size={12} />
                          {Object.values(attendance).filter(s => s === 'present').length} Present
                       </span>
                       <span className="flex items-center gap-2 text-[10px] font-bold text-rose-600 uppercase tracking-wider px-3 py-1 bg-rose-50 rounded-lg">
                          <XCircle size={12} />
                          {Object.values(attendance).filter(s => s === 'absent').length} Absent
                       </span>
                   </div>
                </div>

                <div className="divide-y divide-border-muted/50">
                   {students.map((student, i) => (
                     <div key={student.id} className="bg-surface p-5 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 transition-colors group">
                        <div className="flex items-center gap-4 mb-4 sm:mb-0">
                           <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-semibold">
                              {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                           </div>
                           <div>
                              <h4 className="text-sm font-bold text-on-surface mb-0.5">{student.firstName} {student.lastName}</h4>
                              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{student.registrationNumber || `REG-${student.id.slice(0, 5)}`}</p>
                           </div>
                        </div>

                        <div className="flex p-1 bg-slate-50 border border-border-muted rounded-xl">
                           {[
                             { id: 'present', label: 'Present', color: 'bg-emerald-600', text: 'text-emerald-600' },
                             { id: 'absent', label: 'Absent', color: 'bg-rose-600', text: 'text-rose-600' },
                             { id: 'late', label: 'Late', color: 'bg-amber-600', text: 'text-amber-600' }
                           ].map((status) => (
                             <button
                               key={status.id}
                               onClick={() => handleStatusChange(student.id, status.id)}
                               className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                 attendance[student.id] === status.id 
                                 ? `${status.color} text-white shadow-sm` 
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

                <div className="p-8 bg-slate-50/50 border-t border-border-muted flex flex-col md:flex-row justify-between items-center gap-6">
                   <div className="flex items-center gap-3 text-slate-400">
                      <Clock size={16} />
                      <p className="text-xs font-medium">
                         Records will be synced with student profiles and parent portals.
                      </p>
                   </div>
                   <button 
                    onClick={saveAttendance}
                    disabled={submitting}
                    className="bg-primary text-white h-12 px-10 rounded-xl font-bold text-sm tracking-wide shadow-lg hover:bg-primary-dark transition-all flex items-center gap-2"
                   >
                     {submitting ? 'Saving...' : 'Save Attendance'}
                     {!submitting && <ArrowRight size={16} />}
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

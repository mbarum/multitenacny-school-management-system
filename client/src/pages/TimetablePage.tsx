import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Book, 
  MapPin, 
  User, 
  Calendar, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  ArrowUpRight,
  Printer,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

interface TimetableEntry {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  subject: { name: string };
  room: string;
  teacher?: { name: string };
  classLevel: string;
}

const TimetablePage: React.FC = () => {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [classLevels, setClassLevels] = useState<{ id: string, name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'
  ];

  useEffect(() => {
    fetchClassLevels();
  }, []);

  const fetchClassLevels = async () => {
    try {
      const response = await api.get('/academics/class-levels');
      setClassLevels(response.data);
    } catch (error) {
      console.error('Failed to fetch class levels', error);
    }
  };

  const fetchTimetable = async () => {
    if (!selectedClass) {
      toast.error('Please select a class focus');
      return;
    }
    setLoading(true);
    try {
      // Corrected to expect dayOfWeek from backend
      const response = await api.get(`/timetable?classLevelId=${selectedClass}`);
      setTimetable(response.data);
    } catch (error) {
      console.error('Failed to fetch timetable', error);
      toast.error('Failed to load scheduling data');
    } finally {
      setLoading(false);
    }
  };

  const getEntry = (day: string, time: string) => {
    return timetable.find(e => 
      e.dayOfWeek.toLowerCase() === day.toLowerCase() && 
      e.startTime.startsWith(time.split(':')[0])
    );
  };

  return (
    <div className="min-h-screen bg-canvas pb-24 font-sans selection:bg-primary/10 selection:text-primary">
      <div className="max-w-7xl mx-auto px-8 pt-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
           <div>
              <div className="inline-flex items-center space-x-2 text-[10px] font-black text-violet-500 uppercase tracking-[0.3em] mb-4">
                 <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
                 <span>Scheduling Matrix</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-on-surface tracking-tighter leading-[0.9] mb-4 uppercase italic">
                Academic <span className="text-slate-300 dark:text-slate-700 block md:inline font-normal">Routine</span>
              </h1>
              <p className="text-slate-500 text-sm font-bold tracking-tight">
                Master timetable for departmental resource allocation and academic flow.
              </p>
           </div>

           <div className="flex flex-wrap gap-4 items-end bg-surface border border-border-muted p-6 rounded-[2rem] shadow-sm">
              <div className="flex flex-col gap-2">
                 <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Class Focus</label>
                 <select 
                  className="bg-canvas border border-border-muted rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-violet-500/20"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                 >
                    <option value="">Select Level</option>
                    {classLevels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
              </div>
              <button 
                onClick={fetchTimetable}
                disabled={loading || !selectedClass}
                className="bg-slate-900 dark:bg-violet-600 text-white h-10 px-8 rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50"
              >
                {loading ? 'COMPUTING...' : 'SYNC SCHEDULE'}
              </button>
           </div>
        </header>

        <main>
           <div className="bg-surface border border-border-muted rounded-[2.5rem] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] overflow-hidden">
              {/* Table Header - Days */}
              <div className="grid grid-cols-6 border-b border-border-muted bg-slate-50/50 dark:bg-slate-900/10">
                 <div className="p-8 border-r border-border-muted flex items-center justify-center italic text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    Time / Day
                 </div>
                 {days.map(day => (
                   <div key={day} className="p-8 text-center font-black text-on-surface uppercase italic tracking-widest text-[11px] border-r border-border-muted last:border-r-0">
                     {day}
                   </div>
                 ))}
              </div>

              {/* Matrix Rows */}
              <div className="divide-y divide-border-muted/30">
                 {timeSlots.map((time, idx) => (
                   <div key={time} className="grid grid-cols-6 group">
                      <div className="p-8 bg-slate-50/20 dark:bg-slate-900/5 border-r border-border-muted flex flex-col items-center justify-center">
                         <span className="text-[11px] font-black pointer-events-none text-slate-400 dark:text-slate-600 tabular-nums">{time}</span>
                         <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-1">
                           {parseInt(time) >= 12 ? 'PM' : 'AM'}
                         </span>
                      </div>
                      {days.map(day => {
                        const entry = getEntry(day, time);
                        return (
                          <div key={`${day}-${time}`} className="p-2 border-r border-border-muted last:border-r-0 min-h-[140px] relative transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/20">
                            {entry ? (
                              <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="h-full bg-surface border border-border-muted p-5 rounded-2xl shadow-sm hover:shadow-xl hover:border-violet-500/30 transition-all group/entry cursor-pointer overflow-hidden"
                              >
                                <div className="absolute top-0 right-0 w-12 h-12 bg-violet-500/5 rounded-full blur-xl opacity-0 group-hover/entry:opacity-100 transition-opacity" />
                                <p className="text-[9px] font-black text-violet-500 uppercase tracking-[0.2em] mb-2 leading-none">
                                  {entry.subject.name}
                                </p>
                                <div className="space-y-3">
                                   <div className="flex items-center gap-2 text-[10px] text-on-surface font-black italic tracking-tighter">
                                      <MapPin size={10} className="text-slate-300" />
                                      {entry.room}
                                   </div>
                                   {entry.teacher && (
                                     <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 truncate">
                                        <User size={10} className="text-slate-300" />
                                        {entry.teacher.name}
                                     </div>
                                   )}
                                </div>
                                <div className="absolute bottom-4 right-4 opacity-0 group-hover/entry:opacity-100 transition-opacity translate-x-4 group-hover/entry:translate-x-0 transition-transform">
                                   <ArrowUpRight size={14} className="text-violet-500" />
                                </div>
                              </motion.div>
                            ) : (
                              <div className="h-full flex items-center justify-center opacity-[0.03]">
                                 <Book size={24} className="text-on-surface" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                   </div>
                 ))}
              </div>
           </div>

           {/* Quick Actions Footer */}
           <div className="mt-12 flex justify-between items-center bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
              <div className="flex items-center gap-6">
                 <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary">
                    <Printer size={20} />
                 </div>
                 <div>
                    <h4 className="text-sm font-black uppercase italic tracking-tighter leading-none mb-1">Print Manifest</h4>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Hard copies for departmental display</p>
                 </div>
              </div>
              <button 
                onClick={() => window.print()}
                className="bg-white/10 hover:bg-white/20 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all active:scale-95"
              >
                Launch Printer Interaction
              </button>
           </div>
        </main>
      </div>
    </div>
  );
};

export default TimetablePage;

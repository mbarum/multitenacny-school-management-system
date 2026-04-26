import React, { useState, useEffect } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  isToday
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Tag, 
  X,
  Bell,
  MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { toast } from 'sonner';

interface SchoolEvent {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  category: 'academic' | 'holiday' | 'exam' | 'event';
  location?: string;
}

const CalendarPage: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    endDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    category: 'event' as SchoolEvent['category'],
    location: ''
  });

  useEffect(() => {
    fetchEvents();
  }, [currentMonth]);

  const fetchEvents = async () => {
    try {
      // In a real app, we'd fetch events for the current month/year
      const response = await api.get('/communication/announcements'); 
      // Mapping announcements to events for now as a fallback
      const mappedEvents = response.data.map((a: any) => ({
        id: a.id,
        title: a.title,
        description: a.content,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        category: a.category === 'emergency' ? 'exam' : 'academic'
      }));
      setEvents(mappedEvents);
    } catch (error) {
      console.error('Failed to fetch events', error);
    } finally {
      setLoading(false);
    }
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const onDateClick = (day: Date) => setSelectedDate(day);

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(new Date(event.startDate), date));
  };

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-4xl font-black text-on-surface tracking-tighter uppercase italic leading-none mb-2">
          School <span className="text-slate-300 dark:text-slate-700">Calendar</span>
        </h1>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] italic">
          {format(currentMonth, 'MMMM yyyy')}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex bg-surface border border-border-muted rounded-2xl overflow-hidden shadow-sm">
          <button onClick={prevMonth} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-r border-border-muted text-slate-400">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => setCurrentMonth(new Date())} className="px-6 text-[10px] font-black uppercase tracking-widest text-on-surface hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Today
          </button>
          <button onClick={nextMonth} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-l border-border-muted text-slate-400">
            <ChevronRight size={18} />
          </button>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-white h-12 px-6 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl flex items-center hover:scale-105 transition-all active:scale-95 gap-2"
        >
          <Plus size={16} />
          Add Event
        </button>
      </div>
    </div>
  );

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 mb-4">
        {days.map((day, i) => (
          <div key={i} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, 'd');
        const cloneDay = day;
        const dayEvents = getEventsForDate(day);
        
        days.push(
          <div
            key={day.toString()}
            className={`min-h-[120px] p-2 border border-border-muted/30 transition-all cursor-pointer relative group ${
              !isSameMonth(day, monthStart) ? 'bg-slate-50/30 dark:bg-slate-900/10 opacity-30 pointer-events-none' : 'bg-surface hover:bg-slate-50 dark:hover:bg-slate-800/30'
            } ${isSameDay(day, selectedDate) ? 'ring-2 ring-inset ring-primary z-10' : ''}`}
            onClick={() => onDateClick(cloneDay)}
          >
            <div className="flex justify-between items-start">
               <span className={`text-[10px] font-black p-1.5 rounded-lg w-7 h-7 flex items-center justify-center ${
                 isToday(day) ? 'bg-primary text-white' : 'text-slate-400 dark:text-slate-600'
               }`}>
                 {formattedDate}
               </span>
               {dayEvents.length > 0 && (
                 <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
               )}
            </div>
            
            <div className="mt-2 space-y-1">
              {dayEvents.slice(0, 2).map((event, idx) => (
                <div 
                  key={idx} 
                  className={`px-2 py-1 rounded-md text-[8px] font-bold uppercase tracking-tight truncate border ${
                    event.category === 'academic' ? 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-500/20' :
                    event.category === 'exam' ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:border-rose-500/20' :
                    event.category === 'holiday' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-500/20' :
                    'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                  }`}
                >
                  {event.title}
                </div>
              ))}
              {dayEvents.length > 2 && (
                <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest pl-1">
                  + {dayEvents.length - 2} more
                </div>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="bg-surface rounded-3xl border border-border-muted overflow-hidden shadow-2xl">{rows}</div>;
  };

  const renderSidebar = () => {
    const selectedDateEvents = getEventsForDate(selectedDate);
    
    return (
      <div className="lg:col-span-4 flex flex-col gap-8">
        <div className="p-8 bg-surface border border-border-muted rounded-[2.5rem] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-border-muted">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Schedule for</p>
              <h3 className="text-xl font-black text-on-surface uppercase italic tracking-tighter leading-none">
                {format(selectedDate, 'MMM do, yyyy')}
              </h3>
            </div>
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
               <Clock size={18} />
            </div>
          </div>

          <div className="space-y-6">
            {selectedDateEvents.length > 0 ? (
              selectedDateEvents.map((event, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={event.id}
                  className="group relative pl-6 border-l-2 border-primary/20 hover:border-primary transition-colors py-1"
                >
                  <div className="flex items-start justify-between">
                     <div>
                        <div className="flex items-center gap-2 mb-2">
                           <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                             event.category === 'academic' ? 'bg-indigo-500 text-white' :
                             event.category === 'exam' ? 'bg-rose-500 text-white' :
                             event.category === 'holiday' ? 'bg-emerald-500 text-white' :
                             'bg-slate-500 text-white'
                           }`}>
                             {event.category}
                           </span>
                           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">08:00 AM</span>
                        </div>
                        <h4 className="text-sm font-black text-on-surface uppercase tracking-tight italic group-hover:text-primary transition-colors leading-none mb-2">
                          {event.title}
                        </h4>
                        <p className="text-[11px] font-medium text-slate-500 line-clamp-2 mb-3">
                          {event.description}
                        </p>
                        {event.location && (
                          <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">
                            <MapPin size={10} />
                            {event.location}
                          </div>
                        )}
                     </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-12 flex flex-col items-center text-center">
                 <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center text-slate-300 mb-4 shadow-inner">
                    <CalendarIcon size={24} />
                 </div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic mb-1">Clear Horizon</p>
                 <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em]">No scheduled events found</p>
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="p-8 bg-slate-900 border border-white/5 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px]" />
           <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] italic mb-6 relative z-10">Calendar Legend</h4>
           <div className="space-y-4 relative z-10">
              {[
                { label: 'Exams & Tests', color: 'bg-rose-500' },
                { label: 'Academic Term', color: 'bg-indigo-500' },
                { label: 'Public Holidays', color: 'bg-emerald-500' },
                { label: 'General Events', color: 'bg-slate-500' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                   <div className={`w-2 h-2 rounded-full ${item.color} shadow-[0_0_10px_rgba(255,255,255,0.2)]`} />
                   <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{item.label}</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-canvas pb-24 font-sans selection:bg-primary/10 selection:text-primary">
      <div className="max-w-7xl mx-auto px-8 pt-12">
        {renderHeader()}
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Calendar View */}
          <div className="lg:col-span-8">
            {renderDays()}
            {loading ? (
              <div className="bg-surface rounded-3xl border border-border-muted h-[600px] flex items-center justify-center">
                 <div className="flex flex-col items-center">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="text-primary mb-4">
                       <CalendarIcon size={32} />
                    </motion.div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Synchronizing Events...</p>
                 </div>
              </div>
            ) : renderCells()}
          </div>

          {/* Sidebar */}
          {renderSidebar()}
        </div>
      </div>

      {/* Modal would go here */}
    </div>
  );
};

export default CalendarPage;

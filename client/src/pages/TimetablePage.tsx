import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { motion } from 'framer-motion';

interface TimetableEntry {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: { name: string };
  room: string;
}

const TimetablePage: React.FC = () => {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [classLevels, setClassLevels] = useState<{ id: string, name: string }[]>([]);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'
  ];

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await api.get('/academics/class-levels');
      setClassLevels(response.data);
    } catch (error) {
      console.error('Failed to fetch classes', error);
    }
  };

  const fetchTimetable = async () => {
    if (!selectedClass) return;
    try {
      const response = await api.get(`/timetable?classLevelId=${selectedClass}`);
      setTimetable(response.data);
    } catch (error) {
      console.error('Failed to fetch timetable', error);
    }
  };

  const getEntry = (day: string, time: string) => {
    return timetable.find(e => e.day === day && e.startTime.startsWith(time));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Academic Timetable</h1>
            <p className="text-gray-500 mt-2">Weekly schedule for classes and subjects.</p>
          </div>
          <div className="flex space-x-4 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Class Level</label>
              <select
                className="w-48 border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">Select Class</option>
                {classLevels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <button
              onClick={fetchTimetable}
              className="bg-black text-white px-8 py-2 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-gray-800 transition-all"
            >
              View Schedule
            </button>
          </div>
        </header>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-6 border-b border-gray-100">
            <div className="p-6 bg-gray-50 border-r border-gray-100"></div>
            {days.map(day => (
              <div key={day} className="p-6 text-center font-bold text-gray-800 border-r border-gray-100 last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {timeSlots.map(time => (
            <div key={time} className="grid grid-cols-6 border-b border-gray-100 last:border-b-0">
              <div className="p-6 bg-gray-50 border-r border-gray-100 text-xs font-bold text-gray-400 flex items-center justify-center">
                {time}
              </div>
              {days.map(day => {
                const entry = getEntry(day, time);
                return (
                  <div key={`${day}-${time}`} className="p-4 border-r border-gray-100 last:border-r-0 min-h-[100px]">
                    {entry ? (
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="h-full bg-blue-50 border-l-4 border-blue-500 p-3 rounded-lg"
                      >
                        <p className="text-xs font-bold text-blue-700 uppercase tracking-tight mb-1">
                          {entry.subject.name}
                        </p>
                        <p className="text-[10px] text-blue-400 font-medium">Room: {entry.room}</p>
                      </motion.div>
                    ) : (
                      <div className="h-full border-2 border-dashed border-gray-50 rounded-lg"></div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimetablePage;

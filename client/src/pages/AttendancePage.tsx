import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { motion } from 'framer-motion';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
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
    if (!selectedClass || !selectedSection) return;
    try {
      const response = await api.get(`/students?classLevelId=${selectedClass}&sectionId=${selectedSection}`);
      setStudents(response.data);
      // Initialize attendance state
      const initialAttendance: Record<string, string> = {};
      response.data.forEach((s: Student) => {
        initialAttendance[s.id] = 'Present';
      });
      setAttendance(initialAttendance);
    } catch (error) {
      console.error('Failed to fetch students', error);
    }
  };

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const saveAttendance = async () => {
    try {
      const payload = Object.entries(attendance).map(([studentId, status]) => ({
        studentId,
        status,
        date,
        classLevelId: selectedClass,
        sectionId: selectedSection,
      }));
      await api.post('/attendance/bulk', { records: payload });
      alert('Attendance saved successfully!');
    } catch (error) {
      console.error('Failed to save attendance', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Attendance Register</h1>
          <p className="text-gray-500 mt-2">Track daily student presence and participation.</p>
        </header>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 flex flex-wrap gap-4 items-end">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Date</label>
            <input
              type="date"
              className="w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Class</label>
            <select
              className="w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">Select Class</option>
              {classLevels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Section</label>
            <select
              className="w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
            >
              <option value="">Select Section</option>
              {sections.filter(s => s.classLevelId === selectedClass).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchStudents}
            className="bg-black text-white px-8 py-2 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-gray-800 transition-all"
          >
            Load Register
          </button>
        </div>

        {students.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-xs font-bold uppercase tracking-widest text-gray-400">Student Name</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-widest text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="border-t border-gray-100">
                    <td className="p-4 font-medium text-gray-800">{student.firstName} {student.lastName}</td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        {['Present', 'Absent', 'Late'].map((status) => (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(student.id, status)}
                            className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${
                              attendance[student.id] === status
                                ? status === 'Present' ? 'bg-green-500 text-white' : status === 'Absent' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-6 bg-gray-50 flex justify-end">
              <button
                onClick={saveAttendance}
                className="bg-blue-600 text-white px-10 py-3 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
              >
                Submit Attendance
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AttendancePage;

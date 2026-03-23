import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { motion } from 'framer-motion';

interface AcademicYear {
  id: string;
  name: string;
  isCurrent: boolean;
}

interface Section {
  id: string;
  name: string;
  room: string;
}

interface ClassLevel {
  id: string;
  name: string;
  sections: Section[];
}

const ClassManagementPage: React.FC = () => {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([]);
  const [newYearName, setNewYearName] = useState('');
  const [newClassName, setNewClassName] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [yearsRes, classesRes] = await Promise.all([
        api.get('/academics/academic-years'),
        api.get('/academics/class-levels'),
      ]);
      setAcademicYears(yearsRes.data);
      setClassLevels(classesRes.data);
    } catch (error) {
      console.error('Failed to fetch academic data', error);
    }
  };

  const handleAddYear = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/academics/academic-years', {
        name: newYearName,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 31536000000).toISOString(),
      });
      setNewYearName('');
      fetchData();
    } catch (error) {
      console.error('Failed to add academic year', error);
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/academics/class-levels', { name: newClassName });
      setNewClassName('');
      fetchData();
    } catch (error) {
      console.error('Failed to add class level', error);
    }
  };

  const handleSetCurrentYear = async (id: string) => {
    try {
      await api.patch(`/academics/academic-years/${id}/set-current`);
      fetchData();
    } catch (error) {
      console.error('Failed to set current year', error);
    }
  };

  const handleAddStream = async (classLevelId: string) => {
    const streamName = window.prompt('Enter stream name (e.g. North, Blue, A):');
    if (!streamName) return;

    try {
      await api.post('/academics/sections', {
        name: streamName,
        classLevelId,
      });
      fetchData();
    } catch (error) {
      console.error('Failed to add stream', error);
      alert('Failed to add stream');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Academic Structure</h1>
          <p className="text-gray-500 mt-2">Manage academic years, class levels, and streams.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Academic Years */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <span className="w-2 h-6 bg-blue-500 rounded-full mr-3"></span>
              Academic Years
            </h2>
            <form onSubmit={handleAddYear} className="mb-6 flex space-x-2">
              <input
                type="text"
                placeholder="e.g. 2024/2025"
                className="flex-1 px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={newYearName}
                onChange={(e) => setNewYearName(e.target.value)}
              />
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-blue-700 transition-colors">
                Add
              </button>
            </form>
            <div className="space-y-3">
              {academicYears.map((year) => (
                <div key={year.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <span className="font-semibold text-gray-800">{year.name}</span>
                    {year.isCurrent && (
                      <span className="ml-3 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                        Current
                      </span>
                    )}
                  </div>
                  {!year.isCurrent && (
                    <button
                      onClick={() => handleSetCurrentYear(year.id)}
                      className="text-sm text-blue-600 font-medium hover:underline"
                    >
                      Set Current
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Class Levels */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <span className="w-2 h-6 bg-purple-500 rounded-full mr-3"></span>
              Class Levels
            </h2>
            <form onSubmit={handleAddClass} className="mb-6 flex space-x-2">
              <input
                type="text"
                placeholder="e.g. Grade 1"
                className="flex-1 px-4 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
              />
              <button type="submit" className="bg-purple-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-purple-700 transition-colors">
                Add
              </button>
            </form>
            <div className="space-y-4">
              {classLevels.map((level) => (
                <div key={level.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-gray-800">{level.name}</span>
                    <span className="text-xs text-gray-400 uppercase font-bold">{level.sections.length} Streams</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {level.sections.map(section => (
                      <span key={section.id} className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-sm text-gray-600">
                        {section.name}
                      </span>
                    ))}
                    <button 
                      onClick={() => handleAddStream(level.id)}
                      className="px-3 py-1 border border-dashed border-gray-300 rounded-lg text-sm text-gray-400 hover:border-purple-400 hover:text-purple-500 transition-colors"
                    >
                      + Add Stream
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ClassManagementPage;

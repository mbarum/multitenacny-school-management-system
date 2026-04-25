import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Settings2, User, Calendar as CalendarIcon, MapPin, X, Save, Edit3, Trash2, Users } from 'lucide-react';

interface AcademicYear {
  id: string;
  name: string;
  isCurrent: boolean;
}

interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Section {
  id: string;
  name: string;
  room: string;
  classTeacherId?: string;
  classTeacher?: Staff;
  academicYearId?: string;
  academicYear?: AcademicYear;
}

interface ClassLevel {
  id: string;
  name: string;
  headTeacherId?: string;
  headTeacher?: Staff;
  academicYearId?: string;
  academicYear?: AcademicYear;
  sections: Section[];
}

const ClassManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [newYearName, setNewYearName] = useState('');
  const [newClassName, setNewClassName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [editingLevel, setEditingLevel] = useState<ClassLevel | null>(null);
  const [editingSection, setEditingSection] = useState<{ section: Section, classLevelId: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [yearsRes, classesRes, staffRes] = await Promise.all([
        api.get('/academics/academic-years'),
        api.get('/academics/class-levels'),
        api.get('/staff'),
      ]);
      setAcademicYears(yearsRes.data);
      setClassLevels(classesRes.data);
      setStaff(staffRes.data);
    } catch (error) {
      console.error('Failed to fetch academic data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudents = (classLevelId: string, sectionId: string) => {
    // In our student page, we should handle these filters if passed via URL or state
    // But since StudentsPage.tsx is currently simple, we can just navigate
    // Actually, I should update StudentsPage.tsx to handle query params if I want this to work perfectly.
    navigate(`/students?classLevelId=${classLevelId}&sectionId=${sectionId}`);
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

  const handleUpdateLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLevel) return;
    try {
      await api.patch(`/academics/class-levels/${editingLevel.id}`, {
        name: editingLevel.name,
        headTeacherId: editingLevel.headTeacherId || null,
        academicYearId: editingLevel.academicYearId || null,
      });
      setEditingLevel(null);
      fetchData();
    } catch (error) {
      console.error('Failed to update class level', error);
    }
  };

  const handleUpdateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection) return;
    try {
      await api.patch(`/academics/sections/${editingSection.section.id}`, {
        name: editingSection.section.name,
        room: editingSection.section.room,
        classTeacherId: editingSection.section.classTeacherId || null,
        academicYearId: editingSection.section.academicYearId || null,
      });
      setEditingSection(null);
      fetchData();
    } catch (error) {
      console.error('Failed to update section', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Academic Structure</h1>
            <p className="text-gray-500 mt-2">Manage academic years, class levels, and streams.</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Academic Years */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
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
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
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
            <div className="space-y-6">
              {classLevels.map((level) => (
                <div key={level.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:shadow-md">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg flex items-center">
                        {level.name}
                        <button 
                          onClick={() => setEditingLevel(level)}
                          className="ml-2 p-1 text-gray-400 hover:text-purple-600 transition-colors"
                        >
                          <Settings2 className="w-4 h-4" />
                        </button>
                      </h3>
                      {level.headTeacher ? (
                        <p className="text-xs text-gray-500 flex items-center mt-1">
                          <User className="w-3 h-3 mr-1" />
                          Head: {level.headTeacher.firstName} {level.headTeacher.lastName}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 mt-1 italic">No head teacher assigned</p>
                      )}
                      {level.academicYear && (
                        <p className="text-[10px] text-blue-600 font-bold flex items-center mt-0.5">
                          <CalendarIcon className="w-3 h-3 mr-1" />
                          Active for {level.academicYear.name}
                        </p>
                      )}
                    </div>
                    <span className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-[10px] uppercase font-black text-gray-400">
                      {level.sections.length} Streams
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {level.sections.map(section => (
                      <div 
                        key={section.id} 
                        className="group relative p-3 bg-white border border-gray-200 rounded-xl hover:border-purple-300 transition-all cursor-pointer shadow-sm"
                        onClick={() => setEditingSection({ section, classLevelId: level.id })}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-gray-700">{section.name}</span>
                          <div className="flex items-center space-x-1">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewStudents(level.id, section.id);
                              }}
                              className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-600 transition-colors"
                              title="View Students"
                            >
                              <Users className="w-3 h-3" />
                            </button>
                            <Edit3 className="w-3 h-3 text-gray-300 group-hover:text-purple-500 transition-colors" />
                          </div>
                        </div>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center text-[10px] text-gray-500">
                            <MapPin className="w-3 h-3 mr-1 text-gray-300" />
                            {section.room || 'No Room'}
                          </div>
                          {section.classTeacher && (
                            <div className="flex items-center text-[10px] text-purple-600 font-medium">
                              <User className="w-3 h-3 mr-1" />
                              {section.classTeacher.firstName.charAt(0)}. {section.classTeacher.lastName}
                            </div>
                          )}
                          {section.academicYear && (
                            <div className="flex items-center text-[10px] text-blue-500 font-medium">
                              <CalendarIcon className="w-3 h-3 mr-1" />
                              {section.academicYear.name}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddStream(level.id);
                      }}
                      className="p-3 border border-dashed border-gray-300 rounded-xl text-xs text-gray-400 hover:border-purple-400 hover:text-purple-500 hover:bg-purple-50 transition-all flex items-center justify-center font-medium"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Stream
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Level Edit Modal */}
      <AnimatePresence>
        {editingLevel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingLevel(null)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold">Edit Class Level</h3>
                <button onClick={() => setEditingLevel(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleUpdateLevel} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Level Name</label>
                  <input 
                    type="text"
                    value={editingLevel.name}
                    onChange={(e) => setEditingLevel({ ...editingLevel, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Head Teacher</label>
                  <select 
                    value={editingLevel.headTeacherId || ''}
                    onChange={(e) => setEditingLevel({ ...editingLevel, headTeacherId: e.target.value })}
                    className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">No Head Teacher</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.role})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Active Academic Year</label>
                  <select 
                    value={editingLevel.academicYearId || ''}
                    onChange={(e) => setEditingLevel({ ...editingLevel, academicYearId: e.target.value })}
                    className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">No Specific Year</option>
                    {academicYears.map(y => (
                      <option key={y.id} value={y.id}>{y.name} {y.isCurrent ? '(Active)' : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="pt-2 flex space-x-3">
                  <button 
                    type="button" 
                    onClick={() => setEditingLevel(null)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 shadow-lg shadow-purple-200 transition-colors flex items-center justify-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Section Edit Modal */}
      <AnimatePresence>
        {editingSection && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingSection(null)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold">Edit Stream Details</h3>
                <button onClick={() => setEditingSection(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleUpdateSection} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Stream Name</label>
                    <input 
                      type="text"
                      value={editingSection.section.name}
                      onChange={(e) => setEditingSection({ 
                        ...editingSection, 
                        section: { ...editingSection.section, name: e.target.value }
                      })}
                      className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Room Number</label>
                    <input 
                      type="text"
                      value={editingSection.section.room || ''}
                      onChange={(e) => setEditingSection({ 
                        ...editingSection, 
                        section: { ...editingSection.section, room: e.target.value }
                      })}
                      className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g. Rm 101"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Class Teacher</label>
                  <select 
                    value={editingSection.section.classTeacherId || ''}
                    onChange={(e) => setEditingSection({ 
                      ...editingSection, 
                      section: { ...editingSection.section, classTeacherId: e.target.value }
                    })}
                    className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Assign Teacher</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.role})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Academic Year</label>
                  <select 
                    value={editingSection.section.academicYearId || ''}
                    onChange={(e) => setEditingSection({ 
                      ...editingSection, 
                      section: { ...editingSection.section, academicYearId: e.target.value }
                    })}
                    className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select Year</option>
                    {academicYears.map(y => (
                      <option key={y.id} value={y.id}>{y.name} {y.isCurrent ? '(Active)' : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="pt-2 flex space-x-3">
                  <button 
                    type="button" 
                    onClick={() => setEditingSection(null)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 shadow-lg shadow-purple-200 transition-colors flex items-center justify-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClassManagementPage;

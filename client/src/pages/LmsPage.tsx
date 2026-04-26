import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { motion } from 'framer-motion';
import { Globe, Settings, ExternalLink, ShieldCheck, Zap, RefreshCw, X, Check, ArrowRight, BookOpen, Layers, Cloud, Lock, Key, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface LmsConnection {
  id: string;
  provider: 'moodle' | 'google_classroom' | 'canvas';
  apiUrl: string;
  isConnected: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  classLevelId: string;
  classLevel?: { name: string };
  teacherId: string;
  teacher?: { firstName: string; lastName: string };
  isPublished: boolean;
  lessons?: Lesson[];
  assignments?: Assignment[];
}

interface Lesson {
  id: string;
  title: string;
  content: string;
  videoUrl: string;
  order: number;
}

interface Assignment {
  id: string;
  title: string;
  instructions: string;
  dueDate: string;
  maxPoints: number;
}

const LmsPage: React.FC = () => {
  const [activeView, setActiveView] = useState<'internal' | 'external'>('internal');
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [connections, setConnections] = useState<LmsConnection[]>([]);
  const [classLevels, setClassLevels] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    provider: 'moodle',
    apiUrl: '',
    credential1: '',
    credential2: ''
  });

  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    classLevelId: '',
    teacherId: '',
    thumbnailUrl: ''
  });

  const [lessonForm, setLessonForm] = useState({
    title: '',
    content: '',
    videoUrl: '',
    courseId: '',
    order: 0
  });

  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    instructions: '',
    dueDate: '',
    maxPoints: 100,
    courseId: ''
  });

  useEffect(() => {
    fetchLmsData();
  }, [activeView]);

  const fetchLmsData = async () => {
    setLoading(true);
    try {
      if (activeView === 'external') {
        const response = await api.get('/lms/connections');
        setConnections(response.data);
      } else {
        const [coursesRes, classesRes, staffRes] = await Promise.all([
          api.get('/lms/courses'),
          api.get('/academics/class-levels'),
          api.get('/staff')
        ]);
        setCourses(coursesRes.data);
        setClassLevels(classesRes.data);
        setStaff(staffRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch LMS data', error);
      toast.error('Sync failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCourse = async (courseId: string) => {
    try {
      const res = await api.get(`/lms/courses/${courseId}`);
      setSelectedCourse(res.data);
    } catch (error) {
      toast.error('Failed to load course details');
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/lms/courses', courseForm);
      toast.success('Course published successfully');
      setIsCourseModalOpen(false);
      fetchLmsData();
    } catch (error) {
      toast.error('Failed to create course');
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/lms/lessons', { ...lessonForm, courseId: selectedCourse?.id });
      toast.success('Lesson added');
      setIsLessonModalOpen(false);
      if (selectedCourse) handleSelectCourse(selectedCourse.id);
    } catch (error) {
      toast.error('Failed to add lesson');
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/lms/assignments', { ...assignmentForm, courseId: selectedCourse?.id });
      toast.success('Assignment posted');
      setIsAssignmentModalOpen(false);
      if (selectedCourse) handleSelectCourse(selectedCourse.id);
    } catch (error) {
      toast.error('Failed to post assignment');
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/lms/connections', {
          provider: formData.provider,
          apiUrl: formData.apiUrl,
          encryptedCredential1: formData.credential1,
          encryptedCredential2: formData.credential2
      });
      toast.success('Connection established');
      setIsModalOpen(false);
      fetchConnections();
    } catch (error) {
      toast.error('Failed to connect to LMS');
    }
  };

  const providers = [
      { id: 'moodle', name: 'Moodle', icon: <Layers size={24} />, color: 'bg-orange-500', desc: 'The world\'s most popular open-source LMS.' },
      { id: 'google_classroom', name: 'Google Classroom', icon: <Cloud size={24} />, color: 'bg-green-600', desc: 'Seamless integration with Google Workspace.' },
      { id: 'canvas', name: 'Canvas', icon: <Zap size={24} />, color: 'bg-red-600', desc: 'Modern and flexible learning management.' }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-8 py-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
          <div>
            <div className="flex items-center space-x-2 text-indigo-600 mb-2">
              <Globe size={16} className="animate-spin-slow" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Learning Ecosystem</span>
            </div>
            <h1 className="text-5xl font-black text-gray-900 uppercase tracking-tighter leading-tight italic">
              Virtual <span className="text-indigo-600">Classroom</span>
            </h1>
            <div className="flex bg-gray-100 p-1 rounded-2xl w-fit mt-6 border border-gray-100">
              <button 
                onClick={() => { setActiveView('internal'); setSelectedCourse(null); }}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'internal' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                School Courses
              </button>
              <button 
                onClick={() => setActiveView('external')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'external' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                External Sync
              </button>
            </div>
          </div>
          
          <div className="flex gap-4">
            {activeView === 'internal' && !selectedCourse && (
              <button
                onClick={() => setIsCourseModalOpen(true)}
                className="px-8 py-4 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-3"
              >
                <Plus size={16} />
                Create Course
              </button>
            )}
            {activeView === 'external' && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-8 py-4 bg-gray-900 text-white rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-gray-200 hover:bg-black transition-all flex items-center gap-3"
              >
                <Cloud size={16} />
                Connect LMS
              </button>
            )}
          </div>
        </header>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <RefreshCw className="animate-spin text-indigo-600 mb-4" size={32} />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Synchronizing Education Hub...</p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            {activeView === 'external' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {providers.map(p => {
                  const conn = connections.find(c => c.provider === p.id);
                  return (
                    <div key={p.id} className={`p-8 rounded-[3rem] border-2 transition-all relative overflow-hidden group ${conn?.isConnected ? 'border-indigo-600 bg-indigo-50/10' : 'border-gray-50 bg-gray-50/30'}`}>
                      <div className="relative z-10">
                        <div className={`w-14 h-14 ${p.color} text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl`}>
                            {p.icon}
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight uppercase italic">{p.name}</h3>
                        <p className="text-gray-400 text-xs font-medium leading-relaxed mb-8 uppercase tracking-wider">{p.desc}</p>
                        
                        {conn?.isConnected ? (
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2 text-green-600 text-[10px] font-black uppercase tracking-widest">
                                    <ShieldCheck size={14} />
                                    <span>Status: Synced & Active</span>
                                </div>
                                <button className="flex items-center space-x-2 text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:translate-x-1 transition-transform">
                                    <span>Integration Settings</span>
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        ) : (
                            <button 
                             onClick={() => {
                                 setFormData({...formData, provider: p.id});
                                 setIsModalOpen(true);
                             }}
                             className="px-6 py-3 bg-white border border-gray-200 text-gray-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-indigo-600 hover:text-indigo-600 transition-all font-bold shadow-sm"
                            >
                                Set up Connection
                            </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : selectedCourse ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-in slide-in-from-right duration-500">
                <div className="lg:col-span-2 space-y-12">
                  <header>
                    <button onClick={() => setSelectedCourse(null)} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2 hover:gap-3 transition-all italic">← Back to Courses</button>
                    <h2 className="text-5xl font-black text-gray-900 uppercase tracking-tighter italic leading-none">{selectedCourse.title}</h2>
                    <p className="text-gray-400 text-sm font-medium mt-6 leading-relaxed max-w-2xl">{selectedCourse.description}</p>
                  </header>

                  <section className="space-y-6">
                    <div className="flex items-center justify-between border-b-2 border-gray-900 pb-4">
                      <h3 className="text-xl font-black uppercase italic tracking-tight">Curriculum Lessons</h3>
                      <button onClick={() => setIsLessonModalOpen(true)} className="text-[10px] font-black uppercase text-indigo-600 tracking-widest border-2 border-indigo-600 px-4 py-2 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all">+ Add Lesson</button>
                    </div>
                    <div className="space-y-4">
                      {selectedCourse.lessons?.map((lesson, idx) => (
                        <div key={lesson.id} className="p-6 bg-gray-50 rounded-3xl border-2 border-transparent hover:border-indigo-100 transition-all flex items-start justify-between group">
                          <div className="flex items-start gap-6">
                            <span className="text-4xl font-black text-gray-200 italic leading-none group-hover:text-indigo-100 transition-colors">{idx + 1}</span>
                            <div>
                                <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-2 tracking-wide">{lesson.title}</h4>
                                <div className="text-gray-400 text-xs font-medium mb-4 leading-relaxed line-clamp-2">{lesson.content}</div>
                                {lesson.videoUrl && (
                                  <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:underline italic">
                                     <Zap size={12} fill="currentColor" /> Watch Video Tutorial
                                  </a>
                                )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {(!selectedCourse.lessons || selectedCourse.lessons.length === 0) && (
                        <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-[3rem]">
                           <BookOpen size={40} className="text-gray-100 mx-auto mb-4" />
                           <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">Wait for lesson uploads</p>
                        </div>
                      )}
                    </div>
                  </section>
                </div>

                <aside className="space-y-8">
                  <div className="p-8 bg-gray-900 rounded-[3rem] text-white space-y-8 shadow-2xl relative overflow-hidden">
                    <div className="relative z-10 flex items-center justify-between">
                      <h3 className="text-lg font-black uppercase italic tracking-widest">Assignments</h3>
                      <button onClick={() => setIsAssignmentModalOpen(true)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white text-white hover:text-gray-900 flex items-center justify-center transition-all">
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="relative z-10 space-y-4">
                      {selectedCourse.assignments?.map(assignment => (
                        <div key={assignment.id} className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-white/20 transition-all">
                          <h4 className="text-sm font-black uppercase tracking-wider mb-2">{assignment.title}</h4>
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Due Date</p>
                              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{new Date(assignment.dueDate).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Max Score</p>
                              <p className="text-[10px] font-bold uppercase tracking-widest">{assignment.maxPoints} pts</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {(!selectedCourse.assignments || selectedCourse.assignments.length === 0) && (
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest italic text-center py-10">No pending tasks</p>
                      )}
                    </div>
                    {/* decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600 opacity-20 blur-[80px]" />
                  </div>

                  <div className="p-8 bg-indigo-600 rounded-[3rem] text-white">
                    <h3 className="text-lg font-black uppercase italic tracking-widest mb-4">Instructor</h3>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-black text-xl italic uppercase">
                        {selectedCourse.teacher?.firstName?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-black uppercase tracking-wide">{selectedCourse.teacher?.firstName} {selectedCourse.teacher?.lastName}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Professional Faculty</p>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {courses.map(course => (
                  <div key={course.id} onClick={() => handleSelectCourse(course.id)} className="group cursor-pointer">
                    <div className="relative aspect-[16/10] bg-gray-50 rounded-[2.5rem] overflow-hidden mb-6 border-2 border-transparent group-hover:border-indigo-600 transition-all shadow-lg shadow-gray-100/50">
                      {course.thumbnailUrl ? (
                         <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <BookOpen className="text-gray-200" size={48} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 to-transparent flex items-end p-6">
                        <span className="px-4 py-1.5 bg-white text-gray-900 text-[9px] font-black uppercase tracking-[0.2em] rounded-full shadow-2xl">
                          {course.classLevel?.name}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 uppercase tracking-tighter group-hover:text-indigo-600 transition-colors italic leading-none">{course.title}</h3>
                    <div className="flex items-center gap-2 mt-3">
                       <div className="w-1 h-1 rounded-full bg-gray-300" />
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">{course.teacher?.firstName} {course.teacher?.lastName}</p>
                    </div>
                  </div>
                ))}
                {courses.length === 0 && (
                  <div className="col-span-full py-32 text-center bg-gray-50/50 rounded-[4rem] border-2 border-dashed border-gray-100">
                    <Layers size={64} className="text-gray-100 mx-auto mb-6" />
                    <p className="text-sm font-black text-gray-300 uppercase tracking-widest italic">Your digital library is currently empty</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Course Modal */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[3.5rem] w-full max-w-2xl overflow-hidden shadow-2xl">
                <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-indigo-50/30">
                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">Publish <span className="text-indigo-600">Course</span></h3>
                    <button onClick={() => setIsCourseModalOpen(false)} className="p-4 hover:bg-white text-gray-400 rounded-3xl transition-all shadow-sm"><X size={20} /></button>
                </div>
                <form onSubmit={handleCreateCourse} className="p-12 grid grid-cols-2 gap-8">
                    <div className="col-span-2">
                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 italic">Subject Title</label>
                        <input required value={courseForm.title} onChange={(e) => setCourseForm({...courseForm, title: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-600 font-bold text-gray-900 transition-all outline-none" placeholder="e.g. Advanced Physics" />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 italic">Description</label>
                        <textarea value={courseForm.description} onChange={(e) => setCourseForm({...courseForm, description: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-600 font-bold text-gray-900 transition-all outline-none resize-none h-24" placeholder="Course syllabus overview..." />
                    </div>
                    <div>
                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 italic">Class Level</label>
                        <select required value={courseForm.classLevelId} onChange={(e) => setCourseForm({...courseForm, classLevelId: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-600 font-bold text-gray-900 transition-all outline-none uppercase text-xs tracking-widest">
                            <option value="">Select Class</option>
                            {classLevels.map(cl => <option key={cl.id} value={cl.id}>{cl.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 italic">Instructor</label>
                        <select required value={courseForm.teacherId} onChange={(e) => setCourseForm({...courseForm, teacherId: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-600 font-bold text-gray-900 transition-all outline-none uppercase text-xs tracking-widest">
                            <option value="">Choose Faculty</option>
                            {staff.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
                        </select>
                    </div>
                    <button type="submit" className="col-span-2 bg-gray-900 text-white py-5 rounded-[2.5rem] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-gray-200 hover:bg-indigo-600 transition-all active:scale-95">Establish Curriculum</button>
                </form>
            </motion.div>
        </div>
      )}

      {/* Lesson Modal */}
      {isLessonModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[3.5rem] w-full max-w-xl overflow-hidden shadow-2xl">
                <div className="p-10 bg-indigo-600 text-white flex justify-between items-center">
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter">Add <span className="opacity-60">Lesson</span></h3>
                    <button onClick={() => setIsLessonModalOpen(false)} className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center"><X size={18} /></button>
                </div>
                <form onSubmit={handleCreateLesson} className="p-12 space-y-8">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 italic">Lesson Headline</label>
                        <input required value={lessonForm.title} onChange={(e) => setLessonForm({...lessonForm, title: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-600 font-bold text-gray-900 outline-none" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 italic">Video Integration URL</label>
                        <div className="relative">
                            <ExternalLink size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input value={lessonForm.videoUrl} onChange={(e) => setLessonForm({...lessonForm, videoUrl: e.target.value})} className="w-full pl-14 bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-600 font-bold text-gray-900 outline-none  text-xs italic" placeholder="YouTube/Vimeo Embed Link" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 italic">Content Repository</label>
                        <textarea required value={lessonForm.content} onChange={(e) => setLessonForm({...lessonForm, content: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-600 font-bold text-gray-900 outline-none resize-none h-32" placeholder="Rich education content text..." />
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-[2.5rem] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-indigo-100 mt-4">Append to Syllabus</button>
                </form>
            </motion.div>
        </div>
      )}

      {/* Assignment Modal */}
      {isAssignmentModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[3.5rem] w-full max-w-xl overflow-hidden shadow-2xl">
                <div className="p-10 bg-gray-950 text-white flex justify-between items-center font-black italic uppercase tracking-tighter">
                    <h3 className="text-2xl">Post <span className="text-indigo-500">Assignment</span></h3>
                    <button onClick={() => setIsAssignmentModalOpen(false)} className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center"><X size={18} /></button>
                </div>
                <form onSubmit={handleCreateAssignment} className="p-12 space-y-8">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 italic">Task Label</label>
                        <input required value={assignmentForm.title} onChange={(e) => setAssignmentForm({...assignmentForm, title: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-600 font-bold text-gray-900 outline-none uppercase italic" />
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 italic">Submission Deadline</label>
                            <input required type="date" value={assignmentForm.dueDate} onChange={(e) => setAssignmentForm({...assignmentForm, dueDate: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-600 font-bold text-gray-900 outline-none text-xs" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 italic">Max Proficiency Score</label>
                            <input required type="number" value={assignmentForm.maxPoints} onChange={(e) => setAssignmentForm({...assignmentForm, maxPoints: Number(e.target.value)})} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-600 font-bold text-gray-900 outline-none text-xs" />
                        </div>
                    </div>
                    <div>
                         <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 italic">Instructional Guidelines</label>
                         <textarea required value={assignmentForm.instructions} onChange={(e) => setAssignmentForm({...assignmentForm, instructions: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-600 font-bold text-gray-900 outline-none h-24 resize-none" />
                    </div>
                    <button type="submit" className="w-full bg-gray-950 text-white py-5 rounded-[2.5rem] font-black uppercase tracking-widest text-[11px] shadow-2xl mt-4">Assign Task to Students</button>
                </form>
            </motion.div>
        </div>
      )}

      {/* Connection Modal (Legacy) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-100">
                <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-indigo-50/30">
                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">External <span className="text-indigo-600">Gateway</span></h3>
                    <button onClick={() => setIsModalOpen(false)} className="p-4 hover:bg-white text-gray-400 rounded-3xl transition-all shadow-sm"><X size={20} /></button>
                </div>
                <form onSubmit={handleConnect} className="p-12 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2">
                             <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">LMS Target</label>
                             <select value={formData.provider} onChange={(e) => setFormData({...formData, provider: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-600 font-bold text-gray-900 outline-none transition-all uppercase tracking-wider text-[11px]">
                                <option value="moodle">Moodle HQ</option>
                                <option value="google_classroom">Google Classroom</option>
                                <option value="canvas">Instructure Canvas</option>
                             </select>
                        </div>
                        <div className="md:col-span-2">
                             <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">API Access URL</label>
                             <input type="url" required value={formData.apiUrl} onChange={(e) => setFormData({...formData, apiUrl: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-600 font-bold text-gray-900 transition-all font-mono text-xs" />
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-gray-900 text-white py-5 rounded-[2.5rem] font-black uppercase tracking-widest text-[11px] shadow-2xl">Initialize Integration</button>
                </form>
            </motion.div>
        </div>
      )}
    </div>
  );
};

export default LmsPage;

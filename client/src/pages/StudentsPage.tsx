import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { toast } from 'sonner';
import { UserRole } from '../../../src/common/user-role.enum';
import { 
  Users, 
  UserCheck, 
  DollarSign, 
  Activity, 
  LogOut, 
  Settings, 
  GraduationCap, 
  Calendar, 
  FileText, 
  CreditCard, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Search, 
  Eye, 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Award, 
  Info, 
  MapPin, 
  Truck, 
  Camera, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Printer,
  RefreshCw,
  Filter,
  MoreVertical,
  ExternalLink,
  Shield,
  Download,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

interface Student {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  registrationNumber: string;
  status: string;
  classLevelId: string;
  sectionId: string;
  academicYearId: string;
  photoUrl?: string;
  gender?: string;
  dateOfBirth?: string;
  residence?: string;
  transportRoute?: string;
  parentFirstName?: string;
  parentLastName?: string;
  parentEmail?: string;
  parentPhone?: string;
  classLevel?: { id: string; name: string };
  section?: { id: string; name: string };
  academicYear?: { id: string; name: string };
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

interface AcademicYear {
  id: string;
  name: string;
  isCurrent: boolean;
}

import DashboardLayout from '../components/DashboardLayout';

const StudentsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialClassId = searchParams.get('classLevelId') || '';
  const initialSectionId = searchParams.get('sectionId') || '';

  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'info' | 'behavior'>('info');
  const [behaviorRecords, setBehaviorRecords] = useState<any[]>([]);
  const [behaviorLoading, setBehaviorLoading] = useState(false);
  const [behaviorSummary, setBehaviorSummary] = useState({ merits: 0, demerits: 0, net: 0 });
  const [currentStep, setCurrentStep] = useState(1);
  const [showIdCard, setShowIdCard] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Filters state
  const [filterClassId, setFilterClassId] = useState(initialClassId);
  const [filterSectionId, setFilterSectionId] = useState(initialSectionId);

  useEffect(() => {
    if (isCameraActive && videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [isCameraActive, cameraStream]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      setIsCameraActive(true);
    } catch (err) {
      console.error("Error accessing camera: ", err);
      toast.error("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
      setIsCameraActive(false);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(async (blob) => {
          if (blob) {
            const uploadToast = toast.loading('Saving photo...');
            try {
              const file = new File([blob], `capture_${Date.now()}.png`, { type: 'image/png' });
              const formData = new FormData();
              formData.append('file', file);
              formData.append('folder', 'students');

              const response = await api.post('/media/upload', formData, {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              });

              const { url } = response.data;
              setFormData(prev => ({ ...prev, photoUrl: url }));
              toast.success('Photo saved to cloud', { id: uploadToast });
              stopCamera();
            } catch (error) {
              console.error('Upload failed', error);
              toast.error('Failed to save captured photo', { id: uploadToast });
            }
          }
        }, 'image/png');
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const uploadToast = toast.loading('Uploading photo...');
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'students');

        const response = await api.post('/media/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const { url } = response.data;
        setFormData(prev => ({ ...prev, photoUrl: url }));
        toast.success('Photo uploaded successfully', { id: uploadToast });
      } catch (error) {
        console.error('Upload failed', error);
        toast.error('Failed to upload photo to cloud storage', { id: uploadToast });
      }
    }
  };

  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    registrationNumber: '',
    classLevelId: '',
    sectionId: '',
    academicYearId: '',
    status: 'Active',
    gender: 'Male',
    dateOfBirth: '',
    residence: '',
    transportRoute: '',
    photoUrl: '',
    parentFirstName: '',
    parentLastName: '',
    parentEmail: '',
    parentPhone: ''
  });

  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isBulkStatusModalOpen, setIsBulkStatusModalOpen] = useState(false);
  const [isBulkClassModalOpen, setIsBulkClassModalOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('Active');
  const [bulkClassData, setBulkClassData] = useState({ classLevelId: '', sectionId: '' });

  useEffect(() => {
    fetchData();
  }, [filterClassId, filterSectionId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let studentsUrl = '/students';
      const params = new URLSearchParams();
      if (filterClassId) params.append('classLevelId', filterClassId);
      if (filterSectionId) params.append('sectionId', filterSectionId);
      
      if (params.toString()) {
        studentsUrl += `?${params.toString()}`;
      }

      const [studentsRes, classLevelsRes, sectionsRes, academicYearsRes] = await Promise.all([
        api.get(studentsUrl),
        api.get('/academics/class-levels'),
        api.get('/academics/sections'),
        api.get('/academics/academic-years')
      ]);
      setStudents(studentsRes.data);
      setClassLevels(classLevelsRes.data);
      setSections(sectionsRes.data);
      setAcademicYears(academicYearsRes.data);
      setSelectedStudentIds([]);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedStudentIds(filteredStudents.map(s => s.id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleSelectStudent = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedStudentIds(prev => [...prev, id]);
    } else {
      setSelectedStudentIds(prev => prev.filter(studentId => studentId !== id));
    }
  };

  const handleBulkUpdate = async (type: 'status' | 'class') => {
    try {
      const payload: any = { studentIds: selectedStudentIds };
      if (type === 'status') {
        payload.status = bulkStatus;
      } else if (type === 'class') {
        payload.classLevelId = bulkClassData.classLevelId || undefined;
        payload.sectionId = bulkClassData.sectionId || undefined;
      }

      await api.patch('/students/bulk/update', payload);
      setIsBulkStatusModalOpen(false);
      setIsBulkClassModalOpen(false);
      toast.success('Students updated successfully');
      fetchData();
    } catch (error: any) {
      console.error('Failed to update students', error);
      toast.error('Failed to update students. Please try again.');
    }
  };

  const handleViewStudent = (student: Student) => {
    setViewingStudent(student);
    setIsDetailModalOpen(true);
    setActiveDetailTab('info');
    fetchBehaviorData(student.id);
  };

  const fetchBehaviorData = async (studentId: string) => {
    setBehaviorLoading(true);
    try {
      const [recordsRes, summaryRes] = await Promise.all([
        api.get(`/students/${studentId}/behavior`),
        api.get(`/students/${studentId}/behavior/summary`)
      ]);
      setBehaviorRecords(recordsRes.data);
      setBehaviorSummary(summaryRes.data);
    } catch (error) {
      console.error('Failed to fetch behavior data', error);
    } finally {
      setBehaviorLoading(false);
    }
  };

  const handleOpenModal = (student?: Student) => {
    setCurrentStep(1);
    if (student) {
      setEditingStudent(student);
      setFormData({
        firstName: student.firstName,
        middleName: student.middleName || '',
        lastName: student.lastName,
        registrationNumber: student.registrationNumber || '',
        classLevelId: student.classLevelId || '',
        sectionId: student.sectionId || '',
        academicYearId: student.academicYearId || '',
        status: student.status || 'Active',
        gender: student.gender || 'Male',
        dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '',
        residence: student.residence || '',
        transportRoute: student.transportRoute || '',
        photoUrl: student.photoUrl || '',
        parentFirstName: student.parentFirstName || '',
        parentLastName: student.parentLastName || '',
        parentEmail: student.parentEmail || '',
        parentPhone: student.parentPhone || ''
      });
    } else {
      setEditingStudent(null);
      const currentYear = academicYears.find(y => y.isCurrent);
      setFormData({
        firstName: '', middleName: '', lastName: '', registrationNumber: '', classLevelId: '', sectionId: '', academicYearId: currentYear ? currentYear.id : '', status: 'Active', gender: 'Male', dateOfBirth: '', residence: '', transportRoute: '', photoUrl: '', parentFirstName: '', parentLastName: '', parentEmail: '', parentPhone: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    stopCamera();
    setIsModalOpen(false);
    setEditingStudent(null);
    setCurrentStep(1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        classLevelId: formData.classLevelId || undefined,
        sectionId: formData.sectionId || undefined,
        academicYearId: formData.academicYearId || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
      };

      console.log('[StudentsPage] Submitting student:', payload);

      if (editingStudent) {
        await api.patch(`students/${editingStudent.id}`, payload);
        toast.success('Student updated successfully');
      } else {
        await api.post('students', payload);
        toast.success('Student added successfully');
      }
      handleCloseModal();
      fetchData();
    } catch (error: any) {
      console.error('Failed to save student', error);
      if (error.response && error.response.data && error.response.data.message) {
        toast.error(`Error: ${error.response.data.message}`);
      } else {
        toast.error('Failed to save student. Please try again.');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await api.delete(`/students/${id}`);
        toast.success('Student deleted successfully');
        fetchData();
      } catch (error) {
        console.error('Failed to delete student', error);
        toast.error('Failed to delete student.');
      }
    }
  };

  const availableSections = formData.classLevelId 
    ? sections.filter(s => s.classLevelId === formData.classLevelId)
    : sections;

  const filteredStudents = students.filter(student => {
    const query = searchQuery.toLowerCase();
    const fullName = `${student.firstName} ${student.middleName || ''} ${student.lastName}`.toLowerCase();
    const regNum = student.registrationNumber ? student.registrationNumber.toLowerCase() : '';
    return fullName.includes(query) || regNum.includes(query);
  });

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-canvas">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas pb-20 font-sans selection:bg-primary/10 selection:text-primary">
      {/* Top Navigation / Breadcrumbs */}
      <div className="bg-surface border-b border-border-muted relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/4 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
        <div className="max-w-[1600px] mx-auto px-8 py-12 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center space-x-2 text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4">
                 <Shield size={10} className="text-primary" />
                 <span>Student Information System</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-on-surface tracking-tighter leading-none mb-4 uppercase italic">
                Student <span className="text-slate-300 dark:text-slate-700 block md:inline font-normal underline decoration-primary decoration-4 underline-offset-8">Registry</span>
              </h1>
              <p className="text-slate-500 text-sm font-bold tracking-tight max-w-xl">
                Securely managing student records and academic data. Monitoring institutional enrollment and placement.
              </p>
            </motion.div>
            
            <div className="flex items-center gap-4">
               <div className="flex -space-x-3 items-center mr-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-4 border-surface bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase italic">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                  <div className="w-10 h-10 rounded-full border-4 border-surface bg-primary text-white flex items-center justify-center text-[10px] font-black italic shadow-lg z-10">
                    +{students.length}
                  </div>
               </div>
               <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOpenModal()}
                className="bg-slate-900 dark:bg-primary text-white h-16 px-10 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl flex items-center hover:shadow-primary/30 transition-all group relative overflow-hidden"
               >
                  <Plus size={18} className="mr-3 group-hover:rotate-90 transition-transform duration-500" />
                  New Registration
               </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-8 pt-12">

        {/* Advanced Data Filters */}
        <div className="bg-surface border border-border-muted rounded-[2rem] p-4 flex flex-wrap lg:flex-nowrap items-center gap-4 mb-10 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] relative z-20">
           <div className="relative group w-full lg:w-96">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-primary" />
              <input
                type="text"
                placeholder="Search by student name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-border-muted rounded-2xl text-[11px] font-black uppercase tracking-wider focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all w-full italic"
              />
           </div>

           <div className="h-10 w-px bg-border-muted hidden lg:block" />

           <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-border-muted p-1">
              <div className="flex items-center px-4 py-3 space-x-3">
                 <GraduationCap size={16} className="text-slate-400" />
                 <select 
                   value={filterClassId}
                   onChange={(e) => {
                     setFilterClassId(e.target.value);
                     setFilterSectionId('');
                   }}
                   className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none focus:ring-0 cursor-pointer text-on-surface hover:text-primary transition-colors appearance-none min-w-[160px]"
                 >
                   <option value="">Grade Levels (All)</option>
                   {classLevels.map(cl => (
                     <option key={cl.id} value={cl.id}>{cl.name}</option>
                   ))}
                 </select>
              </div>
              <div className="w-px h-6 bg-border-muted" />
              <div className="flex items-center px-4 py-3 space-x-3">
                 <Activity size={16} className="text-slate-400" />
                 <select 
                   value={filterSectionId}
                   onChange={(e) => setFilterSectionId(e.target.value)}
                   disabled={!filterClassId}
                   className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none focus:ring-0 cursor-pointer text-on-surface hover:text-primary transition-colors appearance-none min-w-[160px] disabled:opacity-30"
                 >
                   <option value="">Streams / Sections (All)</option>
                   {sections.filter(s => s.classLevelId === filterClassId).map(sec => (
                     <option key={sec.id} value={sec.id}>{sec.name}</option>
                   ))}
                 </select>
              </div>
           </div>

           {(filterClassId || filterSectionId || searchQuery) && (
             <motion.button 
               whileHover={{ x: 5 }}
               onClick={() => {
                 setFilterClassId('');
                 setFilterSectionId('');
                 setSearchQuery('');
               }}
               className="px-6 py-4 text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest flex items-center gap-3 transition-colors ml-auto group"
             >
               <RefreshCw size={12} className="group-hover:rotate-180 transition-transform duration-500" />
               Reset Filters
             </motion.button>
           )}
           
           {!filterClassId && !filterSectionId && !searchQuery && (
              <div className="ml-auto flex items-center space-x-6 pr-4">
                 <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] italic">System Status</span>
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
                 </div>
                 <div className="w-px h-10 bg-border-muted" />
                 <Filter size={18} className="text-slate-300" />
              </div>
           )}
        </div>

        <AnimatePresence mode="wait">
        {selectedStudentIds.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-slate-900 p-6 flex items-center justify-between rounded-[2rem] shadow-2xl border border-slate-800 relative z-10">
              <div className="flex items-center space-x-6 px-4">
                <div className="w-12 h-12 bg-primary rounded-2xl text-white font-black text-lg flex items-center justify-center shadow-lg transform rotate-3">
                  {selectedStudentIds.length}
                </div>
                <div>
                  <p className="text-white text-[11px] font-black uppercase tracking-[0.2em] italic">Records Selected for Bulk Action</p>
                  <p className="text-slate-400 text-[9px] uppercase font-bold tracking-[0.3em] mt-1">Authorized for status update or class promotion</p>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setIsBulkStatusModalOpen(true)}
                  className="px-8 py-4 bg-slate-800 text-white hover:bg-indigo-600 transition-all text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl flex items-center gap-3 shadow-lg group"
                >
                  <ShieldCheck size={16} className="group-hover:scale-110 transition-transform" />
                  Update Status
                </button>
                <button
                  onClick={() => setIsBulkClassModalOpen(true)}
                  className="px-8 py-4 bg-slate-800 text-white hover:bg-violet-600 transition-all text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl flex items-center gap-3 shadow-lg group"
                >
                  <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-700" />
                  Promote Class Level
                </button>
                <button
                  onClick={() => setSelectedStudentIds([])}
                  className="px-6 py-4 text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-[0.2em] transition-colors"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>

        <div className="card-premium p-0 overflow-hidden shadow-[0_40px_100px_-30px_rgba(0,0,0,0.1)] border-0 mb-20 rounded-[2.5rem]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-border-muted">
                  <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] w-16 italic">
                    <div className="flex justify-center">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded-lg border-border-muted text-primary focus:ring-primary/20 transition-all cursor-pointer bg-surface"
                        checked={selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0}
                        onChange={handleSelectAll}
                      />
                    </div>
                  </th>
                  <th className="px-6 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Student Name</th>
                  <th className="px-6 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic text-center">Registration ID</th>
                  <th className="px-6 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Grade / Level</th>
                  <th className="px-6 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Current Status</th>
                  <th className="px-10 py-8 text-right text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student, index) => (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      key={student.id} 
                      className={`hover:bg-slate-50 dark:hover:bg-slate-900 transition-all group relative ${selectedStudentIds.includes(student.id) ? 'bg-primary/[0.03]' : ''}`}
                    >
                      <td className="px-10 py-6">
                        <div className="flex justify-center">
                          <input 
                            type="checkbox" 
                            className="w-5 h-5 rounded-lg border-border-muted text-primary focus:ring-primary/20 transition-all cursor-pointer bg-surface"
                            checked={selectedStudentIds.includes(student.id)}
                            onChange={(e) => handleSelectStudent(student.id, e.target.checked)}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-6 font-sans">
                        <div className="flex items-center space-x-6">
                          <div className="w-14 h-14 rounded-2xl shrink-0 border-2 border-border-muted flex items-center justify-center bg-surface overflow-hidden group-hover:border-primary transition-colors shadow-sm relative">
                            {student.photoUrl ? (
                              <img src={student.photoUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-6 h-6 text-slate-200" />
                            )}
                            <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors" />
                          </div>
                          <div>
                            <p className="text-lg font-black text-on-surface tracking-tight leading-none mb-1 group-hover:text-primary transition-colors">{student.firstName} {student.lastName}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center">
                               {student.gender === 'Male' ? <Shield size={10} className="mr-1.5 text-blue-400" /> : <Award size={10} className="mr-1.5 text-rose-400" />}
                               {student.gender || 'Classified'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <span className="font-sans font-black text-slate-500 text-[10px] bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-xl border border-border-muted tracking-[0.2em]">
                          {student.registrationNumber || 'X-PENDING'}
                        </span>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex flex-col">
                           <span className="font-black text-on-surface text-xs uppercase tracking-widest mb-1 italic">{student.classLevel?.name || 'Unassigned'}</span>
                           {student.section && (
                             <div className="flex items-center space-x-2">
                               <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
                               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em]">{student.section.name} Stream</span>
                             </div>
                           )}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <span className={`inline-flex items-center px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border-2 transition-all shadow-sm ${
                          student.status === 'Active' ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/20' :
                          student.status === 'Graduated' ? 'bg-blue-500/5 text-blue-500 border-blue-500/20' :
                          student.status === 'Suspended' ? 'bg-rose-500/5 text-rose-500 border-rose-500/20' :
                          'bg-slate-500/5 text-slate-500 border-slate-500/20'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full mr-2.5 ${
                            student.status === 'Active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                            student.status === 'Graduated' ? 'bg-blue-500' :
                            student.status === 'Suspended' ? 'bg-rose-500' :
                            'bg-slate-500'
                          }`} />
                          {student.status}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex justify-end items-center space-x-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                          <button onClick={() => handleViewStudent(student)} className="w-10 h-10 flex items-center justify-center bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:scale-110 active:scale-95 transition-all shadow-lg" title="View Student Profile"><Eye size={16} /></button>
                          <button onClick={() => handleOpenModal(student)} className="w-10 h-10 flex items-center justify-center bg-surface border border-border-muted text-slate-400 hover:text-indigo-600 hover:border-indigo-600 hover:bg-indigo-50 rounded-xl active:scale-95 transition-all shadow-sm" title="Edit Record"><Edit size={16} /></button>
                          <button onClick={() => handleDelete(student.id)} className="w-10 h-10 flex items-center justify-center bg-surface border border-border-muted text-slate-400 hover:text-rose-600 hover:border-rose-600 hover:bg-rose-50 rounded-xl active:scale-95 transition-all shadow-sm" title="Delete Record"><Trash2 size={16} /></button>
                        </div>
                        {/* More Menu for small screens could go here */}
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-8 py-48 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-8 border border-border-muted animate-pulse">
                          <Users className="text-slate-200 dark:text-slate-800" size={40} />
                        </div>
                        <p className="text-xl font-black text-slate-300 uppercase tracking-[0.4em] italic mb-4">No Students Found</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] max-w-xs leading-loose">
                           The student registry is currently empty. Add students to the registry to get started.
                        </p>
                        <button 
                          onClick={() => handleOpenModal()} 
                          className="mt-8 px-8 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-xl shadow-2xl hover:shadow-primary/40 transition-all"
                        >
                          Add Student
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>


      {/* Add/Edit Modal */}
      <AnimatePresence>
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-surface rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-border-muted"
          >
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-border-muted flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
              <div className="flex items-center space-x-4">
                 <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
                    <UserCheck size={22} />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold text-on-surface tracking-tight">
                      {editingStudent ? 'Edit Student Details' : 'Student Registration'}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">
                      Step {currentStep} of 4: <span className="text-primary italic">{currentStep === 1 ? 'Personal Details' : currentStep === 2 ? 'Parent/Guardian Info' : currentStep === 3 ? 'Academic Placement' : 'Other Details'}</span>
                    </p>
                 </div>
              </div>
              <button 
                onClick={handleCloseModal} 
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-on-surface transition-all"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Progress */}
            <div className="px-10 pt-8 shrink-0">
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4].map((step) => (
                  <React.Fragment key={step}>
                    <div className={`flex items-center justify-center w-10 h-10 rounded-xl border-2 transition-all duration-300 font-bold text-xs ${
                      currentStep >= step ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-surface border-border-muted text-slate-400'
                    }`}>
                      {currentStep > step ? <Check className="w-5 h-5" /> : step}
                    </div>
                    {step < 4 && (
                      <div className={`flex-1 h-1.5 rounded-full transition-all duration-500 overflow-hidden bg-slate-100 dark:bg-slate-800`}>
                         <div className={`h-full bg-primary transition-all duration-500 ${currentStep > step ? 'w-full' : 'w-0'}`} />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <form onSubmit={handleSubmit} className="p-10">
                <div className="min-h-[340px]">
                {currentStep === 1 && (
                  <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex flex-col sm:flex-row items-start gap-10">
                      <div className="relative group">
                        <div className="w-44 h-44 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-border-muted flex flex-col items-center justify-center text-slate-400 overflow-hidden hover:border-primary hover:bg-primary/5 transition-all cursor-pointer relative shadow-inner">
                          {formData.photoUrl ? (
                            <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                          ) : isCameraActive ? (
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-center p-4">
                              <Camera className="w-10 h-10 mb-3 mx-auto text-slate-300" />
                              <span className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">Take Photo</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-5">
                          {!isCameraActive ? (
                            <button 
                              type="button"
                              onClick={startCamera}
                              className="px-4 py-2 bg-slate-800 text-white text-[10px] font-bold rounded-xl hover:bg-primary uppercase tracking-[0.15em] transition-all"
                            >
                              Lens
                            </button>
                          ) : (
                            <button 
                              type="button"
                              onClick={capturePhoto}
                              className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-bold rounded-xl hover:bg-emerald-700 uppercase tracking-[0.15em] transition-all"
                            >
                              Snap
                            </button>
                          )}
                           <label className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 uppercase tracking-[0.15em] cursor-pointer transition-all border border-border-muted">
                            Import
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                          </label>
                        </div>
                      </div>
                      <div className="flex-1 w-full space-y-5">
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">First Name</label>
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            required
                            placeholder="John"
                            className="w-full px-5 py-3.5 bg-slate-50/50 dark:bg-slate-900/50 border border-border-muted rounded-2xl focus:ring-1 focus:ring-primary focus:border-primary outline-none font-bold text-sm transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Middle Name</label>
                          <input
                            type="text"
                            name="middleName"
                            value={formData.middleName}
                            onChange={handleInputChange}
                            placeholder="Fitzgerald"
                            className="w-full px-5 py-3.5 bg-slate-50/50 dark:bg-slate-900/50 border border-border-muted rounded-2xl focus:ring-1 focus:ring-primary focus:border-primary outline-none font-bold text-sm transition-all"
                          />
                        </div>
                         <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Last Name / Surname</label>
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            required
                            placeholder="Kennedy"
                            className="w-full px-5 py-3.5 bg-slate-50/50 dark:bg-slate-900/50 border border-border-muted rounded-2xl focus:ring-1 focus:ring-primary focus:border-primary outline-none font-bold text-sm transition-all"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Gender</label>
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                          className="w-full px-5 py-3.5 bg-slate-50/50 dark:bg-slate-900/50 border border-border-muted rounded-2xl focus:ring-1 focus:ring-primary focus:border-primary outline-none font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Date of Birth</label>
                        <input
                          type="date"
                          name="dateOfBirth"
                          value={formData.dateOfBirth}
                          onChange={handleInputChange}
                          className="w-full px-5 py-3.5 bg-slate-50/50 dark:bg-slate-900/50 border border-border-muted rounded-2xl focus:ring-1 focus:ring-primary focus:border-primary outline-none font-bold text-sm transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="bg-indigo-50/30 dark:bg-indigo-900/10 p-8 rounded-[2rem] border border-indigo-100 dark:border-indigo-500/10 shadow-inner">
                      <div className="flex items-center space-x-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                          <Users size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold text-on-surface text-lg tracking-tight">Parent / Guardian Details</h4>
                          <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-[0.2em] mt-0.5">Primary Contact Person</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Parent First Name</label>
                          <input
                            type="text"
                            name="parentFirstName"
                            value={formData.parentFirstName}
                            onChange={handleInputChange}
                            placeholder="Primary Contact First Name"
                            className="w-full px-5 py-3.5 bg-surface border border-border-muted rounded-2xl focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-sm transition-all shadow-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Parent Last Name</label>
                          <input
                            type="text"
                            name="parentLastName"
                            value={formData.parentLastName}
                            onChange={handleInputChange}
                            placeholder="Primary Contact Last Name"
                            className="w-full px-5 py-3.5 bg-surface border border-border-muted rounded-2xl focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-sm transition-all shadow-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-5">
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                          <div className="relative">
                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 font-bold" />
                            <input
                              type="email"
                              name="parentEmail"
                              value={formData.parentEmail}
                              onChange={handleInputChange}
                              className="w-full pl-12 pr-5 py-3.5 bg-surface border border-border-muted rounded-2xl focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-sm transition-all shadow-sm"
                              placeholder="parent@example.com"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                          <div className="relative">
                            <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 font-bold" />
                            <input
                              type="tel"
                              name="parentPhone"
                              value={formData.parentPhone}
                              onChange={handleInputChange}
                              className="w-full pl-12 pr-5 py-3.5 bg-surface border border-border-muted rounded-2xl focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-sm transition-all shadow-sm"
                              placeholder="+254 XXX XXX XXX"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 flex items-start space-x-3 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-500/10">
                         <Info size={16} className="text-indigo-600 mt-0.5 shrink-0" />
                         <p className="text-[10px] text-indigo-700 dark:text-indigo-400 font-medium leading-relaxed italic">
                           System automated: A secure access profile will be provisioned using the provided email for the parent portal.
                         </p>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Admission / ID Number</label>
                        <input
                          type="text"
                          name="registrationNumber"
                          value={formData.registrationNumber}
                          onChange={handleInputChange}
                          className="w-full px-5 py-3.5 bg-slate-50/50 dark:bg-slate-900/50 border border-border-muted rounded-2xl focus:ring-1 focus:ring-primary outline-none font-bold text-sm transition-all focus:border-primary shadow-inner"
                          placeholder="ADM-2026-XXXX"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Student Status</label>
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                          className="w-full px-5 py-3.5 bg-slate-50/50 dark:bg-slate-900/50 border border-border-muted rounded-2xl focus:ring-1 focus:ring-primary outline-none font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer shadow-inner"
                        >
                          <option value="Active">Operational Status: Active</option>
                          <option value="Graduated">Graduated</option>
                          <option value="Transferred">Transferred</option>
                          <option value="Suspended">Suspended</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Grade Level / Class</label>
                        <select
                          name="classLevelId"
                          value={formData.classLevelId}
                          onChange={handleInputChange}
                          className="w-full px-5 py-3.5 bg-slate-50/50 dark:bg-slate-900/50 border border-border-muted rounded-2xl focus:ring-1 focus:ring-primary outline-none font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer shadow-inner"
                        >
                          <option value="">Select Level</option>
                          {classLevels.map(cl => (
                            <option key={cl.id} value={cl.id}>{cl.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Section / Stream</label>
                        <select
                          name="sectionId"
                          value={formData.sectionId}
                          onChange={handleInputChange}
                          disabled={!formData.classLevelId}
                          className="w-full px-5 py-3.5 bg-slate-50/50 dark:bg-slate-900/50 border border-border-muted rounded-2xl focus:ring-1 focus:ring-primary outline-none font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer disabled:opacity-30 shadow-inner"
                        >
                          <option value="">Select Stream</option>
                          {availableSections.map(sec => (
                            <option key={sec.id} value={sec.id}>{sec.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Academic Year</label>
                      <select
                        name="academicYearId"
                        value={formData.academicYearId}
                        onChange={handleInputChange}
                        className="w-full px-5 py-3.5 bg-slate-50/50 dark:bg-slate-900/50 border border-border-muted rounded-2xl focus:ring-1 focus:ring-primary outline-none font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer shadow-inner"
                      >
                        <option value="">Select Year</option>
                        {academicYears.map(ay => (
                          <option key={ay.id} value={ay.id}>{ay.name} {ay.isCurrent ? '(Current Year)' : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-border-muted shadow-inner">
                      <div className="flex items-center space-x-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-white shadow-xl">
                          <MapPin size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold text-on-surface text-lg tracking-tight">Residence & Transport</h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">Contact Details & Logistics</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Home Address / Residence</label>
                          <div className="relative">
                            <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 font-bold" />
                            <input
                              type="text"
                              name="residence"
                              value={formData.residence}
                              onChange={handleInputChange}
                              className="w-full pl-12 pr-5 py-3.5 bg-surface border border-border-muted rounded-2xl focus:ring-1 focus:ring-on-surface outline-none font-bold text-sm transition-all shadow-sm"
                              placeholder="City, Area, Street"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Transport Route</label>
                          <div className="relative">
                            <Truck className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 font-bold" />
                            <select
                              name="transportRoute"
                              value={formData.transportRoute}
                              onChange={handleInputChange}
                              className="w-full pl-12 pr-5 py-3.5 bg-surface border border-border-muted rounded-2xl focus:ring-1 focus:ring-on-surface outline-none font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                            >
                              <option value="">No Transport Required</option>
                              <option value="Route A (North)">Route A (North)</option>
                              <option value="Route B (South)">Route B (South)</option>
                              <option value="Route C (East)">Route C (East)</option>
                              <option value="Route D (West)">Route D (West)</option>
                            </select>
                          </div>
                        </div>
                        <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 mt-4">
                           <p className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose text-center">
                             Please confirm transport details for student ID card generation.
                           </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-10 pt-8 border-t border-border-muted flex items-center justify-between">
                <div>
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(prev => prev - 1)}
                      className="flex items-center px-6 py-3 text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all active:scale-95 border border-border-muted shadow-sm"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Previous
                    </button>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-3 text-slate-400 hover:text-rose-500 font-bold uppercase tracking-widest text-[10px] transition-colors"
                  >
                    Cancel
                  </button>
                  {currentStep < 4 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (isCameraActive) stopCamera();
                        setCurrentStep(prev => prev + 1);
                      }}
                      className="flex items-center px-10 py-4 bg-slate-900 border border-slate-800 text-white rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] shadow-xl hover:bg-primary transition-all active:scale-95"
                    >
                      Next Step
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="flex items-center px-12 py-4 bg-primary text-white rounded-2xl font-bold uppercase tracking-[0.25em] text-[10px] shadow-2xl shadow-primary/30 hover:bg-primary/90 transition-all active:scale-95"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      {editingStudent ? 'Save Changes' : 'Register Student'}
                    </button>
                  )}
                </div>
              </div>
            </form>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* Bulk Status Update Modal */}
      <AnimatePresence>
      {isBulkStatusModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-surface rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-border-muted"
          >
            <div className="px-8 py-6 border-b border-border-muted flex justify-between items-center bg-indigo-50/50 dark:bg-indigo-900/50">
               <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-200 dark:border-indigo-500/20">
                     <ShieldCheck size={20} />
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-on-surface tracking-tight">Update Status</h3>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Bulk Status Management</p>
                  </div>
               </div>
               <button onClick={() => setIsBulkStatusModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-lg transition-all"><X size={18} /></button>
            </div>
            <div className="p-8">
              <div className="bg-indigo-50/30 dark:bg-indigo-900/10 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-500/10 mb-6">
                 <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest text-center">Updating status for {selectedStudentIds.length} Students</p>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">New Operational State</label>
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50/50 dark:bg-slate-900/50 border border-border-muted rounded-2xl focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer shadow-inner mb-6"
                >
                  <option value="Active">Active / Operational</option>
                  <option value="Graduated">Graduated / Alumnus</option>
                  <option value="Transferred">Sector / Outbound</option>
                  <option value="Suspended">Restricted / Holding</option>
                </select>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setIsBulkStatusModalOpen(false)}
                  className="flex-1 py-3.5 text-slate-400 hover:text-on-surface font-bold uppercase tracking-widest text-[10px] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleBulkUpdate('status')}
                  className="flex-1 py-3.5 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95"
                >
                  Apply State
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

       {/* Bulk Class Update Modal */}
       <AnimatePresence>
       {isBulkClassModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-surface rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-border-muted"
          >
            <div className="px-8 py-6 border-b border-border-muted flex justify-between items-center bg-primary/5">
               <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                     <RefreshCw size={20} />
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-on-surface tracking-tight">Level Re-assignment</h3>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Academic Grade Update</p>
                  </div>
               </div>
               <button onClick={() => setIsBulkClassModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-lg transition-all"><X size={18} /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 mb-2">
                 <p className="text-[10px] font-bold text-primary uppercase tracking-widest text-center">Batch Update: {selectedStudentIds.length} Students</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Target Academic Level</label>
                  <select
                    value={bulkClassData.classLevelId}
                    onChange={(e) => setBulkClassData({ ...bulkClassData, classLevelId: e.target.value, sectionId: '' })}
                    className="w-full px-5 py-3.5 bg-slate-50/50 dark:bg-slate-900/50 border border-border-muted rounded-2xl focus:ring-1 focus:ring-primary outline-none font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer shadow-inner"
                  >
                    <option value="">Select Target Level</option>
                    {classLevels.map(cl => (
                      <option key={cl.id} value={cl.id}>{cl.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Target Spectral Stream</label>
                  <select
                    value={bulkClassData.sectionId}
                    onChange={(e) => setBulkClassData({ ...bulkClassData, sectionId: e.target.value })}
                    className="w-full px-5 py-3.5 bg-slate-50/50 dark:bg-slate-900/50 border border-border-muted rounded-2xl focus:ring-1 focus:ring-primary outline-none font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer shadow-inner disabled:opacity-30"
                    disabled={!bulkClassData.classLevelId}
                  >
                    <option value="">Select Target Stream</option>
                    {bulkClassData.classLevelId && sections
                      .filter(s => s.classLevelId === bulkClassData.classLevelId)
                      .map(sec => (
                      <option key={sec.id} value={sec.id}>{sec.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setIsBulkClassModalOpen(false)}
                  className="flex-1 py-3.5 text-slate-400 hover:text-on-surface font-bold uppercase tracking-widest text-[10px] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleBulkUpdate('class')}
                  disabled={!bulkClassData.classLevelId}
                  className="flex-1 py-3.5 bg-primary text-white rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-30 disabled:shadow-none"
                >
                  Commit Relocation
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* Student Detail Modal */}
      <AnimatePresence>
      {isDetailModalOpen && viewingStudent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[120] p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-surface rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-border-muted flex flex-col max-h-[90vh]"
          >
            {/* Header / Banner */}
            <div className={`h-40 relative transition-all duration-700 ease-in-out ${showIdCard ? 'bg-slate-950' : 'bg-gradient-to-tr from-primary via-primary/90 to-indigo-700'}`}>
              {/* Decorative elements for the header */}
              <div className="absolute inset-0 overflow-hidden opacity-20">
                <div className="absolute -top-10 -right-10 w-64 h-64 bg-white/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-20 -left-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
              </div>

              <div className="absolute top-8 right-8 flex items-center space-x-3 z-20">
                <button 
                  onClick={() => setShowIdCard(!showIdCard)}
                  className={`px-5 py-2.5 rounded-xl flex items-center text-[10px] font-bold uppercase tracking-widest transition-all shadow-xl active:scale-95 ${
                    showIdCard ? 'bg-primary text-white' : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <Award className="w-4 h-4 mr-2" />
                  {showIdCard ? 'View Profile' : 'Generate ID Card'}
                </button>
                <button 
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    setShowIdCard(false);
                  }}
                  className="p-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-white transition-all active:scale-90"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {!showIdCard && (
              <div className="absolute -bottom-14 left-12 flex items-end justify-between right-12 z-10">
                <div className="flex items-end space-x-8">
                  <div className="w-36 h-36 rounded-[2.5rem] bg-surface shadow-2xl flex items-center justify-center border-8 border-surface overflow-hidden group">
                    {viewingStudent.photoUrl ? (
                      <img src={viewingStudent.photoUrl} alt="Student" className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500" />
                    ) : (
                      <div className="w-full h-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                        <User className="w-16 h-16 text-slate-200" />
                      </div>
                    )}
                  </div>
                  <div className="mb-6">
                    <h2 className="text-3xl font-black text-on-surface tracking-tight leading-none mb-3">
                      {viewingStudent.firstName} <span className="text-primary">{viewingStudent.lastName}</span>
                    </h2>
                    <div className="flex items-center space-x-3">
                        <p className="text-primary font-bold text-[10px] uppercase tracking-[0.25em] flex items-center bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20">
                          {viewingStudent.registrationNumber || 'Pending Assignment'}
                        </p>
                        <span className={`w-2 h-2 rounded-full animate-pulse ${viewingStudent.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    </div>
                  </div>
                </div>
                
                {/* Tab Navigation */}
                <div className="flex bg-white/10 backdrop-blur-md p-1 rounded-2xl border border-white/10 mb-6">
                   <button 
                    onClick={() => setActiveDetailTab('info')}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeDetailTab === 'info' ? 'bg-white text-slate-900 shadow-lg' : 'text-white/60 hover:text-white'}`}
                   >
                     Profile
                   </button>
                   <button 
                    onClick={() => setActiveDetailTab('behavior')}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeDetailTab === 'behavior' ? 'bg-white text-slate-900 shadow-lg' : 'text-white/60 hover:text-white'}`}
                   >
                     Discipline
                     {behaviorSummary.net !== 0 && (
                       <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${behaviorSummary.net > 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                         {Math.abs(behaviorSummary.net)}
                       </span>
                     )}
                   </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-12 pt-20">
            {showIdCard ? (
              // ... ID card code ...
              <div className="space-y-12 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex flex-col items-center">
                  <div id="id-card" className="w-[480px] h-[300px] bg-slate-900 rounded-[2.5rem] shadow-[0_30px_70px_-20px_rgba(0,0,0,0.5)] overflow-hidden relative flex flex-col p-8 border border-white/10 group select-none">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -mr-32 -mt-32 opacity-50 group-hover:opacity-80 transition-opacity duration-1000" />
                     <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-[80px] -ml-24 -mb-24 opacity-30 group-hover:opacity-60 transition-opacity duration-1000" />
                     <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                     <div className="flex items-start justify-between relative z-10 border-b border-white/5 pb-5 mb-6">
                        <div className="flex items-center space-x-4">
                           <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-slate-900 shadow-xl shadow-white/10">
                             <ShieldCheck size={20} />
                           </div>
                           <div>
                              <h3 className="text-[14px] font-black tracking-widest text-white uppercase italic">Academic Institution</h3>
                              <p className="text-[8px] font-bold text-primary uppercase tracking-[0.4em] mt-0.5">SaaSLink School ERP</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Session Data</div>
                           <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10">
                              <span className="text-[9px] font-bold text-white uppercase tracking-wider">2026 / 2027</span>
                           </div>
                        </div>
                     </div>
                     <div className="flex-1 flex gap-8 relative z-10">
                        <div className="w-32 h-36 rounded-3xl bg-slate-800/50 border border-white/10 overflow-hidden shadow-2xl relative">
                          {viewingStudent.photoUrl ? (
                            <img src={viewingStudent.photoUrl} alt="Photo" className="w-full h-full object-cover grayscale-[15%] group-hover:grayscale-0 transition-transform duration-700 group-hover:scale-110" />
                          ) : (
                            <User className="w-10 h-10 text-white/10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                          )}
                          <div className="absolute bottom-0 inset-x-0 h-1 bg-primary group-hover:h-2 transition-all duration-300" />
                        </div>
                        <div className="flex-1 flex flex-col justify-center space-y-5">
                           <div>
                              <h4 className="text-xl font-black text-white uppercase tracking-tight mb-1 group-hover:text-primary transition-colors">{viewingStudent.firstName} {viewingStudent.lastName}</h4>
                              <div className="flex items-center space-x-2">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                                <p className="text-[11px] text-white/60 font-bold uppercase tracking-[0.1em]">{viewingStudent.classLevel?.name || 'Class: Alpha'} <span className="text-primary/40 mx-1">•</span> {viewingStudent.section?.name || 'Stream: Sector 1'}</p>
                              </div>
                           </div>
                           <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-white/5 pt-5">
                              <div>
                                 <label className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] block mb-1">Registration No.</label>
                                 <p className="text-[11px] font-bold text-white tracking-widest">{viewingStudent.registrationNumber || 'PENDING'}</p>
                              </div>
                              <div>
                                 <label className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] block mb-1">Gender</label>
                                 <p className="text-[11px] font-bold text-white uppercase tracking-widest">{viewingStudent.gender || 'Unknown'}</p>
                              </div>
                              <div className="col-span-2">
                                 <label className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] block mb-1">Residence Address</label>
                                 <div className="flex items-center space-x-2">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                    <p className="text-[10px] font-bold text-white/80 truncate uppercase tracking-widest leading-none">
                                      {viewingStudent.residence || 'No Address Data'}
                                    </p>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
                  <div className="mt-12 flex flex-col items-center">
                    <p className="text-[11px] text-slate-400 font-medium max-w-sm text-center leading-relaxed italic">
                      "The above card represents the official identity of the enrolled student within the school management system."
                    </p>
                    <div className="flex items-center space-x-4 mt-10">
                      <button onClick={() => window.print()} className="px-10 py-4 bg-slate-900 border border-slate-800 text-white rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] flex items-center hover:bg-primary transition-all shadow-xl active:scale-95">
                        <Printer size={16} className="mr-3" />
                        Print ID Card
                      </button>
                      <button className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl border border-border-muted hover:text-on-surface transition-all active:scale-95">
                        <Download size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeDetailTab === 'info' ? (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                     <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] flex items-center">
                       <div className="w-1.5 h-1.5 bg-primary rounded-full mr-3" />
                       Academic Information
                      </h4>
                     <div className="space-y-4">
                        <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl border border-border-muted hover:border-primary/20 transition-all duration-300 group">
                          <div className="flex items-center space-x-5">
                            <div className="w-12 h-12 rounded-2xl bg-surface shadow-xl flex items-center justify-center text-primary group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500">
                              <GraduationCap size={24} />
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mb-1">Grade Level</p>
                              <p className="text-base font-black text-on-surface tracking-tight">{viewingStudent.classLevel?.name || 'Awaiting Placement'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl border border-border-muted hover:border-primary/20 transition-all duration-300 group">
                          <div className="flex items-center space-x-5">
                            <div className="w-12 h-12 rounded-2xl bg-surface shadow-xl flex items-center justify-center text-primary group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                              <Search size={24} />
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mb-1">Current Section</p>
                              <p className="text-base font-black text-on-surface tracking-tight">{viewingStudent.section?.name || 'Unassigned Section'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl border border-border-muted hover:border-primary/20 transition-all duration-300 group">
                          <div className="flex items-center space-x-5">
                            <div className="w-12 h-12 rounded-2xl bg-surface shadow-xl flex items-center justify-center text-primary group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                              <Calendar size={24} />
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mb-1">Enrollment Year</p>
                              <p className="text-base font-black text-on-surface tracking-tight">Academic Year 2026</p>
                            </div>
                          </div>
                        </div>
                     </div>
                  </div>
                  <div className="space-y-8">
                     <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] flex items-center">
                       <div className="w-1.5 h-1.5 bg-primary rounded-full mr-3" />
                       Transport & Logistics
                      </h4>
                     <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-border-muted space-y-8 relative overflow-hidden shadow-inner">
                        <div className="absolute -bottom-8 -right-8 opacity-[0.03] select-none pointer-events-none">
                          <Truck size={140} className="rotate-12" />
                        </div>
                        <div className="flex items-start space-x-5 relative z-10">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                             <MapPin size= {22} />
                          </div>
                          <div>
                             <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-[0.2em] mb-1">Home Address</p>
                             <p className="text-on-surface font-black tracking-tight">{viewingStudent.residence || 'No Address Provided'}</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-5 relative z-10">
                          <div className="w-12 h-12 rounded-2xl bg-surface dark:bg-slate-800 flex items-center justify-center text-primary shadow-lg ring-1 ring-border-muted">
                             <Truck size={22} />
                          </div>
                          <div>
                             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-1">Transport Route</p>
                             <p className="text-on-surface font-bold text-sm tracking-tight">{viewingStudent.transportRoute || 'No Transport Route'}</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-5 border-t border-border-muted pt-8 relative z-10">
                          <div className="w-12 h-12 rounded-2xl bg-surface dark:bg-slate-800 flex items-center justify-center text-emerald-500 shadow-lg ring-1 ring-border-muted">
                             <Phone size={22} />
                          </div>
                          <div className="flex-1">
                             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-1">Emergency Contact</p>
                             <div className="flex justify-between items-center">
                               <p className="text-on-surface font-bold text-sm tracking-tight">{viewingStudent.parentPhone || 'No phone registered'}</p>
                               <button className="text-[10px] font-black text-primary uppercase tracking-widest underline decoration-2 underline-offset-4">Call</button>
                             </div>
                          </div>
                        </div>
                     </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-900 dark:bg-slate-950 p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group shadow-2xl">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
                  <div className="flex items-center space-x-6 relative z-10 mb-6 sm:mb-0">
                    <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500 shadow-xl shadow-emerald-500/10 border border-emerald-500/30">
                       <ShieldCheck size={28} />
                    </div>
                    <div>
                       <p className="text-lg font-black text-white tracking-tight">Verified Student</p>
                       <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] mt-1">Last System Update: Apr 24, 2026</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      handleOpenModal(viewingStudent);
                    }}
                    className="px-10 py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center hover:bg-primary hover:text-white transition-all active:scale-95 relative z-10 shadow-2xl"
                  >
                    <Edit className="w-4 h-4 mr-3" />
                    Edit Student Profile
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                 {/* Behavior Summary Cards */}
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-emerald-500/5 border border-emerald-500/20 p-8 rounded-[2rem] flex flex-col items-center text-center">
                       <Award size={32} className="text-emerald-500 mb-4" />
                       <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Merits Earned</p>
                       <p className="text-4xl font-black text-on-surface italic tracking-tight">{behaviorSummary.merits}</p>
                    </div>
                    <div className="bg-rose-500/5 border border-rose-500/20 p-8 rounded-[2rem] flex flex-col items-center text-center shadow-lg">
                       <AlertTriangle size={32} className="text-rose-500 mb-4" />
                       <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Demerits Issued</p>
                       <p className="text-4xl font-black text-on-surface italic tracking-tight">{behaviorSummary.demerits}</p>
                    </div>
                    <div className="bg-slate-900 p-8 rounded-[2rem] flex flex-col items-center text-center shadow-2xl">
                       <Activity size={32} className="text-white opacity-40 mb-4" />
                       <p className="text-[10px] font-black text-white opacity-40 uppercase tracking-widest mb-1">Net Standing</p>
                       <p className={`text-4xl font-black italic tracking-tight ${behaviorSummary.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                         {behaviorSummary.net > 0 ? '+' : ''}{behaviorSummary.net}
                       </p>
                    </div>
                 </div>

                 {/* Behavior Timeline */}
                 <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10">
                    <div className="flex justify-between items-center mb-10">
                       <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] italic">Disciplinary Timeline</h4>
                       <button className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                         <Plus size={14} />
                         Add Record
                       </button>
                    </div>

                    <div className="space-y-6 relative">
                       {/* Center Line */}
                       <div className="absolute left-[23px] top-0 bottom-0 w-[2px] bg-slate-50 dark:bg-slate-800" />
                       
                       {behaviorLoading ? (
                         <div className="flex justify-center py-12">
                           <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                         </div>
                       ) : behaviorRecords.length > 0 ? (
                         behaviorRecords.map((record, i) => (
                           <div key={record.id} className="flex gap-6 relative z-10 group hover:-translate-x-1 transition-transform">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                                record.type === 'MERIT' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                              }`}>
                                {record.type === 'MERIT' ? <Award size={20} /> : <AlertTriangle size={20} />}
                              </div>
                              <div className="flex-1 bg-slate-50/50 dark:bg-slate-900/50 p-6 rounded-3xl border border-gray-100 transition-colors group-hover:border-primary/20">
                                 <div className="flex justify-between items-start mb-2">
                                    <h5 className="font-black text-gray-900 group-hover:text-primary transition-colors">{record.description}</h5>
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{new Date(record.date).toLocaleDateString()}</span>
                                 </div>
                                 <p className="text-xs text-gray-500 font-medium leading-relaxed italic">
                                   Points Impact: <span className={record.type === 'MERIT' ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>{record.points}</span>
                                 </p>
                                 <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Reported by: {record.reporter || 'System'}</span>
                                    <MoreVertical size={12} className="text-gray-300" />
                                 </div>
                              </div>
                           </div>
                         ))
                       ) : (
                         <div className="py-20 text-center flex flex-col items-center">
                            <Shield className="text-slate-100 mb-6" size={64} />
                            <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Exemplary Record</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2">No behavioral infractions or merits logged.</p>
                         </div>
                       )}
                    </div>
                 </div>
              </div>
            )}
          </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

    </div>
  );
};

export default StudentsPage;

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
  AlertTriangle,
  LayoutGrid,
  List,
  ChevronDown
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
        <div className="flex flex-col items-center">
          <Activity className="animate-spin text-primary mb-4" size={40} />
          <p className="text-sm font-semibold text-slate-500">Loading registry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-page-bg pb-20 font-body selection:bg-brand-green/10 selection:text-brand-green">
      {/* Top Navigation */}
      <div className="bg-brand-green-dark relative overflow-hidden">
        <div className="max-w-[1600px] mx-auto px-8 py-10 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center space-x-2 text-[11px] font-display font-bold text-brand-gold uppercase tracking-[0.1em] mb-3">
                 <Shield size={12} />
                 <span>Student Information System</span>
              </div>
              <h1 className="text-[36px] font-display font-extrabold text-white tracking-[-0.02em] mb-2 leading-tight">
                Student Registry
              </h1>
              <p className="text-white/80 text-[14px] font-body max-w-xl">
                Manage student records, academic data, and institutional enrollment.
              </p>
            </motion.div>
            
            <div className="flex items-center gap-6">
               <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleOpenModal()}
                className="btn-prop-primary flex items-center shadow-none h-12 px-6"
               >
                  <Plus size={18} className="mr-2" />
                  New Registration
               </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-8 pt-12">

        {/* Advanced Data Filters */}
        <div className="bg-white border border-brand-border rounded-[12px] p-4 flex flex-wrap lg:flex-nowrap items-center gap-4 mb-10 shadow-none relative z-20">
           <div className="relative group w-full lg:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-charcoal/40 group-focus-within:text-brand-green transition-colors" />
              <input
                type="text"
                placeholder="Search by name or registration number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-3 bg-brand-green-tint border border-brand-border rounded-[8px] text-[14px] font-body focus:ring-1 focus:ring-brand-green outline-none transition-all w-full"
              />
           </div>

           <div className="h-10 w-px bg-brand-border hidden lg:block" />

           <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center px-4 py-2 border border-brand-border rounded-[8px] space-x-3 bg-brand-green-tint">
                 <GraduationCap size={16} className="text-brand-green" />
                 <select 
                   value={filterClassId}
                   onChange={(e) => {
                     setFilterClassId(e.target.value);
                     setFilterSectionId('');
                   }}
                   className="bg-transparent text-[11px] font-display font-bold uppercase tracking-wider outline-none cursor-pointer text-brand-green min-w-[140px]"
                 >
                   <option value="">Classes (All)</option>
                   {classLevels.map(cl => (
                     <option key={cl.id} value={cl.id}>{cl.name}</option>
                   ))}
                 </select>
              </div>

              <div className="flex items-center px-4 py-2 border border-brand-border rounded-[8px] space-x-3 bg-brand-green-tint">
                 <Filter size={16} className="text-brand-green" />
                 <select 
                   value={filterSectionId}
                   onChange={(e) => setFilterSectionId(e.target.value)}
                   disabled={!filterClassId}
                   className="bg-transparent text-[11px] font-display font-bold uppercase tracking-wider outline-none cursor-pointer text-brand-green min-w-[140px] disabled:opacity-30"
                 >
                   <option value="">Sections (All)</option>
                   {sections.filter(s => s.classLevelId === filterClassId).map(sec => (
                     <option key={sec.id} value={sec.id}>{sec.name}</option>
                   ))}
                 </select>
              </div>
           </div>

           {(filterClassId || filterSectionId || searchQuery) && (
             <button 
               onClick={() => {
                 setFilterClassId('');
                 setFilterSectionId('');
                 setSearchQuery('');
               }}
               className="px-4 py-2 text-xs font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-2 transition-colors ml-auto group"
             >
               <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
               Reset Search
             </button>
           )}
           
           {!filterClassId && !filterSectionId && !searchQuery && (
              <div className="ml-auto flex items-center space-x-6 pr-4">
                 <div className="flex flex-col items-end">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">System Link</span>
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Active</span>
                 </div>
                 <div className="w-px h-8 bg-border-muted" />
                 <Filter size={18} className="text-slate-300" />
              </div>
           )}
        </div>

        <AnimatePresence mode="wait">
        {selectedStudentIds.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-8"
          >
            <div className="bg-slate-900 p-5 flex items-center justify-between rounded-2xl shadow-lg border border-slate-800 relative z-10">
              <div className="flex items-center space-x-6 px-4">
                <div className="w-10 h-10 bg-primary rounded-xl text-white font-bold text-base flex items-center justify-center shadow-lg">
                  {selectedStudentIds.length}
                </div>
                <div>
                  <p className="text-white text-xs font-bold uppercase tracking-wider">Bulk Actions</p>
                  <p className="text-slate-400 text-[10px] font-medium tracking-wide">Update selected students status or class placement</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsBulkStatusModalOpen(true)}
                  className="px-6 py-3 bg-slate-800 text-white hover:bg-slate-700 transition-all text-[10px] font-bold uppercase tracking-wider rounded-xl flex items-center gap-2"
                >
                  <ShieldCheck size={14} />
                  Status
                </button>
                <button
                  onClick={() => setIsBulkClassModalOpen(true)}
                  className="px-6 py-3 bg-slate-800 text-white hover:bg-slate-700 transition-all text-[10px] font-bold uppercase tracking-wider rounded-xl flex items-center gap-2"
                >
                  <RefreshCw size={14} />
                  Class
                </button>
                <button
                  onClick={() => setSelectedStudentIds([])}
                  className="px-4 py-3 text-xs font-bold text-slate-500 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>

        <div className="bg-white border border-brand-border rounded-[12px] overflow-hidden mb-20">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-green-tint border-b border-brand-border">
                  <th className="px-8 py-6 text-[11px] font-display font-bold text-brand-green uppercase tracking-[0.05em] w-16">
                    <div className="flex justify-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-brand-border text-brand-green focus:ring-brand-green/20 cursor-pointer"
                        checked={selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0}
                        onChange={handleSelectAll}
                      />
                    </div>
                  </th>
                  <th className="px-6 py-6 text-[11px] font-display font-bold text-brand-green uppercase tracking-[0.05em]">Student Name</th>
                  <th className="px-6 py-6 text-[11px] font-display font-bold text-brand-green uppercase tracking-[0.05em] text-center">Registration ID</th>
                  <th className="px-6 py-6 text-[11px] font-display font-bold text-brand-green uppercase tracking-[0.05em]">Grade / Level</th>
                  <th className="px-6 py-6 text-[11px] font-display font-bold text-brand-green uppercase tracking-[0.05em]">Status</th>
                  <th className="px-8 py-6 text-right text-[11px] font-display font-bold text-brand-green uppercase tracking-[0.05em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student, index) => (
                    <motion.tr 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      key={student.id} 
                      className={`hover:bg-brand-green-tint/50 transition-all group ${selectedStudentIds.includes(student.id) ? 'bg-brand-green-tint' : ''}`}
                    >
                      <td className="px-8 py-4">
                        <div className="flex justify-center">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-brand-border text-brand-green focus:ring-brand-green/20 cursor-pointer"
                            checked={selectedStudentIds.includes(student.id)}
                            onChange={(e) => handleSelectStudent(student.id, e.target.checked)}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 rounded-[8px] shrink-0 border border-brand-border flex items-center justify-center bg-brand-green-tint overflow-hidden shadow-none">
                            {student.photoUrl ? (
                              <img src={student.photoUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-brand-green font-display font-bold text-[14px]">
                                {student.firstName.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-[14px] font-body font-medium text-brand-charcoal group-hover:text-brand-green transition-colors">{student.firstName} {student.lastName}</p>
                            <p className="text-[11px] font-body text-brand-charcoal/50 uppercase tracking-wider">{student.gender || 'Unknown'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-body text-[12px] text-brand-charcoal/70 bg-brand-green-tint px-3 py-1 rounded-[4px] border border-brand-border tracking-wider">
                          {student.registrationNumber || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                           <span className="font-display font-bold text-brand-green text-[12px] uppercase">{student.classLevel?.name || 'Unassigned'}</span>
                           {student.section && (
                             <span className="text-[11px] font-body text-brand-charcoal/60">Section: {student.section.name}</span>
                           )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-[20px] text-[10px] font-body font-medium uppercase tracking-[0.05em] border ${
                          student.status === 'Active' ? 'bg-brand-green-tint text-brand-green border-brand-border' :
                          student.status === 'Suspended' ? 'bg-brand-danger/10 text-brand-danger border-brand-danger/20' :
                          'bg-brand-gold/10 text-brand-gold border-brand-gold/20'
                        }`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <div className="flex justify-end items-center space-x-2">
                          <button onClick={() => handleViewStudent(student)} className="p-2 border border-brand-border rounded-[6px] text-brand-green hover:bg-brand-green-tint transition-all" title="View Profile"><Eye size={16} /></button>
                          <button onClick={() => handleOpenModal(student)} className="p-2 border border-brand-border rounded-[6px] text-brand-gold hover:bg-brand-gold/10 transition-all" title="Edit Record"><Edit size={16} /></button>
                          <button onClick={() => handleDelete(student.id)} className="p-2 border border-brand-border rounded-[6px] text-brand-danger hover:bg-brand-danger/10 transition-all" title="Delete Record"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-8 py-32 text-center">
                      <div className="flex flex-col items-center">
                        <Users className="text-brand-green/20 mb-4" size={48} />
                        <p className="text-[18px] font-display font-bold text-brand-green mb-2">No Students Found</p>
                        <p className="text-[14px] text-brand-charcoal/60 max-w-xs mb-8">
                           The student registry is currently empty or no results match your search.
                        </p>
                        <button 
                          onClick={() => handleOpenModal()} 
                          className="btn-prop-primary"
                        >
                          Add student
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
            className="bg-white rounded-[24px] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.3)] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-brand-border"
          >
            {/* Modal Header */}
            <div className="px-10 py-8 border-b border-brand-border flex justify-between items-center bg-brand-green-tint/50 shrink-0">
              <div className="flex items-center space-x-5">
                 <div className="w-14 h-14 bg-white rounded-[12px] flex items-center justify-center text-brand-green border border-brand-border shadow-sm">
                    <UserCheck size={24} />
                 </div>
                <div>
                    <h3 className="text-[24px] font-display font-bold text-brand-green tracking-tight leading-none">
                      {editingStudent ? 'Edit Student' : 'Student Registration'}
                    </h3>
                    <p className="text-[12px] text-brand-charcoal/50 font-body font-bold uppercase tracking-widest mt-2 flex items-center">
                      <span className="w-1.5 h-1.5 bg-brand-gold rounded-full mr-2" />
                      Phase {currentStep} of 4: <span className="text-brand-green ml-1">{currentStep === 1 ? 'Personal Profile' : currentStep === 2 ? 'Guardian Liaison' : currentStep === 3 ? 'Academic Placement' : 'Institutional Data'}</span>
                    </p>
                 </div>
              </div>
               <button 
                onClick={handleCloseModal} 
                className="w-10 h-10 flex items-center justify-center bg-white border border-brand-border rounded-[8px] text-brand-charcoal/30 hover:text-brand-danger hover:border-brand-danger transition-all shadow-sm group"
                type="button"
              >
                <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            {/* Stepper Progress */}
            <div className="px-10 pt-10 pb-2 shrink-0">
              <div className="flex items-center">
                {[1, 2, 3, 4].map((step) => (
                  <React.Fragment key={step}>
                    <div className="flex flex-col items-center relative">
                      <div 
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-[14px] transition-all duration-500 border-2 ${
                          currentStep === step 
                            ? 'bg-brand-green text-white border-brand-green shadow-lg shadow-brand-green/20' 
                            : currentStep > step 
                              ? 'bg-brand-green-tint text-brand-green border-brand-green/30 px-0' 
                              : 'bg-white text-brand-charcoal/20 border-brand-border'
                        }`}
                      >
                        {currentStep > step ? <Check size={18} /> : step}
                      </div>
                    </div>
                    {step < 4 && (
                      <div className="flex-1 px-4">
                        <div className="h-[2px] w-full bg-brand-border rounded-full overflow-hidden">
                           <div 
                             className="h-full bg-brand-green transition-all duration-700" 
                             style={{ width: currentStep > step ? '100%' : '0%' }}
                           />
                        </div>
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
                    <div className="flex flex-col sm:flex-row items-center gap-10">
                      <div className="relative group">
                        <div className="w-44 h-44 rounded-[12px] bg-brand-green-tint border-2 border-dashed border-brand-border flex flex-col items-center justify-center text-brand-charcoal/40 overflow-hidden hover:border-brand-green transition-all cursor-pointer relative shadow-inner">
                          {formData.photoUrl ? (
                            <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                          ) : isCameraActive ? (
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-center p-4">
                              <Camera className="w-8 h-8 mb-2 mx-auto text-brand-green/30" />
                              <span className="text-[11px] font-display font-bold uppercase tracking-wider">Take Photo</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-4">
                          {!isCameraActive ? (
                            <button 
                              type="button"
                               onClick={startCamera}
                              className="px-4 py-2 bg-brand-green-dark text-white text-[11px] font-body font-medium rounded-[6px] hover:bg-brand-green uppercase tracking-wider transition-all"
                            >
                              Camera
                            </button>
                          ) : (
                            <button 
                              type="button"
                              onClick={capturePhoto}
                              className="px-4 py-2 bg-brand-green text-white text-[11px] font-body font-medium rounded-[6px] hover:bg-brand-green-dark uppercase tracking-wider transition-all"
                            >
                              Capture
                            </button>
                          )}
                           <label className="px-4 py-2 bg-white text-brand-green text-[11px] font-body font-medium rounded-[6px] hover:bg-brand-green-tint uppercase tracking-wider cursor-pointer transition-all border border-brand-green">
                            Upload
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                          </label>
                        </div>
                      </div>
                      <div className="flex-1 w-full space-y-4">
                        <div className="space-y-1.5">
                          <label className="block text-[12px] font-body font-medium text-brand-charcoal/70 uppercase ml-1">First Name</label>
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            required
                            placeholder="Student First Name"
                            className="w-full px-4 py-3 bg-brand-green-tint border border-brand-border rounded-[8px] focus:ring-1 focus:ring-brand-green outline-none font-body text-[14px] transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[12px] font-body font-medium text-brand-charcoal/70 uppercase ml-1">Middle Name</label>
                          <input
                            type="text"
                            name="middleName"
                            value={formData.middleName}
                            onChange={handleInputChange}
                            placeholder="Optional"
                            className="w-full px-4 py-3 bg-brand-green-tint border border-brand-border rounded-[8px] focus:ring-1 focus:ring-brand-green outline-none font-body text-[14px] transition-all"
                          />
                        </div>
                         <div className="space-y-1.5">
                          <label className="block text-[12px] font-body font-medium text-brand-charcoal/70 uppercase ml-1">Last Name / Surname</label>
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            required
                            placeholder="Student Last Name"
                            className="w-full px-4 py-3 bg-brand-green-tint border border-brand-border rounded-[8px] focus:ring-1 focus:ring-brand-green outline-none font-body text-[14px] transition-all"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="block text-[12px] font-body font-medium text-brand-charcoal/70 uppercase ml-1">Gender</label>
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-brand-green-tint border border-brand-border rounded-[8px] focus:ring-1 focus:ring-brand-green outline-none font-display font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[12px] font-body font-medium text-brand-charcoal/70 uppercase ml-1">Date of Birth</label>
                        <input
                          type="date"
                          name="dateOfBirth"
                          value={formData.dateOfBirth}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-brand-green-tint border border-brand-border rounded-[8px] focus:ring-1 focus:ring-brand-green outline-none font-body text-[14px] transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="bg-brand-green-tint p-8 rounded-[12px] border border-brand-border">
                      <div className="flex items-center space-x-4 mb-8">
                        <div className="w-12 h-12 rounded-[8px] bg-brand-green flex items-center justify-center text-white">
                          <Users size={22} />
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-brand-green text-[18px]">Parent / Guardian</h4>
                          <p className="text-[11px] text-brand-green/60 font-body font-bold uppercase tracking-wider mt-0.5">Primary Contact</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-1.5">
                          <label className="block text-[12px] font-body font-medium text-brand-charcoal/70 uppercase ml-1">First Name</label>
                          <input
                            type="text"
                            name="parentFirstName"
                            value={formData.parentFirstName}
                            onChange={handleInputChange}
                            placeholder="Guardian First Name"
                            className="w-full px-4 py-3 bg-white border border-brand-border rounded-[8px] focus:ring-1 focus:ring-brand-green outline-none font-body text-[14px] transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[12px] font-body font-medium text-brand-charcoal/70 uppercase ml-1">Last Name</label>
                          <input
                            type="text"
                            name="parentLastName"
                            value={formData.parentLastName}
                            onChange={handleInputChange}
                            placeholder="Guardian Last Name"
                            className="w-full px-4 py-3 bg-white border border-brand-border rounded-[8px] focus:ring-1 focus:ring-brand-green outline-none font-body text-[14px] transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-5">
                        <div className="space-y-1.5">
                          <label className="block text-[12px] font-body font-medium text-brand-charcoal/70 uppercase ml-1">Email Address</label>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-charcoal/40" />
                            <input
                              type="email"
                                name="parentEmail"
                              value={formData.parentEmail}
                              onChange={handleInputChange}
                                className="w-full pl-11 pr-4 py-3 bg-white border border-brand-border rounded-[8px] focus:ring-1 focus:ring-brand-green outline-none font-body text-[14px] transition-all"
                              placeholder="parent@example.com"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[12px] font-body font-medium text-brand-charcoal/70 uppercase ml-1">Phone Number</label>
                          <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-charcoal/40" />
                            <input
                              type="tel"
                                name="parentPhone"
                              value={formData.parentPhone}
                              onChange={handleInputChange}
                                className="w-full pl-11 pr-4 py-3 bg-white border border-brand-border rounded-[8px] focus:ring-1 focus:ring-brand-green outline-none font-body text-[14px] transition-all"
                                placeholder="+254 XXX XXX XXX"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="space-y-1.5">
                        <label className="block text-[12px] font-body font-medium text-brand-charcoal/70 uppercase ml-1">Admission Number</label>
                        <input
                          type="text"
                          name="registrationNumber"
                          value={formData.registrationNumber}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-brand-green-tint border border-brand-border rounded-[8px] focus:ring-1 focus:ring-brand-green outline-none font-body text-[14px] transition-all"
                          placeholder="ADM-2026-000"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[12px] font-body font-medium text-brand-charcoal/70 uppercase ml-1">Status</label>
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-brand-green-tint border border-brand-border rounded-[8px] focus:ring-1 focus:ring-brand-green outline-none font-display font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer"
                        >
                          <option value="Active">Active</option>
                          <option value="Graduated">Graduated</option>
                          <option value="Transferred">Transferred</option>
                          <option value="Suspended">Suspended</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="space-y-1.5">
                        <label className="block text-[12px] font-body font-medium text-brand-charcoal/70 uppercase ml-1">Class Level</label>
                        <select
                          name="classLevelId"
                          value={formData.classLevelId}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-brand-green-tint border border-brand-border rounded-[8px] focus:ring-1 focus:ring-brand-green outline-none font-display font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer"
                        >
                          <option value="">Select Level</option>
                          {classLevels.map(cl => (
                            <option key={cl.id} value={cl.id}>{cl.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[12px] font-body font-medium text-brand-charcoal/70 uppercase ml-1">Section / Stream</label>
                        <select
                          name="sectionId"
                          value={formData.sectionId}
                          onChange={handleInputChange}
                          disabled={!formData.classLevelId}
                          className="w-full px-4 py-3 bg-brand-green-tint border border-brand-border rounded-[8px] focus:ring-1 focus:ring-brand-green outline-none font-display font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer disabled:opacity-30"
                        >
                          <option value="">Select Stream</option>
                          {availableSections.map(sec => (
                            <option key={sec.id} value={sec.id}>{sec.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[12px] font-body font-medium text-brand-charcoal/70 uppercase ml-1">Academic Year</label>
                      <select
                        name="academicYearId"
                        value={formData.academicYearId}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-brand-green-tint border border-brand-border rounded-[8px] focus:ring-1 focus:ring-brand-green outline-none font-display font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer"
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
                    <div className="bg-brand-green-tint p-8 rounded-[12px] border border-brand-border">
                      <div className="flex items-center space-x-4 mb-8">
                        <div className="w-12 h-12 rounded-[8px] bg-brand-green flex items-center justify-center text-white">
                          <MapPin size={22} />
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-brand-green text-[18px]">Logistics</h4>
                          <p className="text-[11px] text-brand-charcoal/60 font-body font-bold uppercase tracking-wider mt-0.5">Residence & Transport</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-1.5">
                          <label className="block text-[12px] font-body font-medium text-brand-charcoal/70 uppercase ml-1">Home Address</label>
                          <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-charcoal/40" />
                            <input
                              type="text"
                              name="residence"
                              value={formData.residence}
                              onChange={handleInputChange}
                              className="w-full pl-11 pr-4 py-3 bg-white border border-brand-border rounded-[8px] focus:ring-1 focus:ring-brand-green outline-none font-body text-[14px] transition-all"
                              placeholder="City, Street, Building"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[12px] font-body font-medium text-brand-charcoal/70 uppercase ml-1">Transport Route</label>
                          <div className="relative">
                            <Truck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-charcoal/40" />
                            <select
                              name="transportRoute"
                              value={formData.transportRoute}
                              onChange={handleInputChange}
                              className="w-full pl-11 pr-4 py-3 bg-white border border-brand-border rounded-[8px] focus:ring-1 focus:ring-brand-green outline-none font-display font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer"
                            >
                              <option value="">None</option>
                              <option value="Route A">Route A (North)</option>
                              <option value="Route B">Route B (South)</option>
                              <option value="Route C">Route C (East)</option>
                              <option value="Route D">Route D (West)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-auto px-10 py-8 bg-brand-green-tint/30 border-t border-brand-border flex items-center justify-between shrink-0">
                <div>
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(prev => prev - 1)}
                      className="btn-prop-outline px-6"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Back
                    </button>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="btn-prop-outline text-brand-charcoal/40 hover:text-brand-danger hover:border-brand-danger px-6 border-transparent"
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
                      className="btn-prop-primary px-10 shadow-lg shadow-brand-green/20"
                    >
                      Continue
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="btn-prop-primary px-12 shadow-lg shadow-brand-green/20"
                    >
                      {editingStudent ? <Edit className="w-4 h-4 mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                      {editingStudent ? 'Update Profile' : 'Finalize Registration'}
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
            <div className="px-8 py-6 border-b border-brand-border flex justify-between items-center bg-brand-green-tint">
               <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white rounded-[8px] flex items-center justify-center text-brand-green border border-brand-border">
                     <ShieldCheck size={20} />
                  </div>
                  <div>
                     <h3 className="text-[18px] font-display font-bold text-brand-green tracking-tight">Update Status</h3>
                     <p className="text-[11px] text-brand-charcoal/60 font-body uppercase tracking-widest">Bulk Status Management</p>
                  </div>
               </div>
               <button onClick={() => setIsBulkStatusModalOpen(false)} className="p-2 hover:bg-brand-green/10 text-brand-charcoal/40 rounded-full transition-all"><X size={18} /></button>
            </div>
            <div className="p-8">
              <div className="bg-brand-green-tint p-5 rounded-[12px] border border-brand-border mb-6">
                 <p className="text-[11px] font-body font-bold text-brand-green uppercase tracking-widest text-center">Updating status for {selectedStudentIds.length} Students</p>
              </div>
              <div className="space-y-4">
                <label className="block text-[12px] font-body font-medium text-brand-charcoal/70 uppercase ml-1">New Operational State</label>
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-brand-green-tint border border-brand-border rounded-[8px] focus:ring-1 focus:ring-brand-green outline-none font-display font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer mb-6"
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
                  className="flex-1 py-3.5 text-brand-charcoal/40 hover:text-brand-danger font-display font-bold uppercase tracking-widest text-[11px] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleBulkUpdate('status')}
                  className="btn-prop-primary flex-1"
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
            <div className="px-8 py-6 border-b border-brand-border flex justify-between items-center bg-brand-green-tint">
               <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white rounded-[8px] flex items-center justify-center text-brand-green border border-brand-border">
                     <RefreshCw size={20} />
                  </div>
                  <div>
                     <h3 className="text-[18px] font-display font-bold text-brand-green tracking-tight">Level Re-assignment</h3>
                     <p className="text-[11px] text-brand-charcoal/60 font-body uppercase tracking-widest">Academic Grade Update</p>
                  </div>
               </div>
               <button onClick={() => setIsBulkClassModalOpen(false)} className="p-2 hover:bg-brand-green/10 text-brand-charcoal/40 rounded-full transition-all"><X size={18} /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="bg-brand-green-tint p-4 rounded-[12px] border border-brand-border mb-2">
                 <p className="text-[11px] font-body font-bold text-brand-green uppercase tracking-widest text-center">Batch Update: {selectedStudentIds.length} Students</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-[12px] font-body font-medium text-brand-charcoal/70 uppercase ml-1">Target Academic Level</label>
                  <select
                    value={bulkClassData.classLevelId}
                    onChange={(e) => setBulkClassData({ ...bulkClassData, classLevelId: e.target.value, sectionId: '' })}
                    className="w-full px-4 py-3 bg-brand-green-tint border border-brand-border rounded-[8px] focus:ring-1 focus:ring-brand-green outline-none font-display font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer"
                  >
                    <option value="">Select Target Level</option>
                    {classLevels.map(cl => (
                      <option key={cl.id} value={cl.id}>{cl.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-[12px] font-body font-medium text-brand-charcoal/70 uppercase ml-1">Target Spectral Stream</label>
                  <select
                    value={bulkClassData.sectionId}
                    onChange={(e) => setBulkClassData({ ...bulkClassData, sectionId: e.target.value })}
                    className="w-full px-4 py-3 bg-brand-green-tint border border-brand-border rounded-[8px] focus:ring-1 focus:ring-brand-green outline-none font-display font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer disabled:opacity-30"
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
                  className="flex-1 py-3.5 text-brand-charcoal/40 hover:text-brand-danger font-display font-bold uppercase tracking-widest text-[11px] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleBulkUpdate('class')}
                  disabled={!bulkClassData.classLevelId}
                  className="btn-prop-primary flex-1 disabled:opacity-30 disabled:shadow-none"
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
            <div className={`h-40 relative transition-all duration-700 ease-in-out ${showIdCard ? 'bg-brand-green-dark' : 'bg-brand-green'}`}>
              {/* Decorative elements for the header */}
              <div className="absolute inset-0 overflow-hidden opacity-10">
                <div className="absolute -top-10 -right-10 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-20 -left-10 w-48 h-48 bg-white rounded-full blur-2xl" />
              </div>

              <div className="absolute top-8 right-8 flex items-center space-x-3 z-20">
                <button 
                  onClick={() => setShowIdCard(!showIdCard)}
                  className={`px-5 py-2.5 rounded-[8px] flex items-center text-[11px] font-display font-bold uppercase tracking-widest transition-all shadow-xl active:scale-95 ${
                    showIdCard ? 'bg-brand-gold text-white' : 'bg-white/20 text-white hover:bg-white/30'
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
                  className="p-2.5 bg-white/20 hover:bg-white/30 rounded-full text-white transition-all active:scale-90"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {!showIdCard && (
                <div className="absolute -bottom-14 left-12 right-12 flex items-end justify-between z-10">
                  <div className="flex items-end space-x-8">
                  <div className="w-36 h-36 rounded-[12px] bg-white flex items-center justify-center border-8 border-white overflow-hidden group shadow-lg">
                    {viewingStudent.photoUrl ? (
                      <img src={viewingStudent.photoUrl} alt="Student" className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500" />
                    ) : (
                      <div className="w-full h-full bg-brand-green-tint flex items-center justify-center">
                        <User className="w-16 h-16 text-brand-green/20" />
                      </div>
                    )}
                  </div>
                    <div className="mb-6">
                       <h2 className="text-[28px] font-display font-bold text-brand-green tracking-tight leading-none mb-2">
                         {viewingStudent.firstName} <span className="text-brand-gold">{viewingStudent.lastName}</span>
                       </h2>
                       <div className="flex items-center space-x-3">
                           <p className="text-brand-green font-body font-bold text-[11px] uppercase tracking-wider flex items-center bg-brand-green-tint px-3 py-1.5 rounded-[6px] border border-brand-green/10">
                             {viewingStudent.registrationNumber || 'Pending'}
                           </p>
                           <span className={`w-2 h-2 rounded-full ${viewingStudent.status === 'Active' ? 'bg-brand-green' : 'bg-brand-charcoal/30'}`} />
                       </div>
                    </div>
                  </div>
                   
                   {/* Tab Navigation */}
                   <div className="flex bg-white/10 backdrop-blur-md p-1 rounded-[10px] border border-white/10 mb-6">
                      <button 
                       onClick={() => setActiveDetailTab('info')}
                       className={`px-6 py-2 rounded-[8px] text-[11px] font-display font-bold uppercase tracking-wider transition-all ${activeDetailTab === 'info' ? 'bg-white text-brand-green shadow-sm' : 'text-white/70 hover:text-white'}`}
                      >
                        Profile
                      </button>
                      <button 
                       onClick={() => setActiveDetailTab('behavior')}
                       className={`px-6 py-2 rounded-[8px] text-[11px] font-display font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeDetailTab === 'behavior' ? 'bg-white text-brand-green shadow-sm' : 'text-white/70 hover:text-white'}`}
                      >
                        Discipline
                        {behaviorSummary.net !== 0 && (
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-body ${behaviorSummary.net > 0 ? 'bg-brand-green text-white' : 'bg-brand-danger text-white'}`}>
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
              <div className="flex flex-col items-center justify-center space-y-10 py-10 animate-in fade-in zoom-in-95 duration-500">
                {/* ID Card Display */}
                <div className="relative group">
                  {/* Premium ID Card Styling */}
                  <div id="id-card" className="w-[480px] h-[300px] bg-brand-green-dark rounded-[24px] shadow-[0_30px_70px_-20px_rgba(0,0,0,0.5)] overflow-hidden relative flex flex-col p-8 border border-white/10 group select-none">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/20 rounded-full blur-[100px] -mr-32 -mt-32 opacity-50 group-hover:opacity-80 transition-opacity duration-1000" />
                     <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                     
                     <div className="flex items-start justify-between relative z-10 border-b border-white/5 pb-5 mb-6">
                        <div className="flex items-center space-x-4">
                           <div className="w-10 h-10 bg-white rounded-[8px] flex items-center justify-center text-brand-green shadow-xl shadow-white/10">
                             <img src="/logo.png" alt="PropCloud360" className="w-6 h-6 grayscale" />
                           </div>
                           <div>
                              <h3 className="text-[12px] font-display font-bold tracking-widest text-white uppercase">PropCloud360 Institute</h3>
                              <p className="text-[8px] font-body font-bold text-brand-gold uppercase tracking-[0.2em] mt-0.5">Academic System Identity</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className="text-[8px] font-body text-white/40 uppercase tracking-wider mb-1">Session</div>
                           <div className="px-3 py-1 bg-white/5 rounded-[6px] border border-white/10">
                              <span className="text-[9px] font-display font-bold text-white uppercase tracking-wider">2026/2027</span>
                           </div>
                        </div>
                     </div>

                     <div className="flex-1 flex gap-8 relative z-10">
                        <div className="w-32 h-36 rounded-[12px] bg-white/10 border border-white/10 overflow-hidden shadow-2xl relative">
                          {viewingStudent.photoUrl ? (
                            <img src={viewingStudent.photoUrl} alt="Photo" className="w-full h-full object-cover grayscale-[15%] group-hover:grayscale-0 transition-transform duration-700 group-hover:scale-110" />
                          ) : (
                            <User className="w-10 h-10 text-white/10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                          )}
                          <div className="absolute bottom-0 inset-x-0 h-1 bg-brand-gold group-hover:h-2 transition-all duration-300" />
                        </div>
                        <div className="flex-1 flex flex-col justify-center space-y-4">
                           <div>
                              <h4 className="text-[20px] font-display font-bold text-white uppercase tracking-tight mb-1 group-hover:text-brand-gold transition-colors">{viewingStudent.firstName} {viewingStudent.lastName}</h4>
                              <div className="flex items-center space-x-2">
                                <span className="w-1.5 h-1.5 bg-brand-gold rounded-full" />
                                <p className="text-[11px] text-white/60 font-body font-bold uppercase tracking-wider">
                                  {classLevels.find(cl => cl.id === viewingStudent.classLevelId)?.name || 'Grade: Alpha'} <span className="text-brand-gold/40 mx-1">•</span> {sections.find(s => s.id === viewingStudent.sectionId)?.name || 'Stream: 01'}
                                </p>
                              </div>
                           </div>
                           <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-white/5 pt-4">
                              <div>
                                 <label className="text-[8px] font-body font-bold text-white/30 uppercase tracking-wider block mb-1">ID Number</label>
                                 <p className="text-[11px] font-display font-bold text-white tracking-widest">{viewingStudent.registrationNumber || 'PENDING'}</p>
                              </div>
                              <div>
                                 <label className="text-[8px] font-body font-bold text-white/30 uppercase tracking-wider block mb-1">Gender</label>
                                 <p className="text-[11px] font-display font-bold text-white uppercase tracking-widest">{viewingStudent.gender || 'Unknown'}</p>
                              </div>
                              <div className="col-span-2">
                                 <label className="text-[8px] font-body font-bold text-white/30 uppercase tracking-wider block mb-1">Residence</label>
                                 <div className="flex items-center space-x-2">
                                    <div className="w-1.5 h-1.5 bg-brand-gold rounded-full" />
                                    <p className="text-[10px] font-display font-bold text-white/80 truncate uppercase tracking-wider leading-none">
                                      {viewingStudent.residence || 'No Address Data'}
                                    </p>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <button onClick={() => window.print()} className="btn-prop-primary px-8">
                      <Printer size={16} className="mr-2" />
                      Print ID card
                    </button>
                    <button className="btn-prop-outline p-3">
                      <Download size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ) : activeDetailTab === 'info' ? (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                     <h4 className="text-[11px] font-display font-bold text-brand-green/40 uppercase tracking-widest flex items-center">
                       <div className="w-1.5 h-1.5 bg-brand-green rounded-full mr-2" />
                       Academic Parameters
                      </h4>
                     <div className="space-y-3">
                        <div className="p-5 bg-brand-green-tint border border-brand-border rounded-[12px] hover:border-brand-green/20 transition-all group">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 rounded-[8px] bg-white border border-brand-border shadow-sm flex items-center justify-center text-brand-green transition-all">
                              <GraduationCap size={20} />
                            </div>
                            <div>
                               <p className="text-[10px] text-brand-charcoal/40 font-body font-bold uppercase tracking-wider mb-0.5">Grade Level</p>
                               <p className="text-[14px] font-display font-bold text-brand-charcoal tracking-tight lowercase first-letter:uppercase">{classLevels.find(cl => cl.id === viewingStudent.classLevelId)?.name || 'Awaiting Placement'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-5 bg-brand-green-tint border border-brand-border rounded-[12px] hover:border-brand-green/20 transition-all group">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 rounded-[8px] bg-white border border-brand-border shadow-sm flex items-center justify-center text-brand-green transition-all">
                              <Search size={20} />
                            </div>
                            <div>
                               <p className="text-[10px] text-brand-charcoal/40 font-body font-bold uppercase tracking-wider mb-0.5">Stream / Section</p>
                               <p className="text-[14px] font-display font-bold text-brand-charcoal tracking-tight lowercase first-letter:uppercase">{sections.find(s => s.id === viewingStudent.sectionId)?.name || 'Unassigned Section'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-5 bg-brand-green-tint border border-brand-border rounded-[12px] hover:border-brand-green/20 transition-all group">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 rounded-[8px] bg-white border border-brand-border shadow-sm flex items-center justify-center text-brand-green transition-all">
                              <Calendar size={20} />
                            </div>
                            <div>
                               <p className="text-[10px] text-brand-charcoal/40 font-body font-bold uppercase tracking-wider mb-0.5">Enrollment Cycle</p>
                               <p className="text-[14px] font-display font-bold text-brand-charcoal tracking-tight">Academic Session 2026</p>
                            </div>
                          </div>
                        </div>
                     </div>
                  </div>
                  <div className="space-y-6">
                     <h4 className="text-[11px] font-display font-bold text-brand-green/40 uppercase tracking-widest flex items-center">
                       <div className="w-1.5 h-1.5 bg-brand-gold rounded-full mr-2" />
                       Logistic Protocol
                      </h4>
                     <div className="p-8 bg-brand-green-tint rounded-[20px] border border-brand-border space-y-8 relative overflow-hidden shadow-inner">
                        <div className="flex items-start space-x-4 relative z-10">
                          <div className="w-11 h-11 rounded-[8px] bg-brand-green flex items-center justify-center text-white shadow-md">
                             <MapPin size= {20} />
                          </div>
                          <div>
                             <p className="text-[10px] text-brand-green-dark font-body font-bold uppercase tracking-wider mb-1">Residential Grid</p>
                             <p className="text-brand-charcoal font-display font-bold text-[14px] tracking-tight">{viewingStudent.residence || 'No Address Provided'}</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-4 relative z-10">
                          <div className="w-11 h-11 rounded-[8px] bg-white border border-brand-border flex items-center justify-center text-brand-green shadow-sm">
                             <Truck size={20} />
                          </div>
                          <div>
                             <p className="text-[10px] text-brand-charcoal/40 font-body font-bold uppercase tracking-wider mb-1">Transport Vector</p>
                             <p className="text-brand-charcoal font-display font-bold text-[14px] tracking-tight">{viewingStudent.transportRoute || 'No Transport Route'}</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-4 border-t border-brand-green/5 pt-8 relative z-10">
                          <div className="w-11 h-11 rounded-[8px] bg-white border border-brand-border flex items-center justify-center text-brand-gold shadow-sm">
                             <Phone size={20} />
                          </div>
                          <div className="flex-1">
                             <p className="text-[10px] text-brand-charcoal/40 font-body font-bold uppercase tracking-wider mb-1">Guardian Liaison</p>
                             <div className="flex justify-between items-center">
                               <p className="text-brand-charcoal font-display font-bold text-[14px] tracking-tight">{viewingStudent.parentPhone || 'No recorded phone'}</p>
                               <button className="text-[10px] font-display font-bold text-brand-green uppercase tracking-wider underline underline-offset-4 decoration-2">Liaise</button>
                             </div>
                          </div>
                        </div>
                     </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-between items-center bg-brand-green-dark p-8 rounded-[24px] border border-white/5 relative overflow-hidden group shadow-2xl">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/10 rounded-full blur-[100px] -mr-32 -mt-32" />
                  <div className="flex items-center space-x-5 relative z-10 mb-6 sm:mb-0">
                    <div className="w-14 h-14 bg-brand-green/20 rounded-[12px] flex items-center justify-center text-brand-green border border-brand-green/30">
                       <ShieldCheck size={28} />
                    </div>
                    <div>
                       <p className="text-lg font-display font-bold text-white tracking-tight">Verified Institutional Access</p>
                       <p className="text-[10px] text-white/40 font-body font-bold uppercase tracking-widest mt-1">Operational State: Active</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      handleOpenModal(viewingStudent);
                    }}
                    className="btn-prop-primary px-10 relative z-10"
                  >
                    <Edit size={16} className="mr-2" />
                    Modify Attributes
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                 {/* Behavior Summary Cards */}
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                    <div className="bg-brand-green-tint border border-brand-green/20 p-8 rounded-[16px] flex flex-col items-center text-center shadow-inner group transition-all">
                       <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-brand-green shadow-sm mb-4 border border-brand-green/20">
                          <Award size={28} />
                       </div>
                       <p className="text-[11px] font-body font-bold text-brand-green uppercase tracking-widest mb-1">Merits Accumulated</p>
                       <p className="text-[40px] font-display font-bold text-brand-green tracking-tight">{behaviorSummary.merits}</p>
                    </div>
                    <div className="bg-white border border-brand-border p-8 rounded-[16px] flex flex-col items-center text-center shadow-sm relative overflow-hidden">
                       <div className="w-14 h-14 bg-brand-danger/5 rounded-full flex items-center justify-center text-brand-danger mb-4 border border-brand-danger/10">
                          <AlertTriangle size={28} />
                       </div>
                       <p className="text-[11px] font-body font-bold text-brand-charcoal/40 uppercase tracking-widest mb-1">Demerit Infractions</p>
                       <p className="text-[40px] font-display font-bold text-brand-charcoal tracking-tight">{behaviorSummary.demerits}</p>
                    </div>
                    <div className="bg-brand-green-dark p-8 rounded-[16px] flex flex-col items-center text-center shadow-2xl">
                       <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center text-white/50 mb-4 border border-white/5">
                          <Activity size={28} />
                       </div>
                       <p className="text-[11px] font-body font-bold text-white/40 uppercase tracking-widest mb-1">Behavioral Delta</p>
                       <p className={`text-[40px] font-display font-bold tracking-tight ${behaviorSummary.net >= 0 ? 'text-brand-green' : 'text-brand-danger'}`}>
                         {behaviorSummary.net > 0 ? '+' : ''}{behaviorSummary.net}
                       </p>
                    </div>
                 </div>

                 {/* Behavior Timeline */}
                 <div className="bg-brand-green-tint border border-brand-border rounded-[24px] p-10 mt-6 relative overflow-hidden group">
                    <div className="flex justify-between items-center mb-10">
                       <h4 className="text-[12px] font-display font-bold text-brand-green/60 uppercase tracking-widest flex items-center">
                          <Calendar size={14} className="mr-2" />
                          Institutional Record Timeline
                       </h4>
                       <button className="flex items-center text-[11px] font-display font-bold text-brand-green uppercase tracking-widest hover:text-brand-gold transition-all">
                         <Plus size={16} className="mr-2" />
                         Append Entry
                       </button>
                    </div>

                    <div className="space-y-8 relative">
                       {/* Center Line */}
                       <div className="absolute left-[23.5px] top-2 bottom-2 w-0.5 bg-brand-green/10" />
                       
                       {behaviorLoading ? (
                         <div className="flex justify-center py-20">
                           <div className="w-8 h-8 border-3 border-brand-green/20 border-t-brand-green rounded-full animate-spin" />
                         </div>
                       ) : behaviorRecords.length > 0 ? (
                         behaviorRecords.map((record, i) => (
                           <div key={record.id} className="flex gap-8 relative z-10 group/item">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
                                record.type === 'MERIT' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                              }`}>
                                {record.type === 'MERIT' ? <Award size={20} /> : <AlertTriangle size={20} />}
                              </div>
                              <div className="flex-1 bg-slate-50/50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 transition-all group-hover:border-primary/20">
                                 <div className="flex justify-between items-start mb-1">
                                    <h5 className="font-bold text-slate-900 whitespace-nowrap overflow-hidden text-ellipsis mr-2">{record.description}</h5>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider shrink-0">{new Date(record.date).toLocaleDateString()}</span>
                                 </div>
                                 <p className="text-[11px] text-slate-500">
                                   Points Impact: <span className={record.type === 'MERIT' ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>{record.points}</span>
                                 </p>
                                 <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider">By: {record.reporter || 'System'}</span>
                                    <MoreVertical size={12} className="text-slate-300" />
                                 </div>
                              </div>
                           </div>
                         ))
                       ) : (
                         <div className="py-16 text-center flex flex-col items-center">
                            <Shield className="text-slate-100 mb-5" size={56} />
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Exemplary Record</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">No behavioral infractions or merits logged.</p>
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

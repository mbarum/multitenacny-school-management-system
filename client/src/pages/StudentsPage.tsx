import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { toast } from 'sonner';
import { UserRole } from '../../../src/common/user-role.enum';
import { Users, UserCheck, DollarSign, Activity, LogOut, Settings, GraduationCap, Calendar, FileText, CreditCard, Plus, Edit, Trash2, X, Search, Eye, User, Mail, Phone, ShieldCheck, Award, Info, MapPin, Truck, Camera, Check, ChevronLeft, ChevronRight, Printer } from 'lucide-react';

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

const StudentsPage: React.FC = () => {
  const { user, logout } = useAuth();
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
  const [currentStep, setCurrentStep] = useState(1);
  const [showIdCard, setShowIdCard] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Error accessing camera: ", err);
      toast.error("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
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
        const dataUrl = canvas.toDataURL('image/png');
        setFormData(prev => ({ ...prev, photoUrl: dataUrl }));
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
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
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsRes, classLevelsRes, sectionsRes, academicYearsRes] = await Promise.all([
        api.get('/students'),
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
      
      // Default to current academic year if available
      const currentYear = academicYears.find(y => y.isCurrent);
      
      setFormData({
        firstName: '',
        middleName: '',
        lastName: '',
        registrationNumber: '',
        classLevelId: '',
        sectionId: '',
        academicYearId: currentYear ? currentYear.id : '',
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
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
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

      if (editingStudent) {
        await api.patch(`/students/${editingStudent.id}`, payload);
        toast.success('Student updated successfully');
      } else {
        await api.post('/students', payload);
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

  // Filter sections based on selected class level
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-blue-600">SaaSLink</h2>
          <p className="text-sm text-gray-500 mt-1">School Management</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <a href="/dashboard" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
            <Activity className="w-5 h-5 mr-3" />
            Dashboard
          </a>
          <a href="/students" className="flex items-center px-4 py-3 text-blue-600 bg-blue-50 rounded-lg font-medium">
            <Users className="w-5 h-5 mr-3" />
            Students
          </a>
          <a href="/academics/classes" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
            <GraduationCap className="w-5 h-5 mr-3" />
            Academics
          </a>
          <a href="/staff" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
            <UserCheck className="w-5 h-5 mr-3" />
            Staff
          </a>
          <a href="/attendance" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
            <Calendar className="w-5 h-5 mr-3" />
            Attendance
          </a>
          <a href="/reports" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
            <FileText className="w-5 h-5 mr-3" />
            Reports
          </a>
          <a href="/payments" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
            <CreditCard className="w-5 h-5 mr-3" />
            Payments
          </a>
          {user?.role === UserRole.SUPER_ADMIN && (
            <a href="/super-admin" className="flex items-center px-4 py-3 text-purple-600 hover:bg-purple-50 rounded-lg font-medium transition-colors mt-4 border border-purple-100">
              <Settings className="w-5 h-5 mr-3" />
              Super Admin
            </a>
          )}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button onClick={logout} className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors">
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
              <p className="text-gray-500 mt-1">Manage student records, enrollments, and details.</p>
            </div>
            <div className="flex w-full md:w-auto flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow"
                />
              </div>
              <button 
                onClick={() => handleOpenModal()}
                className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Student
              </button>
            </div>
          </header>

          {selectedStudentIds.length > 0 && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-6 flex items-center justify-between">
              <span className="text-indigo-800 font-medium">{selectedStudentIds.length} student(s) selected</span>
              <div className="flex space-x-3">
                <button
                  onClick={() => setIsBulkStatusModalOpen(true)}
                  className="px-4 py-2 bg-white text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
                >
                  Change Status
                </button>
                <button
                  onClick={() => setIsBulkClassModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  Change Class
                </button>
              </div>
            </div>
          )}

          {/* Students Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-sm">
                    <th className="px-6 py-4 font-medium w-12">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="px-6 py-4 font-medium">Name</th>
                    <th className="px-6 py-4 font-medium">Reg Number</th>
                    <th className="px-6 py-4 font-medium">Class & Section</th>
                    <th className="px-6 py-4 font-medium">Academic Year</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <tr key={student.id} className={`hover:bg-gray-50 transition-colors ${selectedStudentIds.includes(student.id) ? 'bg-blue-50/50' : ''}`}>
                        <td className="px-6 py-4">
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={selectedStudentIds.includes(student.id)}
                            onChange={(e) => handleSelectStudent(student.id, e.target.checked)}
                          />
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          <button 
                            onClick={() => handleViewStudent(student)}
                            className="flex items-center space-x-3 hover:text-blue-600 transition-colors text-left group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200 group-hover:border-blue-200 transition-colors">
                              {student.photoUrl ? (
                                <img src={student.photoUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-full h-full p-1.5 text-gray-400" />
                              )}
                            </div>
                            <span className="font-bold">{student.firstName} {student.middleName ? `${student.middleName} ` : ''}{student.lastName}</span>
                          </button>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{student.registrationNumber || '-'}</td>
                        <td className="px-6 py-4 text-gray-500">
                          {student.classLevel?.name || '-'} {student.section ? `(${student.section.name})` : ''}
                        </td>
                        <td className="px-6 py-4 text-gray-500">{student.academicYear?.name || '-'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            student.status === 'Active' ? 'bg-green-100 text-green-800' :
                            student.status === 'Graduated' ? 'bg-blue-100 text-blue-800' :
                            student.status === 'Suspended' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {student.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end space-x-2">
                          <button 
                            onClick={() => handleViewStudent(student)}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleOpenModal(student)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(student.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mb-6 border border-gray-100 shadow-sm transition-transform hover:scale-105">
                              <Users className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 tracking-tight">No Students Registered</h3>
                            <p className="text-sm text-gray-500 mt-2.5 max-w-xs mx-auto">
                              Begin building your educational database by adding your school's first student directly to this class logic.
                            </p>
                            <button 
                              onClick={() => handleOpenModal()}
                              className="mt-8 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[13px] font-bold shadow-lg shadow-blue-600/10 hover:bg-blue-700 active:scale-95 transition-all flex items-center space-x-2 mx-auto"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Enroll New Student</span>
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
      </main>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <div>
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                  {editingStudent ? 'Update Enrollment' : 'New Student Enrollment'}
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Step {currentStep} of 4: {currentStep === 1 ? 'Biography' : currentStep === 2 ? 'Parents/Guardians' : currentStep === 3 ? 'Academic Placement' : 'Logistics'}
                </p>
              </div>
              <button 
                onClick={handleCloseModal} 
                className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Progress */}
            <div className="px-8 pt-6 shrink-0">
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4].map((step) => (
                  <React.Fragment key={step}>
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300 ${
                      currentStep >= step ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white border-gray-200 text-gray-400'
                    }`}>
                      {currentStep > step ? <Check className="w-4 h-4" /> : <span className="text-xs font-bold">{step}</span>}
                    </div>
                    {step < 4 && (
                      <div className={`flex-1 h-1 rounded-full transition-all duration-500 ${
                        currentStep > step ? 'bg-blue-600' : 'bg-gray-100'
                      }`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <form onSubmit={handleSubmit} className="p-8">
                <div className="min-h-[320px]">
                {currentStep === 1 && (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex flex-col sm:flex-row items-center gap-8 mb-4">
                      <div className="relative group">
                        <div className="w-40 h-40 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 overflow-hidden hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer relative">
                          {formData.photoUrl ? (
                            <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                          ) : isCameraActive ? (
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                          ) : (
                            <>
                              <Camera className="w-8 h-8 mb-2" />
                              <span className="text-[10px] font-bold uppercase tracking-wider">Student Photo</span>
                            </>
                          )}
                        </div>
                        <div className="flex space-x-2 mt-4">
                          {!isCameraActive ? (
                            <button 
                              type="button"
                              onClick={startCamera}
                              className="px-3 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-lg hover:bg-blue-700 uppercase tracking-wider"
                            >
                              Capture
                            </button>
                          ) : (
                            <button 
                              type="button"
                              onClick={capturePhoto}
                              className="px-3 py-1.5 bg-green-600 text-white text-[10px] font-bold rounded-lg hover:bg-green-700 uppercase tracking-wider"
                            >
                              Snap
                            </button>
                          )}
                           <label className="px-3 py-1.5 bg-gray-600 text-white text-[10px] font-bold rounded-lg hover:bg-gray-700 uppercase tracking-wider cursor-pointer">
                            Upload
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                          </label>
                        </div>
                      </div>
                      <div className="flex-1 w-full space-y-4">
                        <div>
                          <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">First Name</label>
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            required
                            placeholder="e.g. John"
                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-600 font-medium text-gray-900 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Middle Name(s)</label>
                          <input
                            type="text"
                            name="middleName"
                            value={formData.middleName}
                            onChange={handleInputChange}
                            placeholder="e.g. Fitzgerald"
                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-600 font-medium text-gray-900 transition-all"
                          />
                        </div>
                         <div>
                          <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Last Name</label>
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            required
                            placeholder="e.g. Kennedy"
                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-600 font-medium text-gray-900 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Gender</label>
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-600 font-medium text-gray-900 transition-all cursor-pointer"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Date of Birth</label>
                        <input
                          type="date"
                          name="dateOfBirth"
                          value={formData.dateOfBirth}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-600 font-medium text-gray-900 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="bg-orange-50/50 p-6 rounded-2xl border border-orange-100/50">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-200">
                          <Users size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">Parent / Guardian Information</h4>
                          <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">Contact & Portal Data</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Parent First Name</label>
                          <input
                            type="text"
                            name="parentFirstName"
                            value={formData.parentFirstName}
                            onChange={handleInputChange}
                            placeholder="First Name"
                            className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-orange-600 font-medium text-gray-900 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Parent Last Name</label>
                          <input
                            type="text"
                            name="parentLastName"
                            value={formData.parentLastName}
                            onChange={handleInputChange}
                            placeholder="Last Name"
                            className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-orange-600 font-medium text-gray-900 transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Parent Email (For Portal Access)</label>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="email"
                              name="parentEmail"
                              value={formData.parentEmail}
                              onChange={handleInputChange}
                              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-orange-600 font-medium text-gray-900 transition-all"
                              placeholder="parent@example.com"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Parent Phone Number</label>
                          <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="tel"
                              name="parentPhone"
                              value={formData.parentPhone}
                              onChange={handleInputChange}
                              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-orange-600 font-medium text-gray-900 transition-all"
                              placeholder="+1 234 567 890"
                            />
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-4 italic">* An account will be automatically created using this email for the parent portal.</p>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Registration ID</label>
                        <input
                          type="text"
                          name="registrationNumber"
                          value={formData.registrationNumber}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-600 font-medium text-gray-900 transition-all"
                          placeholder="e.g. ADM-2026-001"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Enrollment Status</label>
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-600 font-medium text-gray-900 transition-all cursor-pointer"
                        >
                          <option value="Active">Active Student</option>
                          <option value="Graduated">Graduated</option>
                          <option value="Transferred">Transferred Out</option>
                          <option value="Suspended">Suspended</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Class Level</label>
                        <select
                          name="classLevelId"
                          value={formData.classLevelId}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-600 font-medium text-gray-900 transition-all cursor-pointer"
                        >
                          <option value="">Select Level</option>
                          {classLevels.map(cl => (
                            <option key={cl.id} value={cl.id}>{cl.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Class Section</label>
                        <select
                          name="sectionId"
                          value={formData.sectionId}
                          onChange={handleInputChange}
                          disabled={!formData.classLevelId}
                          className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-600 font-medium text-gray-900 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <option value="">Select Section</option>
                          {availableSections.map(sec => (
                            <option key={sec.id} value={sec.id}>{sec.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Academic Intake Year</label>
                      <select
                        name="academicYearId"
                        value={formData.academicYearId}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-600 font-medium text-gray-900 transition-all cursor-pointer"
                      >
                        <option value="">Select Year</option>
                        {academicYears.map(ay => (
                          <option key={ay.id} value={ay.id}>{ay.name} {ay.isCurrent ? '(Current)' : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100/50">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                          <MapPin size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">Residence & Transport</h4>
                          <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Logistics Planning</p>
                        </div>
                      </div>

                      <div className="space-y-5">
                        <div>
                          <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Permanent Residence (Place/Estate)</label>
                          <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              name="residence"
                              value={formData.residence}
                              onChange={handleInputChange}
                              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-600 font-medium text-gray-900 transition-all"
                              placeholder="e.g. Sunset Estate, Block A"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Transportation Route</label>
                          <div className="relative">
                            <Truck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                              name="transportRoute"
                              value={formData.transportRoute}
                              onChange={handleInputChange}
                              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-600 font-medium text-gray-900 transition-all cursor-pointer"
                            >
                              <option value="">No Transport Required</option>
                              <option value="Route A (North)">Route A (North)</option>
                              <option value="Route B (South)">Route B (South)</option>
                              <option value="Route C (East)">Route C (East)</option>
                              <option value="Route D (West)">Route D (West)</option>
                            </select>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-2 italic">* This information will be used for student ID cards and bus scheduling.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                <div>
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(prev => prev - 1)}
                      className="flex items-center px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-sm transition-all active:scale-95"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Back
                    </button>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-5 py-2.5 text-gray-500 hover:text-gray-700 font-bold text-sm"
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
                      className="flex items-center px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="flex items-center px-10 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm shadow-xl shadow-green-200 hover:bg-green-700 transition-all active:scale-95"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      {editingStudent ? 'Complete Update' : 'Finalize Enrollment'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    )}

      {/* Bulk Status Update Modal */}
      {isBulkStatusModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-indigo-50">
              <h3 className="text-lg font-bold text-indigo-900">Change Status</h3>
              <button onClick={() => setIsBulkStatusModalOpen(false)} className="text-indigo-400 hover:text-indigo-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">New Status for {selectedStudentIds.length} student(s)</label>
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent mb-6"
              >
                <option value="Active">Active</option>
                <option value="Graduated">Graduated</option>
                <option value="Transferred">Transferred</option>
                <option value="Suspended">Suspended</option>
              </select>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsBulkStatusModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleBulkUpdate('status')}
                  className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors"
                >
                  Apply Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

       {/* Bulk Class Update Modal */}
       {isBulkClassModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-indigo-50">
              <h3 className="text-lg font-bold text-indigo-900">Change Class</h3>
              <button onClick={() => setIsBulkClassModalOpen(false)} className="text-indigo-400 hover:text-indigo-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">Updating class for {selectedStudentIds.length} student(s).</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Class Level</label>
                <select
                  value={bulkClassData.classLevelId}
                  onChange={(e) => setBulkClassData({ ...bulkClassData, classLevelId: e.target.value, sectionId: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                >
                  <option value="">Select Class Level</option>
                  {classLevels.map(cl => (
                    <option key={cl.id} value={cl.id}>{cl.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Section</label>
                <select
                  value={bulkClassData.sectionId}
                  onChange={(e) => setBulkClassData({ ...bulkClassData, sectionId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  disabled={!bulkClassData.classLevelId}
                >
                  <option value="">Select Section</option>
                  {bulkClassData.classLevelId && sections
                    .filter(s => s.classLevelId === bulkClassData.classLevelId)
                    .map(sec => (
                    <option key={sec.id} value={sec.id}>{sec.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="pt-4 flex justify-end space-x-3">
                <button
                  onClick={() => setIsBulkClassModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleBulkUpdate('class')}
                  disabled={!bulkClassData.classLevelId}
                  className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Apply Class
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Detail Modal */}
      {isDetailModalOpen && viewingStudent && (
        <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300">
            {/* Header / Banner */}
            <div className={`h-32 relative transition-all duration-500 ${showIdCard ? 'bg-gray-900' : 'bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-600'}`}>
              <div className="absolute top-6 right-6 flex items-center space-x-2">
                <button 
                  onClick={() => setShowIdCard(!showIdCard)}
                  className={`px-4 py-2 rounded-xl flex items-center text-xs font-bold transition-all shadow-lg ${
                    showIdCard ? 'bg-blue-600 text-white' : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <Award className="w-4 h-4 mr-2" />
                  {showIdCard ? 'View Profile' : 'Student ID Card'}
                </button>
                <button 
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    setShowIdCard(false);
                  }}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {!showIdCard && (
                <div className="absolute -bottom-12 left-10 flex items-end space-x-6">
                  <div className="w-32 h-32 rounded-3xl bg-white shadow-2xl flex items-center justify-center border-[6px] border-white overflow-hidden ring-1 ring-black/5">
                    {viewingStudent.photoUrl ? (
                      <img src={viewingStudent.photoUrl} alt="Student" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-14 h-14 text-blue-100 bg-blue-50/50 p-3 rounded-full" />
                    )}
                  </div>
                  <div className="mb-4">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">{viewingStudent.firstName} {viewingStudent.lastName}</h2>
                    <p className="text-blue-600 font-black text-xs uppercase tracking-widest flex items-center bg-blue-50 px-3 py-1 rounded-full w-fit mt-2">
                      {viewingStudent.registrationNumber || 'Pending ID'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-10 pt-16">
              {showIdCard ? (
                <div className="space-y-12 animate-in fade-in duration-500">
                  <div className="flex flex-col items-center">
                    {/* ID Card Content */}
                    <div id="id-card" className="w-[400px] h-[250px] bg-white rounded-3xl shadow-2xl border-2 border-gray-100 overflow-hidden relative flex flex-col p-6 m-auto">
                       {/* Background Decoration */}
                       <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/5 rounded-full blur-3xl" />
                       <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-600/5 rounded-full blur-3xl" />
                       
                       <div className="flex items-start justify-between mb-4 border-b border-gray-100 pb-3">
                          <div className="flex items-center">
                            <GraduationCap className="w-6 h-6 text-blue-600 mr-2" />
                            <div>
                               <h3 className="text-[14px] font-black tracking-tighter text-gray-900 uppercase">SaaSLink Academy</h3>
                               <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Student Identity Card</p>
                            </div>
                          </div>
                          <div className="text-right">
                             <span className="text-[10px] font-black text-gray-400">Valid: 2026/27</span>
                          </div>
                       </div>

                       <div className="flex-1 flex gap-6 mt-2">
                          <div className="w-24 h-28 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden shadow-inner flex items-center justify-center shrink-0">
                            {viewingStudent.photoUrl ? (
                              <img src={viewingStudent.photoUrl} alt="Photo" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-8 h-8 text-gray-300" />
                            )}
                          </div>
                          <div className="space-y-3 flex-1 flex flex-col justify-center">
                             <div>
                                <h4 className="text-sm font-black text-gray-900 uppercase">{viewingStudent.firstName} {viewingStudent.lastName}</h4>
                                <p className="text-[10px] text-blue-600 font-bold">{viewingStudent.classLevel?.name} - {viewingStudent.section?.name}</p>
                             </div>
                             
                             <div className="grid grid-cols-2 gap-4 pt-1">
                                <div>
                                   <label className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Adm No</label>
                                   <p className="text-[10px] font-bold text-gray-800">{viewingStudent.registrationNumber || 'N/A'}</p>
                                </div>
                                <div>
                                   <label className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Gender</label>
                                   <p className="text-[10px] font-bold text-gray-800">{viewingStudent.gender || 'N/A'}</p>
                                </div>
                                <div className="col-span-2">
                                   <label className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Route / Residence</label>
                                   <p className="text-[9px] font-bold text-gray-800 truncate">{viewingStudent.transportRoute || 'Self Transfer'} ({viewingStudent.residence || 'Local'})</p>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>

                    <p className="mt-8 text-xs text-gray-400 font-medium max-w-sm text-center">
                      This digital ID card is automatically generated using the student's enrollment data. Use the print button to generate a physical version for transportation.
                    </p>

                    <button 
                      onClick={() => window.print()}
                      className="mt-6 px-8 py-3 bg-gray-900 text-white rounded-2xl font-bold flex items-center hover:scale-105 transition-all shadow-xl shadow-gray-200"
                    >
                      <Printer size={18} className="mr-3" />
                      Print physical ID
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                       <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 pb-3">Academic Stats</h4>
                       <div className="grid grid-cols-1 gap-4">
                          <div className="p-5 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-blue-100 transition-colors group">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                <GraduationCap size={20} />
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Assigned Class</p>
                                <p className="text-sm font-black text-gray-900">{viewingStudent.classLevel?.name || 'Pending Placement'}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-5 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-blue-100 transition-colors group">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                <Search size={20} />
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Current Section</p>
                                <p className="text-sm font-black text-gray-900">{viewingStudent.section?.name || 'General'}</p>
                              </div>
                            </div>
                          </div>

                          <div className="p-5 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-blue-100 transition-colors group">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                <Calendar size={20} />
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Admission Date</p>
                                <p className="text-sm font-black text-gray-900 italic">Spring Intake 2026</p>
                              </div>
                            </div>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-6">
                       <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 pb-3">Logistics & Residence</h4>
                       <div className="p-6 bg-blue-50/30 rounded-3xl border border-blue-100/50 space-y-6 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <Truck size={80} className="rotate-12" />
                          </div>
                          
                          <div className="flex items-start space-x-4 relative z-10">
                            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                               <MapPin size={20} />
                            </div>
                            <div>
                               <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Home Residence</p>
                               <p className="text-gray-900 font-bold mt-1">{viewingStudent.residence || 'Address not listed'}</p>
                            </div>
                          </div>

                          <div className="flex items-start space-x-4 relative z-10">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm">
                               <Truck size={20} />
                            </div>
                            <div>
                               <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Transport Route</p>
                               <p className="text-gray-900 font-bold mt-1 text-sm">{viewingStudent.transportRoute || 'No School Pick-up Plan'}</p>
                            </div>
                          </div>

                          <div className="flex items-start space-x-4 border-t border-blue-100 pt-6 relative z-10">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm">
                               <Info size={20} />
                            </div>
                            <div>
                               <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Emergency Contact</p>
                               <p className="text-gray-900 font-bold mt-1 text-sm">Parent Primary Mobile Linked</p>
                            </div>
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-gray-50 p-6 rounded-3xl border border-gray-100">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-green-600 shadow-sm">
                         <ShieldCheck size={24} />
                      </div>
                      <div>
                         <p className="text-sm font-black text-gray-900">Student is Verified</p>
                         <p className="text-[10px] text-gray-500 font-medium">Profile and biometric data updated on Apr 24, 2026</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        handleOpenModal(viewingStudent);
                      }}
                      className="px-6 py-2.5 bg-white text-gray-900 border border-gray-200 rounded-2xl font-bold flex items-center hover:bg-gray-50 transition-all active:scale-95"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Modify Record
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsPage;

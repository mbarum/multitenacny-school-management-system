import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { toast } from 'sonner';
import { UserRole } from '../../../src/common/user-role.enum';
import { Users, UserCheck, DollarSign, Activity, LogOut, Settings, GraduationCap, Calendar, FileText, CreditCard, Plus, Edit, Trash2, X, Search, Eye, User, Mail, Phone, ShieldCheck, Award, Info } from 'lucide-react';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  registrationNumber: string;
  status: string;
  classLevelId: string;
  sectionId: string;
  academicYearId: string;
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

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    registrationNumber: '',
    classLevelId: '',
    sectionId: '',
    academicYearId: '',
    status: 'Active'
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
    if (student) {
      setEditingStudent(student);
      setFormData({
        firstName: student.firstName,
        lastName: student.lastName,
        registrationNumber: student.registrationNumber || '',
        classLevelId: student.classLevelId || '',
        sectionId: student.sectionId || '',
        academicYearId: student.academicYearId || '',
        status: student.status || 'Active'
      });
    } else {
      setEditingStudent(null);
      
      // Default to current academic year if available
      const currentYear = academicYears.find(y => y.isCurrent);
      
      setFormData({
        firstName: '',
        lastName: '',
        registrationNumber: '',
        classLevelId: '',
        sectionId: '',
        academicYearId: currentYear ? currentYear.id : '',
        status: 'Active'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
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
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
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
                            className="hover:text-blue-600 transition-colors text-left"
                          >
                            {student.firstName} {student.lastName}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">
                {editingStudent ? 'Edit Student' : 'Add New Student'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                <input
                  type="text"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="e.g. STU-2026-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class Level</label>
                <select
                  name="classLevelId"
                  value={formData.classLevelId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                >
                  <option value="">Select Class Level</option>
                  {classLevels.map(cl => (
                    <option key={cl.id} value={cl.id}>{cl.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                <select
                  name="sectionId"
                  value={formData.sectionId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  disabled={!formData.classLevelId}
                >
                  <option value="">Select Section</option>
                  {availableSections.map(sec => (
                    <option key={sec.id} value={sec.id}>{sec.name}</option>
                  ))}
                </select>
                {!formData.classLevelId && (
                  <p className="text-xs text-gray-500 mt-1">Please select a class level first.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                <select
                  name="academicYearId"
                  value={formData.academicYearId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                >
                  <option value="">Select Academic Year</option>
                  {academicYears.map(ay => (
                    <option key={ay.id} value={ay.id}>{ay.name} {ay.isCurrent ? '(Current)' : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                >
                  <option value="Active">Active</option>
                  <option value="Graduated">Graduated</option>
                  <option value="Transferred">Transferred</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
                >
                  {editingStudent ? 'Save Changes' : 'Add Student'}
                </button>
              </div>
            </form>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100">
            {/* Header / Banner */}
            <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
              <button 
                onClick={() => setIsDetailModalOpen(false)}
                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute -bottom-10 left-8">
                <div className="w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center border-4 border-white">
                  <User className="w-10 h-10 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="pt-12 px-8 pb-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{viewingStudent.firstName} {viewingStudent.lastName}</h2>
                  <p className="text-blue-600 font-medium flex items-center mt-1">
                    <Award className="w-4 h-4 mr-1.5" />
                    {viewingStudent.registrationNumber || 'No Registration Number'}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                    viewingStudent.status === 'Active' ? 'bg-green-100 text-green-700' :
                    viewingStudent.status === 'Graduated' ? 'bg-blue-100 text-blue-700' :
                    viewingStudent.status === 'Suspended' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    <ShieldCheck className="w-4 h-4 mr-1.5" />
                    {viewingStudent.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Academic Information</h4>
                  <div className="flex items-start space-x-3">
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <GraduationCap className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Class & Section</p>
                      <p className="text-gray-900 font-medium">
                        {viewingStudent.classLevel?.name || 'Unassigned'} 
                        {viewingStudent.section ? ` - Section ${viewingStudent.section.name}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <Calendar className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Academic Year</p>
                      <p className="text-gray-900 font-medium">{viewingStudent.academicYear?.name || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact & System</h4>
                  <div className="flex items-start space-x-3">
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <Info className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Internal System ID</p>
                      <p className="text-gray-900 font-mono text-xs">{viewingStudent.id}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <Settings className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Data Connectivity</p>
                      <p className="text-green-600 text-xs font-medium flex items-center">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                        Active Student Record
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button 
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleOpenModal(viewingStudent);
                  }}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-lg shadow-blue-200 flex items-center"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsPage;

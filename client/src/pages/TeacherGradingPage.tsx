import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Users, BookOpen, Calendar, CheckSquare, LogOut, Bell, MessageSquare, Award, ChevronRight, Search, Check, X, Clock, Save } from 'lucide-react';
import { Link } from 'react-router-dom';

const TeacherGradingPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [selectedClass, setSelectedClass] = useState('Grade 10A');
  const [assessmentType, setAssessmentType] = useState('Midterm Exam');
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    // Mocking student grades
    setStudents([
      { id: 1, name: 'Alice Johnson', grade: 85, remarks: 'Good progress' },
      { id: 2, name: 'Bob Smith', grade: 92, remarks: 'Excellent work' },
      { id: 3, name: 'Charlie Brown', grade: 78, remarks: 'Needs improvement in algebra' },
      { id: 4, name: 'Diana Prince', grade: 95, remarks: 'Outstanding' },
      { id: 5, name: 'Evan Wright', grade: 65, remarks: 'Please see me after class' },
      { id: 6, name: 'Fiona Gallagher', grade: 88, remarks: 'Solid performance' },
    ]);
  }, [selectedClass, assessmentType]);

  const handleGradeChange = (id: number, value: string) => {
    setStudents(students.map(s => s.id === id ? { ...s, grade: value } : s));
  };

  const handleRemarksChange = (id: number, value: string) => {
    setStudents(students.map(s => s.id === id ? { ...s, remarks: value } : s));
  };

  const handleSave = () => {
    alert('Grades saved successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-indigo-600">SaaSLink</h2>
          <p className="text-sm text-gray-500 mt-1">Teacher Portal</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link to="/teacher" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
            <BookOpen className="w-5 h-5 mr-3" />
            My Dashboard
          </Link>
          <Link to="/teacher/classes" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
            <Users className="w-5 h-5 mr-3" />
            My Classes
          </Link>
          <Link to="/teacher/attendance" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
            <CheckSquare className="w-5 h-5 mr-3" />
            Attendance
          </Link>
          <Link to="/teacher/grading" className="flex items-center px-4 py-3 text-indigo-600 bg-indigo-50 rounded-lg font-medium">
            <Award className="w-5 h-5 mr-3" />
            Grading
          </Link>
          <a href="#" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
            <Calendar className="w-5 h-5 mr-3" />
            Schedule
          </a>
          <a href="#" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
            <MessageSquare className="w-5 h-5 mr-3" />
            Messages
          </a>
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
          <header className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gradebook</h1>
              <p className="text-gray-500 mt-1">Enter and manage student grades and assessments.</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-indigo-600 transition-colors relative">
                <Bell className="w-6 h-6" />
              </button>
            </div>
          </header>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-col md:flex-row gap-4">
                <select 
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-gray-700"
                >
                  <option value="Grade 10A">Grade 10A - Mathematics</option>
                  <option value="Grade 11B">Grade 11B - Physics</option>
                  <option value="Grade 12A">Grade 12A - Computer Science</option>
                </select>
                <select 
                  value={assessmentType}
                  onChange={(e) => setAssessmentType(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                >
                  <option value="Assignment 1">Assignment 1</option>
                  <option value="Midterm Exam">Midterm Exam</option>
                  <option value="Final Exam">Final Exam</option>
                  <option value="Project">Term Project</option>
                </select>
              </div>
              <div className="flex space-x-3">
                <button 
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Export CSV
                </button>
                <button 
                  onClick={handleSave}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" /> Save Grades
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-sm">
                    <th className="px-6 py-4 font-medium">Student Name</th>
                    <th className="px-6 py-4 font-medium w-32">Score (%)</th>
                    <th className="px-6 py-4 font-medium">Remarks / Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900 flex items-center">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs mr-3">
                          {student.name.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        {student.name}
                      </td>
                      <td className="px-6 py-4">
                        <input 
                          type="number" 
                          min="0" 
                          max="100"
                          value={student.grade}
                          onChange={(e) => handleGradeChange(student.id, e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                            Number(student.grade) < 50 ? 'border-red-300 text-red-700 bg-red-50' : 
                            Number(student.grade) >= 90 ? 'border-emerald-300 text-emerald-700 bg-emerald-50' : 
                            'border-gray-200 text-gray-900'
                          }`}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input 
                          type="text" 
                          value={student.remarks}
                          onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                          placeholder="Add feedback..."
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherGradingPage;

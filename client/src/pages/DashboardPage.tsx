import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { UserRole } from '../../../src/common/user-role.enum';

interface Student {
  id: string;
  name: string;
  email: string;
}

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/students');
      setStudents(response.data);
    } catch (error) {
      console.error('Failed to fetch students', error);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/students', { name, email });
      fetchStudents();
      setName('');
      setEmail('');
    } catch (error) {
      console.error('Failed to add student', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">School Dashboard</h1>
          <div className="flex items-center space-x-6">
            <a href="/academics/classes" className="text-blue-600 font-medium hover:underline">Classes</a>
            <a href="/staff" className="text-blue-600 font-medium hover:underline">Staff</a>
            <a href="/attendance" className="text-blue-600 font-medium hover:underline">Attendance</a>
            <a href="/timetable" className="text-blue-600 font-medium hover:underline">Timetable</a>
            <a href="/reports" className="text-blue-600 font-medium hover:underline">Reports</a>
            <a href="/payments" className="text-blue-600 font-medium hover:underline">Payments</a>
            {user?.role === UserRole.SUPER_ADMIN && (
              <a href="/super-admin" className="text-purple-600 font-bold hover:underline">Super Admin</a>
            )}
            <button onClick={logout} className="bg-red-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-600 transition-colors">
              Logout
            </button>
          </div>
        </div>

        {user?.role === UserRole.ADMIN && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-2xl font-bold mb-4">Add New Student</h2>
            <form onSubmit={handleAddStudent}>
              <div className="flex space-x-4">
                <input
                  type="text"
                  placeholder="Name"
                  className="flex-1 px-3 py-2 border rounded-lg"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="flex-1 px-3 py-2 border rounded-lg"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded-lg">
                  Add Student
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">All Students</h2>
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Email</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td className="py-2">{student.name}</td>
                  <td className="py-2">{student.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

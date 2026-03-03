import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { motion } from 'framer-motion';

interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  employeeId: string;
}

const StaffManagementPage: React.FC = () => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'Teacher',
    employeeId: '',
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await api.get('/staff');
      setStaffList(response.data);
    } catch (error) {
      console.error('Failed to fetch staff', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/staff', formData);
      setIsAdding(false);
      setFormData({ firstName: '', lastName: '', email: '', role: 'Teacher', employeeId: '' });
      fetchStaff();
    } catch (error) {
      console.error('Failed to add staff', error);
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-5xl font-black text-gray-900 uppercase tracking-tighter">Human Resources</h1>
            <p className="text-gray-400 font-mono text-sm mt-2">Total Personnel: {staffList.length}</p>
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="bg-black text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-gray-800 transition-all"
          >
            {isAdding ? 'Cancel' : 'Register New Staff'}
          </button>
        </header>

        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-50 p-8 rounded-3xl border-2 border-black mb-12"
          >
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">First Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-black outline-none transition-all"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Last Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-black outline-none transition-all"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Email Address</label>
                <input
                  type="email"
                  required
                  className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-black outline-none transition-all"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Role</label>
                <select
                  className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-black outline-none transition-all"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option>Teacher</option>
                  <option>Admin</option>
                  <option>Accountant</option>
                  <option>Librarian</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Employee ID</label>
                <input
                  type="text"
                  required
                  className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-black outline-none transition-all"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <button type="submit" className="w-full bg-black text-white py-3 rounded-xl font-bold uppercase tracking-widest text-xs">
                  Save Personnel Record
                </button>
              </div>
            </form>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {staffList.map((staff) => (
            <div key={staff.id} className="group border-2 border-gray-100 p-6 rounded-3xl hover:border-black transition-all cursor-pointer">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center font-bold text-gray-400 group-hover:bg-black group-hover:text-white transition-all">
                  {staff.firstName[0]}{staff.lastName[0]}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full text-gray-500">
                  {staff.role}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{staff.firstName} {staff.lastName}</h3>
              <p className="text-gray-400 text-sm font-mono mb-4">{staff.email}</p>
              <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">ID: {staff.employeeId}</span>
                <button className="text-xs font-bold uppercase tracking-widest text-black opacity-0 group-hover:opacity-100 transition-all">
                  View Profile →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StaffManagementPage;

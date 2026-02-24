import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { UserRole } from '../../../src/common/user-role.enum';

interface User {
  id: string;
  username: string;
  role: UserRole;
}

const SuperAdminPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<UserRole>(UserRole.ADMIN);

  useEffect(() => {
    if (user?.role === UserRole.SUPER_ADMIN) {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users', error);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setNewRole(user.role);
  };

  const handleUpdate = async () => {
    if (!editingUser) return;
    try {
      await api.patch(`/users/${editingUser.id}`, { role: newRole });
      fetchUsers();
      setEditingUser(null);
    } catch (error) {
      console.error('Failed to update user', error);
    }
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/users/${userId}`);
        fetchUsers();
      } catch (error) {
        console.error('Failed to delete user', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Super Admin Dashboard</h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">User Management</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Username</th>
                <th className="text-left py-3 px-4">Role</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b">
                  <td className="py-3 px-4">{user.username}</td>
                  <td className="py-3 px-4">{user.role}</td>
                  <td className="py-3 px-4">
                    <button onClick={() => handleEdit(user)} className="bg-blue-500 text-white py-1 px-3 rounded-lg mr-2">Edit</button>
                    <button onClick={() => handleDelete(user.id)} className="bg-red-500 text-white py-1 px-3 rounded-lg">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Edit User Role</h2>
            <select value={newRole} onChange={(e) => setNewRole(e.target.value as UserRole)} className="w-full px-3 py-2 border rounded-lg mb-4">
              {Object.values(UserRole).map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <div className="flex justify-end">
              <button onClick={() => setEditingUser(null)} className="bg-gray-500 text-white py-2 px-4 rounded-lg mr-2">Cancel</button>
              <button onClick={handleUpdate} className="bg-blue-500 text-white py-2 px-4 rounded-lg">Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminPage;

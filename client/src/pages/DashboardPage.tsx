import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage: React.FC = () => {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to the Dashboard</h1>
      <button onClick={logout} className="bg-red-500 text-white py-2 px-4 rounded-lg">
        Logout
      </button>
    </div>
  );
};

export default DashboardPage;

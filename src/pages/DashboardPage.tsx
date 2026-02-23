import { useAuth } from '../hooks/useAuth';
import { LogOut } from 'lucide-react';

const DashboardPage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center">
       <div className="w-full max-w-2xl p-8 bg-white rounded-2xl shadow-md">
        <h1 className="text-3xl font-bold text-slate-800 mb-4">Welcome!</h1>
        <p className="text-slate-600 mb-6">You have successfully signed in via Single Sign-On.</p>
        
        {user && (
          <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm text-slate-700">
            <p><strong>User ID:</strong> {user.userId}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Tenant ID:</strong> {user.tenantId}</p>
          </div>
        )}

        <button
          onClick={logout}
          className="mt-6 w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Log Out
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;

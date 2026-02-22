import React from 'react';
import { useQuery } from '@tanstack/react-query';
import * as api from '../../services/api';
import { AdminAuditLog } from '../../types';

const AdminAuditTrail: React.FC = () => {
  const { data: logs = [], isLoading } = useQuery({ queryKey: ['admin-audit-log'], queryFn: api.getAdminAuditLog });

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Admin Audit Trail</h3>
      <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
        <table className="w-full text-left table-auto">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">IP Address</th>
              <th className="px-4 py-3">User Agent</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log: AdminAuditLog) => (
              <tr key={log.id} className="border-b border-slate-100">
                <td className="px-4 py-3">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3">{log.action}</td>
                <td className="px-4 py-3">{log.userId}</td>
                <td className="px-4 py-3">{log.ipAddress}</td>
                <td className="px-4 py-3 text-xs">{log.userAgent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminAuditTrail;

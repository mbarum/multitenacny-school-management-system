import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import * as api from '../../services/api';
import { FinancialAuditLog } from '../../types';

const FinancialAuditTrail: React.FC = () => {
  const { data: logs = [], isLoading } = useQuery({ queryKey: ['financial-audit-log'], queryFn: api.getFinancialAuditLog });
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const verificationMutation = useMutation({
    mutationFn: api.verifyFinancialAuditTrail,
    onSuccess: (data) => setVerificationResult(data),
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Financial Audit Trail</h3>
        <button onClick={() => verificationMutation.mutate()} disabled={verificationMutation.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
          {verificationMutation.isPending ? 'Verifying...' : 'Verify Chain Integrity'}
        </button>
      </div>
      {verificationResult && (
        <div className={`p-4 rounded-lg mb-4 ${verificationResult.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          <strong>Verification Result:</strong> {verificationResult.isValid ? 'Chain is valid.' : 'Tampering detected!'}
          {!verificationResult.isValid && <ul>{verificationResult.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}</ul>}
        </div>
      )}
      <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
        <table className="w-full text-left table-auto">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Details</th>
              <th className="px-4 py-3">Hash</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log: FinancialAuditLog) => (
              <tr key={log.id} className="border-b border-slate-100">
                <td className="px-4 py-3">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3">{log.actionType}</td>
                <td className="px-4 py-3">{log.userId}</td>
                <td className="px-4 py-3"><pre className="text-xs bg-slate-50 p-2 rounded">{JSON.stringify(log.details, null, 2)}</pre></td>
                <td className="px-4 py-3 font-mono text-xs">{log.hash.substring(0, 16)}...</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinancialAuditTrail;

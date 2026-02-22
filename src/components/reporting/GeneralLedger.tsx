import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as api from '../../services/api';
import { Journal } from '../../types';
import { useData } from '../../contexts/DataContext';

const GeneralLedger: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { formatCurrency } = useData();
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });
  const { data: journals = [], isLoading } = useQuery({ 
    queryKey: ['journals', filters], 
    queryFn: () => api.getJournals(filters) 
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">General Ledger</h3>
        <button onClick={onBack} className="text-sm text-blue-600">Back to Reports</button>
      </div>
      {/* Add filter inputs here */}
      {isLoading ? (
        <p>Loading journal entries...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
          <table className="w-full text-left table-auto">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Memo</th>
                <th className="px-4 py-3 text-right">Debit</th>
                <th className="px-4 py-3 text-right">Credit</th>
              </tr>
            </thead>
            <tbody>
              {journals.map((journal: Journal) => (
                <React.Fragment key={journal.id}>
                  {journal.entries.map((entry, index) => (
                    <tr key={entry.id} className={`border-b border-slate-100 ${index === 0 ? 'font-bold' : ''}`}>
                      <td className="px-4 py-3">{index === 0 ? journal.date : ''}</td>
                      <td className="px-4 py-3">{index === 0 ? journal.reference : ''}</td>
                      <td className="px-4 py-3">{entry.account.name}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(entry.debit)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(entry.credit)}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GeneralLedger;

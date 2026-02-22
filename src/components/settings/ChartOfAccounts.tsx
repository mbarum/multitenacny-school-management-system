import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../../services/api';
import { Account, AccountType, AccountCategory } from '../../types';
import Modal from '../common/Modal';

const ChartOfAccounts: React.FC = () => {
  const { data: accounts = [], isLoading } = useQuery({ queryKey: ['accounts'], queryFn: api.getAccounts });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const handleOpenModal = (account: Account | null = null) => {
    setEditingAccount(account);
    setIsModalOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Chart of Accounts</h3>
        <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-primary-600 text-white rounded-lg">Add Account</button>
      </div>
      {isLoading ? (
        <p>Loading accounts...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
          <table className="w-full text-left table-auto">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc: Account) => (
                <tr key={acc.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-mono text-primary-700 font-bold">{acc.accountCode}</td>
                  <td className="px-4 py-3">{acc.name}</td>
                  <td className="px-4 py-3">{acc.type}</td>
                  <td className="px-4 py-3">{acc.category}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleOpenModal(acc)} className="text-blue-600 hover:underline">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {isModalOpen && <AccountModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} account={editingAccount} />}
    </div>
  );
};

const AccountModal: React.FC<{ isOpen: boolean, onClose: () => void, account: Account | null }> = ({ isOpen, onClose, account }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<Account>>({
    accountCode: '',
    name: '',
    type: AccountType.Asset,
    category: AccountCategory.CashAndBank,
    ...account,
  });

  const mutation = useMutation({
    mutationFn: (newData: Partial<Account>) => 
      account ? api.updateAccount(account.id, newData) : api.createAccount(newData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={account ? 'Edit Account' : 'Add Account'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" value={formData.accountCode} onChange={e => setFormData({ ...formData, accountCode: e.target.value })} placeholder="Account Code" className="w-full p-2 border rounded" required />
        <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Account Name" className="w-full p-2 border rounded" required />
        <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as AccountType })} className="w-full p-2 border rounded">
          {Object.values(AccountType).map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as AccountCategory })} className="w-full p-2 border rounded">
          {Object.values(AccountCategory).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex justify-end">
          <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded">Save</button>
        </div>
      </form>
    </Modal>
  );
};

export default ChartOfAccounts;

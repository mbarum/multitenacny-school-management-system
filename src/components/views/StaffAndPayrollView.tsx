import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '../common/Modal';
import Skeleton from '../common/Skeleton';
import Spinner from '../common/Spinner';
import type { Staff, Payroll, PayrollItem, NewStaff, PayrollEntry } from '../../types';
import { Role, PayrollItemType, CalculationType } from '../../types';
import { useData } from '../../contexts/DataContext';
import * as api from '../../services/api';

const StaffAndPayrollView: React.FC = () => {
    const { addNotification, formatCurrency, openIdCardModal } = useData();
    const queryClient = useQueryClient();
    
    const [activeTab, setActiveTab] = useState('roster');
    const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
    const [isRunPayrollModalOpen, setIsRunPayrollModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
    const [payrollWorksheet, setPayrollWorksheet] = useState<Payroll[]>([]);
    
    const photoInputRef = useRef<HTMLInputElement>(null);

    const { data: staffList = [], isLoading: rosterLoading } = useQuery({ queryKey: ['staff'], queryFn: api.getStaff });
    const { data: payrollItems = [] } = useQuery({ queryKey: ['payroll-items'], queryFn: api.getPayrollItems });
    const { data: history = [], isLoading: historyLoading } = useQuery({ 
        queryKey: ['payroll-history'], 
        queryFn: () => api.getPayrollHistory({ limit: 50 }).then(res => res.data) 
    });

    const staffMutation = useMutation({
        mutationFn: (data: NewStaff) => editingStaff ? api.updateStaff(editingStaff.id, data) : api.createStaff(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
            setIsStaffModalOpen(false);
            addNotification(`Staff member ${editingStaff ? 'updated' : 'enrolled'} successfully.`, 'success');
        },
        onError: (err: any) => addNotification(`Staff operation failed: ${err.message}`, 'error')
    });

    const payrollMutation = useMutation({
        mutationFn: api.savePayrollRun,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payroll-history'] });
            setIsRunPayrollModalOpen(false);
            addNotification('Payroll run successfully processed.', 'success');
        }
    });

    const [staffFormData, setStaffFormData] = useState<any>({
        name: '', email: '', userRole: Role.Teacher, role: '', salary: 0, joinDate: new Date().toISOString().split('T')[0]
    });

    const openEnrollment = (staff?: Staff) => {
        setEditingStaff(staff || null);
        setStaffFormData(staff || { name: '', email: '', userRole: Role.Teacher, role: '', salary: 0, joinDate: new Date().toISOString().split('T')[0] });
        setIsStaffModalOpen(true);
    };

    const handleSaveStaff = (e: React.FormEvent) => {
        e.preventDefault();
        const { id, userId, schoolId, ...payload } = staffFormData;
        staffMutation.mutate(payload);
    };

    const calculatePAYE = (taxablePay: number) => {
        const annualPay = taxablePay * 12;
        let tax = 0;
        if (annualPay <= 288000) tax = annualPay * 0.1;
        else if (annualPay <= 388000) tax = 28800 + (annualPay - 288000) * 0.25;
        else tax = 28800 + 25000 + (annualPay - 388000) * 0.30;
        return Math.max(0, (tax / 12) - 2400);
    };

    const generateDraft = () => {
        const month = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
        const draft = staffList.map((s: Staff) => {
            const basic = Number(s.salary);
            const earnings: PayrollEntry[] = [{ name: 'Basic Salary', amount: basic }];
            const deductions: PayrollEntry[] = [
                { name: 'PAYE', amount: calculatePAYE(basic) },
                { name: 'NSSF', amount: 200 }
            ];
            const gross = basic;
            const totalDed = deductions.reduce((sum, d) => sum + d.amount, 0);
            
            return {
                staffId: s.id,
                staffName: s.name,
                month,
                payDate: new Date().toISOString().split('T')[0],
                grossPay: gross,
                totalDeductions: totalDed,
                netPay: gross - totalDed,
                earnings,
                deductions
            };
        });
        setPayrollWorksheet(draft as any);
        setIsRunPayrollModalOpen(true);
    };

    return (
        <div className="p-6 md:p-8">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Staff & Human Resources</h2>
                <div className="flex space-x-3">
                    <button onClick={generateDraft} className="px-6 py-3 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-black transition-all">Process Payroll</button>
                    <button onClick={() => openEnrollment()} className="px-6 py-3 bg-primary-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-primary-700 transition-all shadow-xl shadow-primary-500/30">Enroll Staff</button>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px] text-slate-400">Identity</th>
                            <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px] text-slate-400">Role</th>
                            <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px] text-slate-400">Base Salary</th>
                            <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px] text-slate-400 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {rosterLoading ? (
                             Array.from({ length: 3 }).map((_, i) => (
                                <tr key={i}><td colSpan={4} className="px-8 py-4"><Skeleton className="h-6 w-full"/></td></tr>
                            ))
                        ) : staffList.map((s: Staff) => (
                            <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-8 py-4">
                                    <div className="font-black text-slate-800 text-lg">{s.name}</div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{s.email}</div>
                                </td>
                                <td className="px-8 py-4 font-bold text-slate-600">{s.role}</td>
                                <td className="px-8 py-4 font-black text-primary-700">{formatCurrency(s.salary)}</td>
                                <td className="px-8 py-4 text-center space-x-4">
                                    <button onClick={() => openIdCardModal(s, 'staff')} className="text-blue-600 font-black text-[10px] uppercase">ID Card</button>
                                    <button onClick={() => openEnrollment(s)} className="text-slate-400 hover:text-slate-900 font-black text-[10px] uppercase">Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isStaffModalOpen} onClose={() => setIsStaffModalOpen(false)} title={editingStaff ? 'Update Staff Profile' : 'Staff Enrollment'}>
                <form onSubmit={handleSaveStaff} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                            <input value={staffFormData.name} onChange={e=>setStaffFormData({...staffFormData, name: e.target.value})} className="w-full p-3 border-2 border-slate-100 rounded-xl focus:border-primary-500 outline-none font-bold" required/>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Work Email</label>
                            <input value={staffFormData.email} onChange={e=>setStaffFormData({...staffFormData, email: e.target.value})} className="w-full p-3 border-2 border-slate-100 rounded-xl focus:border-primary-500 outline-none font-bold" required/>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Designation</label>
                            <input value={staffFormData.role} onChange={e=>setStaffFormData({...staffFormData, role: e.target.value})} className="w-full p-3 border-2 border-slate-100 rounded-xl focus:border-primary-500 outline-none font-bold" placeholder="e.g. Senior Librarian" required/>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Salary (KES)</label>
                            <input type="number" value={staffFormData.salary} onChange={e=>setStaffFormData({...staffFormData, salary: parseFloat(e.target.value) || 0})} className="w-full p-3 border-2 border-slate-100 rounded-xl focus:border-primary-500 outline-none font-bold" required/>
                        </div>
                    </div>
                    <div className="flex justify-end pt-4 border-t">
                        <button type="submit" disabled={staffMutation.isPending} className="px-10 py-4 bg-primary-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-primary-500/30">
                            {staffMutation.isPending ? <Spinner /> : 'Commit Records'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isRunPayrollModalOpen} onClose={() => setIsRunPayrollModalOpen(false)} title="Payroll Confirmation Worksheet" size="3xl">
                <div className="space-y-6">
                    <p className="text-slate-500 font-medium">Review statutory deductions and net pay before finalizing the month's ledger entries.</p>
                    <div className="bg-slate-50 rounded-3xl p-6 overflow-hidden border border-slate-100">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <th className="pb-4">Staff Member</th>
                                    <th className="pb-4 text-right">Gross</th>
                                    <th className="pb-4 text-right">Deductions</th>
                                    <th className="pb-4 text-right">Net Disbursement</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {payrollWorksheet.map((p, idx) => (
                                    <tr key={idx}>
                                        <td className="py-4 font-bold text-slate-800">{p.staffName}</td>
                                        <td className="py-4 text-right font-bold text-green-700">{p.grossPay.toLocaleString()}</td>
                                        <td className="py-4 text-right font-bold text-red-600">({p.totalDeductions.toLocaleString()})</td>
                                        <td className="py-4 text-right font-black text-slate-900">{formatCurrency(p.netPay)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-end pt-4 border-t gap-4">
                        <button onClick={()=>setIsRunPayrollModalOpen(false)} className="px-8 py-4 font-black text-[10px] uppercase text-slate-400">Discard</button>
                        <button onClick={()=>payrollMutation.mutate(payrollWorksheet)} className="px-12 py-4 bg-primary-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary-500/30">Confirm & Save Entries</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default StaffAndPayrollView;
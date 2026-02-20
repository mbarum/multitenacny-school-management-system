import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '../components/common/Modal';
import UpgradeModal from '../components/common/UpgradeModal';
import type { SchoolInfo, User, FeeItem, SchoolClass, DarajaSettings, GradingRule } from '../types';
import { GradingSystem, Role, Currency, SubscriptionPlan, CbetScore } from '../types';
import { useData } from '../contexts/DataContext';
import * as api from '../services/api';
import Spinner from '../components/common/Spinner';

// --- Sub-Modals ---

const FeeItemModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    onSave: (item: any) => void; 
    item: FeeItem | null; 
    classes: SchoolClass[]; 
    feeCategories: string[]; 
    isPending?: boolean;
}> = ({ isOpen, onClose, onSave, item, classes, feeCategories, isPending }) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [frequency, setFrequency] = useState<'Termly' | 'Annually' | 'One-Time'>('Termly');
    const [isOptional, setIsOptional] = useState(false);
    const [classFees, setClassFees] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            if (item) {
                setName(item.name); 
                setCategory(item.category); 
                setFrequency(item.frequency as any); 
                setIsOptional(item.isOptional);
                const fees: Record<string, string> = {};
                item.classSpecificFees?.forEach(fee => { fees[fee.classId] = String(fee.amount); });
                setClassFees(fees);
            } else {
                setName(''); setCategory(feeCategories[0] || ''); setFrequency('Termly'); setIsOptional(false); setClassFees({});
            }
        }
    }, [item, isOpen, feeCategories]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const classSpecificFees = Object.entries(classFees)
            .map(([classId, amount]) => ({ classId, amount: parseFloat(amount as string) || 0 }))
            .filter(f => f.amount > 0);
            
        onSave({ 
            id: item?.id, name, category: category.trim().toUpperCase(), frequency, isOptional, classSpecificFees 
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={item ? 'Update Charge' : 'New Fee Charge'} size="lg">
             <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Label</label>
                        <input value={name} onChange={e=>setName(e.target.value)} className="p-3.5 border-2 border-slate-100 rounded-2xl w-full font-bold outline-none focus:border-primary-500 bg-slate-50" required/>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Interval</label>
                        <select value={frequency} onChange={e=>setFrequency(e.target.value as any)} className="p-3.5 border-2 border-slate-100 rounded-2xl w-full font-bold bg-slate-50 outline-none">
                            <option value="Termly">Termly</option>
                            <option value="Annually">Annually</option>
                            <option value="One-Time">One-Time</option>
                        </select>
                     </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                    <input list="cats" value={category} onChange={e=>setCategory(e.target.value)} className="p-3.5 border-2 border-slate-100 rounded-2xl w-full font-bold outline-none focus:border-primary-500 bg-slate-50" required/>
                    <datalist id="cats">{feeCategories.map(c=><option key={c} value={c}/>)}</datalist>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Grade Pricing Matrix</label>
                    <div className="max-h-56 overflow-y-auto border-2 border-slate-50 rounded-2xl p-4 space-y-2 bg-slate-50/50 shadow-inner custom-scrollbar">
                        {classes.map(c => (
                            <div key={c.id} className="flex items-center space-x-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm hover:border-primary-100 transition-colors">
                                <input type="checkbox" checked={classFees[c.id] !== undefined} onChange={() => setClassFees(p => { const n={...p}; if(n[c.id]!==undefined) delete n[c.id]; else n[c.id]=''; return n; })} className="h-5 w-5 rounded-lg text-primary-600 focus:ring-0 border-slate-200"/>
                                <span className="flex-1 text-xs font-black text-slate-700 uppercase">{c.name}</span>
                                {classFees[c.id] !== undefined && (
                                    <div className="flex items-center bg-slate-50 rounded-lg px-2 border border-slate-200">
                                        <span className="text-[10px] font-black text-slate-400 mr-2">{useData().schoolInfo?.currency || 'KES'}</span>
                                        <input type="number" value={classFees[c.id]} onChange={e=>setClassFees(p=>({...p, [c.id]: e.target.value}))} className="w-24 p-1 bg-transparent font-black text-primary-700 outline-none text-right" placeholder="0" autoFocus/>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                 </div>
                 <button type="submit" disabled={isPending} className="w-full py-4 bg-primary-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl shadow-primary-500/30 hover:bg-primary-700 transition-all flex items-center justify-center">
                    {isPending ? <Spinner /> : 'Save Financial Item'}
                 </button>
             </form>
        </Modal>
    );
};

const UserModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (u: any) => void; user: User | null; isPending?: boolean }> = ({ isOpen, onClose, onSave, user, isPending }) => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: Role.Teacher });
    useEffect(() => {
        if (user) setFormData({ name: user.name, email: user.email, password: '', role: user.role });
        else setFormData({ name: '', email: '', password: '', role: Role.Teacher });
    }, [user, isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={user ? 'Edit User Credentials' : 'New System User'} size="md">
            <form onSubmit={e => { e.preventDefault(); onSave({ ...formData, id: user?.id }); }} className="space-y-4">
                <input value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} placeholder="Full Legal Name" className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold bg-slate-50 focus:bg-white outline-none focus:border-primary-500 transition-all" required/>
                <input value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} placeholder="Official Email Address" className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold bg-slate-50 focus:bg-white outline-none focus:border-primary-500 transition-all" required/>
                <input type="password" value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} placeholder={user ? "Set New Password (optional)" : "Access Password"} className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold bg-slate-50 focus:bg-white outline-none focus:border-primary-500 transition-all" required={!user}/>
                <select value={formData.role} onChange={e=>setFormData({...formData, role: e.target.value as Role})} className="w-full p-4 border-2 border-slate-100 rounded-xl font-bold bg-slate-50 outline-none">
                    {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <button type="submit" disabled={isPending} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs shadow-xl hover:bg-black transition-all">
                    {isPending ? <Spinner /> : 'Finalize Identity'}
                </button>
            </form>
        </Modal>
    );
};

// --- Main View ---

const SettingsView: React.FC = () => {
    const { schoolInfo, updateSchoolInfo, addNotification, uploadLogo, formatCurrency } = useData();
    const queryClient = useQueryClient();
    const [activeSection, setActiveSection] = useState<'hub' | 'info' | 'users' | 'fee_structure' | 'grading' | 'mpesa'>('hub');
    const logoInputRef = useRef<HTMLInputElement>(null);
    const [localSchoolInfo, setLocalSchoolInfo] = useState<SchoolInfo | null>(null);

    // Hooks must be top-level
    const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: api.getUsers, enabled: activeSection === 'users' });
    const { data: feeStructure = [] } = useQuery({ queryKey: ['fee-structure'], queryFn: api.getFeeStructure, enabled: activeSection === 'fee_structure' });
    const { data: gradingScale = [] } = useQuery({ queryKey: ['grading-scale'], queryFn: api.getGradingScale, enabled: activeSection === 'grading' });
    const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: () => api.getClasses().then((res: any) => Array.isArray(res) ? res : res.data || []) });
    const { data: darajaSettings } = useQuery({ queryKey: ['daraja'], queryFn: api.getDarajaSettings, enabled: activeSection === 'mpesa' });

    const userMutation = useMutation({
        mutationFn: (d: any) => d.id ? api.updateUser(d.id, d) : api.createUser(d),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); setIsUserModalOpen(false); addNotification('User record updated', 'success'); }
    });

    const feeMutation = useMutation({
        mutationFn: (d: any) => d.id ? api.updateFeeItem(d.id, d) : api.createFeeItem(d),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['fee-structure'] }); setIsFeeModalOpen(false); addNotification('Financial ledger updated', 'success'); }
    });

    const gradingMutation = useMutation({
        mutationFn: (d: any) => d.id ? api.updateGradingRule(d.id, d) : api.createGradingRule(d),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['grading-scale'] }); addNotification('Rubric synchronized', 'success'); }
    });

    const darajaMutation = useMutation({
        mutationFn: api.updateDarajaSettings,
        onSuccess: () => { addNotification('Gateway settings secured', 'success'); }
    });

    // UI States
    const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
    const [editingFeeItem, setEditingFeeItem] = useState<FeeItem | null>(null);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [localDaraja, setLocalDaraja] = useState<any>({});
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

    useEffect(() => { if (schoolInfo) setLocalSchoolInfo(schoolInfo); }, [schoolInfo]);
    useEffect(() => { if (darajaSettings) setLocalDaraja(darajaSettings); }, [darajaSettings]);

    const feeCategories = useMemo(() => {
        const items = Array.isArray(feeStructure) ? feeStructure : [];
        return [...new Set(items.map((i: any) => i.category))];
    }, [feeStructure]);

    if (!localSchoolInfo) return <div className="p-20 text-center"><Spinner /></div>;

    const handleSaveInfo = (e: React.FormEvent) => {
        e.preventDefault();
        updateSchoolInfo(localSchoolInfo).then(() => {
            addNotification('Profile synchronized', 'success');
            setActiveSection('hub');
        });
    };

    const SettingTile: React.FC<{ id: typeof activeSection, title: string, desc: string, icon: React.ReactNode }> = ({ id, title, desc, icon }) => (
        <button onClick={() => setActiveSection(id)} className="bg-white p-8 rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all border border-slate-50 text-left group">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-primary-600 mb-6 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                {icon}
            </div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">{title}</h3>
            <p className="text-sm text-slate-400 font-medium leading-relaxed">{desc}</p>
        </button>
    );

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
                <div>
                    <h2 className="text-4xl font-black text-slate-800 tracking-tight uppercase">Control Center</h2>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Configure Institutional Governance</p>
                </div>
                {activeSection !== 'hub' && (
                    <button onClick={() => setActiveSection('hub')} className="flex items-center text-primary-600 font-black text-[10px] uppercase tracking-widest group">
                        <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7"/></svg>
                        Back to Hub
                    </button>
                )}
            </div>

            {activeSection === 'hub' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in-up">
                    <SettingTile 
                        id="info" title="Institutional Profile" desc="Legal name, logo, currency, and global academic framework settings." 
                        icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>}
                    />
                    <SettingTile 
                        id="users" title="Identity Vault" desc="Manage administrative, teaching, and accountant credentials and privileges." 
                        icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.975 5.975 0 0112 13a5.975 5.975 0 013 5.197"/></svg>}
                    />
                    <SettingTile 
                        id="fee_structure" title="Financial Ledger" desc="Configure termly billing items, mandatory fees, and class-specific pricing." 
                        icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>}
                    />
                    <SettingTile 
                        id="grading" title="Academic Rubrics" desc="Switch between Traditional Marks and CBE Performance descriptors." 
                        icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>}
                    />
                    <SettingTile 
                        id="mpesa" title="Secure Gateway" desc="Configure Lipa Na M-Pesa credentials for automated fee reconciliation." 
                        icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>}
                    />
                    <button onClick={() => setIsUpgradeModalOpen(true)} className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl hover:bg-black transition-all text-left relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-primary-400 font-black uppercase text-[10px] tracking-widest mb-2">Service Package</p>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-4">Enterprise Upgrade</h3>
                            <p className="text-sm text-slate-400 font-medium leading-relaxed">Unlock Premium modules including AI Reporting and Library Management.</p>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
                    </button>
                </div>
            )}

            {activeSection === 'info' && (
                <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 max-w-4xl mx-auto animate-fade-in-up">
                    <form onSubmit={handleSaveInfo} className="space-y-10">
                        <div className="flex items-center gap-10 border-b border-slate-100 pb-10">
                            <div className="relative group cursor-pointer" onClick={() => logoInputRef.current?.click()}>
                                <img src={localSchoolInfo.logoUrl || 'https://i.imgur.com/S5o7W44.png'} className="h-32 w-32 rounded-[2.5rem] object-cover border-4 border-slate-50 shadow-lg group-hover:scale-105 transition-all" />
                                <div className="absolute inset-0 bg-black/40 rounded-[2.5rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><span className="text-white text-[9px] font-black uppercase tracking-widest bg-black/50 p-2 rounded-lg">Update Logo</span></div>
                                <input type="file" ref={logoInputRef} className="hidden" onChange={e => {
                                    if (e.target.files?.[0]) {
                                        const fd = new FormData(); fd.append('logo', e.target.files[0]);
                                        uploadLogo(fd).then(res => setLocalSchoolInfo({...localSchoolInfo, logoUrl: res.logoUrl}));
                                    }
                                }} />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none mb-3">{localSchoolInfo.name}</h4>
                                <span className="px-3 py-1 bg-primary-50 text-primary-600 rounded-lg text-[10px] font-black uppercase tracking-widest">{localSchoolInfo.schoolCode}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Entity Name</label>
                                <input value={localSchoolInfo.name} onChange={e=>setLocalSchoolInfo({...localSchoolInfo, name: e.target.value})} className="w-full p-4 border-2 border-slate-50 bg-slate-50 rounded-2xl font-bold outline-none focus:border-primary-500 focus:bg-white transition-all"/>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Operational Currency</label>
                                <select value={localSchoolInfo.currency || 'KES'} onChange={e=>setLocalSchoolInfo({...localSchoolInfo, currency: e.target.value as any})} className="w-full p-4 border-2 border-slate-50 bg-slate-50 rounded-2xl font-bold outline-none">
                                    {Object.values(Currency).map(c=><option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Official Email</label>
                                <input value={localSchoolInfo.email} onChange={e=>setLocalSchoolInfo({...localSchoolInfo, email: e.target.value})} className="w-full p-4 border-2 border-slate-50 bg-slate-50 rounded-2xl font-bold outline-none focus:border-primary-500 focus:bg-white transition-all"/>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Registry Phone</label>
                                <input value={localSchoolInfo.phone} onChange={e=>setLocalSchoolInfo({...localSchoolInfo, phone: e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-primary-500 focus:bg-white transition-all"/>
                            </div>
                        </div>
                        <button type="submit" className="px-12 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-black transition-all transform active:scale-95">Commit Institutional Sync</button>
                    </form>
                </div>
            )}

            {activeSection === 'users' && (
                <div className="space-y-6 animate-fade-in-up">
                    <div className="flex justify-between items-center px-4">
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Identity Management</h3>
                        <button onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }} className="px-6 py-3 bg-primary-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary-500/30 transition-all hover:-translate-y-1">Issue New Access</button>
                    </div>
                    <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-white">
                                <tr>
                                    <th className="px-8 py-6 font-black uppercase text-[10px] tracking-widest">Full Name / Email</th>
                                    <th className="px-8 py-6 font-black uppercase text-[10px] tracking-widest">Privilege Level</th>
                                    <th className="px-8 py-6 font-black uppercase text-[10px] tracking-widest text-center">Manage</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {users.map((u: User) => (
                                    <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="font-black text-slate-800 text-lg uppercase tracking-tight">{u.name}</div>
                                            <div className="text-[10px] font-bold text-slate-400 mt-1">{u.email}</div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[9px] font-black uppercase rounded-lg tracking-widest">{u.role}</span>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <button onClick={() => { setEditingUser(u); setIsUserModalOpen(true); }} className="text-primary-600 font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all underline underline-offset-4 decoration-2">Revise Identity</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeSection === 'fee_structure' && (
                <div className="space-y-6 animate-fade-in-up">
                    <div className="flex justify-between items-center px-4">
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Financial Matrix</h3>
                        <button onClick={() => { setEditingFeeItem(null); setIsFeeModalOpen(true); }} className="px-6 py-3 bg-primary-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary-500/30 transition-all hover:-translate-y-1">New Fee Class</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {feeStructure.map((item: any) => (
                            <div key={item.id} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 group hover:-translate-y-1 transition-all">
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-lg text-[9px] font-black uppercase mb-3 inline-block tracking-widest">{item.category}</span>
                                        <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none">{item.name}</h4>
                                        <p className="text-[10px] text-slate-400 font-black uppercase mt-3 tracking-widest">{item.frequency} {item.isOptional ? '• Optional' : '• Mandatory'}</p>
                                    </div>
                                    <button onClick={() => { setEditingFeeItem(item); setIsFeeModalOpen(true); }} className="p-3 text-slate-300 hover:text-primary-600 transition-colors bg-slate-50 rounded-2xl">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                                    </button>
                                </div>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {item.classSpecificFees?.map((cf: any) => (
                                        <div key={cf.classId} className="flex justify-between items-center text-xs font-bold p-3.5 bg-slate-50 rounded-2xl border border-slate-100 group-hover:border-primary-100 transition-colors">
                                            <span className="text-slate-500 uppercase tracking-tight">{classes.find((c: any) => c.id === cf.classId)?.name}</span>
                                            <span className="text-slate-800 font-black">{formatCurrency(cf.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeSection === 'grading' && (
                <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 space-y-12 animate-fade-in-up">
                    <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8">System Global Rubric</h4>
                        <div className="flex gap-8">
                            <button onClick={()=>updateSchoolInfo({...localSchoolInfo, gradingSystem: GradingSystem.Traditional})} className={`flex-1 p-10 rounded-[2rem] border-4 transition-all text-left relative overflow-hidden group ${localSchoolInfo.gradingSystem === GradingSystem.Traditional ? 'border-primary-500 bg-primary-50 shadow-inner' : 'border-slate-50 opacity-60 hover:opacity-100'}`}>
                                <h5 className="font-black text-slate-800 uppercase text-xs tracking-widest mb-3">Numeric Performance</h5>
                                <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed">Classical percentage maps to letter-based grades (A-E).</p>
                                {localSchoolInfo.gradingSystem === GradingSystem.Traditional && <div className="absolute top-4 right-4 h-3 w-3 bg-primary-600 rounded-full animate-pulse"></div>}
                            </button>
                            <button onClick={()=>updateSchoolInfo({...localSchoolInfo, gradingSystem: GradingSystem.CBC})} className={`flex-1 p-10 rounded-[2rem] border-4 transition-all text-left relative overflow-hidden group ${localSchoolInfo.gradingSystem === GradingSystem.CBC ? 'border-primary-500 bg-primary-50 shadow-inner' : 'border-slate-50 opacity-60 hover:opacity-100'}`}>
                                <h5 className="font-black text-slate-800 uppercase text-xs tracking-widest mb-3">Competency Rubrics</h5>
                                <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed">Qualitative outcome tracking (EE, ME, AE, BE).</p>
                                {localSchoolInfo.gradingSystem === GradingSystem.CBC && <div className="absolute top-4 right-4 h-3 w-3 bg-primary-600 rounded-full animate-pulse"></div>}
                            </button>
                        </div>
                    </div>
                    {localSchoolInfo.gradingSystem === GradingSystem.Traditional ? (
                        <div className="animate-fade-in">
                            <div className="flex justify-between items-end mb-10">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Rubric Logic</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Letter-Grade Percentage Maps</p>
                                </div>
                                <button onClick={() => gradingMutation.mutate({ grade: 'New', minScore: 0, maxScore: 10 })} className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em] hover:text-primary-700 transition-all border-b-2 border-primary-500 pb-1">+ Append Row</button>
                            </div>
                            <div className="overflow-hidden border-2 border-slate-50 rounded-[2.5rem] shadow-inner">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-900 text-white font-black uppercase text-[10px] tracking-[0.2em]">
                                        <tr><th className="px-10 py-6">Grade Label</th><th className="px-10 py-6 text-center">Floor (%)</th><th className="px-10 py-6 text-right">Ceiling (%)</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-bold">
                                        {gradingScale.map((rule: GradingRule) => (
                                            <tr key={rule.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-10 py-5 font-black text-primary-700 text-2xl uppercase">{rule.grade}</td>
                                                <td className="px-10 py-5 text-slate-600 text-center text-lg">{rule.minScore}</td>
                                                <td className="px-10 py-5 text-slate-600 text-right text-lg">{rule.maxScore}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-fade-in">
                            <div className="mb-10">
                                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Performance Qualifiers</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">CBC Standard Descriptors</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {Object.entries(CbetScore).map(([key, val]) => (
                                    <div key={key} className="p-8 bg-slate-50 rounded-[2rem] border-2 border-white shadow-sm hover:border-primary-100 transition-all group">
                                        <p className="text-3xl font-black text-primary-600 leading-none mb-3 group-hover:scale-110 transition-transform origin-left">{val}</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Competency Assessment Tag</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeSection === 'mpesa' && (
                <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 max-w-2xl mx-auto animate-fade-in-up">
                    <div className="flex items-center gap-6 mb-12 border-b border-slate-50 pb-8">
                        <div className="p-4 bg-green-50 rounded-3xl"><img src="https://i.imgur.com/G5YvJ2F.png" className="h-8" alt="mpesa" /></div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Gateway Config</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Daraja API v2.0 Integration</p>
                        </div>
                    </div>
                    <div className="space-y-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lipa Na M-Pesa Paybill</label>
                            <input value={localDaraja.paybillNumber || ''} onChange={e=>setLocalDaraja({...localDaraja, paybillNumber: e.target.value})} className="w-full p-4 border-2 border-slate-50 bg-slate-50 rounded-2xl font-bold outline-none focus:border-primary-500 focus:bg-white transition-all" placeholder="522522" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Consumer Key</label>
                            <input value={localDaraja.consumerKey || ''} onChange={e=>setLocalDaraja({...localDaraja, consumerKey: e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-primary-500 focus:bg-white transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Consumer Secret</label>
                            <input type="password" value={localDaraja.consumerSecret || ''} onChange={e=>setLocalDaraja({...localDaraja, consumerSecret: e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-primary-500 focus:bg-white transition-all" />
                        </div>
                        <button onClick={() => darajaMutation.mutate(localDaraja)} disabled={darajaMutation.isPending} className="px-12 py-5 bg-primary-600 text-white rounded-[1.8rem] font-black uppercase text-xs tracking-widest shadow-2xl shadow-primary-500/30 hover:bg-primary-700 transition-all flex items-center justify-center active:scale-95 w-full">
                            {darajaMutation.isPending ? <Spinner /> : 'Validate & Lock Gateway'}
                        </button>
                    </div>
                </div>
            )}

            <FeeItemModal isOpen={isFeeModalOpen} onClose={() => setIsFeeModalOpen(false)} onSave={(d) => feeMutation.mutate(d)} item={editingFeeItem} classes={classes} feeCategories={feeCategories} isPending={feeMutation.isPending} />
            <UserModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} onSave={(u) => userMutation.mutate(u)} user={editingUser} isPending={userMutation.isPending} />
            <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />
        </div>
    );
};

export default SettingsView;
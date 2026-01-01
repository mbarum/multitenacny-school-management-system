
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '../components/common/Modal';
import Spinner from '../components/common/Spinner';
import type { SchoolInfo, User, FeeItem, SchoolClass, DarajaSettings, ClassFee, NewUser, NewFeeItem, GradingRule } from '../types';
import { GradingSystem, CbetScore, Role, Currency, CBC_LEVEL_MAP } from '../types';
import { useData } from '../contexts/DataContext';
import * as api from '../services/api';

const FeeItemModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: any) => void;
    item: FeeItem | null;
    classes: SchoolClass[];
    feeCategories: string[];
    isPending: boolean;
}> = ({ isOpen, onClose, onSave, item, classes, feeCategories, isPending }) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [frequency, setFrequency] = useState<string>('Termly');
    const [isOptional, setIsOptional] = useState(false);
    const [classFees, setClassFees] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            if (item) {
                setName(item.name);
                setCategory(item.category);
                setFrequency(item.frequency);
                setIsOptional(item.isOptional);
                const fees: Record<string, string> = {};
                item.classSpecificFees.forEach(fee => {
                    fees[fee.classId] = String(fee.amount);
                });
                setClassFees(fees);
            } else {
                setName('');
                setCategory(feeCategories[0] || '');
                setFrequency('Termly');
                setIsOptional(false);
                setClassFees({});
            }
        }
    }, [item, isOpen, feeCategories]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const classSpecificFees = Object.entries(classFees)
            .map(([classId, amount]) => ({ classId, amount: parseFloat(amount as string) || 0 }))
            .filter(f => f.amount > 0);
        onSave({ id: item?.id, name, category, frequency, isOptional, classSpecificFees });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={item ? 'Edit Fee Item' : 'Create New Fee Item'} size="lg">
             <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fee Name</label>
                        <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Tuition Fee" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-bold" required/>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Billing Frequency</label>
                        <select value={frequency} onChange={e=>setFrequency(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-bold bg-white">
                            <option value="Termly">Termly</option>
                            <option value="Annually">Annually</option>
                            <option value="One-Time">One-Time</option>
                        </select>
                     </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accounting Category</label>
                    <input list="cats" value={category} onChange={e=>setCategory(e.target.value)} placeholder="e.g. Academic Fees" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-bold" required/>
                    <datalist id="cats">{feeCategories.map(c=><option key={c} value={c}/>)}</datalist>
                 </div>
                 
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Class-Specific Pricing</label>
                    <div className="p-4 border border-slate-100 rounded-2xl max-h-64 overflow-y-auto bg-slate-50 space-y-3">
                        {classes.map(c => (
                            <div key={c.id} className="flex items-center space-x-4 bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                                <input type="checkbox" checked={classFees[c.id] !== undefined} onChange={() => setClassFees(prev => { const n = {...prev}; if(n[c.id]!==undefined) delete n[c.id]; else n[c.id]=''; return n; })} className="h-5 w-5 rounded-lg text-primary-600"/>
                                <span className="flex-1 font-bold text-slate-700">{c.name}</span>
                                {classFees[c.id] !== undefined && (
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xs font-black text-slate-300">KES</span>
                                        <input type="number" value={classFees[c.id]} onChange={e=>setClassFees(p=>({...p, [c.id]: e.target.value}))} className="w-28 p-2 border border-slate-200 rounded-lg text-right font-black" placeholder="0.00"/>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                 </div>

                 <div className="flex items-center p-3 bg-blue-50 rounded-xl">
                    <input id="opt-chk" type="checkbox" checked={isOptional} onChange={e => setIsOptional(e.target.checked)} className="h-5 w-5 rounded-lg text-blue-600 mr-3"/>
                    <label htmlFor="opt-chk" className="text-sm font-bold text-blue-800">This is an optional/elective fee</label>
                 </div>

                 <div className="flex justify-end pt-4 border-t gap-3">
                    <button type="button" onClick={onClose} className="px-6 py-3 font-black text-[10px] uppercase text-slate-400 hover:text-slate-600">Cancel</button>
                    <button type="submit" disabled={isPending} className="px-8 py-3 bg-primary-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-primary-500/30 hover:bg-primary-700 transition-all flex items-center gap-2">
                        {isPending ? <Spinner /> : (item ? 'Update Fee' : 'Create Fee')}
                    </button>
                 </div>
             </form>
        </Modal>
    );
};

const UserModal: React.FC<any> = ({ isOpen, onClose, onSave, user }) => {
     const [formData, setFormData] = useState({ name: '', email: '', password: '', role: Role.Parent });
     useEffect(() => { if(user) setFormData({name: user.name, email: user.email, password: '', role: user.role}); else setFormData({name: '', email: '', password: '', role: Role.Parent}) }, [user, isOpen]);
     const handleChange = (e: any) => setFormData(p => ({...p, [e.target.name]: e.target.value}));
     const handleSubmit = (e: any) => { e.preventDefault(); onSave(user ? {...formData, id: user.id} : formData); }
     return <Modal isOpen={isOpen} onClose={onClose} title={user ? 'Edit User' : 'Add User'}>
         <form onSubmit={handleSubmit} className="space-y-4">
             <input name="name" value={formData.name} onChange={handleChange} placeholder="Name" className="w-full p-2 border rounded" required/>
             <input name="email" value={formData.email} onChange={handleChange} placeholder="Email" className="w-full p-2 border rounded" required/>
             <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Password" className="w-full p-2 border rounded"/>
             <select name="role" value={formData.role} onChange={handleChange} className="w-full p-2 border rounded">{Object.values(Role).map(r=><option key={r} value={r}>{r}</option>)}</select>
             <button type="submit" className="w-full bg-primary-600 text-white p-2 rounded">Save</button>
         </form>
     </Modal>
}

const SettingsView: React.FC = () => {
    const { schoolInfo, updateSchoolInfo, addNotification, uploadLogo, currentUser } = useData();
    const queryClient = useQueryClient();
    const logoInputRef = useRef<HTMLInputElement>(null);
    
    const [activeTab, setActiveTab] = useState('info');
    const [localSchoolInfo, setLocalSchoolInfo] = useState<SchoolInfo | null>(null);

    // Queries
    const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => api.getUsers(), enabled: activeTab === 'users' });
    const { data: feeStructure = [] } = useQuery({ queryKey: ['fee-structure'], queryFn: () => api.getFeeStructure(), enabled: activeTab === 'fee_structure' });
    const { data: gradingScale = [] } = useQuery({ queryKey: ['grading-scale'], queryFn: () => api.getGradingScale(), enabled: activeTab === 'grading' });
    const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: () => api.getClasses().then(res => Array.isArray(res) ? res : res.data) });
    const { data: darajaSettings } = useQuery({ queryKey: ['daraja'], queryFn: () => api.getDarajaSettings(), enabled: activeTab === 'mpesa' });

    // Local States
    const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
    const [editingFeeItem, setEditingFeeItem] = useState<FeeItem | null>(null);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [localDaraja, setLocalDaraja] = useState<any>({});
    const [localGradingScale, setLocalGradingScale] = useState<GradingRule[]>([]);

    useEffect(() => { if(darajaSettings) setLocalDaraja(darajaSettings); }, [darajaSettings]);
    useEffect(() => { if(gradingScale) setLocalGradingScale(gradingScale); }, [gradingScale]);
    useEffect(() => { setLocalSchoolInfo(schoolInfo); }, [schoolInfo]);

    // Mutations
    const feeMutation = useMutation({ 
        mutationFn: (data: any) => data.id ? api.updateFeeItem(data.id, data) : api.createFeeItem(data), 
        onSuccess: () => { 
            queryClient.invalidateQueries({ queryKey: ['fee-structure'] }); 
            setIsFeeModalOpen(false); 
            addNotification('Fee structure updated successfully', 'success'); 
        },
        onError: () => addNotification('Failed to save fee item', 'error')
    });

    const deleteFeeMutation = useMutation({ 
        mutationFn: api.deleteFeeItem, 
        onSuccess: () => { 
            queryClient.invalidateQueries({ queryKey: ['fee-structure'] }); 
            addNotification('Fee item deleted', 'success');
        },
        onError: () => addNotification('Failed to delete fee item', 'error')
    });

    const userMutation = useMutation({ 
        mutationFn: (data: any) => data.id ? api.updateUser(data.id, data) : api.createUser(data), 
        onSuccess: () => { 
            queryClient.invalidateQueries({ queryKey: ['users'] }); 
            setIsUserModalOpen(false); 
            addNotification('User settings saved successfully', 'success'); 
        },
        onError: () => addNotification('Failed to save user', 'error')
    });

    const deleteUserMutation = useMutation({ 
        mutationFn: api.deleteUser, 
        onSuccess: () => { 
            queryClient.invalidateQueries({ queryKey: ['users'] }); 
            addNotification('User removed', 'success');
        },
        onError: () => addNotification('Failed to delete user', 'error')
    });

    const gradingMutation = useMutation({ 
        mutationFn: (data: any) => data.id ? api.updateGradingRule(data.id, data) : api.createGradingRule(data), 
        onSuccess: () => { 
            queryClient.invalidateQueries({ queryKey: ['grading-scale'] }); 
            addNotification('Grading parameters synchronized', 'success'); 
        },
        onError: () => addNotification('Failed to sync grading rule', 'error')
    });

    const deleteGradingMutation = useMutation({ 
        mutationFn: api.deleteGradingRule, 
        onSuccess: () => { 
            queryClient.invalidateQueries({ queryKey: ['grading-scale'] }); 
            addNotification('Grading rule deleted', 'success');
        },
        onError: () => addNotification('Failed to delete grading rule', 'error')
    });

    const darajaMutation = useMutation({ 
        mutationFn: api.updateDarajaSettings, 
        onSuccess: () => { 
            queryClient.invalidateQueries({ queryKey: ['daraja'] }); 
            addNotification('M-Pesa integration parameters saved successfully', 'success'); 
        },
        onError: () => addNotification('Failed to save M-Pesa settings', 'error')
    });

    const infoMutation = useMutation({
        mutationFn: api.updateSchoolInfo,
        onSuccess: (data) => {
            updateSchoolInfo(data); 
            addNotification('Institutional profile updated successfully', 'success');
        },
        onError: () => addNotification('Failed to update school info', 'error')
    });

    // --- Memo and Callback definitions (MUST BE ABOVE EARLY RETURN) ---
    const feeCategories = useMemo(() => {
        const cats = [...new Set((feeStructure as FeeItem[]).map(i => i.category))];
        return cats.length > 0 ? cats : ['Academic Fees', 'Transport', 'Meals', 'Extra-Curricular'];
    }, [feeStructure]);

    const handleGradingChange = (id: string, field: keyof GradingRule, value: any) => {
        setLocalGradingScale(prev => prev.map(rule => rule.id === id ? { ...rule, [field]: value } : rule));
    }

    const saveGrading = () => {
         localGradingScale.forEach(rule => gradingMutation.mutate(rule));
    }

    // --- Early Return (CRITICAL: MUST BE BELOW ALL HOOK CALLS) ---
    if (!localSchoolInfo) return null;

    const handleSaveSchoolInfo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (localSchoolInfo) {
            // SECURITY: Strip non-whitelisted fields before sending to prevent 400 Bad Request
            const cleanInfo = {
                name: localSchoolInfo.name,
                schoolCode: localSchoolInfo.schoolCode,
                address: localSchoolInfo.address,
                phone: localSchoolInfo.phone,
                email: localSchoolInfo.email,
                logoUrl: localSchoolInfo.logoUrl,
                gradingSystem: localSchoolInfo.gradingSystem,
                currency: localSchoolInfo.currency
            };
            infoMutation.mutate(cleanInfo as any);
        }
    };

    return (
        <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Platform Configuration</h2>
                    <p className="text-slate-500 font-medium">Enterprise settings & system integrations.</p>
                </div>
            </div>

            <div className="border-b border-slate-200 mb-10 overflow-x-auto scrollbar-hide">
                <nav className="-mb-px flex space-x-10">
                    {[
                        { id: 'info', label: 'Institutional Profile', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
                        { id: 'fee_structure', label: 'Fee Architecture', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg> },
                        { id: 'grading', label: 'Grading Framework', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
                        { id: 'mpesa', label: 'M-Pesa Gateway', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
                        { id: 'users', label: 'Access Control', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg> }
                    ].map(tab => (
                        <button 
                            key={tab.id} 
                            onClick={() => setActiveTab(tab.id)} 
                            className={`whitespace-nowrap py-4 px-1 border-b-4 font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 transition-all ${
                                activeTab === tab.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            
            <div className="animate-fade-in">
            {activeTab === 'info' && (
                 <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
                    <form onSubmit={handleSaveSchoolInfo} className="space-y-10">
                        <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-10">
                            <div className="relative group cursor-pointer" onClick={() => logoInputRef.current?.click()}>
                                <img src={localSchoolInfo.logoUrl} alt="Logo" className="h-40 w-40 rounded-[2.5rem] object-cover border-8 border-slate-50 shadow-inner group-hover:opacity-80 transition-all" />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="bg-black/50 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-full backdrop-blur-md">Change Logo</span>
                                </div>
                                <input type="file" ref={logoInputRef} onChange={async (e) => {
                                    if (e.target.files?.[0]) {
                                        const fd = new FormData();
                                        fd.append('logo', e.target.files[0]);
                                        const res = await uploadLogo(fd);
                                        setLocalSchoolInfo({...localSchoolInfo, logoUrl: res.logoUrl});
                                    }
                                }} className="hidden" accept="image/*" />
                            </div>
                            <div className="text-center md:text-left">
                                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Institutional Identity</h3>
                                <p className="text-slate-400 font-bold text-sm">This data is used globally for report cards, certificates, and official invoices.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-slate-100">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Official School Name</label>
                                <input value={localSchoolInfo.name} onChange={e => setLocalSchoolInfo({...localSchoolInfo, name: e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl focus:border-primary-500 transition-all outline-none font-bold text-slate-700 shadow-sm" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Operating Currency</label>
                                <select value={localSchoolInfo.currency || 'KES'} onChange={e => setLocalSchoolInfo({...localSchoolInfo, currency: e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl focus:border-primary-500 transition-all outline-none font-bold text-slate-700 shadow-sm bg-white">
                                    {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Official Phone</label>
                                <input value={localSchoolInfo.phone} onChange={e => setLocalSchoolInfo({...localSchoolInfo, phone: e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl focus:border-primary-500 transition-all outline-none font-bold text-slate-700 shadow-sm" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Official Email</label>
                                <input value={localSchoolInfo.email} onChange={e => setLocalSchoolInfo({...localSchoolInfo, email: e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl focus:border-primary-500 transition-all outline-none font-bold text-slate-700 shadow-sm" />
                            </div>
                            <div className="col-span-1 md:col-span-2 space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Physical Address</label>
                                <input value={localSchoolInfo.address} onChange={e => setLocalSchoolInfo({...localSchoolInfo, address: e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl focus:border-primary-500 transition-all outline-none font-bold text-slate-700 shadow-sm" />
                            </div>
                        </div>
                        <div className="flex justify-end pt-6 border-t border-slate-100">
                            <button type="submit" disabled={infoMutation.isPending} className="px-12 py-5 bg-primary-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-primary-500/40 hover:-translate-y-1 transition-all active:scale-95 flex items-center gap-3">
                                {infoMutation.isPending ? <Spinner /> : 'Save System Profile'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {activeTab === 'fee_structure' && (
                <div className="space-y-8">
                     <div className="bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl text-white flex justify-between items-center relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-4xl font-black uppercase leading-tight">Financial<br/>Architecture.</h3>
                            <p className="text-slate-400 font-bold mt-4 max-w-sm">Define termly and one-time charges per class level to enable automated bulk invoicing.</p>
                        </div>
                        <button onClick={() => { setEditingFeeItem(null); setIsFeeModalOpen(true); }} className="relative z-10 px-8 py-4 bg-primary-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-primary-500 transition-all shadow-xl shadow-primary-600/20">
                            Add Billable Item
                        </button>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {(feeStructure as FeeItem[]).map(item => (
                            <div key={item.id} className="bg-white p-8 rounded-[2rem] border-2 border-slate-50 shadow-lg hover:shadow-xl transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 flex space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingFeeItem(item); setIsFeeModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    </button>
                                    <button onClick={() => { if(confirm('Permanently delete this fee item?')) deleteFeeMutation.mutate(item.id); }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                                <div className="mb-6">
                                    <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full font-black text-[10px] uppercase tracking-widest">{item.category}</span>
                                    <h4 className="text-2xl font-black text-slate-800 mt-3">{item.name}</h4>
                                    <p className="text-slate-400 font-bold text-sm">{item.frequency} {item.isOptional ? '• Optional' : '• Mandatory'}</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b pb-1">Price per Grade</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {item.classSpecificFees.map(fee => (
                                            <div key={fee.classId} className="flex justify-between items-center text-xs font-bold text-slate-600 bg-slate-50 px-3 py-2 rounded-xl">
                                                <span>{classes.find((c: any)=>c.id === fee.classId)?.name || 'Level'}</span>
                                                <span className="font-black text-slate-900">KES {fee.amount.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <FeeItemModal 
                        isOpen={isFeeModalOpen} 
                        onClose={() => setIsFeeModalOpen(false)} 
                        onSave={(d) => feeMutation.mutate(d)} 
                        item={editingFeeItem} 
                        classes={classes} 
                        feeCategories={feeCategories}
                        isPending={feeMutation.isPending}
                    />
                </div>
            )}
            
            {activeTab === 'grading' && (
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
                        <div className="flex justify-between items-start mb-8">
                             <div>
                                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Academic Framework</h3>
                                <p className="text-slate-400 font-bold text-sm mt-1">Switch between traditional grade letters or Kenyan CBC rubrics.</p>
                             </div>
                             <select 
                                value={localSchoolInfo.gradingSystem} 
                                onChange={e => {
                                    const newSystem = e.target.value as GradingSystem;
                                    setLocalSchoolInfo({...localSchoolInfo, gradingSystem: newSystem});
                                    infoMutation.mutate({...localSchoolInfo, gradingSystem: newSystem});
                                }} 
                                className="p-3 border-2 border-slate-100 rounded-xl focus:border-primary-500 outline-none font-black text-xs uppercase tracking-widest bg-slate-50"
                            >
                                <option value={GradingSystem.Traditional}>Standard (Marks)</option>
                                <option value={GradingSystem.CBC}>Kenyan CBC</option>
                            </select>
                        </div>

                        {localSchoolInfo.gradingSystem === GradingSystem.Traditional && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-5 gap-4 px-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">
                                    <div className="col-span-1">Symbol</div>
                                    <div className="col-span-1 text-center">Min %</div>
                                    <div className="col-span-1 text-center">Max %</div>
                                    <div className="col-span-2 text-right">Actions</div>
                                </div>
                                <div className="space-y-3">
                                    {localGradingScale.sort((a,b) => b.minScore - a.minScore).map(rule => (
                                        <div key={rule.id} className="grid grid-cols-5 gap-4 bg-slate-50 p-4 rounded-2xl items-center border border-slate-100">
                                            <input value={rule.grade} onChange={e=>handleGradingChange(rule.id, 'grade', e.target.value)} className="p-2 border border-slate-200 rounded-lg font-black text-center text-primary-600 focus:ring-2 focus:ring-primary-500 outline-none"/>
                                            <input type="number" value={rule.minScore} onChange={e=>handleGradingChange(rule.id, 'minScore', parseInt(e.target.value) || 0)} className="p-2 border border-slate-200 rounded-lg text-center font-bold"/>
                                            <input type="number" value={rule.maxScore} onChange={e=>handleGradingChange(rule.id, 'maxScore', parseInt(e.target.value) || 0)} className="p-2 border border-slate-200 rounded-lg text-center font-bold"/>
                                            <div className="col-span-2 flex justify-end gap-3">
                                                <button onClick={()=>deleteGradingMutation.mutate(rule.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                                    <button onClick={()=>gradingMutation.mutate({grade: 'New', minScore: 0, maxScore: 0})} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">+ Add Rule</button>
                                    <button onClick={saveGrading} disabled={gradingMutation.isPending} className="px-10 py-4 bg-primary-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-primary-500/30 hover:-translate-y-1 transition-all flex items-center gap-3">
                                        {gradingMutation.isPending ? <Spinner /> : 'Sync Grading Scale'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {localSchoolInfo.gradingSystem === GradingSystem.CBC && (
                            <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-dashed border-slate-200">
                                 <h4 className="text-xl font-black text-slate-800 mb-6">Kenyan CBC Rubrics (EE-BE)</h4>
                                 <div className="grid grid-cols-1 gap-4">
                                     {Object.entries(CBC_LEVEL_MAP).map(([key, info]: [string, any]) => (
                                         <div key={key} className="flex items-center gap-6 bg-white p-5 rounded-2xl shadow-sm">
                                             <div className="w-16 h-16 bg-primary-600 text-white rounded-2xl flex items-center justify-center text-2xl font-black">{key}</div>
                                             <div>
                                                 <p className="font-black text-slate-900 text-lg uppercase tracking-tight">{info.description}</p>
                                                 <p className="text-sm font-bold text-slate-400">Scale Points: {info.points}</p>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                                 <p className="mt-8 text-xs font-bold text-slate-400 text-center italic">The CBC framework is locked to national standards and cannot be customized.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {activeTab === 'mpesa' && (
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
                        <div className="flex items-center gap-6 mb-10 border-b border-slate-100 pb-10">
                            <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center">
                                <img src="https://i.imgur.com/G5YvJ2F.png" className="h-8" alt="M-Pesa" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Daraja API Gateway</h3>
                                <p className="text-slate-400 font-bold text-sm">Automate your cashflow with direct Safaricom Paybill integration.</p>
                            </div>
                        </div>

                        <form onSubmit={e => {e.preventDefault(); darajaMutation.mutate(localDaraja);}} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Paybill / Store Number</label>
                                    <input value={localDaraja.paybillNumber || ''} onChange={e => setLocalDaraja({...localDaraja, paybillNumber: e.target.value})} placeholder="e.g. 745321" className="w-full p-4 border-2 border-slate-50 rounded-2xl focus:border-green-500 transition-all outline-none font-black text-slate-700 shadow-sm" required/>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Short Code</label>
                                    <input value={localDaraja.shortCode || ''} onChange={e => setLocalDaraja({...localDaraja, shortCode: e.target.value})} placeholder="e.g. 745321" className="w-full p-4 border-2 border-slate-50 rounded-2xl focus:border-green-500 transition-all outline-none font-black text-slate-700 shadow-sm" required/>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Consumer Key</label>
                                <input value={localDaraja.consumerKey || ''} onChange={e => setLocalDaraja({...localDaraja, consumerKey: e.target.value})} placeholder="Live API Key" className="w-full p-4 border-2 border-slate-50 rounded-2xl focus:border-green-500 transition-all outline-none font-mono text-sm text-slate-700 shadow-sm" required/>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Consumer Secret</label>
                                <input type="password" value={localDaraja.consumerSecret || ''} onChange={e => setLocalDaraja({...localDaraja, consumerSecret: e.target.value})} placeholder="••••••••••••••••" className="w-full p-4 border-2 border-slate-50 rounded-2xl focus:border-green-500 transition-all outline-none font-mono text-sm text-slate-700 shadow-sm" required/>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Online Passkey</label>
                                <input type="password" value={localDaraja.passkey || ''} onChange={e => setLocalDaraja({...localDaraja, passkey: e.target.value})} placeholder="LNM Passkey" className="w-full p-4 border-2 border-slate-50 rounded-2xl focus:border-green-500 transition-all outline-none font-mono text-sm text-slate-700 shadow-sm" required/>
                            </div>

                            <div className="flex flex-col md:flex-row items-center justify-between pt-10 border-t border-slate-100 gap-6">
                                <div className="flex items-center gap-3 text-slate-400">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
                                    <span className="text-xs font-bold uppercase tracking-widest">TLS 1.2 Encrypted</span>
                                </div>
                                <button type="submit" disabled={darajaMutation.isPending} className="w-full md:w-auto px-12 py-5 bg-green-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-green-500/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-3">
                                    {darajaMutation.isPending ? <Spinner /> : 'Establish Connection'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {activeTab === 'users' && (
                 <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
                     <div className="flex justify-between items-center mb-10">
                         <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">System Operators</h3>
                         <button onClick={()=>{setEditingUser(null); setIsUserModalOpen(true)}} className="px-6 py-3 bg-primary-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary-500/20">Provision New User</button>
                     </div>
                     <div className="overflow-x-auto rounded-3xl border border-slate-50">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-white">
                                <tr>
                                    <th className="p-6 font-black uppercase text-[10px] tracking-widest border-r border-slate-800">Identity</th>
                                    <th className="p-6 font-black uppercase text-[10px] tracking-widest border-r border-slate-800">System Role</th>
                                    <th className="p-6 font-black uppercase text-[10px] tracking-widest text-center">Manage</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                            {(users as User[]).map(u => (
                                <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="p-6 border-r border-slate-50">
                                        <div className="flex items-center gap-4">
                                            <img src={u.avatarUrl || 'https://i.pravatar.cc/150'} className="h-12 w-12 rounded-2xl object-cover border-2 border-white shadow-md"/>
                                            <div>
                                                <p className="font-black text-slate-900 text-lg leading-none">{u.name}</p>
                                                <p className="text-sm font-bold text-slate-400 mt-1">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6 border-r border-slate-50">
                                        <span className={`px-4 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest ${
                                            u.role === Role.Admin ? 'bg-primary-100 text-primary-700' :
                                            u.role === Role.Accountant ? 'bg-amber-100 text-amber-700' :
                                            'bg-slate-100 text-slate-700'
                                        }`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="p-6 text-center space-x-6">
                                        <button onClick={()=>{setEditingUser(u); setIsUserModalOpen(true)}} className="text-blue-600 font-black text-[10px] uppercase tracking-widest hover:underline">Revise</button>
                                        {currentUser?.email !== u.email && (
                                            <button onClick={()=>{ if(confirm('Revoke access for this user permanently?')) deleteUserMutation.mutate(u.id); }} className="text-red-600 font-black text-[10px] uppercase tracking-widest hover:underline">Revoke</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                     </div>
                 </div>
            )}
            </div>

            <UserModal 
                isOpen={isUserModalOpen} 
                onClose={() => setIsUserModalOpen(false)} 
                onSave={(d: any) => userMutation.mutate(d)} 
                user={editingUser} 
            />
        </div>
    );
};

export default SettingsView;

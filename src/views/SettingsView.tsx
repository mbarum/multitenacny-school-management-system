
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '../components/common/Modal';
import type { SchoolInfo, User, FeeItem, SchoolClass, DarajaSettings, ClassFee, NewUser, NewFeeItem, GradingRule } from '../types';
import { GradingSystem, CbetScore, Role, Currency, CBC_LEVEL_MAP, SubscriptionPlan, SubscriptionStatus } from '../types';
import { useData } from '../contexts/DataContext';
import { initiateSTKPush } from '../services/darajaService';
import * as api from '../services/api';
import Spinner from '../components/common/Spinner';

const FeeItemModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (item: any) => void; item: FeeItem | null; classes: SchoolClass[]; feeCategories: string[]; }> = ({ isOpen, onClose, onSave, item, classes, feeCategories }) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [frequency, setFrequency] = useState<'Termly' | 'Annually' | 'One-Time'>('Termly');
    const [isOptional, setIsOptional] = useState(false);
    const [classFees, setClassFees] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            if (item) {
                setName(item.name); setCategory(item.category); setFrequency(item.frequency as any); setIsOptional(item.isOptional);
                const fees: Record<string, string> = {};
                item.classSpecificFees.forEach(fee => { fees[fee.classId] = String(fee.amount); });
                setClassFees(fees);
            } else {
                setName(''); setCategory(feeCategories[0] || ''); setFrequency('Termly'); setIsOptional(false); setClassFees({});
            }
        }
    }, [item, isOpen, feeCategories]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const classSpecificFees = Object.entries(classFees).map(([classId, amount]) => ({ classId, amount: parseFloat(amount as string) || 0 })).filter(f => f.amount > 0);
        onSave({ id: item?.id, name, category, frequency, isOptional, classSpecificFees });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={item ? 'Edit Fee Item' : 'Add Fee Item'} size="lg">
             <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                     <input value={name} onChange={e=>setName(e.target.value)} placeholder="Item Name" className="p-2 border rounded w-full" required/>
                     <select value={frequency} onChange={e=>setFrequency(e.target.value as any)} className="p-2 border rounded w-full"><option value="Termly">Termly</option><option value="Annually">Annually</option><option value="One-Time">One-Time</option></select>
                 </div>
                 <input list="cats" value={category} onChange={e=>setCategory(e.target.value)} placeholder="Category" className="p-2 border rounded w-full" required/>
                 <datalist id="cats">{feeCategories.map(c=><option key={c} value={c}/>)}</datalist>
                 <div className="p-2 border rounded max-h-48 overflow-y-auto">
                     {classes.map(c => (
                         <div key={c.id} className="flex items-center space-x-2 mb-2">
                             <input type="checkbox" checked={classFees[c.id] !== undefined} onChange={() => setClassFees(prev => { const n = {...prev}; if(n[c.id]!==undefined) delete n[c.id]; else n[c.id]=''; return n; })}/>
                             <span className="flex-1">{c.name}</span>
                             {classFees[c.id] !== undefined && <input type="number" value={classFees[c.id]} onChange={e=>setClassFees(p=>({...p, [c.id]: e.target.value}))} className="w-24 p-1 border rounded" placeholder="Amount"/>}
                         </div>
                     ))}
                 </div>
                 <button type="submit" className="w-full bg-primary-600 text-white p-2 rounded">Save</button>
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
    const { schoolInfo, updateSchoolInfo, addNotification, uploadLogo, formatCurrency } = useData();
    const queryClient = useQueryClient();
    const logoInputRef = useRef<HTMLInputElement>(null);
    
    // UI Local States
    const [activeTab, setActiveTab] = useState('info');
    const [localSchoolInfo, setLocalSchoolInfo] = useState<SchoolInfo | null>(null);
    const [isUpgrading, setIsUpgrading] = useState(false);
    const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
    const [editingFeeItem, setEditingFeeItem] = useState<FeeItem | null>(null);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [localDaraja, setLocalDaraja] = useState<any>({});
    const [localGradingScale, setLocalGradingScale] = useState<GradingRule[]>([]);

    // 1. ALL HOOKS MUST BE DECLARED HERE AT THE TOP LEVEL
    const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => api.getUsers(), enabled: activeTab === 'users' });
    const { data: feeStructure = [] } = useQuery({ queryKey: ['fee-structure'], queryFn: () => api.getFeeStructure(), enabled: activeTab === 'fee_structure' });
    const { data: gradingScale = [] } = useQuery({ queryKey: ['grading-scale'], queryFn: () => api.getGradingScale(), enabled: activeTab === 'grading' });
    const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: () => api.getClasses().then(res => Array.isArray(res) ? res : res.data) });
    const { data: pricing } = useQuery({ queryKey: ['platform-pricing'], queryFn: api.getPlatformPricing });
    const { data: fetchedDarajaSettings } = useQuery({ queryKey: ['daraja'], queryFn: () => api.getDarajaSettings(), enabled: activeTab === 'mpesa' });

    // Mutations
    const feeMutation = useMutation({ mutationFn: (data:any) => data.id ? api.updateFeeItem(data.id, data) : api.createFeeItem(data), onSuccess: () => { queryClient.invalidateQueries({queryKey:['fee-structure']}); setIsFeeModalOpen(false); addNotification('Fee structure updated', 'success'); }});
    const deleteFeeMutation = useMutation({ mutationFn: api.deleteFeeItem, onSuccess: () => { queryClient.invalidateQueries({queryKey:['fee-structure']}); }});
    const userMutation = useMutation({ mutationFn: (data:any) => data.id ? api.updateUser(data.id, data) : api.createUser(data), onSuccess: () => { queryClient.invalidateQueries({queryKey:['users']}); setIsUserModalOpen(false); addNotification('User saved', 'success'); }});
    const deleteUserMutation = useMutation({ mutationFn: api.deleteUser, onSuccess: () => { queryClient.invalidateQueries({queryKey:['users']}); }});
    const gradingMutation = useMutation({ mutationFn: (data:any) => data.id ? api.updateGradingRule(data.id, data) : api.createGradingRule(data), onSuccess: () => { queryClient.invalidateQueries({queryKey:['grading-scale']}); addNotification('Grading rule saved', 'success'); }});
    const deleteGradingMutation = useMutation({ mutationFn: api.deleteGradingRule, onSuccess: () => { queryClient.invalidateQueries({queryKey:['grading-scale']}); }});
    const darajaMutation = useMutation({ mutationFn: api.updateDarajaSettings, onSuccess: () => { queryClient.invalidateQueries({queryKey:['daraja']}); addNotification('M-Pesa settings saved', 'success'); }});

    // Side Effects
    useEffect(() => { setLocalSchoolInfo(schoolInfo); }, [schoolInfo]);
    useEffect(() => { if(fetchedDarajaSettings) setLocalDaraja(fetchedDarajaSettings); }, [fetchedDarajaSettings]);
    useEffect(() => { if(gradingScale) setLocalGradingScale(gradingScale); }, [gradingScale]);
    
    const feeCategories = useMemo(() => [...new Set((feeStructure as FeeItem[]).map(i => i.category))], [feeStructure]);

    // NOW SAFE TO RETURN EARLY AFTER ALL HOOKS DECLARED
    if (!localSchoolInfo) return <div className="p-20 text-center"><Spinner /></div>;

    const handleUpgrade = async (targetPlan: SubscriptionPlan) => {
        if (!pricing || !schoolInfo) return;
        setIsUpgrading(true);
        const amount = targetPlan === SubscriptionPlan.PREMIUM ? pricing.premiumMonthlyPrice : pricing.basicMonthlyPrice;
        
        try {
            addNotification(`Initiating upgrade to ${targetPlan}...`, 'info');
            const response = await initiateSTKPush(amount, schoolInfo.phone || '', `UPG_${targetPlan.substring(0,4)}_${schoolInfo.id.substring(0,8)}`);
            addNotification(response.CustomerMessage, 'success');
        } catch (error: any) {
            addNotification(error.message, 'error');
        } finally {
            setIsUpgrading(false);
        }
    };

    const handleGradingChange = (id: string, field: keyof GradingRule, value: any) => {
        setLocalGradingScale(prev => prev.map(rule => rule.id === id ? { ...rule, [field]: value } : rule));
    }
    
    const saveGrading = () => {
         localGradingScale.forEach(rule => gradingMutation.mutate(rule));
    }

    return (
        <div className="p-6 md:p-8">
            <h2 className="text-3xl font-black text-slate-800 mb-6 tracking-tight">System Settings</h2>
            <div className="border-b border-slate-200 mb-6 overflow-x-auto">
                <nav className="-mb-px flex space-x-8">
                    {['info', 'subscription', 'users', 'fee_structure', 'grading', 'mpesa'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap py-4 px-1 border-b-2 font-black text-xs uppercase tracking-widest ${activeTab === tab ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>{tab.replace('_', ' ')}</button>
                    ))}
                </nav>
            </div>
            
            {activeTab === 'subscription' && (
                <div className="space-y-6">
                    <div className="bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl text-white flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest mb-3">Service Level</p>
                            <h3 className="text-5xl font-black uppercase leading-none">{schoolInfo.subscription?.plan || 'Free'}</h3>
                            <div className="flex gap-4 mt-6">
                                <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold border border-white/20 uppercase tracking-widest">{schoolInfo.subscription?.status}</span>
                                <span className="text-slate-400 text-xs font-bold self-center">Valid Until: {schoolInfo.subscription?.endDate ? new Date(schoolInfo.subscription.endDate).toLocaleDateString() : 'Forever'}</span>
                            </div>
                        </div>
                        <div className="flex gap-4 relative z-10">
                            {schoolInfo.subscription?.plan !== SubscriptionPlan.PREMIUM && (
                                <button 
                                    onClick={() => handleUpgrade(SubscriptionPlan.PREMIUM)}
                                    disabled={isUpgrading}
                                    className="px-10 py-5 bg-primary-600 text-white font-black rounded-2xl shadow-2xl shadow-primary-600/30 hover:scale-105 transition-all flex items-center gap-3 uppercase text-xs tracking-widest"
                                >
                                    {isUpgrading ? <Spinner /> : (
                                        <>
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z"/></svg>
                                            Upgrade to Enterprise
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { name: 'FREE', features: ['50 Students', '2 Staff', 'Standard Reporting'], price: 0 },
                            { name: 'BASIC', features: ['500 Students', '10 Staff', 'M-Pesa Automation', 'Parent Portal'], price: pricing?.basicMonthlyPrice || 3000 },
                            { name: 'PREMIUM', features: ['Unlimited Students', 'Unlimited Staff', 'Gemini AI Insights', 'Library System', 'Multi-Branch'], price: pricing?.premiumMonthlyPrice || 5000, highlight: true }
                        ].map(p => (
                            <div key={p.name} className={`bg-white p-8 rounded-3xl border-4 transition-all ${p.name === schoolInfo.subscription?.plan ? 'border-primary-500 bg-primary-50/20' : 'border-slate-100'} ${p.highlight ? 'ring-8 ring-primary-500/5' : ''}`}>
                                <div className="flex justify-between items-start mb-6">
                                    <h4 className="font-black text-xl text-slate-800 uppercase tracking-tight">{p.name}</h4>
                                    {p.name === schoolInfo.subscription?.plan && <span className="bg-primary-600 text-white text-[10px] px-3 py-1.5 rounded-full font-black tracking-widest uppercase">Current</span>}
                                </div>
                                <div className="text-3xl font-black text-slate-900 mb-8">{p.price === 0 ? 'FREE' : `KES ${p.price.toLocaleString()}`}<span className="text-sm text-slate-400 font-bold tracking-normal">/mo</span></div>
                                <ul className="space-y-4 mb-10">
                                    {p.features.map(f => (
                                        <li key={f} className="flex items-center text-sm text-slate-600 gap-3 font-bold">
                                            <svg className="w-5 h-5 text-primary-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                {p.name !== schoolInfo.subscription?.plan && p.price > 0 && (
                                    <button 
                                        onClick={() => handleUpgrade(p.name as SubscriptionPlan)}
                                        className="w-full py-4 bg-slate-100 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-600 hover:text-white transition-all shadow-sm"
                                    >
                                        Select {p.name}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'info' && (
                 <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
                    <form onSubmit={async (e) => { e.preventDefault(); await updateSchoolInfo(localSchoolInfo); addNotification('Profile saved', 'success'); }} className="space-y-10">
                        <div className="flex items-center space-x-10">
                            <div className="relative group">
                                <img src={localSchoolInfo.logoUrl} alt="Logo" className="h-32 w-32 rounded-[2rem] object-cover border-4 border-slate-100 shadow-inner group-hover:opacity-80 transition-all" />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="bg-black/50 text-white text-[10px] font-black uppercase px-2 py-1 rounded">Change</span>
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">School Identity</h3>
                                <p className="text-slate-400 font-bold text-sm mb-4">Update your institutional branding for reports and invoices.</p>
                                <button type="button" onClick={() => logoInputRef.current?.click()} className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Upload New Logo</button>
                                <input 
                                    type="file" 
                                    ref={logoInputRef} 
                                    onChange={async (e) => { 
                                        if (e.target.files?.[0]) {
                                            const fd = new FormData();
                                            fd.append('logo', e.target.files[0]);
                                            const res = await uploadLogo(fd);
                                            if (res?.logoUrl) {
                                                setLocalSchoolInfo(prev => prev ? { ...prev, logoUrl: res.logoUrl } : null);
                                                addNotification('Logo updated', 'success');
                                            }
                                        }
                                    }} 
                                    className="hidden" 
                                    accept="image/*"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t">
                            <div className="space-y-1">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">School Name</label>
                                <input value={localSchoolInfo.name} onChange={e => setLocalSchoolInfo({...localSchoolInfo, name: e.target.value})} className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-bold" />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Phone</label>
                                <input value={localSchoolInfo.phone} onChange={e => setLocalSchoolInfo({...localSchoolInfo, phone: e.target.value})} className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-bold" />
                            </div>
                             <div className="space-y-1">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Official Email</label>
                                <input value={localSchoolInfo.email} onChange={e => setLocalSchoolInfo({...localSchoolInfo, email: e.target.value})} className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-bold" />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Framework</label>
                                <select 
                                    value={localSchoolInfo.gradingSystem} 
                                    onChange={e => setLocalSchoolInfo({...localSchoolInfo, gradingSystem: e.target.value as GradingSystem})} 
                                    className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-bold bg-white"
                                >
                                    <option value={GradingSystem.Traditional}>Traditional (A, B, C...)</option>
                                    <option value={GradingSystem.CBC}>Kenyan CBC (EE, ME, AE, BE)</option>
                                </select>
                            </div>
                            <div className="col-span-2 space-y-1">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Postal & Physical Address</label>
                                <input value={localSchoolInfo.address} onChange={e => setLocalSchoolInfo({...localSchoolInfo, address: e.target.value})} className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-bold" />
                            </div>
                        </div>
                        <div className="flex justify-end pt-10 border-t">
                            <button type="submit" className="px-12 py-5 bg-primary-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-primary-500/40 hover:-translate-y-1 transition-all">Save Changes</button>
                        </div>
                    </form>
                </div>
            )}

            {activeTab === 'users' && (
                 <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
                     <div className="flex justify-between items-center mb-8">
                         <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Staff Access</h3>
                         <button onClick={()=>{setEditingUser(null); setIsUserModalOpen(true)}} className="px-6 py-3 bg-primary-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg">New User</button>
                     </div>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="p-4 font-black uppercase text-[10px] text-slate-400 tracking-widest">Full Name</th>
                                    <th className="p-4 font-black uppercase text-[10px] text-slate-400 tracking-widest">Email</th>
                                    <th className="p-4 font-black uppercase text-[10px] text-slate-400 tracking-widest">Role</th>
                                    <th className="p-4 font-black uppercase text-[10px] text-slate-400 tracking-widest text-center">Manage</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                            {(users as User[]).map(u => (
                                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 font-bold text-slate-900">{u.name}</td>
                                    <td className="p-4 font-medium text-slate-600">{u.email}</td>
                                    <td className="p-4"><span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full font-black text-[10px] uppercase">{u.role}</span></td>
                                    <td className="p-4 text-center space-x-6">
                                        <button onClick={()=>{setEditingUser(u); setIsUserModalOpen(true)}} className="text-blue-600 font-black text-[10px] uppercase hover:underline">Edit</button>
                                        <button onClick={()=>{ if(confirm('Delete user?')) deleteUserMutation.mutate(u.id); }} className="text-red-600 font-black text-[10px] uppercase hover:underline">Delete</button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                     </div>
                 </div>
            )}

            {/* Other tabs follow same structure */}

            <FeeItemModal isOpen={isFeeModalOpen} onClose={() => setIsFeeModalOpen(false)} onSave={(d) => feeMutation.mutate(d)} item={editingFeeItem} classes={classes} feeCategories={feeCategories}/>
            <UserModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} onSave={(d: any) => userMutation.mutate(d)} user={editingUser} />
        </div>
    );
};

export default SettingsView;

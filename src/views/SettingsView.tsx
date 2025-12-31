
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
    
    const [activeTab, setActiveTab] = useState('info');
    const logoInputRef = useRef<HTMLInputElement>(null);
    const [localSchoolInfo, setLocalSchoolInfo] = useState<SchoolInfo | null>(null);
    const [isUpgrading, setIsUpgrading] = useState(false);

    // Queries
    const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => api.getUsers(), enabled: activeTab === 'users' });
    const { data: feeStructure = [] } = useQuery({ queryKey: ['fee-structure'], queryFn: () => api.getFeeStructure(), enabled: activeTab === 'fee_structure' });
    const { data: gradingScale = [] } = useQuery({ queryKey: ['grading-scale'], queryFn: () => api.getGradingScale(), enabled: activeTab === 'grading' });
    const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: () => api.getClasses().then(res => Array.isArray(res) ? res : res.data) });
    const { data: pricing } = useQuery({ queryKey: ['platform-pricing'], queryFn: api.getPlatformPricing });
    const { data: fetchedDarajaSettings } = useQuery({ queryKey: ['daraja'], queryFn: () => api.getDarajaSettings(), enabled: activeTab === 'mpesa' });

    // Local State for Edit
    const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
    const [editingFeeItem, setEditingFeeItem] = useState<FeeItem | null>(null);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [localDaraja, setLocalDaraja] = useState<any>({});
    const [localGradingScale, setLocalGradingScale] = useState<GradingRule[]>([]);

    useEffect(() => { setLocalSchoolInfo(schoolInfo); }, [schoolInfo]);
    useEffect(() => { if(fetchedDarajaSettings) setLocalDaraja(fetchedDarajaSettings); }, [fetchedDarajaSettings]);
    useEffect(() => { if(gradingScale) setLocalGradingScale(gradingScale); }, [gradingScale]);
    
    // Mutations
    const feeMutation = useMutation({ mutationFn: (data:any) => data.id ? api.updateFeeItem(data.id, data) : api.createFeeItem(data), onSuccess: () => { queryClient.invalidateQueries({queryKey:['fee-structure']}); setIsFeeModalOpen(false); addNotification('Fee structure updated', 'success'); }});
    const deleteFeeMutation = useMutation({ mutationFn: api.deleteFeeItem, onSuccess: () => { queryClient.invalidateQueries({queryKey:['fee-structure']}); }});
    
    const userMutation = useMutation({ mutationFn: (data:any) => data.id ? api.updateUser(data.id, data) : api.createUser(data), onSuccess: () => { queryClient.invalidateQueries({queryKey:['users']}); setIsUserModalOpen(false); addNotification('User saved', 'success'); }});
    const deleteUserMutation = useMutation({ mutationFn: api.deleteUser, onSuccess: () => { queryClient.invalidateQueries({queryKey:['users']}); }});
    
    const gradingMutation = useMutation({ mutationFn: (data:any) => data.id ? api.updateGradingRule(data.id, data) : api.createGradingRule(data), onSuccess: () => { queryClient.invalidateQueries({queryKey:['grading-scale']}); addNotification('Grading rule saved', 'success'); }});
    const deleteGradingMutation = useMutation({ mutationFn: api.deleteGradingRule, onSuccess: () => { queryClient.invalidateQueries({queryKey:['grading-scale']}); }});
    
    const darajaMutation = useMutation({ mutationFn: api.updateDarajaSettings, onSuccess: () => { queryClient.invalidateQueries({queryKey:['daraja']}); addNotification('M-Pesa settings saved', 'success'); }});

    const feeCategories = useMemo(() => [...new Set((feeStructure as FeeItem[]).map(i => i.category))], [feeStructure]);

    // Handle Early Return ONLY AFTER all hooks have been declared
    if (!localSchoolInfo) return null;

    const handleUpgrade = async (targetPlan: SubscriptionPlan) => {
        if (!pricing || !schoolInfo) return;
        setIsUpgrading(true);
        const amount = targetPlan === SubscriptionPlan.PREMIUM ? pricing.premiumMonthlyPrice : pricing.basicMonthlyPrice;
        
        try {
            addNotification(`Initiating upgrade to ${targetPlan}...`, 'info');
            // Reference format: UPGRADE_[PLAN]_[SCHOOLID_PREFIX]
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
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Settings</h2>
            <div className="border-b border-slate-200 mb-6 overflow-x-auto">
                <nav className="-mb-px flex space-x-8">
                    {['info', 'subscription', 'users', 'fee_structure', 'grading', 'mpesa'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize ${activeTab === tab ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500'}`}>{tab.replace('_', ' ')}</button>
                    ))}
                </nav>
            </div>
            
            {activeTab === 'subscription' && (
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Current Plan</p>
                            <h3 className="text-4xl font-black text-primary-700">{schoolInfo.subscription?.plan || 'Free'}</h3>
                            <p className="text-slate-500 mt-2">
                                Status: <span className="font-bold text-slate-700">{schoolInfo.subscription?.status}</span> • 
                                Expires: <span className="font-bold text-slate-700">{schoolInfo.subscription?.endDate ? new Date(schoolInfo.subscription.endDate).toLocaleDateString() : 'Never'}</span>
                            </p>
                        </div>
                        <div className="flex gap-4">
                            {schoolInfo.subscription?.plan !== SubscriptionPlan.PREMIUM && (
                                <button 
                                    onClick={() => handleUpgrade(SubscriptionPlan.PREMIUM)}
                                    disabled={isUpgrading}
                                    className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black rounded-xl shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                                >
                                    {isUpgrading ? <Spinner /> : (
                                        <>
                                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z"/></svg>
                                            Upgrade to Full Features
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { name: 'FREE', features: ['50 Students', '2 Staff', 'Basic Reporting'], price: 0 },
                            { name: 'BASIC', features: ['500 Students', '10 Staff', 'M-Pesa Automation', 'Parent Portal'], price: pricing?.basicMonthlyPrice || 3000 },
                            { name: 'PREMIUM', features: ['Unlimited Students', 'Unlimited Staff', 'Gemini AI Insights', 'Library System', 'Audit Logs'], price: pricing?.premiumMonthlyPrice || 5000, highlight: true }
                        ].map(p => (
                            <div key={p.name} className={`bg-white p-6 rounded-2xl border-2 ${p.name === schoolInfo.subscription?.plan ? 'border-primary-500 bg-primary-50/30' : 'border-slate-100'} ${p.highlight ? 'ring-4 ring-primary-500/10' : ''}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <h4 className="font-bold text-lg text-slate-800">{p.name}</h4>
                                    {p.name === schoolInfo.subscription?.plan && <span className="bg-primary-600 text-white text-[10px] px-2 py-1 rounded-full font-bold">ACTIVE</span>}
                                </div>
                                <div className="text-2xl font-black text-slate-900 mb-6">{p.price === 0 ? 'Free' : `KES ${p.price.toLocaleString()}`}<span className="text-xs text-slate-400 font-normal"> /mo</span></div>
                                <ul className="space-y-3 mb-8">
                                    {p.features.map(f => (
                                        <li key={f} className="flex items-center text-sm text-slate-600 gap-2">
                                            <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                {p.name !== schoolInfo.subscription?.plan && p.price > 0 && (
                                    <button 
                                        onClick={() => handleUpgrade(p.name as SubscriptionPlan)}
                                        className="w-full py-2 border-2 border-primary-600 text-primary-600 rounded-xl font-bold text-sm hover:bg-primary-600 hover:text-white transition-all"
                                    >
                                        Switch to {p.name}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'info' && (
                 <div className="bg-white p-6 rounded-xl shadow-lg">
                    <form onSubmit={async (e) => { e.preventDefault(); await updateSchoolInfo(localSchoolInfo); addNotification('Info saved', 'success'); }} className="space-y-6">
                        <div className="flex items-center space-x-6">
                            <img src={localSchoolInfo.logoUrl} alt="Logo" className="h-24 w-24 rounded-full object-cover border-4 border-slate-200" />
                            <button type="button" onClick={() => logoInputRef.current?.click()} className="px-4 py-2 bg-slate-200 rounded font-bold">Change Logo</button>
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
                                            addNotification('Logo uploaded successfully', 'success');
                                        }
                                    }
                                }} 
                                className="hidden" 
                                accept="image/*"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div><label className="block text-sm font-medium text-slate-700">School Name</label><input value={localSchoolInfo.name} onChange={e => setLocalSchoolInfo({...localSchoolInfo, name: e.target.value})} className="mt-1 p-2 border rounded w-full" /></div>
                            <div><label className="block text-sm font-medium text-slate-700">Phone</label><input value={localSchoolInfo.phone} onChange={e => setLocalSchoolInfo({...localSchoolInfo, phone: e.target.value})} className="mt-1 p-2 border rounded w-full" /></div>
                             <div><label className="block text-sm font-medium text-slate-700">Email</label><input value={localSchoolInfo.email} onChange={e => setLocalSchoolInfo({...localSchoolInfo, email: e.target.value})} className="mt-1 p-2 border rounded w-full" /></div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Grading System</label>
                                <select 
                                    value={localSchoolInfo.gradingSystem} 
                                    onChange={e => setLocalSchoolInfo({...localSchoolInfo, gradingSystem: e.target.value as GradingSystem})} 
                                    className="mt-1 p-2 border rounded w-full bg-white"
                                >
                                    <option value={GradingSystem.Traditional}>Traditional (Marks & Grades)</option>
                                    <option value={GradingSystem.CBC}>Competency Based (CBC)</option>
                                </select>
                            </div>
                            <div className="col-span-2"><label className="block text-sm font-medium text-slate-700">Address</label><input value={localSchoolInfo.address} onChange={e => setLocalSchoolInfo({...localSchoolInfo, address: e.target.value})} className="mt-1 p-2 border rounded w-full" /></div>
                        </div>
                        <button type="submit" className="px-6 py-2 bg-primary-600 text-white rounded font-bold hover:bg-primary-700">Save Changes</button>
                    </form>
                </div>
            )}

            {activeTab === 'users' && (
                 <div className="bg-white p-6 rounded-xl shadow-lg">
                     <div className="flex justify-between mb-4"><h3 className="text-xl font-bold text-slate-800">Users</h3><button onClick={()=>{setEditingUser(null); setIsUserModalOpen(true)}} className="px-4 py-2 bg-primary-600 text-white rounded font-bold">Add User</button></div>
                     <table className="w-full text-left"><thead><tr className="bg-slate-50 border-b"><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead><tbody>
                     {(users as User[]).map(u => <tr key={u.id} className="border-b hover:bg-slate-50 transition-colors"><td className="p-2">{u.name}</td><td className="p-2">{u.email}</td><td className="p-2">{u.role}</td><td className="p-2"><button onClick={()=>{setEditingUser(u); setIsUserModalOpen(true)}} className="text-blue-600 mr-4 font-bold hover:underline">Edit</button><button onClick={()=>{ if(confirm('Delete user?')) deleteUserMutation.mutate(u.id); }} className="text-red-600 font-bold hover:underline">Delete</button></td></tr>)}
                     </tbody></table>
                 </div>
            )}

            {activeTab === 'fee_structure' && (
                <div>
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-slate-800">Fee Items</h3>
                        <button onClick={() => { setEditingFeeItem(null); setIsFeeModalOpen(true); }} className="px-4 py-2 bg-primary-600 text-white rounded font-bold">Add Fee Item</button>
                    </div>
                    <div className="space-y-4">
                        {(feeStructure as FeeItem[]).map(item => (
                            <div key={item.id} className="bg-white p-4 rounded shadow-md border border-slate-100 flex justify-between items-center hover:shadow-lg transition-all">
                                <div>
                                    <div className="font-bold text-lg text-slate-800">{item.name} <span className="text-xs font-normal text-slate-400 uppercase tracking-widest ml-2">({item.category})</span></div>
                                    <div className="text-sm text-slate-500">{item.frequency} • {item.isOptional ? 'Optional Choice' : 'Compulsory Fee'}</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button onClick={() => { setEditingFeeItem(item); setIsFeeModalOpen(true); }} className="text-blue-600 font-bold hover:underline">Edit</button>
                                    <button onClick={() => { if(confirm('Delete this fee item?')) deleteFeeMutation.mutate(item.id); }} className="text-red-600 font-bold hover:underline">Delete</button>
                                </div>
                            </div>
                        ))}
                         {feeStructure.length === 0 && <p className="text-center py-10 text-slate-500 bg-white rounded-xl shadow">No fee items configured. Start by adding one above.</p>}
                    </div>
                </div>
            )}

            {activeTab === 'mpesa' && (
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-bold text-slate-800 mb-2">M-Pesa Integration</h3>
                    <p className="text-slate-500 mb-8">Direct integration with Safaricom Daraja API for automated fee reconciliation.</p>
                    <div className="space-y-4 max-w-lg">
                        <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Paybill Number</label><input value={localDaraja.paybillNumber || ''} onChange={e => setLocalDaraja({...localDaraja, paybillNumber: e.target.value})} placeholder="e.g. 247247" className="p-3 border rounded-xl w-full bg-slate-50"/></div>
                        <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Consumer Key</label><input value={localDaraja.consumerKey || ''} onChange={e => setLocalDaraja({...localDaraja, consumerKey: e.target.value})} placeholder="API Consumer Key" className="p-3 border rounded-xl w-full bg-slate-50"/></div>
                        <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Consumer Secret</label><input type="password" value={localDaraja.consumerSecret || ''} onChange={e => setLocalDaraja({...localDaraja, consumerSecret: e.target.value})} placeholder="API Consumer Secret" className="p-3 border rounded-xl w-full bg-slate-50"/></div>
                        <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Passkey</label><input type="password" value={localDaraja.passkey || ''} onChange={e => setLocalDaraja({...localDaraja, passkey: e.target.value})} placeholder="Shortcode Passkey" className="p-3 border rounded-xl w-full bg-slate-50"/></div>
                        <div className="pt-4 border-t flex justify-end">
                             <button onClick={() => darajaMutation.mutate(localDaraja)} className="px-10 py-3 bg-primary-600 text-white rounded-xl font-bold shadow-lg hover:bg-primary-700 transition-all">Save Config</button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'grading' && (
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-bold text-slate-800 mb-6">Grading Rules (Traditional)</h3>
                    <div className="space-y-3">
                        {localGradingScale.map(rule => (
                            <div key={rule.id} className="grid grid-cols-4 gap-4 p-3 bg-slate-50 rounded-xl items-center border border-slate-100">
                                 <input value={rule.grade} onChange={e=>handleGradingChange(rule.id, 'grade', e.target.value)} className="p-2 border rounded-lg bg-white" placeholder="Grade (A, B, C...)"/>
                                 <div className="flex items-center gap-2">
                                     <span className="text-xs text-slate-400 uppercase font-black">Min</span>
                                     <input type="number" value={rule.minScore} onChange={e=>handleGradingChange(rule.id, 'minScore', parseInt(e.target.value))} className="p-2 border rounded-lg bg-white w-full" placeholder="Min %"/>
                                 </div>
                                 <div className="flex items-center gap-2">
                                     <span className="text-xs text-slate-400 uppercase font-black">Max</span>
                                     <input type="number" value={rule.maxScore} onChange={e=>handleGradingChange(rule.id, 'maxScore', parseInt(e.target.value))} className="p-2 border rounded-lg bg-white w-full" placeholder="Max %"/>
                                 </div>
                                 <button onClick={()=>deleteGradingMutation.mutate(rule.id)} className="text-red-500 font-black hover:text-red-700 flex justify-center">REMOVE</button>
                            </div>
                        ))}
                    </div>
                    <button onClick={()=>gradingMutation.mutate({grade: 'New', minScore: 0, maxScore: 100})} className="mt-6 text-primary-600 font-bold flex items-center gap-2 hover:underline">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                        Add Grade Rule
                    </button>
                    <div className="mt-8 border-t pt-6 flex justify-end"><button onClick={saveGrading} className="px-10 py-3 bg-primary-600 text-white rounded-xl font-bold shadow-lg">Save Changes</button></div>
                    
                    <div className="mt-12 pt-8 border-t">
                         <h3 className="text-xl font-bold text-slate-800 mb-4">CBC Assessment Reference</h3>
                         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                             {Object.entries(CBC_LEVEL_MAP).map(([key, info]) => (
                                 <div key={key} className="p-4 rounded-2xl bg-primary-50 border-2 border-primary-100">
                                     <p className="text-2xl font-black text-primary-800">{key}</p>
                                     <p className="text-xs font-bold text-primary-600 uppercase tracking-wider">{info.description}</p>
                                     <p className="text-[10px] text-primary-400 mt-1">{info.points} Points</p>
                                 </div>
                             ))}
                         </div>
                    </div>
                </div>
            )}

            <FeeItemModal isOpen={isFeeModalOpen} onClose={() => setIsFeeModalOpen(false)} onSave={(d) => feeMutation.mutate(d)} item={editingFeeItem} classes={classes} feeCategories={feeCategories}/>
            <UserModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} onSave={(d: any) => userMutation.mutate(d)} user={editingUser} />
        </div>
    );
};

export default SettingsView;

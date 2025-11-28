
import React, { useState, useMemo, useEffect, useRef } from 'react';
import Modal from '../common/Modal';
import type { SchoolInfo, User, GradingRule, FeeItem, SchoolClass, DarajaSettings, ClassFee, Student, NewUser, NewFeeItem, NewGradingRule } from '../../types';
import { GradingSystem, CbetScore, Role } from '../../types';
import { useData } from '../../contexts/DataContext';

const FeeItemModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: NewFeeItem | (NewFeeItem & { id: string })) => void;
    item: FeeItem | null;
    classes: SchoolClass[];
    feeCategories: string[];
}> = ({ isOpen, onClose, onSave, item, classes, feeCategories }) => {
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
                item.classSpecificFees.forEach(fee => {
                    fees[fee.classId] = String(fee.amount);
                });
                setClassFees(fees);
            } else {
                setName('');
                setCategory(feeCategories.length > 0 ? String(feeCategories[0]) : '');
                setFrequency('Termly');
                setIsOptional(false);
                setClassFees({});
            }
        }
    }, [item, isOpen, feeCategories]);
    
    const handleAmountChange = (classId: string, value: string) => {
        setClassFees(prev => ({ ...prev, [classId]: value }));
    };

    const handleClassToggle = (classId: string) => {
        setClassFees(prev => {
            const newFees = { ...prev };
            if (newFees[classId] !== undefined) {
                delete newFees[classId];
            } else {
                newFees[classId] = '';
            }
            return newFees;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const classSpecificFees: ClassFee[] = Object.entries(classFees)
            .map(([classId, amountStr]) => ({
                classId,
                amount: parseFloat(amountStr as string) || 0
            }))
            .filter(fee => fee.amount > 0);

        const itemToSave: NewFeeItem = { name, category, frequency, isOptional, classSpecificFees };
        
        if (item) {
            onSave({ ...itemToSave, id: item.id });
        } else {
            onSave(itemToSave);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={item ? 'Edit Fee Item' : 'Add Fee Item'} size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Item Name</label>
                        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Tuition Fee" className="w-full p-2 border rounded" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Frequency</label>
                        <select value={frequency} onChange={e => setFrequency(e.target.value as any)} className="w-full p-2 border rounded">
                            <option value="Termly">Termly</option>
                            <option value="Annually">Annually</option>
                            <option value="One-Time">One-Time</option>
                        </select>
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium">Category</label>
                    <input list="fee-categories" value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g., ACADEMIC & TUITION FEES" className="w-full p-2 border rounded" required />
                    <datalist id="fee-categories">
                        {(feeCategories as string[]).map((cat: string, index) => <option key={index} value={cat} />)}
                    </datalist>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Class Specific Fees</label>
                    <div className="p-2 border rounded-md max-h-48 overflow-y-auto space-y-2">
                        {classes.map(c => (
                            <div key={c.id} className="flex items-center space-x-2 p-1 rounded hover:bg-slate-50">
                                <input id={`class-check-${c.id}`} type="checkbox" checked={classFees[c.id] !== undefined} onChange={() => handleClassToggle(c.id)} className="h-4 w-4 rounded text-primary-600"/>
                                <label htmlFor={`class-check-${c.id}`} className="flex-grow">{c.name}</label>
                                {classFees[c.id] !== undefined && (
                                    <div className="flex items-center">
                                        <span className="mr-1 text-slate-500">KES</span>
                                        <input
                                            type="number"
                                            placeholder="Amount"
                                            value={classFees[c.id]}
                                            onChange={e => handleAmountChange(c.id, e.target.value)}
                                            className="w-28 p-1 border rounded"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                <label className="flex items-center"><input type="checkbox" checked={isOptional} onChange={e => setIsOptional(e.target.checked)} /> <span className="ml-2">Is this fee optional?</span></label>
                <div className="flex justify-end pt-2 border-t"><button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded">Save</button></div>
            </form>
        </Modal>
    );
};

const UserModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (user: NewUser | (Partial<NewUser> & { id: string })) => void;
    user: User | null;
}> = ({ isOpen, onClose, onSave, user }) => {
    
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', role: Role.Parent
    });

    useEffect(() => {
        if (user) {
            setFormData({ name: user.name, email: user.email, password: '', role: user.role });
        } else {
            setFormData({ name: '', email: '', password: '', role: Role.Parent });
        }
    }, [user, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave: any = { ...formData };
        if (!dataToSave.password) {
            delete dataToSave.password;
        }
        
        if (user) {
            onSave({ ...dataToSave, id: user.id });
        } else {
            onSave(dataToSave as NewUser);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={user ? 'Edit User' : 'Add New User'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700">Full Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full p-2 border border-slate-300 rounded-md" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Email Address</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full p-2 border border-slate-300 rounded-md" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Password</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder={user ? 'Leave blank to keep unchanged' : 'Default: password123'} className="mt-1 block w-full p-2 border border-slate-300 rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Role</label>
                    <select name="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full p-2 border border-slate-300 rounded-md">
                        {Object.values(Role).map(roleValue => <option key={roleValue} value={roleValue}>{roleValue}</option>)}
                    </select>
                </div>
                <div className="flex justify-end pt-4 border-t">
                    <button type="submit" className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700">Save User</button>
                </div>
            </form>
        </Modal>
    );
};


const SettingsView: React.FC = () => {
    const { 
        schoolInfo, 
        updateSchoolInfo, 
        users, 
        addUser,
        updateUser,
        deleteUser,
        gradingScale, 
        addGradingRule,
        updateGradingRule,
        deleteGradingRule,
        feeStructure, 
        addFeeItem,
        updateFeeItem,
        deleteFeeItem,
        classes, 
        darajaSettings, 
        updateDarajaSettings, 
        students, 
        addNotification,
        uploadLogo 
    } = useData();
    
    const [activeTab, setActiveTab] = useState('info');
    const logoInputRef = useRef<HTMLInputElement>(null);
    
    const [localSchoolInfo, setLocalSchoolInfo] = useState<SchoolInfo | null>(schoolInfo);
    const [logoFile, setLogoFile] = useState<File | null>(null); // New state for the actual file
    const [localGradingScale, setLocalGradingScale] = useState<GradingRule[]>(gradingScale);
    const [localDarajaSettings, setLocalDarajaSettings] = useState<DarajaSettings | null>(darajaSettings);

    const [isFeeItemModalOpen, setIsFeeItemModalOpen] = useState(false);
    const [editingFeeItem, setEditingFeeItem] = useState<FeeItem | null>(null);

    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    
    useEffect(() => { setLocalSchoolInfo(schoolInfo); }, [schoolInfo]);
    useEffect(() => { setLocalGradingScale(gradingScale); }, [gradingScale]);
    useEffect(() => { setLocalDarajaSettings(darajaSettings); }, [darajaSettings]);

    if (!schoolInfo || !localSchoolInfo) {
        return null;
    }

    // School Info Handlers
    const handleInfoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalSchoolInfo(prev => (prev ? { ...prev, [e.target.name]: e.target.value } : null));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file); // Store the file object

            // Create a preview URL for the UI
            const reader = new FileReader();
            reader.onload = (event) => {
                setLocalSchoolInfo(prev => (prev ? { ...prev, logoUrl: event.target?.result as string } : null));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSaveSchoolInfo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!localSchoolInfo) return;
    
        try {
            const { name, address, phone, email, schoolCode, gradingSystem } = localSchoolInfo;
            const textFieldsToUpdate = { name, address, phone, email, schoolCode, gradingSystem };
    
            // Step 1: Update text fields
            await updateSchoolInfo(textFieldsToUpdate);
    
            // Step 2: If there's a new logo, upload it. The backend will handle updating the URL.
            if (logoFile) {
                const formData = new FormData();
                formData.append('logo', logoFile);
                await uploadLogo(formData);
            }
    
            addNotification('School information updated successfully!', 'success');
            setLogoFile(null); // Reset file state after successful save
        } catch (error) {
            console.error("Failed to save settings:", error);
            addNotification('Failed to save settings.', 'error');
        }
    };

    // Grading Handlers
    const handleGradingRuleChange = (id: string, field: keyof Omit<GradingRule, 'id'>, value: string) => {
        setLocalGradingScale(prev => prev.map(rule => 
            rule.id === id ? { ...rule, [field]: field === 'grade' ? value : value === '' ? '' : parseInt(value) || 0 } : rule
        ));
    };

    const handleSaveGradingChanges = () => {
        localGradingScale.forEach(rule => {
            const originalRule = gradingScale.find(r => r.id === rule.id);
            if (originalRule && (originalRule.grade !== rule.grade || originalRule.minScore !== rule.minScore || originalRule.maxScore !== rule.maxScore)) {
                updateGradingRule(rule.id, { grade: rule.grade, minScore: rule.minScore, maxScore: rule.maxScore });
            }
        });
        addNotification('Grading scale changes saved!', 'success');
    };

    const { feeItemsByCategory, feeCategories } = useMemo(() => {
        const items: FeeItem[] = (feeStructure as unknown as FeeItem[]) || [];
        const categories = [...new Set(items.map(item => item.category))].sort();
        const itemsByCategory = items.reduce((acc, item) => {
            if (!acc[item.category]) acc[item.category] = [];
            acc[item.category].push(item);
            return acc;
        }, {} as Record<string, FeeItem[]>);
        return { feeItemsByCategory: itemsByCategory, feeCategories: categories };
    }, [feeStructure]);

    const openFeeItemModal = (item: FeeItem | null = null) => {
        setEditingFeeItem(item);
        setIsFeeItemModalOpen(true);
    };

    const handleSaveFeeItem = (itemToSave: NewFeeItem | (NewFeeItem & { id: string })) => {
        if ('id' in itemToSave) {
            updateFeeItem(itemToSave.id, itemToSave);
        } else {
            addFeeItem(itemToSave);
        }
        setIsFeeItemModalOpen(false);
    };

    const handleDeleteFeeItem = (itemId: string) => {
        if (window.confirm('Are you sure you want to delete this fee item?')) {
            deleteFeeItem(itemId);
        }
    };

    const handleDarajaInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalDarajaSettings(prev => ({ ...(prev || {consumerKey: '', consumerSecret: '', shortCode: '', passkey: '', paybillNumber: ''}), [e.target.name]: e.target.value }));
    };

    const handleSaveDarajaSettings = () => {
        if (localDarajaSettings) {
            updateDarajaSettings(localDarajaSettings);
            addNotification('M-Pesa settings saved successfully!', 'success');
        }
    };

    // User Management Handlers
    const openUserModal = (user: User | null) => {
        setEditingUser(user);
        setIsUserModalOpen(true);
    };

    const handleSaveUser = (userData: NewUser | (Partial<NewUser> & { id: string })) => {
        if ('id' in userData) {
            updateUser(userData.id, userData);
        } else {
            addUser(userData);
        }
        setIsUserModalOpen(false);
    };

     const handleToggleUserStatus = (user: User) => {
        const newStatus = user.status === 'Active' ? 'Disabled' : 'Active';
        updateUser(user.id, { status: newStatus });
    };

    const handleSyncGuardians = () => {
        const existingUserEmails = new Set(users.map(u => u.email));
        const newParentUsers: NewUser[] = [];
        const processedGuardianEmails = new Set<string>();

        students.forEach(student => {
            if (student.guardianEmail && !existingUserEmails.has(student.guardianEmail) && !processedGuardianEmails.has(student.guardianEmail)) {
                newParentUsers.push({
                    name: student.guardianName,
                    email: student.guardianEmail,
                    password: 'password123',
                    role: Role.Parent,
                });
                processedGuardianEmails.add(student.guardianEmail);
            }
        });

        if (newParentUsers.length > 0) {
            const promises = newParentUsers.map(user => addUser(user));
            Promise.all(promises).then(() => {
                addNotification(`${newParentUsers.length} new parent user(s) created successfully.`, 'success');
            });
        } else {
            addNotification('No new parent accounts to create. All guardians are already users.', 'info');
        }
    };


    return (
        <div className="p-6 md:p-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Settings</h2>
            <div className="border-b border-slate-200 mb-6">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button onClick={() => setActiveTab('info')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'info' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>School Info</button>
                    <button onClick={() => setActiveTab('users')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'users' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Users</button>
                    <button onClick={() => setActiveTab('fee_structure')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'fee_structure' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Fee Structure</button>
                    <button onClick={() => setActiveTab('grading')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'grading' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Grading</button>
                    <button onClick={() => setActiveTab('mpesa')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'mpesa' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>M-Pesa Integration</button>
                </nav>
            </div>
            
            {activeTab === 'info' && (
                 <div className="bg-white p-6 rounded-xl shadow-lg">
                    <form onSubmit={handleSaveSchoolInfo} className="space-y-6">
                        <div className="flex items-center space-x-6">
                            <img src={localSchoolInfo.logoUrl} alt="School Logo" className="h-24 w-24 rounded-full object-cover border-4 border-slate-200" />
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">School Logo</h3>
                                <p className="text-slate-500 text-sm mb-2">Click the button to upload a new logo.</p>
                                <input type="file" accept="image/*" ref={logoInputRef} onChange={handleLogoChange} className="hidden" />
                                <button type="button" onClick={() => logoInputRef.current?.click()} className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300">
                                    Change Logo
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">School Name</label>
                                <input type="text" name="name" value={localSchoolInfo.name} onChange={handleInfoInputChange} className="mt-1 block w-full p-2 border border-slate-300 rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">School Code</label>
                                <input type="text" name="schoolCode" value={localSchoolInfo.schoolCode || ''} onChange={handleInfoInputChange} className="mt-1 block w-full p-2 border border-slate-300 rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Phone Number</label>
                                <input type="text" name="phone" value={localSchoolInfo.phone} onChange={handleInfoInputChange} className="mt-1 block w-full p-2 border border-slate-300 rounded-md" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700">Address</label>
                                <input type="text" name="address" value={localSchoolInfo.address} onChange={handleInfoInputChange} className="mt-1 block w-full p-2 border border-slate-300 rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Email Address</label>
                                <input type="email" name="email" value={localSchoolInfo.email} onChange={handleInfoInputChange} className="mt-1 block w-full p-2 border border-slate-300 rounded-md" />
                            </div>
                        </div>
                        <div className="flex justify-end pt-6 border-t">
                            <button type="submit" className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700">Save Changes</button>
                        </div>
                    </form>
                </div>
            )}

            {activeTab === 'users' && (
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-slate-700">User Management</h3>
                         <div className="flex space-x-2">
                            <button onClick={handleSyncGuardians} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">Sync Guardians</button>
                            <button onClick={() => openUserModal(null)} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700">Add User</button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left table-auto">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-4 py-3 font-semibold text-slate-600">Name</th>
                                    <th className="px-4 py-3 font-semibold text-slate-600">Email</th>
                                    <th className="px-4 py-3 font-semibold text-slate-600">Role</th>
                                    <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                                    <th className="px-4 py-3 font-semibold text-slate-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(users || []).map((user: User) => (
                                    <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="px-4 py-2 flex items-center space-x-3">
                                            <img src={user.avatarUrl} alt={user.name} className="h-10 w-10 rounded-full object-cover"/>
                                            <span className="font-semibold">{user.name}</span>
                                        </td>
                                        <td className="px-4 py-2 text-slate-600">{user.email}</td>
                                        <td className="px-4 py-2 text-slate-600">{user.role}</td>
                                        <td className="px-4 py-2">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                                            }`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 space-x-2 whitespace-nowrap">
                                            <button onClick={() => openUserModal(user)} className="text-blue-600 hover:underline">Edit</button>
                                            <button onClick={() => handleToggleUserStatus(user)} className="text-yellow-600 hover:underline">
                                                {user.status === 'Active' ? 'Disable' : 'Enable'}
                                            </button>
                                            <button onClick={() => deleteUser(user.id)} className="text-red-600 hover:underline">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'fee_structure' && (
                <div>
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">Manage Fee Structure</h3>
                        <button onClick={() => openFeeItemModal()} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700">Add Fee Item</button>
                    </div>
                    <div className="space-y-6">
                        {Object.entries(feeItemsByCategory).map(([category, items]) => (
                             <div key={category} className="bg-white p-4 rounded-xl shadow-lg">
                                <h4 className="text-lg font-bold text-slate-700 border-b pb-2 mb-2">{category}</h4>
                                 <div className="overflow-x-auto">
                                    <table className="w-full text-left table-auto">
                                        <thead><tr><th className="p-2 font-semibold">Name</th><th className="p-2 font-semibold">Amounts per Class</th><th className="p-2 font-semibold">Actions</th></tr></thead>
                                        <tbody>
                                            {(items as FeeItem[]).map(item => (
                                                <tr key={item.id} className="text-sm border-t">
                                                    <td className="p-2 align-top">
                                                        <div className="font-semibold">{item.name}</div>
                                                        <div className="text-xs text-slate-500">{item.frequency} {item.isOptional && '(Optional)'}</div>
                                                    </td>
                                                    <td className="p-2 align-top">
                                                        <div className="flex flex-wrap gap-1">
                                                        {item.classSpecificFees.length > 0 ? (
                                                            item.classSpecificFees.map(fee => (
                                                                <span key={fee.classId} className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                                                                    {classes.find(c=>c.id === fee.classId)?.name}: <span className="font-bold">KES {fee.amount.toLocaleString()}</span>
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-slate-400 italic">Not assigned</span>
                                                        )}
                                                        </div>
                                                    </td>
                                                    <td className="p-2 align-top whitespace-nowrap">
                                                        <button onClick={() => openFeeItemModal(item)} className="text-blue-500 hover:underline">Edit</button>
                                                        <button onClick={() => handleDeleteFeeItem(item.id)} className="ml-2 text-red-500 hover:underline">Delete</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {activeTab === 'grading' && (
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">Grading System</h3>
                    <div className="space-y-2 mb-6">
                        <label className="flex items-center">
                            <input type="radio" name="gradingSystem" value={GradingSystem.Traditional} checked={localSchoolInfo.gradingSystem === GradingSystem.Traditional} onChange={() => setLocalSchoolInfo(s => s ? ({...s, gradingSystem: GradingSystem.Traditional}) : s)} className="form-radio text-primary-600"/>
                            <span className="ml-2">Traditional Grading (e.g., A, B, C)</span>
                        </label>
                        <label className="flex items-center">
                             <input type="radio" name="gradingSystem" value={GradingSystem.CBC} checked={localSchoolInfo.gradingSystem === GradingSystem.CBC} onChange={() => setLocalSchoolInfo(s => s ? ({...s, gradingSystem: GradingSystem.CBC}) : s)} className="form-radio text-primary-600"/>
                            <span className="ml-2">Competency-Based Curriculum (CBC) Grading</span>
                        </label>
                    </div>

                    {localSchoolInfo.gradingSystem === GradingSystem.Traditional && (
                        <div>
                            <h4 className="text-lg font-semibold text-slate-700 mb-2">Traditional Grade Scale</h4>
                             <table className="w-full max-w-lg text-left table-auto">
                                <thead><tr className="bg-slate-50 border-b"><th className="p-2">Grade</th><th className="p-2">Min (%)</th><th className="p-2">Max (%)</th><th className="p-2"></th></tr></thead>
                                <tbody>
                                    {localGradingScale.map(rule => (
                                        <tr key={rule.id} className="border-b">
                                            <td className="p-1"><input type="text" value={rule.grade} onChange={e => handleGradingRuleChange(rule.id, 'grade', e.target.value)} className="w-full p-1 border rounded" /></td>
                                            <td className="p-1"><input type="number" value={rule.minScore} onChange={e => handleGradingRuleChange(rule.id, 'minScore', e.target.value)} className="w-full p-1 border rounded" /></td>
                                            <td className="p-1"><input type="number" value={rule.maxScore} onChange={e => handleGradingRuleChange(rule.id, 'maxScore', e.target.value)} className="w-full p-1 border rounded" /></td>
                                            <td className="p-1 text-center"><button onClick={() => deleteGradingRule(rule.id)} className="text-red-500 hover:text-red-700 font-bold text-lg">&times;</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                             <button onClick={() => addGradingRule({ grade: '', minScore: 0, maxScore: 0 })} className="mt-4 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-300">Add New Rule</button>
                             <div className="flex justify-end mt-4 pt-4 border-t">
                                <button onClick={handleSaveGradingChanges} className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700">Save Grading Scale</button>
                            </div>
                        </div>
                    )}

                    {localSchoolInfo.gradingSystem === GradingSystem.CBC && (
                        <div>
                            <h4 className="text-lg font-semibold text-slate-700 mb-2">CBC Performance Levels</h4>
                            <ul className="list-disc list-inside bg-slate-50 p-4 rounded-md text-slate-700">
                                {Object.values(CbetScore).map(level => <li key={level}>{level}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            )}
            
            {activeTab === 'mpesa' && (
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">Daraja API Settings</h3>
                    <p className="text-slate-600 mb-6">Enter your live credentials from the Safaricom Daraja Developer Portal.</p>
                    <div className="space-y-4 max-w-lg">
                         <div>
                            <label className="block text-sm font-medium text-slate-700">Paybill Number</label>
                            <input type="text" name="paybillNumber" value={localDarajaSettings?.paybillNumber || ''} onChange={handleDarajaInputChange} className="mt-1 block w-full p-2 border border-slate-300 rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Short Code</label>
                            <input type="text" name="shortCode" value={localDarajaSettings?.shortCode || ''} onChange={handleDarajaInputChange} className="mt-1 block w-full p-2 border border-slate-300 rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Consumer Key</label>
                            <input type="text" name="consumerKey" value={localDarajaSettings?.consumerKey || ''} onChange={handleDarajaInputChange} className="mt-1 block w-full p-2 border border-slate-300 rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Consumer Secret</label>
                            <input type="password" name="consumerSecret" value={localDarajaSettings?.consumerSecret || ''} onChange={handleDarajaInputChange} className="mt-1 block w-full p-2 border border-slate-300 rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Passkey</label>
                            <input type="password" name="passkey" value={localDarajaSettings?.passkey || ''} onChange={handleDarajaInputChange} className="mt-1 block w-full p-2 border border-slate-300 rounded-md" />
                        </div>
                        <div className="flex justify-end space-x-4 pt-4 border-t">
                            <button onClick={handleSaveDarajaSettings} className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700">Save Settings</button>
                        </div>
                    </div>
                </div>
            )}

            <FeeItemModal 
                isOpen={isFeeItemModalOpen} 
                onClose={() => setIsFeeItemModalOpen(false)} 
                onSave={handleSaveFeeItem} 
                item={editingFeeItem} 
                classes={classes} 
                feeCategories={feeCategories}
            />
            <UserModal 
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                onSave={handleSaveUser}
                user={editingUser}
            />
        </div>
    );
};

export default SettingsView;

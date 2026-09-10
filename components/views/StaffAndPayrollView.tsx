
import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import type { Staff, Payroll, PayrollItem, SchoolInfo, PayrollEntry, NewStaff, NewPayrollItem } from '../../types';
import { PayrollItemType, PayrollItemCategory, CalculationType, Role } from '../../types';
import { useData } from '../../contexts/DataContext';

const StaffAndPayrollView: React.FC = () => {
    const { staff, addStaff, updateStaff, payrollHistory, savePayrollRun, payrollItems, addPayrollItem, updatePayrollItem, deletePayrollItem, schoolInfo, openIdCardModal } = useData();

    const [activeTab, setActiveTab] = useState('roster');
    const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
    const [isRunPayrollModalOpen, setIsRunPayrollModalOpen] = useState(false);
    const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
    const [isP9ModalOpen, setIsP9ModalOpen] = useState(false);
    const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
    const [selectedStaffForP9, setSelectedStaffForP9] = useState<Staff | null>(null);
    const [payrollWorksheet, setPayrollWorksheet] = useState<Payroll[]>([]);
    
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<PayrollItem | null>(null);
    const [itemFormData, setItemFormData] = useState<NewPayrollItem>({
        name: '', type: PayrollItemType.Earning, category: PayrollItemCategory.Allowance, calculationType: CalculationType.Fixed, value: 0, isRecurring: false
    });
    
    // Fix: Updated initial state to match the NewStaff type by removing photoUrl and adding required fields.
    const initialStaffState: NewStaff = {
        name: '', email: '', userRole: Role.Teacher, role: '', salary: 0, joinDate: '', kraPin: '', nssfNumber: '', shaNumber: '',
        bankName: '', accountNumber: ''
    };

    const [staffFormData, setStaffFormData] = useState<NewStaff | Staff>(initialStaffState);

    useEffect(() => {
        if (isStaffModalOpen) {
            setStaffFormData(editingStaff || initialStaffState);
        }
        if (isItemModalOpen) {
            setItemFormData(editingItem || { name: '', type: PayrollItemType.Earning, category: PayrollItemCategory.Allowance, calculationType: CalculationType.Fixed, value: 0, isRecurring: false });
        }
    }, [isStaffModalOpen, editingStaff, isItemModalOpen, editingItem]);
    
    // Fix: Simplified form handler for flattened state.
    const handleStaffFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setStaffFormData(prev => ({ ...prev, [name]: name === 'salary' ? parseFloat(value) || 0 : value }));
    };
    
    const handleSaveStaff = (e: React.FormEvent) => {
        e.preventDefault();
        if ('id' in staffFormData) { // Editing
            updateStaff(staffFormData.id, staffFormData);
        } else { // Adding
            addStaff(staffFormData as NewStaff);
        }
        setIsStaffModalOpen(false);
    };

    const openStaffModal = (staffMember: Staff | null = null) => {
        setEditingStaff(staffMember);
        setIsStaffModalOpen(true);
    };
    
    // Payroll Item Management
    const openItemModal = (item: PayrollItem | null) => {
        setEditingItem(item);
        setIsItemModalOpen(true);
    };
    
    const handleSaveItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            updatePayrollItem(editingItem.id, itemFormData);
        } else {
            addPayrollItem(itemFormData);
        }
        setIsItemModalOpen(false);
    };
    
    const handleDeleteItem = (itemId: string) => {
        if (window.confirm("Are you sure you want to delete this payroll item?")) {
            deletePayrollItem(itemId);
        }
    };

    // Payroll Calculation Logic
    const calculatePAYE = (taxablePay: number) => {
        const annualPay = taxablePay * 12;
        let tax = 0;
        if (annualPay <= 288000) tax = annualPay * 0.1;
        else if (annualPay <= 388000) tax = 28800 + (annualPay - 288000) * 0.25;
        else tax = 28800 + 25000 + (annualPay - 388000) * 0.30;
        return Math.max(0, (tax / 12) - 2400);
    };

    const calculateSHA = (grossPay: number) => grossPay * 0.0275;
    const calculateNSSF = (grossPay: number) => Math.min(grossPay, 18000) * 0.06;
    const calculateHousingLevy = (grossPay: number) => grossPay * 0.015;

    const generatePayrollWorksheet = () => {
        const month = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
        const worksheet = staff.map(staffMember => {
            const earnings: PayrollEntry[] = [{ name: 'Basic Salary', amount: staffMember.salary }];
            
            payrollItems
                .filter(i => i.type === PayrollItemType.Earning && i.isRecurring)
                .forEach(item => {
                    const earningAmount = item.calculationType === CalculationType.Percentage
                        ? (item.value / 100) * staffMember.salary
                        : item.value;
                    earnings.push({ name: item.name, amount: earningAmount });
                });

            const grossPay = earnings.reduce((sum, item) => sum + item.amount, 0);
            
            const deductions: PayrollEntry[] = [
                { name: 'PAYE', amount: calculatePAYE(grossPay) },
                { name: 'SHA Contribution', amount: calculateSHA(grossPay) },
                { name: 'NSSF', amount: calculateNSSF(grossPay) },
                { name: 'Housing Levy', amount: calculateHousingLevy(grossPay) },
            ];
            
            const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
            const netPay = grossPay - totalDeductions;
            
            return {
                id: `payroll-${staffMember.id}-${Date.now()}`, staffId: staffMember.id, staffName: staffMember.name,
                month, payDate: new Date().toISOString().split('T')[0],
                grossPay, totalDeductions, netPay, earnings, deductions,
            };
        });
        setPayrollWorksheet(worksheet);
        setIsRunPayrollModalOpen(true);
    };

    const handleWorksheetChange = (staffId: string, deductionName: string, value: number) => {
        setPayrollWorksheet(prev => prev.map(p => {
            if (p.staffId === staffId) {
                const newDeductions = p.deductions.map(d => d.name === deductionName ? { ...d, amount: value } : d);
                const newTotalDeductions = newDeductions.reduce((sum, d) => sum + d.amount, 0);
                const newNetPay = p.grossPay - newTotalDeductions;
                return { ...p, deductions: newDeductions, totalDeductions: newTotalDeductions, netPay: newNetPay };
            }
            return p;
        }));
    };

    const finalizePayroll = () => {
        savePayrollRun(payrollWorksheet).then(() => {
            setIsRunPayrollModalOpen(false);
            alert(`Payroll for ${payrollWorksheet[0]?.month} finalized successfully.`);
        });
    };
    
    const openPayslipModal = (payrollEntry: Payroll) => {
        setSelectedPayroll(payrollEntry);
        setIsPayslipModalOpen(true);
    };
    
    const openP9Modal = (staffMember: Staff) => {
        setSelectedStaffForP9(staffMember);
        setIsP9ModalOpen(true);
    };
    
    const staffMemberForPayslip = selectedPayroll ? staff.find(s => s.id === selectedPayroll.staffId) : null;
    
    if (!schoolInfo) return null;

    return (
        <div className="p-6 md:p-8">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800">Staff & Payroll</h2>
                <div>
                     <button onClick={generatePayrollWorksheet} className="mr-4 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">Run Payroll</button>
                    <button onClick={() => openStaffModal()} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700">Add New Staff</button>
                </div>
            </div>
             <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button onClick={() => setActiveTab('roster')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'roster' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Staff Roster</button>
                    <button onClick={() => setActiveTab('items')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'items' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Payroll Items</button>
                    <button onClick={() => setActiveTab('history')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'history' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Payroll History</button>
                </nav>
            </div>
            {activeTab === 'roster' && (
                <div className="mt-6 bg-white rounded-xl shadow-lg overflow-x-auto">
                    <table className="w-full text-left table-auto">
                        <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="px-4 py-3 font-semibold text-slate-600">Name</th><th className="px-4 py-3 font-semibold text-slate-600">Role</th><th className="px-4 py-3 font-semibold text-slate-600">Basic Salary (KES)</th><th className="px-4 py-3 font-semibold text-slate-600">Actions</th></tr></thead>
                        <tbody>{staff.map(s => (<tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50"><td className="px-4 py-3 text-slate-800 font-medium">{s.name}</td><td className="px-4 py-3 text-slate-500">{s.role}</td><td className="px-4 py-3 text-slate-500">{s.salary.toLocaleString()}</td><td className="px-4 py-3 space-x-4"><button onClick={() => openStaffModal(s)} className="text-blue-600 hover:underline">Edit</button><button onClick={() => openIdCardModal(s, 'staff')} className="text-purple-600 hover:underline">ID Card</button><button onClick={() => openP9Modal(s)} className="text-green-600 hover:underline">View P9</button></td></tr>))}</tbody>
                    </table>
                </div>
            )}
            {activeTab === 'items' && (
                 <div className="mt-6">
                    <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-slate-700">Custom Payroll Earnings & Deductions</h3><button onClick={() => openItemModal(null)} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700">Add Item</button></div>
                    <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
                         <table className="w-full text-left table-auto">
                            <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="px-4 py-3 font-semibold text-slate-600">Name</th><th className="px-4 py-3 font-semibold text-slate-600">Type</th><th className="px-4 py-3 font-semibold text-slate-600">Value</th><th className="px-4 py-3 font-semibold text-slate-600">Recurring</th><th className="px-4 py-3 font-semibold text-slate-600">Actions</th></tr></thead>
                            <tbody>{payrollItems.map(item => (<tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50"><td className="px-4 py-3 text-slate-800 font-medium">{item.name}</td><td className="px-4 py-3"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.type === 'Earning' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.type}</span></td>
                                <td className="px-4 py-3 text-slate-500">
                                    {item.calculationType === CalculationType.Percentage
                                        ? `${item.value}% of Basic`
                                        : item.value.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}
                                </td>
                            <td className="px-4 py-3 text-slate-500">{item.isRecurring ? 'Yes' : 'No'}</td><td className="px-4 py-3 space-x-4"><button onClick={() => openItemModal(item)} className="text-blue-600 hover:underline">Edit</button><button onClick={() => handleDeleteItem(item.id)} className="text-red-600 hover:underline">Delete</button></td></tr>))}</tbody>
                        </table>
                    </div>
                </div>
            )}
            {activeTab === 'history' && (
                <div className="mt-6 bg-white rounded-xl shadow-lg overflow-x-auto">
                    <table className="w-full text-left table-auto">
                        <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="px-4 py-3 font-semibold text-slate-600">Month</th><th className="px-4 py-3 font-semibold text-slate-600">Staff Name</th><th className="px-4 py-3 font-semibold text-slate-600">Net Pay (KES)</th><th className="px-4 py-3 font-semibold text-slate-600">Actions</th></tr></thead>
                        <tbody>{payrollHistory.map(p => (<tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50"><td className="px-4 py-3 text-slate-500">{p.month}</td><td className="px-4 py-3 text-slate-800 font-medium">{p.staffName}</td><td className="px-4 py-3 font-semibold text-slate-800">{p.netPay.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}</td><td className="px-4 py-3"><button onClick={() => openPayslipModal(p)} className="text-blue-600 hover:underline">View Payslip</button></td></tr>))}</tbody>
                    </table>
                </div>
            )}
            
            <Modal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} title={editingItem ? "Edit Payroll Item" : "Add Payroll Item"}>
                <form onSubmit={handleSaveItem} className="space-y-4">
                    <input type="text" placeholder="Item Name" value={itemFormData.name} onChange={e => setItemFormData(p => ({...p, name: e.target.value}))} required className="w-full p-2 border border-slate-300 rounded-lg"/>
                    <select value={itemFormData.type} onChange={e => setItemFormData(p => ({...p, type: e.target.value as PayrollItemType}))} className="w-full p-2 border border-slate-300 rounded-lg"><option value="Earning">Earning</option><option value="Deduction">Deduction</option></select>
                     <select value={itemFormData.calculationType} onChange={e => setItemFormData(p => ({...p, calculationType: e.target.value as CalculationType}))} className="w-full p-2 border border-slate-300 rounded-lg">
                        <option value={CalculationType.Fixed}>Fixed Amount</option>
                        <option value={CalculationType.Percentage}>Percentage of Basic</option>
                    </select>
                    <div className="relative">
                        <input 
                            type="number" 
                            placeholder={itemFormData.calculationType === CalculationType.Fixed ? 'Amount in KES' : 'Percentage'}
                            value={itemFormData.value || ''} 
                            onChange={e => setItemFormData(p => ({...p, value: parseFloat(e.target.value) || 0 }))} 
                            required 
                            className="w-full p-2 border border-slate-300 rounded-lg pr-12"
                        />
                        <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-slate-500">
                            {itemFormData.calculationType === CalculationType.Fixed ? 'KES' : '%'}
                        </span>
                    </div>

                    <label className="flex items-center"><input type="checkbox" checked={itemFormData.isRecurring} onChange={e => setItemFormData(p => ({...p, isRecurring: e.target.checked}))} className="h-4 w-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"/> <span className="ml-2 text-slate-700">Is this a recurring monthly item?</span></label>
                    <div className="flex justify-end"><button type="submit" className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700">Save Item</button></div>
                </form>
            </Modal>
            
            <Modal isOpen={isStaffModalOpen} onClose={() => setIsStaffModalOpen(false)} title={editingStaff ? 'Edit Staff Details' : 'Add New Staff Member'}>
                <form onSubmit={handleSaveStaff} className="space-y-4">
                    <h4 className="text-lg font-semibold text-slate-700">Personal Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><input type="text" name="name" placeholder="Full Name" value={(staffFormData as any).name} onChange={handleStaffFormChange} required className="p-2 border border-slate-300 rounded-lg"/><input type="text" name="role" placeholder="Role (e.g., Cook)" value={staffFormData.role} onChange={handleStaffFormChange} required className="p-2 border border-slate-300 rounded-lg"/><input type="date" name="joinDate" value={staffFormData.joinDate} onChange={handleStaffFormChange} required className="p-2 border border-slate-300 rounded-lg"/><input type="number" name="salary" placeholder="Basic Salary" value={staffFormData.salary || ''} onChange={handleStaffFormChange} required className="p-2 border border-slate-300 rounded-lg"/></div>
                    <h4 className="text-lg font-semibold text-slate-700 pt-4 border-t">Financial & Statutory Details</h4>
                    {/* Fix: Updated value attributes to use flattened properties */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><input type="text" name="bankName" placeholder="Bank Name" value={staffFormData.bankName} onChange={handleStaffFormChange} required className="p-2 border border-slate-300 rounded-lg"/><input type="text" name="accountNumber" placeholder="Bank Account Number" value={staffFormData.accountNumber} onChange={handleStaffFormChange} required className="p-2 border border-slate-300 rounded-lg"/><input type="text" name="kraPin" placeholder="KRA PIN" value={staffFormData.kraPin} onChange={handleStaffFormChange} required className="p-2 border border-slate-300 rounded-lg"/><input type="text" name="nssfNumber" placeholder="NSSF Number" value={staffFormData.nssfNumber} onChange={handleStaffFormChange} required className="p-2 border border-slate-300 rounded-lg"/><input type="text" name="shaNumber" placeholder="SHA Number" value={staffFormData.shaNumber} onChange={handleStaffFormChange} required className="p-2 border border-slate-300 rounded-lg"/></div>
                    <div className="flex justify-end pt-4"><button type="submit" className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700">Save Staff</button></div>
                </form>
            </Modal>

            <Modal isOpen={isRunPayrollModalOpen} onClose={() => setIsRunPayrollModalOpen(false)} title={`Run Payroll for ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`} size="3xl">
                <div className="overflow-x-auto"><table className="w-full text-left text-sm table-auto"><thead><tr className="bg-slate-50"><th className="p-2 font-semibold text-slate-600">Staff</th><th className="p-2 font-semibold text-slate-600">Gross</th><th className="p-2 font-semibold text-slate-600">PAYE</th><th className="p-2 font-semibold text-slate-600">SHA</th><th className="p-2 font-semibold text-slate-600">NSSF</th><th className="p-2 font-semibold text-slate-600">Levy</th><th className="p-2 font-semibold text-slate-600">Total Ded.</th><th className="p-2 font-semibold text-slate-600">Net Pay</th></tr></thead><tbody>{payrollWorksheet.map(p => (<tr key={p.staffId} className="border-b border-slate-100">
                    <td className="p-2 font-medium">{p.staffName}</td><td className="p-2">{p.grossPay.toFixed(2)}</td>
                    {p.deductions.map(d => (<td key={d.name} className="p-1"><input type="number" value={d.amount.toFixed(2)} onChange={e => handleWorksheetChange(p.staffId, d.name, parseFloat(e.target.value))} className="w-24 p-1 border border-slate-300 rounded"/></td>))}
                    <td className="p-2">{p.totalDeductions.toFixed(2)}</td><td className="p-2 font-bold">{p.netPay.toFixed(2)}</td></tr>))}</tbody></table></div>
                <div className="flex justify-end mt-4"><button onClick={finalizePayroll} className="px-4 py-2 bg-primary-600 text-white rounded">Finalize & Save Payroll</button></div>
            </Modal>
            
            {isPayslipModalOpen && selectedPayroll && staffMemberForPayslip && (
                 <Modal isOpen={isPayslipModalOpen} onClose={() => setIsPayslipModalOpen(false)} title={`Payslip`} size="2xl" footer={<button onClick={() => window.print()} className="px-4 py-2 bg-slate-600 text-white rounded no-print">Print</button>}>
                     <div className="printable-area font-sans text-slate-800 bg-white">
                         <div className="p-8 border border-slate-200 rounded-lg">
                            {/* Header */}
                            <div className="flex justify-between items-start pb-4 border-b border-slate-200">
                                <div className="flex items-center space-x-4">
                                    {schoolInfo.logoUrl && <img src={schoolInfo.logoUrl} alt="logo" className="h-20 w-20 rounded-full object-cover" />}
                                    <div>
                                        <h2 className="text-3xl font-bold text-primary-800">{schoolInfo.name}</h2>
                                        <p className="text-slate-500 text-sm">{schoolInfo.address}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <h3 className="text-2xl font-bold text-slate-700">Payslip</h3>
                                    <p className="text-slate-500">{selectedPayroll.month}</p>
                                </div>
                            </div>
                            {/* Employee Details */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 my-6 text-sm">
                                <div><strong className="text-slate-500 block">Employee:</strong> <span className="font-semibold">{selectedPayroll.staffName}</span></div>
                                <div><strong className="text-slate-500 block">Employee ID:</strong> <span className="font-semibold">{selectedPayroll.staffId}</span></div>
                                <div><strong className="text-slate-500 block">Pay Date:</strong> <span className="font-semibold">{selectedPayroll.payDate}</span></div>
                                <div><strong className="text-slate-500 block">KRA PIN:</strong> <span className="font-semibold">{staffMemberForPayslip.kraPin}</span></div>
                                <div><strong className="text-slate-500 block">NSSF No:</strong> <span className="font-semibold">{staffMemberForPayslip.nssfNumber}</span></div>
                                <div><strong className="text-slate-500 block">SHA No:</strong> <span className="font-semibold">{staffMemberForPayslip.shaNumber}</span></div>
                            </div>
                            {/* Main Body */}
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <h4 className="text-lg font-semibold border-b pb-1 text-slate-700">Earnings</h4>
                                    <table className="w-full text-sm">
                                        <tbody>
                                            {selectedPayroll.earnings.map(item => (<tr key={item.name}><td className="py-1">{item.name}</td><td className="py-1 text-right">{item.amount.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}</td></tr>))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-lg font-semibold border-b pb-1 text-slate-700">Deductions</h4>
                                    <table className="w-full text-sm">
                                        <tbody>
                                            {selectedPayroll.deductions.map(item => (<tr key={item.name}><td className="py-1">{item.name}</td><td className="py-1 text-right">({item.amount.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })})</td></tr>))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                             {/* Summary Section */}
                            <div className="mt-6 pt-4 border-t-2 border-slate-200 grid grid-cols-2 gap-8 items-end">
                                <div className="text-sm space-y-1">
                                    <div className="flex justify-between font-semibold"><span className="text-slate-600">Gross Pay:</span><span>{selectedPayroll.grossPay.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}</span></div>
                                    <div className="flex justify-between font-semibold"><span className="text-slate-600">Total Deductions:</span><span>({selectedPayroll.totalDeductions.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })})</span></div>
                                </div>
                                <div className="bg-primary-50 p-4 rounded-lg text-right">
                                    <p className="text-sm font-semibold text-primary-700">Net Pay</p>
                                    <p className="text-3xl font-bold text-primary-800">{selectedPayroll.netPay.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}</p>
                                </div>
                            </div>
                            {/* Footer */}
                            <div className="mt-8 pt-4 border-t text-center text-xs text-slate-400">
                                <p>This is a computer-generated payslip and does not require a signature.</p>
                                <p>Generated by Saaslink School Management System &copy; {new Date().getFullYear()}</p>
                            </div>
                         </div>
                     </div>
                 </Modal>
            )}
             {isP9ModalOpen && selectedStaffForP9 && (
                <Modal isOpen={isP9ModalOpen} onClose={() => setIsP9ModalOpen(false)} title={`P9 Form for ${selectedStaffForP9.name}`} size="2xl" footer={<button onClick={() => window.print()} className="px-4 py-2 bg-slate-600 text-white rounded no-print">Print</button>}>
                     <div className="printable-area p-4 border border-slate-200 rounded-lg">
                        <h2 className="text-center font-bold text-xl">P9 A - TAX DEDUCTION CARD YEAR {new Date().getFullYear()}</h2>
                        <div className="my-4 text-sm"><p><strong>Employer Name:</strong> {schoolInfo.name}</p><p><strong>Employee Name:</strong> {selectedStaffForP9.name}</p><p><strong>Employee KRA PIN:</strong> {selectedStaffForP9.kraPin}</p></div>
                        <table className="w-full text-left text-xs table-auto border-collapse border border-slate-400">
                            <thead className="bg-slate-100"><tr className="border border-slate-400"><th className="p-1 border border-slate-400">Month</th><th className="p-1 border border-slate-400">Gross Pay</th><th className="p-1 border border-slate-400">PAYE</th><th className="p-1 border border-slate-400">SHA</th><th className="p-1 border border-slate-400">NSSF</th><th className="p-1 border border-slate-400">Housing Levy</th></tr></thead>
                            <tbody>{payrollHistory.filter(p => p.staffId === selectedStaffForP9.id).map(p => (<tr key={p.id} className="border border-slate-400"><td className="p-1 border border-slate-400">{p.month}</td><td className="p-1 border border-slate-400">{p.grossPay.toFixed(2)}</td><td className="p-1 border border-slate-400">{p.deductions.find(d=>d.name==='PAYE')?.amount.toFixed(2)}</td><td className="p-1 border border-slate-400">{p.deductions.find(d=>d.name==='SHA Contribution')?.amount.toFixed(2)}</td><td className="p-1 border border-slate-400">{p.deductions.find(d=>d.name==='NSSF')?.amount.toFixed(2)}</td><td className="p-1 border border-slate-400">{p.deductions.find(d=>d.name==='Housing Levy')?.amount.toFixed(2)}</td></tr>))}</tbody>
                        </table>
                    </div>
                </Modal>
            )}
        </div>
    )
};


export default StaffAndPayrollView;

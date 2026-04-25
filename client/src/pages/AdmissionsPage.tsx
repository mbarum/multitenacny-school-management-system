import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserPlus, Search, Filter, ClipboardList, CheckCircle2, XCircle, 
  Clock, MoreVertical, Eye, Check, X, ArrowRight, User, Mail, 
  Phone, Calendar, GraduationCap, ChevronRight, FileText, Download,
  MoreHorizontal, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

import DashboardLayout from '../components/DashboardLayout';

interface Application {
  id: string;
  firstName: string;
  lastName: string;
  parentEmail: string;
  parentPhone: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  createdAt: string;
  dateOfBirth: string;
  adminNotes?: string;
}

const AdmissionsPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [enrollData, setEnrollData] = useState({
    admissionNumber: '',
    classId: '',
    academicYearId: ''
  });

  const fetchApplications = async () => {
    try {
      const res = await api.get('/admissions/applications');
      setApplications(res.data);
    } catch (err) {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleEnrol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    try {
      await api.post(`/admissions/enrol/${selectedApp.id}`, enrollData);
      toast.success('Student successfully enrolled and billed');
      setIsProcessModalOpen(false);
      fetchApplications();
    } catch (err) {
      toast.error('Enrolment failed');
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/admissions/applications/${id}/status`, { status });
      toast.success(`Status updated to ${status}`);
      fetchApplications();
    } catch (err) {
      toast.error('Update failed');
    }
  };

  return (
    <>
      <div className="max-w-full px-6 py-8">
      <header className="mb-8 border-b border-gray-200 pb-6 flex justify-between items-end">
          <div>
            <nav className="flex mb-2 text-[10px] font-mono text-gray-400 uppercase tracking-widest">
              <span>Admissions</span>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-bold uppercase tracking-widest">Candidates</span>
            </nav>
            <h1 className="text-3xl font-serif italic font-medium text-gray-900 leading-tight">Student Intake Registry</h1>
            <p className="text-gray-500 font-sans mt-1 text-sm">Managing prospective enrollment applications and processing approvals.</p>
          </div>
          
          <div className="flex bg-gray-50 p-1 border border-gray-200 rounded shrink-0">
             {['pending', 'approved', 'rejected'].map(tab => (
               <button key={tab} className="px-4 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all text-gray-400 hover:text-gray-600 capitalize">
                 {tab}
               </button>
             ))}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
           <div className="lg:col-span-3">
              <div className="bg-white border border-gray-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-gray-400">Application Queue</h3>
                  <div className="flex space-x-2">
                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                        <input type="text" placeholder="Search applicant..." className="pl-8 pr-4 py-1.5 bg-white border border-gray-200 rounded text-[10px] w-48 focus:ring-1 focus:ring-gray-900 font-mono" />
                     </div>
                  </div>
                </div>

                {applications.length === 0 ? (
                  <div className="py-24 text-center">
                     <Clock className="mx-auto text-gray-200 mb-4" size={32} />
                     <p className="text-gray-400 font-mono text-[9px] uppercase tracking-widest">No pending applications in queue</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto text-[11px]">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-transparent border-b border-gray-100">
                          <th className="px-6 py-4 font-mono font-bold text-gray-400 uppercase tracking-widest">Candidate</th>
                          <th className="px-6 py-4 font-mono font-bold text-gray-400 uppercase tracking-widest">Parent / Contact</th>
                          <th className="px-6 py-4 font-mono font-bold text-gray-400 uppercase tracking-widest">Status</th>
                          <th className="px-6 py-4 font-mono font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {applications.map(app => (
                          <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gray-50 border border-gray-100 rounded flex items-center justify-center font-serif italic text-gray-400">
                                  {app.firstName[0]}
                                </div>
                                <div>
                                  <p className="font-serif italic text-gray-900 text-sm tracking-tight">{app.firstName} {app.lastName}</p>
                                  <p className="text-[10px] font-mono text-gray-400 mt-0.5 lowercase tracking-tight">{new Date(app.createdAt).toLocaleDateString()}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-600 font-sans tracking-tight">
                              <div className="flex flex-col">
                                <span>{app.parentEmail}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-widest border ${
                                app.status === 'pending' ? 'bg-orange-50 text-orange-700 border-orange-100' : 
                                app.status === 'approved' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                              }`}>{app.status}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end space-x-2">
                                {app.status === 'pending' && (
                                  <button 
                                    onClick={() => { setSelectedApp(app); setIsProcessModalOpen(true); }}
                                    className="px-3 py-1 bg-gray-900 text-white rounded-sm text-[9px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
                                  >
                                    Review
                                  </button>
                                )}
                                <button className="p-1 text-gray-300 hover:text-gray-900 transition-colors">
                                   <Eye size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
           </div>

           <div className="space-y-6">
              <div className="bg-gray-900 p-8 text-white shadow-lg relative overflow-hidden group">
                 <FileText className="absolute -right-4 -bottom-4 text-white/5 transition-transform group-hover:scale-110" size={120} />
                 <h3 className="text-xl font-serif italic text-white mb-2">Public Intake URL</h3>
                 <p className="text-[10px] font-sans text-white/40 mb-6 leading-relaxed">
                   Link provided to guardians for prospective submissions.
                 </p>
                 <div className="bg-white/5 p-3 rounded border border-white/5 mb-6">
                    <p className="text-[10px] font-mono text-white/60 truncate italic">/apply/royal-academy</p>
                 </div>
                 <button className="w-full bg-white text-gray-900 py-3 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95 shadow-lg">
                   Copy link
                 </button>
              </div>

              <div className="bg-white border border-gray-200 p-8 shadow-sm">
                 <div className="w-10 h-10 bg-gray-50 text-gray-400 rounded flex items-center justify-center mb-4 border border-gray-100">
                    <UserPlus size={18} />
                 </div>
                 <h4 className="text-lg font-serif italic text-gray-900">Direct Entry</h4>
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2 leading-relaxed mb-6">
                   Immediate institutional placement.
                 </p>
                 <button className="w-full bg-gray-50 border border-gray-200 text-gray-900 py-3 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-gray-100 transition-all">
                   Manual Admission
                 </button>
              </div>
           </div>
        </div>
      </div>

      <AnimatePresence>
        {isProcessModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="bg-white rounded-[3.5rem] w-full max-w-xl overflow-hidden shadow-2xl"
             >
                <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-orange-50/50">
                  <div>
                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">Institutional <span className="text-orange-500">Placement</span></h3>
                    <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mt-2">{selectedApp?.firstName} {selectedApp?.lastName}</p>
                  </div>
                  <button onClick={() => setIsProcessModalOpen(false)} className="p-4 hover:bg-white text-orange-400 rounded-3xl transition-all"><X size={24} /></button>
                </div>
                
                <form onSubmit={handleEnrol} className="p-10 space-y-6">
                   <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Admission Number</label>
                        <input 
                          required type="text" value={enrollData.admissionNumber}
                          onChange={(e) => setEnrollData({...enrollData, admissionNumber: e.target.value})}
                          className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-orange-600 font-bold"
                          placeholder="e.g. ADM-2024-001"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                         <div>
                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Placement Class</label>
                            <input 
                              required type="text" value={enrollData.classId}
                              onChange={(e) => setEnrollData({...enrollData, classId: e.target.value})}
                              className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold"
                              placeholder="Class ID"
                            />
                         </div>
                         <div>
                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Academic Year</label>
                            <input 
                              required type="text" value={enrollData.academicYearId}
                              onChange={(e) => setEnrollData({...enrollData, academicYearId: e.target.value})}
                              className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold"
                              placeholder="Year ID"
                            />
                         </div>
                      </div>
                   </div>

                   <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                      <div className="flex items-center space-x-3 text-emerald-600 mb-2">
                        <AlertCircle size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Financial Nexus</span>
                      </div>
                      <p className="text-[11px] font-bold text-gray-600 leading-relaxed uppercase">
                        Confirming this placement will automatically generate an invoice for Admission & Tuition fees.
                      </p>
                   </div>

                   <div className="flex space-x-4 pt-6">
                      <button 
                        type="button"
                        onClick={() => selectedApp && updateStatus(selectedApp.id, 'rejected')}
                        className="flex-grow bg-rose-50 text-rose-600 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-rose-100 transition-all"
                      >
                        Decline
                      </button>
                      <button 
                        type="submit"
                        className="flex-grow-[2] bg-gray-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-gray-200 hover:scale-[1.02] active:scale-95 transition-all"
                      >
                        Finalize Enrolment
                      </button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdmissionsPage;

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
    <DashboardLayout>
      <div className="max-w-7xl mx-auto pb-20">
        <header className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
          <div>
            <div className="flex items-center space-x-2 text-orange-600 mb-2">
              <UserPlus size={16} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Intake Pipeline</span>
            </div>
            <h1 className="text-4xl font-display font-black text-gray-900 tracking-tight leading-none uppercase italic">
              ADMISSION <span className="text-orange-500">CONTROL</span>
            </h1>
          </div>
          
          <div className="flex bg-white p-1.5 rounded-2xl border border-gray-200/60 shadow-sm">
             {['pending', 'approved', 'rejected'].map(tab => (
               <button key={tab} className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-all capitalize">
                 {tab}
               </button>
             ))}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
           <div className="lg:col-span-3 space-y-8">
              {applications.length === 0 ? (
                <div className="bg-white rounded-[2rem] p-24 text-center border border-dashed border-gray-200">
                   <Clock className="mx-auto text-gray-100 mb-6" size={48} />
                   <h3 className="text-xl font-display font-black text-gray-900 tracking-tight uppercase italic">No active applications</h3>
                   <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-2 leading-relaxed">The digital intake terminal is currently silent</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {applications.map(app => (
                     <motion.div 
                      layoutId={app.id}
                      key={app.id} 
                      className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-200/60 hover:shadow-xl hover:shadow-orange-500/5 transition-all group relative overflow-hidden flex flex-col"
                     >
                        <div className="flex items-center space-x-5 mb-8">
                           <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center font-black text-lg italic border border-orange-100">
                             {app.firstName[0]}
                           </div>
                           <div>
                              <h3 className="text-xl font-display font-black text-gray-900 uppercase tracking-tighter italic leading-none">{app.firstName} {app.lastName}</h3>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">{new Date(app.createdAt).toLocaleDateString()}</p>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 mb-8 flex-grow">
                           <div className="px-5 py-4 bg-gray-50 rounded-2xl flex items-center justify-between">
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Contact</span>
                              <span className="text-xs font-bold text-gray-900 truncate ml-4 font-mono">{app.parentEmail}</span>
                           </div>
                           <div className="px-5 py-4 bg-gray-50 rounded-2xl flex items-center justify-between">
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Status</span>
                              <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                                app.status === 'pending' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                                app.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                              }`}>{app.status}</span>
                           </div>
                        </div>

                        <div className="flex space-x-3 pt-6 border-t border-gray-50">
                           {app.status === 'pending' && (
                             <button 
                              onClick={() => { setSelectedApp(app); setIsProcessModalOpen(true); }}
                              className="flex-grow bg-gray-900 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-95"
                             >
                               Evaluate
                             </button>
                           )}
                           <button className="p-4 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-900 hover:text-white transition-all">
                              <Eye size={18} />
                           </button>
                        </div>
                     </motion.div>
                   ))}
                </div>
              )}
           </div>

           <div className="space-y-8">
              <div className="bg-gray-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                 <FileText className="absolute right-0 bottom-0 text-white/5 -mb-6 -mr-6 transition-transform group-hover:scale-110" size={160} />
                 <h3 className="text-2xl font-display font-black italic tracking-tighter uppercase mb-2">Public <span className="text-orange-500">Portal</span></h3>
                 <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-8 leading-relaxed">
                   External link for prospective candidate submissions.
                 </p>
                 <div className="bg-white/5 p-4 rounded-xl mb-6 border border-white/5">
                    <p className="text-[10px] font-mono text-white/60 truncate italic">/apply/royal-academy</p>
                 </div>
                 <button className="w-full bg-white text-gray-900 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all active:scale-95 shadow-lg">
                   Copy Intake URL
                 </button>
              </div>

              <div className="bg-white border border-gray-200/60 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
                 <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 border border-emerald-100">
                    <CheckCircle2 size={24} />
                 </div>
                 <h4 className="text-lg font-display font-black uppercase italic tracking-tighter text-gray-900">Direct <span className="text-emerald-600">Entry</span></h4>
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-3 leading-relaxed mb-8">
                   Immediate placement for walk-in enrollments.
                 </p>
                 <button className="w-full border-2 border-gray-100 text-gray-900 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all font-display">
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
    </DashboardLayout>
  );
};

export default AdmissionsPage;

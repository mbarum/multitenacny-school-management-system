import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, Sparkles, User, Mail, Phone, Calendar, 
  ChevronRight, ArrowRight, CheckCircle2, FileText, Globe, 
  MapPin, ShieldCheck, Heart
} from 'lucide-react';
import { toast } from 'sonner';

const OnlineApplicationPage: React.FC = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'male',
    parentFirstName: '',
    parentLastName: '',
    parentEmail: '',
    parentPhone: '',
    appliedClassId: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/admissions/public/${tenantId}`, formData);
      setIsSubmitted(true);
    } catch (err) {
      toast.error('Submission failed. Please try again.');
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6">
         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl w-full text-center p-16 bg-white rounded-[4rem] shadow-2xl shadow-blue-100 border border-blue-50">
            <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-10 shadow-lg shadow-emerald-200">
               <CheckCircle2 size={48} />
            </div>
            <h2 className="text-5xl font-black text-gray-900 tracking-tighter uppercase italic mb-6">Application <span className="text-emerald-500">Received</span></h2>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm leading-relaxed mb-10">
              Your information has been securely transmitted. Our admissions board will review the dossier and contact you via email shortly.
            </p>
            <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 mb-10">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 italic">Next Protocol</p>
               <div className="space-y-4">
                  {[
                    'Portfolio Review',
                    'Internal Assessment',
                    'Strategic Placement'
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-4 text-left">
                       <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-[10px]">{idx+1}</span>
                       <span className="text-[11px] font-black uppercase tracking-widest text-gray-700">{item}</span>
                    </div>
                  ))}
               </div>
            </div>
         </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex flex-col lg:flex-row">
       <div className="lg:w-2/5 bg-gray-900 p-12 lg:p-24 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
             <div className="flex items-center space-x-3 mb-12">
                <div className="p-3 bg-white/10 rounded-2xl"><GraduationCap size={28} className="text-blue-400" /></div>
                <h3 className="text-2xl font-black italic tracking-tighter uppercase">Elite <span className="text-blue-400">Registry</span></h3>
             </div>
             
             <h1 className="text-6xl font-black italic tracking-tighter leading-none uppercase mb-8">
                The Future <br /><span className="text-blue-400">Starts Here</span>
             </h1>
             <p className="text-blue-100/40 font-bold uppercase tracking-[0.2em] text-[10px] leading-relaxed max-w-sm mb-12">
               Access high-fidelity academic excellence through our streamlined digital enrollment process.
             </p>

             <div className="space-y-12">
                {[
                  { icon: ShieldCheck, title: 'Secure Intake', desc: 'Encrypted data transmission protocol' },
                  { icon: Globe, title: 'Global Standard', desc: 'Recognized academic certification' },
                  { icon: Heart, title: 'Holistic Focus', desc: 'Nurturing talent & strategic intelligence' }
                ].map((item, idx) => (
                  <div key={idx} className="flex space-x-5">
                     <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-blue-400"><item.icon size={24} /></div>
                     <div>
                        <h4 className="text-xs font-black uppercase tracking-widest">{item.title}</h4>
                        <p className="text-[10px] font-bold text-white/30 uppercase mt-1">{item.desc}</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>
          
          <div className="mt-24 relative z-10 pt-12 border-t border-white/5">
             <div className="flex items-center space-x-4 opacity-40">
                <ShieldCheck size={18} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Institutional Grade Security</span>
             </div>
          </div>
          
          <Globe className="absolute -left-20 -bottom-20 opacity-5 text-blue-500" size={500} />
       </div>

       <div className="lg:w-3/5 p-12 lg:p-24 flex items-center justify-center">
          <div className="max-w-2xl w-full">
             <div className="flex justify-between items-end mb-16">
                <div>
                   <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 block">Application Form</span>
                   <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">Enrollment <span className="text-blue-500">Step {step}/2</span></h2>
                </div>
                <div className="flex space-x-2">
                   {[1, 2].map(s => (
                     <div key={s} className={`h-1 rounded-full transition-all duration-500 ${s <= step ? 'w-12 bg-blue-500' : 'w-4 bg-gray-200'}`} />
                   ))}
                </div>
             </div>

             <form onSubmit={handleSubmit} className="space-y-10">
                <AnimatePresence mode="wait">
                   {step === 1 ? (
                     <motion.div 
                      key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                     >
                        <div className="grid grid-cols-2 gap-8">
                           <div className="space-y-3">
                              <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 px-1">
                                <User size={12} /> First Name
                              </label>
                              <input 
                                required type="text" value={formData.firstName}
                                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                className="w-full bg-white border-2 border-gray-50 rounded-3xl px-8 py-5 focus:border-blue-500 focus:ring-0 font-bold text-gray-900 transition-all shadow-sm"
                                placeholder="E.g. Alexander"
                              />
                           </div>
                           <div className="space-y-3">
                              <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 px-1">
                                <User size={12} /> Last Name
                              </label>
                              <input 
                                required type="text" value={formData.lastName}
                                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                                className="w-full bg-white border-2 border-gray-50 rounded-3xl px-8 py-5 focus:border-blue-500 focus:ring-0 font-bold text-gray-900 transition-all shadow-sm"
                                placeholder="E.g. Hamilton"
                              />
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                           <div className="space-y-3">
                              <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 px-1">
                                <Calendar size={12} /> Date of Birth
                              </label>
                              <input 
                                required type="date" value={formData.dateOfBirth}
                                onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                                className="w-full bg-white border-2 border-gray-50 rounded-3xl px-8 py-5 focus:border-blue-500 focus:ring-0 font-bold text-gray-900 uppercase transition-all shadow-sm"
                              />
                           </div>
                           <div className="space-y-3">
                              <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 px-1">
                                <GraduationCap size={12} /> Grade / Class
                              </label>
                              <input 
                                required type="text" value={formData.appliedClassId}
                                onChange={(e) => setFormData({...formData, appliedClassId: e.target.value})}
                                className="w-full bg-white border-2 border-gray-50 rounded-3xl px-8 py-5 focus:border-blue-500 focus:ring-0 font-bold text-gray-900 transition-all shadow-sm"
                                placeholder="E.g. Grade 1"
                              />
                           </div>
                        </div>

                        <div className="pt-8">
                           <button 
                            type="button" onClick={() => setStep(2)}
                            className="w-full bg-gray-900 text-white rounded-[2.5rem] py-6 font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-gray-200 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-4"
                           >
                             <span>Proceed to Parent Profile</span>
                             <ChevronRight size={18} />
                           </button>
                        </div>
                     </motion.div>
                   ) : (
                     <motion.div 
                      key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                     >
                        <div className="grid grid-cols-2 gap-8">
                           <div className="space-y-3">
                              <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 px-1">
                                Guardian First Name
                              </label>
                              <input 
                                required type="text" value={formData.parentFirstName}
                                onChange={(e) => setFormData({...formData, parentFirstName: e.target.value})}
                                className="w-full bg-white border-2 border-gray-50 rounded-3xl px-8 py-5 focus:border-blue-500 focus:ring-0 font-bold text-gray-900"
                              />
                           </div>
                           <div className="space-y-3">
                              <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 px-1">
                                Guardian Last Name
                              </label>
                              <input 
                                required type="text" value={formData.parentLastName}
                                onChange={(e) => setFormData({...formData, parentLastName: e.target.value})}
                                className="w-full bg-white border-2 border-gray-50 rounded-3xl px-8 py-5 focus:border-blue-500 focus:ring-0 font-bold text-gray-900"
                              />
                           </div>
                        </div>

                        <div className="space-y-3">
                           <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 px-1">
                             <Mail size={12} /> Contact Email
                           </label>
                           <input 
                             required type="email" value={formData.parentEmail}
                             onChange={(e) => setFormData({...formData, parentEmail: e.target.value})}
                             className="w-full bg-white border-2 border-gray-50 rounded-3xl px-8 py-5 focus:border-blue-500 focus:ring-0 font-bold text-gray-900"
                             placeholder="E.g. parent@example.com"
                           />
                        </div>

                        <div className="space-y-3">
                           <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 px-1">
                             <Phone size={12} /> Phone Number
                           </label>
                           <input 
                             required type="tel" value={formData.parentPhone}
                             onChange={(e) => setFormData({...formData, parentPhone: e.target.value})}
                             className="w-full bg-white border-2 border-gray-50 rounded-3xl px-8 py-5 focus:border-blue-500 focus:ring-0 font-bold text-gray-900"
                             placeholder="E.g. +214..."
                           />
                        </div>

                        <div className="flex flex-col space-y-4 pt-8">
                           <button 
                            type="submit"
                            className="w-full bg-blue-600 text-white rounded-[2.5rem] py-6 font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-blue-100 hover:scale-[1.02] active:scale-95 transition-all"
                           >
                             Transmit Application
                           </button>
                           <button 
                            type="button" onClick={() => setStep(1)}
                            className="w-full bg-gray-50 text-gray-400 rounded-[2.5rem] py-6 font-black uppercase tracking-[0.2em] text-xs hover:bg-gray-100 transition-all italic underline"
                           >
                             Back to Student Profile
                           </button>
                        </div>
                     </motion.div>
                   )}
                </AnimatePresence>
             </form>
          </div>
       </div>
    </div>
  );
};

export default OnlineApplicationPage;

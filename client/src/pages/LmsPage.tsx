import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { motion } from 'framer-motion';
import { Globe, Settings, ExternalLink, ShieldCheck, Zap, RefreshCw, X, Check, ArrowRight, BookOpen, Layers, Cloud, Lock, Key, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface LmsConnection {
  id: string;
  provider: 'moodle' | 'google_classroom' | 'canvas';
  apiUrl: string;
  isConnected: boolean;
}

const LmsPage: React.FC = () => {
  const [connections, setConnections] = useState<LmsConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    provider: 'moodle',
    apiUrl: '',
    credential1: '',
    credential2: ''
  });

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const response = await api.get('/lms/connections');
      setConnections(response.data);
    } catch (error) {
      console.error('Failed to fetch connections', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/lms/connections', {
          provider: formData.provider,
          apiUrl: formData.apiUrl,
          encryptedCredential1: formData.credential1,
          encryptedCredential2: formData.credential2
      });
      toast.success('Connection established');
      setIsModalOpen(false);
      fetchConnections();
    } catch (error) {
      toast.error('Failed to connect to LMS');
    }
  };

  const providers = [
      { id: 'moodle', name: 'Moodle', icon: <Layers size={24} />, color: 'bg-orange-500', desc: 'The world\'s most popular open-source LMS.' },
      { id: 'google_classroom', name: 'Google Classroom', icon: <Cloud size={24} />, color: 'bg-green-600', desc: 'Seamless integration with Google Workspace.' },
      { id: 'canvas', name: 'Canvas', icon: <Zap size={24} />, color: 'bg-red-600', desc: 'Modern and flexible learning management.' }
  ];

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <div className="flex items-center space-x-2 text-indigo-600 mb-3">
              <Globe size={18} className="animate-spin-slow" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">External Ecosystems</span>
            </div>
            <h1 className="text-6xl font-black text-gray-900 uppercase tracking-tighter leading-none italic">
              LMS <span className="text-indigo-600">Integrations</span>
            </h1>
            <p className="text-gray-400 font-medium text-sm mt-6 max-w-xl leading-relaxed">
              Bridge your school ecosystem with global learning management systems. Sync grades, assignments, and personnel automatically.
            </p>
          </div>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="group relative px-8 py-4 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-indigo-100 overflow-hidden active:scale-95 transition-all"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Establish New Bridge
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
           {providers.map(p => {
               const conn = connections.find(c => c.provider === p.id);
               return (
                   <div key={p.id} className={`p-8 rounded-[3rem] border-2 transition-all relative overflow-hidden group ${conn?.isConnected ? 'border-indigo-600 bg-indigo-50/10' : 'border-gray-50 bg-gray-50/30'}`}>
                       <div className="relative z-10">
                           <div className={`w-14 h-14 ${p.color} text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl`}>
                               {p.icon}
                           </div>
                           <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight uppercase italic">{p.name}</h3>
                           <p className="text-gray-400 text-xs font-medium leading-relaxed mb-8 uppercase tracking-wider">{p.desc}</p>
                           
                           {conn?.isConnected ? (
                               <div className="space-y-4">
                                   <div className="flex items-center space-x-2 text-green-600 text-[10px] font-black uppercase tracking-widest">
                                       <ShieldCheck size={14} />
                                       <span>Status: Synced & Active</span>
                                   </div>
                                   <button className="flex items-center space-x-2 text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:translate-x-1 transition-transform">
                                       <span>Configure Bridge</span>
                                       <ArrowRight size={14} />
                                   </button>
                               </div>
                           ) : (
                               <button 
                                onClick={() => {
                                    setFormData({...formData, provider: p.id});
                                    setIsModalOpen(true);
                                }}
                                className="px-6 py-3 bg-white border border-gray-200 text-gray-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-indigo-600 hover:text-indigo-600 transition-all"
                               >
                                   Set up Connection
                               </button>
                           )}
                       </div>
                       
                       {/* Background decoration */}
                       <div className={`absolute top-0 right-0 w-32 h-32 ${p.color} opacity-[0.03] rounded-full -translate-y-12 translate-x-12 group-hover:scale-150 transition-transform`} />
                   </div>
               );
           })}
        </div>

        {/* Sync Status Section */}
        <div className="bg-gray-950 rounded-[4rem] p-12 text-white relative overflow-hidden">
             <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12">
                 <div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter mb-6 italic leading-none">
                        Real-time <span className="text-indigo-500">Synchronization</span>
                    </h2>
                    <p className="text-gray-400 text-sm font-medium leading-relaxed mb-8 uppercase tracking-widest opacity-80">
                        Our hybrid architecture ensures your internal EMIS data matches external LMS environments within milliseconds of any update.
                    </p>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                            <RefreshCw className="text-indigo-500 mb-4" size={24} />
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-1">Queue Health</p>
                            <p className="text-xl font-bold uppercase tracking-tight">Optimal</p>
                        </div>
                        <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                            <Lock className="text-indigo-500 mb-4" size={24} />
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-1">Security</p>
                            <p className="text-xl font-bold uppercase tracking-tight">256-Bit AES</p>
                        </div>
                    </div>
                 </div>
                 
                 <div className="flex flex-col justify-end space-y-6">
                     <div className="space-y-4">
                        {[
                            { label: 'Academic Years Synced', status: 'Complete' },
                            { label: 'Student Rosters Mapping', status: 'Syncing' },
                            { label: 'Assignment Categories', status: 'Pending' }
                        ].map(item => (
                            <div key={item.label} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{item.label}</span>
                                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded ${item.status === 'Complete' ? 'bg-green-500/20 text-green-500' : (item.status === 'Syncing' ? 'bg-blue-500/20 text-blue-500 animate-pulse' : 'bg-gray-500/20 text-gray-500')}`}>
                                    {item.status}
                                </span>
                            </div>
                        ))}
                     </div>
                 </div>
             </div>
             
             <div className="absolute right-0 bottom-0 opacity-10 blur-3xl pointer-events-none">
                 <Globe size={400} className="text-indigo-600" />
             </div>
        </div>
      </div>

      {/* Connection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-100"
            >
                <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-indigo-50/30">
                    <div>
                        <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">Create <span className="text-indigo-600">Bridge</span></h3>
                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1">LMS Connection Protocol</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="p-4 hover:bg-white text-gray-400 rounded-2xl transition-all shadow-sm">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleConnect} className="p-12 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">LMS Provider</label>
                            <select 
                                value={formData.provider}
                                onChange={(e) => setFormData({...formData, provider: e.target.value})}
                                className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-600 font-bold text-gray-900 outline-none transition-all uppercase tracking-wider text-[11px]"
                            >
                                <option value="moodle">Moodle HQ</option>
                                <option value="google_classroom">Google Classroom</option>
                                <option value="canvas">Instructure Canvas</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">System API URL</label>
                            <input 
                                type="url"
                                required
                                value={formData.apiUrl}
                                onChange={(e) => setFormData({...formData, apiUrl: e.target.value})}
                                className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-600 font-bold text-gray-900 transition-all font-mono text-xs"
                                placeholder="https://lms.yourschool.edu/api"
                            />
                        </div>
                        <div className="md:col-span-2">
                             <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Auth Credential (API Key / Client ID)</label>
                             <div className="relative">
                                <Key className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    type="password"
                                    required
                                    value={formData.credential1}
                                    onChange={(e) => setFormData({...formData, credential1: e.target.value})}
                                    className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold text-gray-900 transition-all"
                                    placeholder="••••••••••••••••"
                                />
                             </div>
                        </div>
                        <div className="md:col-span-2">
                             <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Secret / Refresh Token (Optional)</label>
                             <div className="relative">
                                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    type="password"
                                    value={formData.credential2}
                                    onChange={(e) => setFormData({...formData, credential2: e.target.value})}
                                    className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold text-gray-900 transition-all"
                                    placeholder="••••••••••••••••"
                                />
                             </div>
                        </div>
                    </div>

                    <div className="pt-6">
                        <button type="submit" className="w-full bg-gray-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-gray-200 hover:bg-indigo-600 transition-all active:scale-95">
                            Validate & Established Connection
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
      )}
    </div>
  );
};

export default LmsPage;

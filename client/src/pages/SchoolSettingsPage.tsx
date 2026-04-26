import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Settings, Save, Shield, Smartphone, Award, GraduationCap, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import DashboardLayout from '../components/DashboardLayout';
import SchoolLetterhead from '../components/SchoolLetterhead';

const SchoolSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [gradingMode, setGradingMode] = useState('TRADITIONAL');
  const [mpesaPaybill, setMpesaPaybill] = useState('');
  const [gradingScales, setGradingScales] = useState<any[]>([]);
  const [showAddScale, setShowAddScale] = useState(false);
  const [newScale, setNewScale] = useState({
    grade: '',
    minMark: 0,
    maxMark: 100,
    gradePoint: 0,
    remarks: ''
  });
  const [schoolData, setSchoolData] = useState({
    name: '',
    logoUrl: '',
    website: '',
    phoneNumber: '',
    address: '',
    motto: '',
    contactEmail: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchGradingScales();
  }, []);

  const fetchGradingScales = async () => {
    try {
      const res = await api.get('/academics/grading-scales');
      setGradingScales(res.data);
    } catch (error) {
      console.error('Failed to fetch grading scales', error);
    }
  };

  const handleAddScale = async () => {
    try {
      await api.post('/academics/grading-scales', {
        ...newScale,
        type: gradingMode
      });
      toast.success('Grade added');
      setNewScale({ grade: '', minMark: 0, maxMark: 100, gradePoint: 0, remarks: '' });
      setShowAddScale(false);
      fetchGradingScales();
    } catch (error) {
      toast.error('Failed to add grade');
    }
  };

  const handleDeleteScale = async (id: string) => {
    try {
      await api.delete(`/academics/grading-scales/${id}`);
      toast.success('Grade deleted');
      fetchGradingScales();
    } catch (error) {
      toast.error('Failed to delete grade');
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await api.get('/tenants/current');
      setGradingMode(response.data.gradingMode || 'TRADITIONAL');
      setMpesaPaybill(response.data.mpesaPaybill || '');
      setSchoolData({
        name: response.data.name || '',
        logoUrl: response.data.logoUrl || '',
        website: response.data.website || '',
        phoneNumber: response.data.phoneNumber || '',
        address: response.data.address || '',
        motto: response.data.motto || '',
        contactEmail: response.data.contactEmail || ''
      });
    } catch (error) {
      console.error('Failed to fetch school settings', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/tenants/current', {
        ...schoolData,
        gradingMode,
        mpesaPaybill,
      });
      toast.success('Settings updated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  if (!schoolData) {
     return <div className="p-8 text-center bg-red-50 text-red-600 rounded-xl">Failed to load institutional data. Please refresh.</div>
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 px-6 py-8">
      <div className="mb-8">
        <nav className="flex mb-2 text-[10px] font-mono text-gray-400 uppercase tracking-widest">
          <span>System</span>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-bold uppercase tracking-widest">School Settings</span>
        </nav>
        <h1 className="text-3xl font-serif italic text-gray-900 leading-tight">Institutional Configuration</h1>
        <p className="text-gray-500 font-sans mt-2 text-sm">Configure your school's identity, letterhead, and system integrations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Branding & Letterhead */}
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-orange-50 rounded-xl">
                <Settings className="text-orange-600 w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Branding & Letterhead</h2>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">School Official Name</label>
                  <input 
                    id="school-name-input"
                    type="text"
                    value={schoolData.name}
                    onChange={(e) => setSchoolData({...schoolData, name: e.target.value})}
                    placeholder="e.g. Royal Academy of Excellence"
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Logo</label>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                      {schoolData.logoUrl ? (
                        <img src={schoolData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Settings className="text-gray-300 w-6 h-6" />
                      )}
                    </div>
                    <label className="cursor-pointer px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold text-gray-600 transition-colors">
                      Upload Logo
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setSchoolData({ ...schoolData, logoUrl: reader.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">School Slogan / Motto</label>
                  <input 
                    id="school-motto-input"
                    type="text"
                    value={schoolData.motto}
                    onChange={(e) => setSchoolData({...schoolData, motto: e.target.value})}
                    placeholder="e.g. Lead to Serve"
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-gray-900 italic"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Contact Email</label>
                  <input 
                    id="school-email-input"
                    type="email"
                    value={schoolData.contactEmail}
                    onChange={(e) => setSchoolData({...schoolData, contactEmail: e.target.value})}
                    placeholder="info@school.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Phone Number</label>
                  <input 
                    id="school-phone-input"
                    type="tel"
                    value={schoolData.phoneNumber}
                    onChange={(e) => setSchoolData({...schoolData, phoneNumber: e.target.value})}
                    placeholder="+254 700 000 000"
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Physical Address</label>
                <textarea 
                  value={schoolData.address}
                  onChange={(e) => setSchoolData({...schoolData, address: e.target.value})}
                  rows={2}
                  placeholder="e.g. 1st Floor, Academic Tower, Education Street, Nairobi"
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-gray-900 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Website</label>
                <input 
                  type="text"
                  value={schoolData.website}
                  onChange={(e) => setSchoolData({...schoolData, website: e.target.value})}
                  placeholder="www.school.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Letterhead Preview */}
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-100 overflow-hidden relative group">
             <div className="absolute top-4 right-4 text-[10px] font-black uppercase text-gray-300 tracking-widest z-10">Letterhead Preview</div>
             <SchoolLetterhead schoolData={schoolData} variant="full" />
          </div>

          {/* Grading System Selection */}
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-indigo-50 rounded-xl">
                <GraduationCap className="text-indigo-600 w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Grading System Configuration</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={() => setGradingMode('TRADITIONAL')}
                className={`p-6 rounded-2xl border-2 text-left transition-all ${
                  gradingMode === 'TRADITIONAL' 
                  ? 'border-indigo-600 bg-indigo-50/50' 
                  : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                  <Award className="text-indigo-600 w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Traditional Grading</h3>
                <p className="text-xs text-gray-500 font-medium">Percentage-based scoring with numeric grades and averages.</p>
              </button>

              <button 
                onClick={() => setGradingMode('CBE')}
                className={`p-6 rounded-2xl border-2 text-left transition-all ${
                  gradingMode === 'CBE' 
                  ? 'border-brand-green bg-brand-green/5' 
                  : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="w-10 h-10 bg-brand-green/10 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="text-brand-green w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">CBE (Competency Based)</h3>
                <p className="text-xs text-gray-500 font-medium">Level-based assessments focusing on individual competencies and rubrics.</p>
              </button>
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">
                  {gradingMode === 'TRADITIONAL' ? 'Traditional Scaling' : 'CBE Performance Levels'}
                </h3>
                <button 
                  onClick={() => setShowAddScale(true)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center"
                >
                  <Plus size={14} className="mr-1" /> Add Layer
                </button>
              </div>

              {showAddScale && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4 mb-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Grade / Level Name</label>
                      <input 
                        type="text"
                        placeholder="e.g. A or Exceeding"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold"
                        value={newScale.grade}
                        onChange={(e) => setNewScale({...newScale, grade: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Grade Point</label>
                      <input 
                        type="number"
                        step="0.1"
                        placeholder="e.g. 4.0"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold"
                        value={newScale.gradePoint}
                        onChange={(e) => setNewScale({...newScale, gradePoint: Number(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Min Mark (%)</label>
                      <input 
                        type="number"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold"
                        value={newScale.minMark}
                        onChange={(e) => setNewScale({...newScale, minMark: Number(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Max Mark (%)</label>
                      <input 
                        type="number"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold"
                        value={newScale.maxMark}
                        onChange={(e) => setNewScale({...newScale, maxMark: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button onClick={() => setShowAddScale(false)} className="px-4 py-2 text-xs font-bold text-gray-500">Cancel</button>
                    <button onClick={handleAddScale} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold">Save Grade</button>
                  </div>
                </motion.div>
              )}

              <div className="space-y-2">
                {gradingScales.filter(s => s.type === gradingMode).sort((a, b) => b.minMark - a.minMark).map(scale => (
                  <div key={scale.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl group">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center font-bold text-gray-900">
                        {scale.grade}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">{scale.minMark}% - {scale.maxMark}%</p>
                        <p className="text-[10px] text-gray-400 font-medium">GP: {scale.gradePoint}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteScale(scale.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 transition-all font-mono text-[10px] flex items-center"
                    >
                      <Trash2 size={14} className="mr-1" /> REMOVE
                    </button>
                  </div>
                ))}
                {gradingScales.filter(s => s.type === gradingMode).length === 0 && (
                  <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No grading layers defined for this mode</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* M-Pesa Integration */}
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-brand-green/10 rounded-xl">
                <Smartphone className="text-brand-green w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">M-Pesa Reconciliation</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">School Paybill Number</label>
                <input 
                  type="text"
                  value={mpesaPaybill}
                  onChange={(e) => setMpesaPaybill(e.target.value)}
                  placeholder="e.g. 123456"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-green font-bold text-gray-900"
                />
                <p className="mt-2 text-[11px] text-gray-400 font-medium">Use this Paybill for student fee payments. System will automatically reconcile payments using Admission Number as Account Number.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-brand-green text-brand-sand rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-brand-green/10 hover:bg-brand-green/90 transition-all active:scale-95 flex items-center"
            >
              <Save size={18} className="mr-2" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-brand-green rounded-2xl p-6 text-brand-sand">
            <h3 className="font-black uppercase tracking-tight text-lg mb-3 leading-tight">Helpful Tip</h3>
            <p className="text-xs font-medium opacity-80 leading-relaxed">
              Switching between Traditional and CBE affects the grading UI for all teachers. Make sure you have configured your academic year before making this change.
            </p>
          </div>
          
          <div className="bg-gray-100 rounded-2xl p-6 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-2 border-b border-gray-200 pb-2">Why Auto-Reconcile?</h3>
            <ul className="space-y-3">
              <li className="text-[11px] font-medium text-gray-600 flex items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-green mt-1 mr-2 shrink-0" />
                Eliminate manual entry of receipts.
              </li>
              <li className="text-[11px] font-medium text-gray-600 flex items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-green mt-1 mr-2 shrink-0" />
                Instant confirmation for parents on payment.
              </li>
              <li className="text-[11px] font-medium text-gray-600 flex items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-green mt-1 mr-2 shrink-0" />
                Accurate fee statements for all students.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolSettingsPage;

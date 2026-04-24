import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Settings, Save, Shield, Smartphone, Award, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import DashboardLayout from '../components/DashboardLayout';
import SchoolLetterhead from '../components/SchoolLetterhead';

const SchoolSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [gradingMode, setGradingMode] = useState('TRADITIONAL');
  const [mpesaPaybill, setMpesaPaybill] = useState('');
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
  }, []);

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
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
    </div>;
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">School Settings</h1>
        <p className="text-gray-500 font-medium">Configure your school's identity, letterhead, and system integrations.</p>
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
                    type="text"
                    value={schoolData.name}
                    onChange={(e) => setSchoolData({...schoolData, name: e.target.value})}
                    placeholder="e.g. Royal Academy of Excellence"
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Logo URL</label>
                  <input 
                    type="text"
                    value={schoolData.logoUrl}
                    onChange={(e) => setSchoolData({...schoolData, logoUrl: e.target.value})}
                    placeholder="https:// school.com/logo.png"
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">School Slogan / Motto</label>
                  <input 
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
                    type="email"
                    value={schoolData.contactEmail}
                    onChange={(e) => setSchoolData({...schoolData, contactEmail: e.target.value})}
                    placeholder="admissions@school.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Phone Number</label>
                  <input 
                    type="text"
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
  </DashboardLayout>
  );
};

export default SchoolSettingsPage;

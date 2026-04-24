import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { motion } from 'framer-motion';
import { Camera, Upload, X, Check, User } from 'lucide-react';
import { toast } from 'sonner';

interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  employeeId: string;
  photoUrl?: string;
}

const StaffManagementPage: React.FC = () => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'Teacher',
    employeeId: '',
    photoUrl: '',
  });

  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Error accessing camera: ", err);
      toast.error("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setFormData(prev => ({ ...prev, photoUrl: dataUrl }));
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await api.get('/staff');
      setStaffList(response.data);
    } catch (error) {
      console.error('Failed to fetch staff', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/staff', formData);
      setIsAdding(false);
      setFormData({ firstName: '', lastName: '', email: '', role: 'Teacher', employeeId: '', photoUrl: '' });
      fetchStaff();
      toast.success('Staff added successfully');
    } catch (error) {
      console.error('Failed to add staff', error);
      toast.error('Failed to add staff');
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-5xl font-black text-gray-900 uppercase tracking-tighter">Human Resources</h1>
            <p className="text-gray-400 font-mono text-sm mt-2">Total Personnel: {staffList.length}</p>
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="bg-black text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-gray-800 transition-all"
          >
            {isAdding ? 'Cancel' : 'Register New Staff'}
          </button>
        </header>

        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-50 p-8 rounded-3xl border-2 border-black mb-12"
          >
            <div className="flex flex-col md:flex-row gap-8 mb-8">
               <div className="relative group shrink-0">
                <div className="w-48 h-48 rounded-2xl bg-white border-2 border-gray-200 flex flex-col items-center justify-center text-gray-400 overflow-hidden relative">
                  {formData.photoUrl ? (
                    <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : isCameraActive ? (
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <Camera className="w-8 h-8 mb-2 mx-auto" />
                      <span className="text-[10px] font-bold uppercase tracking-wider block">Staff Portrait</span>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2 mt-4 justify-center">
                  {!isCameraActive ? (
                    <button 
                      type="button"
                      onClick={startCamera}
                      className="px-4 py-2 bg-blue-600 text-white text-[10px] font-bold rounded-xl hover:bg-blue-700 uppercase tracking-widest transition-all"
                    >
                      Capture
                    </button>
                  ) : (
                    <button 
                      type="button"
                      onClick={capturePhoto}
                      className="px-4 py-2 bg-green-600 text-white text-[10px] font-bold rounded-xl hover:bg-green-700 uppercase tracking-widest transition-all"
                    >
                      Snap
                    </button>
                  )}
                  <label className="px-4 py-2 bg-black text-white text-[10px] font-bold rounded-xl hover:bg-gray-800 uppercase tracking-widest cursor-pointer transition-all">
                    Upload
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                  </label>
                  {isCameraActive && (
                    <button 
                      type="button"
                      onClick={stopCamera}
                      className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 content-start">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">First Name</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-black outline-none transition-all"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Last Name</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-black outline-none transition-all"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Email Address</label>
                  <input
                    type="email"
                    required
                    className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-black outline-none transition-all"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Role</label>
                  <select
                    className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-black outline-none transition-all"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option>Teacher</option>
                    <option>Admin</option>
                    <option>Accountant</option>
                    <option>Librarian</option>
                    <option>Principal</option>
                    <option>Security</option>
                    <option>Maintenance</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Employee ID</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-black outline-none transition-all"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  />
                </div>
                <div className="flex items-end">
                  <button type="submit" className="w-full bg-black text-white py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-gray-200 hover:scale-[1.02] active:scale-95 transition-all">
                    Register Staff Member
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {staffList.map((staff) => (
            <div key={staff.id} className="group border-2 border-gray-100 p-6 rounded-3xl hover:border-black transition-all cursor-pointer bg-white">
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center font-bold text-gray-300 group-hover:bg-black group-hover:text-white transition-all overflow-hidden border border-gray-100">
                  {staff.photoUrl ? (
                    <img src={staff.photoUrl} alt={staff.firstName} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8" />
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full text-gray-500">
                    {staff.role}
                  </span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{staff.firstName} {staff.lastName}</h3>
              <p className="text-gray-400 text-[11px] font-medium mb-6 uppercase tracking-wider">{staff.email}</p>
              
              <div className="pt-4 border-t border-dashed border-gray-100 flex justify-between items-center">
                <div>
                  <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">Staff ID</p>
                  <p className="text-xs font-bold text-gray-900">{staff.employeeId}</p>
                </div>
                <button className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white transition-all">
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StaffManagementPage;

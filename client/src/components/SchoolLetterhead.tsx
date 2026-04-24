import React from 'react';
import { GraduationCap, Mail, Phone, Globe, MapPin } from 'lucide-react';

interface SchoolLetterheadProps {
  schoolData: {
    name: string;
    logoUrl?: string;
    website?: string;
    phoneNumber?: string;
    address?: string;
    motto?: string;
    contactEmail?: string;
  };
  variant?: 'compact' | 'full';
}

const SchoolLetterhead: React.FC<SchoolLetterheadProps> = ({ schoolData, variant = 'full' }) => {
  return (
    <div className={`w-full bg-white transition-all duration-300 ${variant === 'full' ? 'p-8 border-b-2 border-brand-green/20' : 'p-4'}`}>
      <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
          {schoolData.logoUrl ? (
            <div className="relative group">
              <div className="absolute -inset-2 bg-brand-green/5 blur-xl group-hover:bg-brand-green/10 transition-colors rounded-full" />
              <img 
                src={schoolData.logoUrl} 
                alt="School Logo" 
                className="relative w-24 h-24 object-contain rounded-2xl bg-white shadow-xl shadow-brand-green/5 border border-gray-100" 
              />
            </div>
          ) : (
            <div className="w-24 h-24 bg-brand-green/5 rounded-2xl flex items-center justify-center border border-brand-green/10 shadow-inner">
               <GraduationCap className="text-brand-green/40" size={40} />
            </div>
          )}
          
          <div className="flex flex-col">
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter uppercase italic leading-none mb-2">
              {schoolData.name || 'Your Institution Name'}
            </h1>
            {schoolData.motto && (
              <p className="text-xs font-black text-brand-green uppercase tracking-[0.2em] italic mb-4">
                {schoolData.motto}
              </p>
            )}
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {schoolData.address && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                  <MapPin size={10} className="text-brand-green" />
                  <span>{schoolData.address}</span>
                </div>
              )}
              {schoolData.phoneNumber && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                  <Phone size={10} className="text-brand-green" />
                  <span>{schoolData.phoneNumber}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center md:items-end gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">
          {schoolData.contactEmail && (
            <div className="flex items-center gap-2 group cursor-pointer hover:text-brand-green transition-colors">
              <Mail size={12} className="text-gray-300 group-hover:text-brand-green transition-colors" />
              <span>{schoolData.contactEmail}</span>
            </div>
          )}
          {schoolData.website && (
            <div className="flex items-center gap-2 group cursor-pointer hover:text-brand-green transition-colors">
              <Globe size={12} className="text-gray-300 group-hover:text-brand-green transition-colors" />
              <span>{schoolData.website}</span>
            </div>
          )}
        </div>
      </div>
      
      {variant === 'full' && (
        <div className="mt-8 flex items-center gap-4">
          <div className="h-[2px] flex-1 bg-gradient-to-r from-brand-green/20 via-brand-green/10 to-transparent rounded-full" />
          <div className="w-2 h-2 rounded-full bg-brand-green/20 shadow-sm" />
          <div className="h-[2px] flex-1 bg-gradient-to-l from-brand-green/20 via-brand-green/10 to-transparent rounded-full" />
        </div>
      )}
    </div>
  );
};

export default SchoolLetterhead;

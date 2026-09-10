import React, { useState, useEffect, useRef } from 'react';
import type { Student, Staff, SchoolInfo } from '../../types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import Spinner from './Spinner';

interface IDCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: { type: 'student' | 'staff', data: Student | Staff } | null;
    schoolInfo: SchoolInfo;
}

const DEFAULT_AVATAR = 'https://i.imgur.com/S5o7W44.png';

const Barcode: React.FC = () => {
    const bars = [4, 2, 3, 2, 4, 1, 3, 1, 2, 4, 2, 3, 1, 4, 2, 3, 2, 4, 1, 3, 1, 2, 4, 2, 3, 1, 2, 4, 3, 2, 1, 3, 4, 1, 2];
    return (
        <div className="h-10 flex items-end justify-center space-x-0.5 w-full overflow-hidden opacity-80">
            {bars.map((width, i) => (
                <div key={i} className="bg-slate-900" style={{ width: `${width}px`, height: `${Math.random() * 60 + 40}%` }}></div>
            ))}
        </div>
    );
};

const IDCardFront: React.FC<{ person: Student | Staff, isStudent: boolean, schoolInfo: SchoolInfo }> = ({ person, isStudent, schoolInfo }) => {
    const [imgSrc, setImgSrc] = useState(DEFAULT_AVATAR);
    
    useEffect(() => {
        const source = isStudent 
            ? (person as Student).profileImage 
            : (person as Staff).photoUrl;
        
        if (source && source !== 'undefined' && source !== 'null') {
            setImgSrc(source);
        } else {
            setImgSrc(DEFAULT_AVATAR);
        }
    }, [person, isStudent]);

    const student = person as Student;
    const staff = person as Staff;
    const staffDisplayId = !isStudent ? `STF-${staff.id.substring(0, 6).toUpperCase()}` : '';

    return (
        <div className="w-[540px] h-[340px] bg-white rounded-xl shadow-2xl flex font-sans overflow-hidden relative border border-slate-200 id-card-content">
            <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-900 to-transparent pointer-events-none" />
            <div className="w-2/5 bg-slate-100 flex flex-col items-center justify-center p-6 relative border-r border-slate-200">
                 <div className="absolute top-0 left-0 w-full h-4 bg-primary-600" />
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-200 mb-4 z-10">
                    <img 
                        src={imgSrc} 
                        alt="profile" 
                        onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
                        className="w-full h-full object-cover" 
                        crossOrigin="anonymous"
                    />
                </div>
                <div className="text-center z-10">
                     <span className={`px-3 py-1 text-xs font-bold text-white rounded-full uppercase tracking-wide ${isStudent ? 'bg-primary-600' : 'bg-slate-700'}`}>
                        {isStudent ? 'Student' : 'Staff Member'}
                    </span>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-12 bg-primary-800" style={{ clipPath: 'polygon(0 100%, 100% 100%, 0 0)' }}></div>
            </div>
            <div className="w-3/5 p-6 flex flex-col relative">
                <div className="flex items-center space-x-3 border-b pb-3 mb-3">
                    {schoolInfo.logoUrl && (
                        <img src={schoolInfo.logoUrl} className="h-10 w-10 object-contain" alt="School Logo" onError={(e) => (e.currentTarget.style.display = 'none')} crossOrigin="anonymous"/>
                    )}
                    <div className="overflow-hidden">
                        <h2 className="font-bold text-lg text-primary-900 leading-tight uppercase truncate">{schoolInfo.name}</h2>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Official Identity Card</p>
                    </div>
                </div>
                <div className="flex-grow space-y-3">
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Full Name</p>
                        <p className="font-bold text-slate-800 text-lg leading-none truncate">{person.name}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">{isStudent ? 'Admission No.' : 'Staff ID'}</p>
                            <p className="font-semibold text-slate-700 font-mono">{isStudent ? student.admissionNumber : staffDisplayId}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">{isStudent ? 'Class / Grade' : 'Position'}</p>
                            <p className="font-semibold text-slate-700">{isStudent ? student.class : staff.role}</p>
                        </div>
                    </div>
                    <div>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">{isStudent ? 'Emergency Contact' : 'Date Joined'}</p>
                         <p className="font-semibold text-slate-700">{isStudent ? student.emergencyContact : staff.joinDate}</p>
                    </div>
                </div>
                <div className="mt-2 pt-2">
                    <Barcode />
                    <p className="text-center text-[8px] text-slate-400 mt-1">{isStudent ? student.id : staff.id}</p>
                </div>
            </div>
        </div>
    );
};

const IDCardBack: React.FC<{ schoolInfo: SchoolInfo }> = ({ schoolInfo }) => {
    return (
        <div className="w-[540px] h-[340px] bg-slate-50 rounded-xl shadow-2xl p-8 flex flex-col font-sans overflow-hidden relative border border-slate-200 id-card-content">
            <h3 className="font-bold text-slate-800 tracking-wider border-b-2 border-primary-600 pb-2 mb-4 inline-block w-full">TERMS & CONDITIONS</h3>
            <div className="text-xs text-slate-600 space-y-2 flex-grow list-decimal pl-4">
                <p>1. This card is the property of <strong>{schoolInfo.name}</strong>.</p>
                <p>2. It must be worn/carried at all times while on school premises.</p>
                <p>3. If lost or found, please return to the school administration office immediately.</p>
                <p>4. <strong>Address:</strong> {schoolInfo.address}</p>
                <p>5. <strong>Phone:</strong> {schoolInfo.phone}</p>
                <p>6. <strong>Email:</strong> {schoolInfo.email}</p>
            </div>
            <div className="mt-auto">
                 <div className="flex justify-between items-end">
                    <div className="text-center">
                        <div className="w-32 h-10 border-b border-slate-400 mb-1"></div>
                        <p className="text-[10px] text-slate-500 uppercase">Authorized Signature</p>
                    </div>
                    <div className="text-center">
                        <div className="w-32 h-10 border-b border-slate-400 mb-1"></div>
                        <p className="text-[10px] text-slate-500 uppercase">Holder's Signature</p>
                    </div>
                 </div>
            </div>
             <div className="absolute bottom-0 left-0 w-full h-3 bg-primary-600" />
        </div>
    );
};

const IDCardModal: React.FC<IDCardModalProps> = ({ isOpen, onClose, data, schoolInfo }) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const exportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) setIsFlipped(false);
    }, [isOpen]);

    if (!isOpen || !data) return null;

    const isStudent = data.type === 'student';
    const person = data.data;

    const handleDownloadPdf = async () => {
        if (!exportRef.current) return;
        setIsGeneratingPdf(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            const frontElement = exportRef.current.querySelector('.export-front') as HTMLElement;
            const backElement = exportRef.current.querySelector('.export-back') as HTMLElement;
            if (!frontElement || !backElement) throw new Error("Export elements not found");

            const frontCanvas = await html2canvas(frontElement, { scale: 2, useCORS: true, backgroundColor: null, logging: false });
            const backCanvas = await html2canvas(backElement, { scale: 2, useCORS: true, backgroundColor: null, logging: false });
            const frontImg = frontCanvas.toDataURL('image/png');
            const backImg = backCanvas.toDataURL('image/png');

            const pdf = new jsPDF('p', 'mm', 'a4');
            const cardWidth = 85.6;
            const cardHeight = 54;
            const startX = (210 - cardWidth) / 2;

            pdf.text(`Identity Card: ${person.name}`, 105, 20, { align: 'center' });
            
            pdf.addImage(frontImg, 'PNG', startX, 40, cardWidth, cardHeight);
            pdf.setFontSize(10);
            pdf.text("Front", 105, 40 + cardHeight + 5, { align: 'center' });
            
            pdf.addImage(backImg, 'PNG', startX, 40 + cardHeight + 20, cardWidth, cardHeight);
            pdf.text("Back", 105, 40 + cardHeight + 20 + cardHeight + 5, { align: 'center' });

            pdf.save(`${person.name.replace(/\s+/g, '_')}_ID_Card.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
            <style>{`
                .preserve-3d { transform-style: preserve-3d; }
                .perspective { perspective: 1000px; }
                .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }
                @media print {
                    body * { visibility: hidden; }
                    .printable-card-area, .printable-card-area * { visibility: visible; }
                    .printable-card-area { 
                        position: absolute; left: 0; top: 0; width: 100%; height: 100%;
                        display: flex; flex-direction: column; align-items: center; background: white;
                    }
                    .card-container { transform: none !important; }
                    .card-front, .card-back {
                        position: relative !important; transform: none !important; backface-visibility: visible !important;
                        margin-bottom: 20px; page-break-inside: avoid; box-shadow: none !important; border: 1px solid #ccc !important;
                    }
                    .no-print { display: none !important; }
                }
            `}</style>
            <div className="relative">
                <button onClick={onClose} className="absolute -top-12 right-0 text-white hover:text-slate-200 transition-colors no-print flex items-center">
                    <span className="mr-2">Close</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <div className="perspective printable-card-area">
                     <div className={`relative w-[540px] h-[340px] transition-transform duration-700 preserve-3d card-container ${isFlipped ? 'rotate-y-180' : ''}`}>
                        <div className="absolute w-full h-full backface-hidden card-front">
                            <IDCardFront person={person} isStudent={isStudent} schoolInfo={schoolInfo} />
                        </div>
                        <div className="absolute w-full h-full backface-hidden rotate-y-180 card-back">
                             <IDCardBack schoolInfo={schoolInfo} />
                        </div>
                    </div>
                </div>
                <div className="mt-8 flex justify-center space-x-6 no-print">
                    <button onClick={() => setIsFlipped(!isFlipped)} className="px-6 py-2.5 bg-white text-slate-800 font-bold rounded-full shadow-lg hover:bg-slate-100 hover:scale-105 transition-all flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        Flip Card
                    </button>
                    <button onClick={handleDownloadPdf} disabled={isGeneratingPdf} className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-full shadow-lg hover:bg-green-500 hover:scale-105 transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed">
                         {isGeneratingPdf ? <Spinner /> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
                        {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
                    </button>
                     <button onClick={() => window.print()} className="px-6 py-2.5 bg-primary-600 text-white font-bold rounded-full shadow-lg hover:bg-primary-500 hover:scale-105 transition-all flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm7-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        Print
                    </button>
                </div>
            </div>
            <div ref={exportRef} className="fixed top-0 left-0 w-[540px] z-[-1] invisible pointer-events-none" style={{ visibility: 'hidden', position: 'absolute', top: '-10000px' }}>
                <div className="export-front mb-4">
                     <IDCardFront person={person} isStudent={isStudent} schoolInfo={schoolInfo} />
                </div>
                <div className="export-back">
                     <IDCardBack schoolInfo={schoolInfo} />
                </div>
            </div>
        </div>
    );
};

export default IDCardModal;
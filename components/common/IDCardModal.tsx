

import React, { useState } from 'react';
import type { Student, Staff, SchoolInfo } from '../../types';

interface IDCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: { type: 'student' | 'staff', data: Student | Staff } | null;
    schoolInfo: SchoolInfo;
}

const Barcode: React.FC = () => {
    const bars = [4, 2, 3, 2, 4, 1, 3, 1, 2, 4, 2, 3, 1, 4, 2, 3, 2, 4, 1, 3, 1, 2, 4, 2, 3, 1, 4, 2, 3, 2, 4, 1, 3, 1, 2, 4, 2, 3, 1, 2, 4, 3, 2, 1, 3, 4, 1, 2];
    return (
        <div className="h-8 flex items-end space-x-px w-full">
            {bars.map((width, i) => (
                <div key={i} className="bg-primary-700" style={{ width: `${width}px`, height: `${Math.random() * 80 + 20}%` }}></div>
            ))}
        </div>
    );
};

const IDCardFront: React.FC<{ person: Student | Staff, isStudent: boolean, schoolInfo: SchoolInfo }> = ({ person, isStudent, schoolInfo }) => {
    const photoUrl = isStudent ? (person as Student).profileImage : (person as Staff).photoUrl;

    const student = person as Student;
    const staff = person as Staff;

    return (
        <div className="w-[540px] h-[340px] bg-white rounded-lg shadow-2xl flex font-sans overflow-hidden relative border border-slate-200">
            {/* Left Part */}
            <div className="w-1/3 bg-slate-50 flex flex-col items-center justify-center p-6 space-y-4 relative">
                 <div className="absolute top-0 left-0 h-full w-2 bg-primary-500" />
                <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-white shadow-md">
                    <img src={photoUrl} alt="profile" className="w-full h-full object-cover" />
                </div>
            </div>

            {/* Right Part */}
            <div className="w-2/3 p-6 flex flex-col relative">
                <div className="text-right">
                    <h2 className="font-bold text-2xl text-primary-800 tracking-wider">{schoolInfo.name.toUpperCase()}</h2>
                    <p className="font-semibold text-slate-500 text-sm">{isStudent ? 'STUDENT IDENTITY CARD' : 'STAFF IDENTITY CARD'}</p>
                </div>

                <div className="flex-grow mt-6 space-y-3 text-slate-800">
                    <div>
                        <p className="text-xs text-slate-500 font-medium tracking-wider">NAME</p>
                        <p className="font-bold text-xl">{person.name}</p>
                    </div>
                    <div className="flex space-x-6">
                        <div>
                            <p className="text-xs text-slate-500 font-medium tracking-wider">{isStudent ? 'ADMISSION NO.' : 'STAFF ID'}</p>
                            <p className="font-semibold">{isStudent ? student.admissionNumber : staff.id}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium tracking-wider">{isStudent ? 'CLASS' : 'ROLE'}</p>
                            <p className="font-semibold">{isStudent ? student.class : staff.role}</p>
                        </div>
                    </div>
                     <div>
                        <p className="text-xs text-slate-500 font-medium tracking-wider">{isStudent ? 'GUARDIAN CONTACT' : 'JOIN DATE'}</p>
                        <p className="font-semibold">{isStudent ? student.guardianContact : staff.joinDate}</p>
                    </div>
                </div>
                
                <Barcode />
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 h-4 w-2/3 bg-slate-800" />
            <div className="absolute bottom-0 right-0 h-16 w-1/2 bg-slate-800" style={{ clipPath: 'polygon(25% 0, 100% 0, 100% 100%, 0% 100%)' }} />
            <div className="absolute bottom-0 right-0 h-14 w-1/2 bg-primary-600" style={{ clipPath: 'polygon(30% 0, 100% 0, 100% 100%, 0% 100%)' }} />
        </div>
    );
};

const IDCardBack: React.FC<{ schoolInfo: SchoolInfo }> = ({ schoolInfo }) => {
    return (
        <div className="w-[540px] h-[340px] bg-white rounded-lg shadow-2xl p-6 flex flex-col font-sans overflow-hidden relative border border-slate-200">
            <h3 className="font-bold text-xl text-slate-800 tracking-wider">TERMS & CONDITIONS</h3>
            <div className="text-xs text-slate-600 mt-3 space-y-1.5 flex-grow">
                <p>1. This card is the property of {schoolInfo.name} and must be surrendered upon request.</p>
                <p>2. The card is not transferable and must be carried by the cardholder at all times within school premises.</p>
                <p>3. Any loss or damage to this card must be reported to the school administration immediately. A replacement fee will apply.</p>
                <p>4. Unauthorized use or duplication of this card is strictly prohibited and may result in disciplinary action.</p>
                <p>5. If found, please return this card to the school reception at {schoolInfo.address}.</p>
            </div>
            <div className="mt-4 pt-8 border-t-2 border-dashed relative">
                <p className="text-xs text-slate-500 absolute -top-2.5 right-0 bg-white px-2">Cardholder's Signature</p>
            </div>
            {/* Decorative Elements */}
             <div className="absolute bottom-0 left-0 h-full w-4 bg-slate-800" />
             <div className="absolute bottom-0 right-0 h-16 w-1/2 bg-slate-800" style={{ clipPath: 'polygon(25% 0, 100% 0, 100% 100%, 0% 100%)' }}>
                 <div className="absolute bottom-3 right-4 flex items-center space-x-2">
                     {schoolInfo.logoUrl && <img src={schoolInfo.logoUrl} alt="logo" className="h-8 w-8 rounded-full" />}
                 </div>
            </div>
            <div className="absolute bottom-0 right-0 h-14 w-1/2 bg-primary-600" style={{ clipPath: 'polygon(30% 0, 100% 0, 100% 100%, 0% 100%)' }} />
        </div>
    );
};


const IDCardModal: React.FC<IDCardModalProps> = ({ isOpen, onClose, data, schoolInfo }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    if (!isOpen || !data) return null;

    const isStudent = data.type === 'student';
    const person = data.data;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <style>{`
                .preserve-3d { transform-style: preserve-3d; }
                .perspective { perspective: 1000px; }
                .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }

                @media print {
                    body * { visibility: hidden; }
                    .printable-card-area, .printable-card-area * { visibility: visible; }
                    .printable-card-area { 
                        position: absolute; 
                        left: 0; 
                        top: 0;
                        width: 100%;
                        display: flex;
                        flex-direction: column;
                        gap: 2rem;
                        justify-content: center;
                        align-items: center;
                    }
                    .no-print { display: none !important; }
                    .card-container {
                        transform: none !important;
                    }
                    .card-front, .card-back {
                        position: static !important;
                        transform: none !important;
                        backface-visibility: visible !important;
                        display: block !important;
                        box-shadow: none !important;
                        border: 1px solid #ccc !important;
                    }
                }
            `}</style>
            <div className="bg-white rounded-lg shadow-xl p-6 relative max-w-xl w-full no-print">
                 <button onClick={onClose} className="absolute top-2 right-2 text-slate-500 hover:text-slate-800 transition-colors p-1 rounded-full hover:bg-slate-100 no-print">
                    {/* Fix: Corrected invalid SVG viewBox attribute from "0_0_24_24" to "0 0 24 24". */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                
                <div className="perspective printable-card-area">
                     <div 
                        className={`relative w-[540px] h-[340px] transition-transform duration-700 preserve-3d card-container mx-auto ${isFlipped ? 'rotate-y-180' : ''}`}
                     >
                        <div className="absolute w-full h-full backface-hidden card-front">
                            <IDCardFront person={person} isStudent={isStudent} schoolInfo={schoolInfo} />
                        </div>
                        <div className="absolute w-full h-full backface-hidden rotate-y-180 card-back">
                             <IDCardBack schoolInfo={schoolInfo} />
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-center space-x-4 no-print">
                    <button onClick={() => setIsFlipped(!isFlipped)} className="px-6 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg shadow-md hover:bg-slate-300">Flip Card</button>
                    <button onClick={() => window.print()} className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700">Print ID Card</button>
                </div>
            </div>
        </div>
    );
};

export default IDCardModal;
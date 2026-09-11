import React, { useState, useEffect } from 'react';
import type { Student, Staff, SchoolInfo } from '../../types';
import { 
    CARD_THEMES, 
    generateInitialsAvatar, 
    generateBarcodeSVG, 
    generateStudentQRCode,
    FALLBACK_SCHOOL_INFO,
    CardTheme 
} from '../../utils/idCardGenerator';
import { ShieldCheck, Phone, Mail, MapPin, Award } from 'lucide-react';

interface IDCardProps {
    person: Student | Staff;
    isStudent: boolean;
    schoolInfo?: SchoolInfo | null;
    theme?: CardTheme;
    academicYear?: string;
    scale?: number;
    showCutGuides?: boolean;
}

/**
 * Standard ID Card Front Face (540px x 340px)
 */
export const IDCardFrontView: React.FC<IDCardProps> = ({
    person,
    isStudent,
    schoolInfo,
    theme = CARD_THEMES.navy,
    academicYear = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
    scale = 1,
    showCutGuides = false,
}) => {
    const safeSchoolInfo = schoolInfo || FALLBACK_SCHOOL_INFO;
    const student = isStudent ? (person as Student) : null;
    const staff = !isStudent ? (person as Staff) : null;

    const [photoSrc, setPhotoSrc] = useState<string>(() => {
        const url = isStudent ? student?.profileImage : staff?.photoUrl;
        if (url && url !== 'undefined' && url !== 'null' && url.trim() !== '') {
            return url;
        }
        return generateInitialsAvatar(person.name, theme.primaryHex);
    });

    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

    // Generate authentic QR code
    useEffect(() => {
        let isMounted = true;
        generateStudentQRCode(person, isStudent, safeSchoolInfo).then((url) => {
            if (isMounted && url) {
                setQrCodeUrl(url);
            }
        });
        return () => {
            isMounted = false;
        };
    }, [person, isStudent, safeSchoolInfo]);

    // Handle photo change or fallback
    useEffect(() => {
        const rawUrl = isStudent ? student?.profileImage : staff?.photoUrl;
        if (rawUrl && rawUrl !== 'undefined' && rawUrl !== 'null' && rawUrl.trim() !== '') {
            setPhotoSrc(rawUrl);
        } else {
            setPhotoSrc(generateInitialsAvatar(person.name, theme.primaryHex));
        }
    }, [person, isStudent, student?.profileImage, staff?.photoUrl, theme.primaryHex]);

    const admissionNumber = student?.admissionNumber || 'ADM-PENDING';
    const className = student?.class || 'Standard Grade';
    const staffId = staff ? `STF-${staff.id.substring(0, 6).toUpperCase()}` : '';
    const barcodeSvg = generateBarcodeSVG(isStudent ? admissionNumber : staffId, 240, 36);

    return (
        <div
            className={`w-[540px] h-[340px] bg-white rounded-2xl shadow-xl flex flex-col font-sans overflow-hidden relative border border-slate-200 select-none ${
                showCutGuides ? 'border-dashed border-slate-400' : ''
            }`}
            style={{
                transform: scale !== 1 ? `scale(${scale})` : undefined,
                transformOrigin: 'top left',
            }}
        >
            {/* Top Brand Header Ribbon */}
            <div 
                className="h-16 px-5 flex items-center justify-between relative text-white"
                style={{
                    background: `linear-gradient(135deg, ${theme.primaryHex} 0%, ${theme.secondaryHex} 100%)`,
                }}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    {safeSchoolInfo.logoUrl ? (
                        <div className="w-10 h-10 rounded-lg bg-white p-1 shadow-sm flex items-center justify-center shrink-0">
                            <img
                                src={safeSchoolInfo.logoUrl}
                                alt="Logo"
                                className="w-full h-full object-contain"
                                crossOrigin="anonymous"
                                onError={(e) => {
                                    (e.currentTarget as HTMLElement).style.display = 'none';
                                }}
                            />
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/30">
                            <Award className="w-6 h-6 text-white" />
                        </div>
                    )}
                    <div className="min-w-0">
                        <h2 className="font-extrabold text-sm uppercase tracking-wide truncate leading-tight">
                            {safeSchoolInfo.name}
                        </h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] uppercase tracking-widest font-semibold opacity-90 text-blue-100">
                                {isStudent ? 'Scholar Identity Card' : 'Faculty Identity Card'}
                            </span>
                            <span className="text-[8px] bg-white/20 px-1.5 py-0.2 rounded font-mono">
                                {safeSchoolInfo.schoolCode || 'SCH'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="text-right shrink-0">
                    <span className="inline-block px-2.5 py-1 text-[10px] font-black rounded-full bg-white/20 text-white uppercase tracking-wider backdrop-blur-xs border border-white/25">
                        {academicYear}
                    </span>
                </div>

                {/* Micro accent line */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-400 opacity-90" />
            </div>

            {/* Main Content Area: Left Profile + Right Details */}
            <div className="flex-1 p-5 flex gap-5 bg-gradient-to-br from-slate-50 via-white to-slate-50/50">
                {/* Left Column: Photo & Role Badge */}
                <div className="w-36 flex flex-col items-center justify-between shrink-0">
                    <div className="w-32 h-36 rounded-xl overflow-hidden border-2 border-slate-300 shadow-md bg-slate-100 relative group">
                        <img
                            src={photoSrc}
                            alt={person.name}
                            className="w-full h-full object-cover"
                            crossOrigin="anonymous"
                            onError={() => {
                                setPhotoSrc(generateInitialsAvatar(person.name, theme.primaryHex));
                            }}
                        />
                        <div className="absolute bottom-1 right-1 bg-emerald-500 text-white p-0.5 rounded-full shadow-xs" title="Verified Active">
                            <ShieldCheck className="w-3.5 h-3.5" />
                        </div>
                    </div>

                    <div className="w-full text-center mt-2">
                        <span className={`inline-block w-full py-1 text-[10px] font-black text-white rounded-md uppercase tracking-wider ${theme.badgeBg}`}>
                            {isStudent ? 'STUDENT' : (staff?.role || 'STAFF')}
                        </span>
                        <span className="block text-[8px] text-slate-400 font-semibold uppercase mt-0.5">
                            Status: Active
                        </span>
                    </div>
                </div>

                {/* Right Column: Student Data Grid */}
                <div className="flex-1 flex flex-col justify-between overflow-hidden">
                    {/* Student Name */}
                    <div>
                        <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 block mb-0.5">
                            Full Legal Name
                        </span>
                        <h3 className="font-black text-slate-900 text-base leading-tight tracking-tight uppercase truncate">
                            {person.name}
                        </h3>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-2.5 py-1">
                        <div className="bg-slate-100/80 rounded-lg p-2 border border-slate-200/60">
                            <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">
                                {isStudent ? 'Admission No.' : 'Staff ID'}
                            </span>
                            <span className="font-mono font-black text-xs text-slate-800">
                                {isStudent ? admissionNumber : staffId}
                            </span>
                        </div>

                        <div className="bg-slate-100/80 rounded-lg p-2 border border-slate-200/60">
                            <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">
                                {isStudent ? 'Class / Grade' : 'Department'}
                            </span>
                            <span className="font-bold text-xs text-slate-800 truncate block">
                                {isStudent ? className : (staff?.role || 'Academics')}
                            </span>
                        </div>

                        <div className="bg-slate-100/80 rounded-lg p-2 border border-slate-200/60">
                            <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">
                                {isStudent ? 'Emergency Phone' : 'Join Date'}
                            </span>
                            <span className="font-semibold text-[11px] text-slate-800 truncate block">
                                {isStudent ? (student?.emergencyContact || student?.guardianContact || 'N/A') : (staff?.joinDate || 'N/A')}
                            </span>
                        </div>

                        <div className="bg-slate-100/80 rounded-lg p-2 border border-slate-200/60">
                            <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">
                                Validity
                            </span>
                            <span className="font-semibold text-[11px] text-emerald-700">
                                Valid 2026/27
                            </span>
                        </div>
                    </div>

                    {/* Bottom Bar: Deterministic Barcode & QR Code */}
                    <div className="pt-1 border-t border-slate-200 flex items-center justify-between gap-3">
                        <div className="flex-1 overflow-hidden">
                            <div 
                                className="w-full h-8 flex items-center" 
                                dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                            />
                            <p className="text-[8px] font-mono text-slate-500 font-semibold tracking-wider text-center">
                                *{isStudent ? admissionNumber : staffId}*
                            </p>
                        </div>

                        {qrCodeUrl && (
                            <div className="w-12 h-12 rounded-md bg-white p-0.5 border border-slate-200 shadow-xs shrink-0 flex items-center justify-center">
                                <img
                                    src={qrCodeUrl}
                                    alt="QR Code"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Security Footer Strip */}
            <div className="h-4 bg-slate-900 px-4 flex items-center justify-between text-[7px] text-slate-400 font-mono tracking-widest uppercase">
                <span>OFFICIAL CARD • PROPERTY OF {safeSchoolInfo.name.substring(0, 30)}</span>
                <span>ISO/IEC 7810 ID-1</span>
            </div>
        </div>
    );
};

/**
 * Standard ID Card Back Face (540px x 340px)
 */
export const IDCardBackView: React.FC<IDCardProps> = ({
    person,
    isStudent,
    schoolInfo,
    theme = CARD_THEMES.navy,
    academicYear = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
    scale = 1,
    showCutGuides = false,
}) => {
    const safeSchoolInfo = schoolInfo || FALLBACK_SCHOOL_INFO;
    return (
        <div
            className={`w-[540px] h-[340px] bg-slate-50 rounded-2xl shadow-xl p-6 flex flex-col font-sans overflow-hidden relative border border-slate-200 select-none ${
                showCutGuides ? 'border-dashed border-slate-400' : ''
            }`}
            style={{
                transform: scale !== 1 ? `scale(${scale})` : undefined,
                transformOrigin: 'top left',
            }}
        >
            {/* Top Accent Strip */}
            <div
                className="absolute top-0 left-0 right-0 h-2"
                style={{
                    background: `linear-gradient(90deg, ${theme.primaryHex} 0%, ${theme.secondaryHex} 100%)`,
                }}
            />

            {/* Header / Notice */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-3 mt-1">
                <div>
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-800">
                        Terms & Institutional Regulations
                    </h4>
                    <p className="text-[8.5px] text-slate-500 font-medium">
                        Property of {safeSchoolInfo.name}
                    </p>
                </div>
                <span className="text-[9px] font-mono font-bold bg-slate-200 px-2 py-0.5 rounded text-slate-700">
                    ACAD YEAR {academicYear}
                </span>
            </div>

            {/* Terms list */}
            <div className="text-[9.5px] text-slate-600 leading-relaxed space-y-1.5 flex-1 pr-2">
                <p className="flex items-start gap-1.5">
                    <span className="font-bold text-slate-800">1.</span>
                    <span>This identity card is non-transferable and remains the official property of the school.</span>
                </p>
                <p className="flex items-start gap-1.5">
                    <span className="font-bold text-slate-800">2.</span>
                    <span>The cardholder must carry and display this credential at all times while on school premises, transport, or institutional events.</span>
                </p>
                <p className="flex items-start gap-1.5">
                    <span className="font-bold text-slate-800">3.</span>
                    <span>Loss of this card must be reported immediately to the School Administration Office. A replacement fee will apply.</span>
                </p>
                <p className="flex items-start gap-1.5">
                    <span className="font-bold text-slate-800">4.</span>
                    <span className="font-semibold text-slate-700">
                        If found, please return to: <span className="font-normal">{safeSchoolInfo.address || 'Administration Block'}</span> or call <span className="font-normal">{safeSchoolInfo.phone || 'the school registrar'}</span>.
                    </span>
                </p>
            </div>

            {/* Contact Details Bar */}
            <div className="bg-white rounded-lg p-2.5 border border-slate-200/80 mb-3 grid grid-cols-3 gap-2 text-[8px] text-slate-600">
                <div className="flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{safeSchoolInfo.address || 'Campus Grounds'}</span>
                </div>
                <div className="flex items-center gap-1 truncate">
                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{safeSchoolInfo.phone || '+254 700 000000'}</span>
                </div>
                <div className="flex items-center gap-1 truncate">
                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{safeSchoolInfo.email || 'info@school.ac.ke'}</span>
                </div>
            </div>

            {/* Signatures & Seal Section */}
            <div className="mt-auto flex justify-between items-end pt-2 border-t border-slate-200">
                {/* Principal Signature */}
                <div className="text-center w-36">
                    <div className="h-8 flex items-end justify-center mb-1">
                        <span className="font-serif italic text-sm text-slate-800 opacity-90 border-b border-slate-400 pb-0.5 px-4 w-full">
                            Dr. A. K. Mbogo
                        </span>
                    </div>
                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">
                        Authorized Principal
                    </p>
                </div>

                {/* Official School Seal Stamp */}
                <div className="w-14 h-14 rounded-full border-2 border-dashed border-primary-700/60 flex flex-col items-center justify-center text-primary-800 opacity-75">
                    <span className="text-[6px] font-black uppercase tracking-tighter">OFFICIAL</span>
                    <Award className="w-4 h-4 my-0.5" />
                    <span className="text-[6px] font-black uppercase tracking-tighter">SEAL</span>
                </div>

                {/* Holder Signature */}
                <div className="text-center w-36">
                    <div className="h-8 flex items-end justify-center mb-1">
                        <div className="w-full border-b border-slate-400 pb-0.5 px-4 text-center">
                            <span className="text-[9px] font-mono text-slate-400 italic">Holder Signature</span>
                        </div>
                    </div>
                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">
                        {isStudent ? 'Scholar Signature' : 'Staff Signature'}
                    </p>
                </div>
            </div>

            {/* Bottom Accent Strip */}
            <div
                className="absolute bottom-0 left-0 right-0 h-1.5"
                style={{
                    backgroundColor: theme.primaryHex,
                }}
            />
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import type { LmsLiveClass } from '../../types';

interface VirtualClassroomModalProps {
    isOpen: boolean;
    onClose: () => void;
    liveClass: LmsLiveClass | null;
    currentUserName?: string;
    isTeacher?: boolean;
}

interface ChatMessage {
    id: string;
    sender: string;
    role: 'Teacher' | 'Student';
    text: string;
    time: string;
}

const VirtualClassroomModal: React.FC<VirtualClassroomModalProps> = ({
    isOpen,
    onClose,
    liveClass,
    currentUserName = 'Current User',
    isTeacher = false
}) => {
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isHandRaised, setIsHandRaised] = useState(false);
    const [activeTab, setActiveTab] = useState<'chat' | 'participants' | 'notes'>('chat');
    const [newMessage, setNewMessage] = useState('');
    const [reactionEmoji, setReactionEmoji] = useState<string | null>(null);

    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        { id: '1', sender: 'Teacher Mary Atieno', role: 'Teacher', text: 'Welcome everyone! Please open chapter 4 notes on Chemical Reactions.', time: '14:02' },
        { id: '2', sender: 'John Kamau', role: 'Student', text: 'Good afternoon teacher, I can hear you clearly.', time: '14:03' },
        { id: '3', sender: 'Amina Mohamed', role: 'Student', text: 'Teacher, will the practical questions be on tomorrow\'s homework?', time: '14:05' }
    ]);

    const participants = [
        { name: liveClass?.teacherName || 'Teacher Mary Atieno', role: 'Host (Teacher)', isMuted: false, isVideo: true },
        { name: 'John Kamau (Adm #4021)', role: 'Student', isMuted: true, isVideo: true },
        { name: 'Amina Mohamed (Adm #4022)', role: 'Student', isMuted: true, isVideo: true },
        { name: 'David Kiprop (Adm #4025)', role: 'Student', isMuted: false, isVideo: false },
        { name: 'Faith Wanjiru (Adm #4030)', role: 'Student', isMuted: true, isVideo: true },
        { name: currentUserName, role: isTeacher ? 'Co-Host' : 'Student (You)', isMuted: isMuted, isVideo: !isVideoOff }
    ];

    useEffect(() => {
        if (reactionEmoji) {
            const timer = setTimeout(() => setReactionEmoji(null), 2500);
            return () => clearTimeout(timer);
        }
    }, [reactionEmoji]);

    if (!isOpen || !liveClass) return null;

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        const msg: ChatMessage = {
            id: `msg-${Date.now()}`,
            sender: currentUserName,
            role: isTeacher ? 'Teacher' : 'Student',
            text: newMessage.trim(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages(prev => [...prev, msg]);
        setNewMessage('');
    };

    const isZoom = liveClass.platform === 'Zoom';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 overflow-hidden animate-fade-in">
            <div className="bg-slate-900 text-slate-100 rounded-2xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl border border-slate-800 overflow-hidden">
                {/* Header Bar */}
                <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center space-x-3">
                        {isZoom ? (
                            <div className="flex items-center space-x-2 bg-blue-600/20 border border-blue-500/40 text-blue-400 px-3 py-1 rounded-lg text-xs font-semibold">
                                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                                <span>Zoom Classroom</span>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2 bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 px-3 py-1 rounded-lg text-xs font-semibold">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                <span>Google Meet Classroom</span>
                            </div>
                        )}
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-white truncate max-w-md">
                                {liveClass.title}
                            </h2>
                            <p className="text-xs text-slate-400">
                                {liveClass.className} • {liveClass.subjectName} • Hosted by {liveClass.teacherName}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 sm:space-x-3">
                        <a 
                            href={liveClass.joinUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="hidden sm:inline-flex items-center text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition"
                            title="Open native meeting client in a new browser tab"
                        >
                            <svg className="w-3.5 h-3.5 mr-1.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Launch External App
                        </a>
                        <button 
                            onClick={onClose}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition flex items-center"
                        >
                            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                            </svg>
                            Leave Room
                        </button>
                    </div>
                </div>

                {/* Main Content: Video Stage + Side Panel */}
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
                    {/* Floating Reaction Bubble */}
                    {reactionEmoji && (
                        <div className="absolute top-8 left-1/3 z-30 bg-slate-900/90 text-4xl p-4 rounded-2xl shadow-2xl border border-slate-700 animate-bounce">
                            {reactionEmoji}
                        </div>
                    )}

                    {/* Left: Video Stage & Screen share */}
                    <div className="flex-1 bg-slate-950 p-3 sm:p-4 flex flex-col justify-between overflow-hidden relative">
                        {isScreenSharing ? (
                            /* Screen Share View */
                            <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 p-4 flex flex-col overflow-hidden relative">
                                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs text-slate-400">
                                    <span className="flex items-center text-primary-400 font-semibold">
                                        <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        Live Screen Share: {liveClass.subjectName} Presentation
                                    </span>
                                    <span className="bg-slate-800 px-2.5 py-0.5 rounded text-[11px]">Slide 4 of 12</span>
                                </div>
                                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-950/60 rounded-lg mt-3">
                                    <div className="max-w-xl text-left bg-slate-900/90 p-6 rounded-xl border border-slate-700/60 shadow-xl space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs uppercase tracking-wider font-bold text-primary-400">CBC Science Curriculum • Grade 8</span>
                                            <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">Interactive Practical</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-white">Lesson: Exothermic vs Endothermic Chemical Reactions</h3>
                                        <p className="text-sm text-slate-300 leading-relaxed">
                                            In today&apos;s virtual session, we investigate enthalpy changes during neutralization. Notice how temperature increases when dilute hydrochloric acid is added to sodium hydroxide.
                                        </p>
                                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400">
                                            Equation: HCl (aq) + NaOH (aq) &rarr; NaCl (aq) + H2O (l) + &Delta;H (Heat)
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Video Grid Stage */
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto">
                                {/* Teacher Video Tile */}
                                <div className="relative bg-slate-900 rounded-xl border-2 border-primary-500/60 overflow-hidden flex flex-col items-center justify-center p-4 min-h-[160px] shadow-lg">
                                    <div className="absolute top-3 left-3 bg-primary-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center">
                                        <span className="w-1.5 h-1.5 rounded-full bg-white mr-1.5 animate-ping"></span>
                                        HOST • SPEAKING
                                    </div>
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-inner ring-4 ring-primary-500/30">
                                        {liveClass.teacherName.charAt(0) || 'T'}
                                    </div>
                                    {/* Audio waves visualizer */}
                                    <div className="flex items-center space-x-1 mt-3">
                                        <span className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce"></span>
                                        <span className="w-1 h-5 bg-emerald-400 rounded-full animate-bounce [animation-delay:150ms]"></span>
                                        <span className="w-1 h-4 bg-emerald-400 rounded-full animate-bounce [animation-delay:300ms]"></span>
                                        <span className="w-1 h-6 bg-emerald-400 rounded-full animate-bounce [animation-delay:100ms]"></span>
                                        <span className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce [animation-delay:200ms]"></span>
                                    </div>
                                    <span className="mt-2 text-xs font-semibold text-white truncate max-w-[180px]">
                                        {liveClass.teacherName} (Teacher)
                                    </span>
                                </div>

                                {/* Student 1 Tile */}
                                <div className="relative bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col items-center justify-center p-4 min-h-[160px]">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white text-xl font-bold">
                                        JK
                                    </div>
                                    <span className="mt-3 text-xs font-medium text-slate-300">John Kamau</span>
                                    <div className="absolute bottom-2.5 right-2.5 text-slate-400 bg-slate-950/70 p-1 rounded">
                                        <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Student 2 Tile */}
                                <div className="relative bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col items-center justify-center p-4 min-h-[160px]">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white text-xl font-bold">
                                        AM
                                    </div>
                                    <span className="mt-3 text-xs font-medium text-slate-300">Amina Mohamed</span>
                                    <div className="absolute top-2.5 right-2.5 bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded text-[10px] flex items-center font-medium">
                                        ✋ Hand Raised
                                    </div>
                                </div>

                                {/* Current User Tile */}
                                <div className={`relative bg-slate-900 rounded-xl border ${isVideoOff ? 'border-slate-800' : 'border-emerald-500/40'} overflow-hidden flex flex-col items-center justify-center p-4 min-h-[160px]`}>
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white text-xl font-bold ring-2 ring-purple-400/40">
                                        {currentUserName.charAt(0) || 'U'}
                                    </div>
                                    <span className="mt-3 text-xs font-medium text-white flex items-center">
                                        {currentUserName} (You)
                                        {isHandRaised && <span className="ml-1 text-sm">✋</span>}
                                    </span>
                                    <div className="absolute bottom-2.5 right-2.5 flex items-center space-x-1 bg-slate-950/70 px-1.5 py-0.5 rounded">
                                        {isMuted ? (
                                            <span className="text-[10px] text-red-400">Muted</span>
                                        ) : (
                                            <span className="text-[10px] text-emerald-400">Mic On</span>
                                        )}
                                    </div>
                                </div>

                                {/* Extra Student Tile */}
                                <div className="relative bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col items-center justify-center p-4 min-h-[160px]">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-600 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
                                        FW
                                    </div>
                                    <span className="mt-3 text-xs font-medium text-slate-300">Faith Wanjiru</span>
                                </div>

                                {/* Class Info Summary Tile */}
                                <div className="bg-slate-900/60 rounded-xl border border-dashed border-slate-800 p-4 flex flex-col justify-center text-center">
                                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Active Session</span>
                                    <span className="text-lg font-bold text-white mt-1">{liveClass.durationMinutes} Minutes</span>
                                    <div className="mt-2 text-xs text-slate-400">
                                        {liveClass.platform === 'Zoom' && liveClass.meetingId && (
                                            <p className="font-mono text-blue-400 text-[11px]">Zoom ID: {liveClass.meetingId}</p>
                                        )}
                                        <span className="inline-block mt-1 text-emerald-400 font-medium">Recording: Active (Cloud)</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Interactive In-Call Action Toolbar */}
                        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center space-x-2">
                                {/* Mic Toggle */}
                                <button
                                    onClick={() => setIsMuted(!isMuted)}
                                    className={`p-2.5 rounded-xl text-xs font-medium flex items-center transition ${
                                        isMuted ? 'bg-red-600/20 text-red-400 border border-red-500/40 hover:bg-red-600/30' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                                    }`}
                                    title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                                >
                                    {isMuted ? (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                        </svg>
                                    )}
                                    <span className="hidden sm:inline ml-1.5">{isMuted ? 'Muted' : 'Mic On'}</span>
                                </button>

                                {/* Video Toggle */}
                                <button
                                    onClick={() => setIsVideoOff(!isVideoOff)}
                                    className={`p-2.5 rounded-xl text-xs font-medium flex items-center transition ${
                                        isVideoOff ? 'bg-red-600/20 text-red-400 border border-red-500/40 hover:bg-red-600/30' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                                    }`}
                                    title={isVideoOff ? 'Turn camera on' : 'Turn camera off'}
                                >
                                    {isVideoOff ? (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    )}
                                    <span className="hidden sm:inline ml-1.5">{isVideoOff ? 'Camera Off' : 'Camera On'}</span>
                                </button>

                                {/* Screen Share Toggle */}
                                <button
                                    onClick={() => setIsScreenSharing(!isScreenSharing)}
                                    className={`p-2.5 rounded-xl text-xs font-medium flex items-center transition ${
                                        isScreenSharing ? 'bg-primary-600 text-white shadow-lg' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                                    }`}
                                >
                                    <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span className="hidden sm:inline">{isScreenSharing ? 'Stop Share' : 'Share Screen'}</span>
                                </button>

                                {/* Raise Hand */}
                                <button
                                    onClick={() => setIsHandRaised(!isHandRaised)}
                                    className={`p-2.5 rounded-xl text-xs font-medium flex items-center transition ${
                                        isHandRaised ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                                    }`}
                                >
                                    <span className="text-base mr-1">✋</span>
                                    <span className="hidden sm:inline">{isHandRaised ? 'Hand Raised' : 'Raise Hand'}</span>
                                </button>
                            </div>

                            {/* Reactions Emoji Bar */}
                            <div className="flex items-center space-x-1.5 bg-slate-800/80 px-2 py-1 rounded-xl">
                                {['👍', '👏', '❤️', '💡', '🎉'].map(emoji => (
                                    <button
                                        key={emoji}
                                        onClick={() => setReactionEmoji(emoji)}
                                        className="hover:scale-125 transition transform text-base p-1"
                                        title={`Send ${emoji} reaction`}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Collaborative Sidebar (Chat, Participants, Class Notes) */}
                    <div className="w-full lg:w-80 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col flex-shrink-0 h-64 lg:h-auto">
                        {/* Sidebar Tabs */}
                        <div className="flex border-b border-slate-800 text-xs font-semibold">
                            <button
                                onClick={() => setActiveTab('chat')}
                                className={`flex-1 py-3 text-center border-b-2 transition ${
                                    activeTab === 'chat' ? 'border-primary-500 text-primary-400 bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                In-Class Chat ({chatMessages.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('participants')}
                                className={`flex-1 py-3 text-center border-b-2 transition ${
                                    activeTab === 'participants' ? 'border-primary-500 text-primary-400 bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                Roster ({participants.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('notes')}
                                className={`flex-1 py-3 text-center border-b-2 transition ${
                                    activeTab === 'notes' ? 'border-primary-500 text-primary-400 bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                Notes
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-3">
                            {activeTab === 'chat' && (
                                <div className="space-y-3">
                                    {chatMessages.map(msg => (
                                        <div key={msg.id} className="text-xs bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                                            <div className="flex items-center justify-between text-slate-400 mb-1">
                                                <span className={`font-semibold ${msg.role === 'Teacher' ? 'text-primary-400' : 'text-slate-200'}`}>
                                                    {msg.sender}
                                                </span>
                                                <span className="text-[10px]">{msg.time}</span>
                                            </div>
                                            <p className="text-slate-300 break-words">{msg.text}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'participants' && (
                                <div className="space-y-2">
                                    {participants.map((p, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50 text-xs">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[11px] font-bold text-slate-200">
                                                    {p.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white truncate max-w-[140px]">{p.name}</p>
                                                    <p className="text-[10px] text-slate-400">{p.role}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-1.5 text-slate-400">
                                                {p.isMuted ? (
                                                    <span className="text-red-400 text-[10px]" title="Microphone muted">🔇</span>
                                                ) : (
                                                    <span className="text-emerald-400 text-[10px]" title="Microphone active">🎤</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'notes' && (
                                <div className="text-xs space-y-3">
                                    <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                                        <h4 className="font-bold text-white mb-1.5 flex items-center">
                                            <svg className="w-3.5 h-3.5 mr-1 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            Lesson Objectives
                                        </h4>
                                        <ul className="list-disc list-inside text-slate-300 space-y-1">
                                            <li>Differentiate exothermic and endothermic systems.</li>
                                            <li>Measure temperature changes using digital sensors.</li>
                                            <li>Complete homework assignment by Friday 17:00.</li>
                                        </ul>
                                    </div>
                                    <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                                        <h4 className="font-bold text-white mb-1">Homework Reference</h4>
                                        <p className="text-slate-300">
                                            Refer to LMS Assignment: <span className="text-primary-400 font-semibold">&ldquo;Term 2 CBC Science Practical Worksheet&rdquo;</span>
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Chat Input Box */}
                        {activeTab === 'chat' && (
                            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-900 flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message to class..."
                                    className="flex-1 bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary-500"
                                />
                                <button
                                    type="submit"
                                    className="bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-lg transition"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VirtualClassroomModal;


import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

interface WebcamCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (imageDataUrl: string) => void;
}

const WebcamCaptureModal: React.FC<WebcamCaptureModalProps> = ({ isOpen, onClose, onCapture }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

    useEffect(() => {
        let activeStream: MediaStream | null = null;
        let isMounted = true;

        if (isOpen) {
            setIsLoading(true);
            setCameraError(null);

            const constraints: MediaStreamConstraints = {
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            };

            navigator.mediaDevices?.getUserMedia(constraints)
                .then(s => {
                    if (!isMounted) {
                        s.getTracks().forEach(t => t.stop());
                        return;
                    }
                    activeStream = s;
                    setStream(s);
                    if (videoRef.current) {
                        videoRef.current.srcObject = s;
                        videoRef.current.play().catch(() => {});
                    }
                    setIsLoading(false);
                })
                .catch(err => {
                    if (!isMounted) return;
                    console.error("Camera access error:", err);
                    setIsLoading(false);
                    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                        setCameraError('Camera access was denied. Please allow camera permissions in your browser settings.');
                    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                        setCameraError('No camera found on this device. Please connect a webcam or upload a photo.');
                    } else {
                        setCameraError('Could not start webcam stream. Please ensure permissions are granted or upload a photo.');
                    }
                });
        }

        return () => {
            isMounted = false;
            if (activeStream) {
                activeStream.getTracks().forEach(track => track.stop());
            }
            if (videoRef.current && videoRef.current.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }
        };
    }, [isOpen, facingMode]);

    const handleToggleCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            
            // Calculate square center crop for passport photo
            const vWidth = video.videoWidth || 640;
            const vHeight = video.videoHeight || 480;
            const cropSize = Math.min(vWidth, vHeight);
            const startX = (vWidth - cropSize) / 2;
            const startY = (vHeight - cropSize) / 2;

            // Target dimensions: 400x400 for standard passport photo
            const targetDim = 400;
            canvas.width = targetDim;
            canvas.height = targetDim;

            const context = canvas.getContext('2d');
            if (context) {
                context.imageSmoothingEnabled = true;
                context.imageSmoothingQuality = 'high';
                context.drawImage(video, startX, startY, cropSize, cropSize, 0, 0, targetDim, targetDim);

                // Use WebP if supported, fallback to JPEG
                let dataUrl: string;
                try {
                    dataUrl = canvas.toDataURL('image/webp', 0.85);
                    if (!dataUrl.startsWith('data:image/webp')) {
                        dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                    }
                } catch {
                    dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                }

                // Stop stream before returning
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }
                onCapture(dataUrl);
                onClose();
            }
        }
    };

    const handleClose = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        onClose();
    };
    
    if (!isOpen) return null;

    return (
        <div 
            id="webcam-capture-modal-backdrop"
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[200] flex justify-center items-center p-4 transition-all duration-200" 
            onClick={handleClose}
        >
            <div 
                id="webcam-capture-modal-dialog"
                className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                    <div className="flex items-center space-x-2">
                        <span className="p-2 bg-primary-100 dark:bg-primary-950/70 text-primary-600 dark:text-primary-400 rounded-xl">
                            <Camera className="w-5 h-5" />
                        </span>
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                Capture Passport Portrait
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Position scholar face inside the guide frame
                            </p>
                        </div>
                    </div>
                    <button 
                        id="btn-close-webcam-modal"
                        onClick={handleClose} 
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Close Camera"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Viewfinder Container */}
                <div className="relative p-4 bg-slate-950 flex flex-col items-center justify-center min-h-[320px]">
                    {isLoading && !cameraError && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white space-y-3 z-10 bg-slate-950">
                            <RefreshCw className="w-8 h-8 animate-spin text-primary-400" />
                            <p className="text-xs font-medium text-slate-300">Initializing camera sensor...</p>
                        </div>
                    )}

                    {cameraError ? (
                        <div className="p-6 text-center text-white max-w-sm space-y-3">
                            <div className="w-12 h-12 mx-auto rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <h4 className="text-sm font-bold text-white">Camera Unavailable</h4>
                            <p className="text-xs text-slate-300 leading-relaxed">{cameraError}</p>
                            <div className="pt-2 flex justify-center gap-2">
                                <button
                                    onClick={() => handleToggleCamera()}
                                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                                >
                                    Retry Camera
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
                                >
                                    Use File Upload
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="relative w-full aspect-square max-w-[340px] rounded-2xl overflow-hidden bg-black flex items-center justify-center shadow-inner border border-slate-800">
                            <video 
                                ref={videoRef} 
                                autoPlay 
                                playsInline 
                                muted 
                                className="w-full h-full object-cover"
                            />
                            
                            {/* Passport Oval Guide Frame */}
                            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                                <div className="w-[72%] h-[82%] border-2 border-dashed border-white/70 rounded-full shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] flex items-center justify-center">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-xs">
                                        Align Face Here
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <canvas ref={canvasRef} className="hidden" />
                </div>

                {/* Footer Controls */}
                <div className="p-4 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                        type="button"
                        onClick={handleToggleCamera}
                        disabled={isLoading || !!cameraError}
                        className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-40"
                        title="Flip Camera (Front/Back)"
                    >
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                        Switch Lens
                    </button>

                    <div className="flex items-center gap-2">
                        <button 
                            type="button" 
                            onClick={handleClose} 
                            className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            id="btn-capture-webcam-photo"
                            type="button" 
                            onClick={handleCapture} 
                            disabled={isLoading || !!cameraError}
                            className="inline-flex items-center px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-40"
                        >
                            <Camera className="w-4 h-4 mr-1.5" />
                            Capture Photo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WebcamCaptureModal;

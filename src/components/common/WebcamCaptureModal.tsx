import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, RefreshCw, AlertCircle, Check, RotateCcw, Smartphone, Upload, Info } from 'lucide-react';

interface WebcamCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (imageDataUrl: string) => void;
    title?: string;
    description?: string;
}

const WebcamCaptureModal: React.FC<WebcamCaptureModalProps> = ({ 
    isOpen, 
    onClose, 
    onCapture,
    title = 'Capture Portrait Photo',
    description = 'Position face inside the guide frame or snap with your device camera'
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const nativeCameraInputRef = useRef<HTMLInputElement>(null);
    const fileUploadInputRef = useRef<HTMLInputElement>(null);

    const [stream, setStream] = useState<MediaStream | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isVideoReady, setIsVideoReady] = useState(false);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [capturedPreview, setCapturedPreview] = useState<string | null>(null);

    // Stop all active tracks on a media stream
    const stopStream = (s: MediaStream | null) => {
        if (s) {
            try {
                s.getTracks().forEach(track => {
                    track.stop();
                });
            } catch (e) {
                console.warn('Error stopping tracks', e);
            }
        }
    };

    // Robust multi-tier stream initializer
    const requestCameraStream = async (facing: 'user' | 'environment'): Promise<MediaStream> => {
        if (!navigator.mediaDevices?.getUserMedia) {
            const legacyGetUserMedia = (navigator as any).getUserMedia || 
                                       (navigator as any).webkitGetUserMedia || 
                                       (navigator as any).mozGetUserMedia;
            if (legacyGetUserMedia) {
                return new Promise((resolve, reject) => {
                    legacyGetUserMedia.call(navigator, { video: true }, resolve, reject);
                });
            }
            throw new Error('MEDIA_DEVICES_NOT_SUPPORTED');
        }

        // Tier 1: Ideal resolution + preferred lens
        try {
            return await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: facing },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });
        } catch (t1Err) {
            console.warn('Tier 1 camera constraints failed, attempting Tier 2...', t1Err);
        }

        // Tier 2: Facing mode only (no resolution constraint)
        try {
            return await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facing },
                audio: false
            });
        } catch (t2Err) {
            console.warn('Tier 2 camera constraints failed, attempting Tier 3 basic video...', t2Err);
        }

        // Tier 3: Basic unconstrained video
        return await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        });
    };

    useEffect(() => {
        let activeStream: MediaStream | null = null;
        let isMounted = true;

        if (isOpen && !capturedPreview) {
            setIsLoading(true);
            setIsVideoReady(false);
            setCameraError(null);

            requestCameraStream(facingMode)
                .then(s => {
                    if (!isMounted) {
                        stopStream(s);
                        return;
                    }
                    activeStream = s;
                    setStream(s);

                    if (videoRef.current) {
                        videoRef.current.srcObject = s;
                        videoRef.current.onloadedmetadata = () => {
                            if (isMounted) {
                                setIsVideoReady(true);
                                setIsLoading(false);
                            }
                        };
                        videoRef.current.play().catch(playErr => {
                            console.warn('Autoplay prevented on webcam element:', playErr);
                            if (isMounted) {
                                setIsVideoReady(true);
                                setIsLoading(false);
                            }
                        });
                    } else {
                        setIsLoading(false);
                    }
                })
                .catch(err => {
                    if (!isMounted) return;
                    console.error("Camera acquisition error:", err);
                    setIsLoading(false);
                    setIsVideoReady(false);

                    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.name === 'SecurityError') {
                        setCameraError('Camera access was blocked by browser or iframe permissions. You can use the "Snap with Device Camera" button below which works directly with your camera app.');
                    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                        setCameraError('No webcam hardware was detected. You can use the "Snap with Device Camera" button or upload a photo.');
                    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                        setCameraError('The webcam is currently in use by another application or tab. Please close other camera apps or snap with your device camera.');
                    } else {
                        setCameraError('Could not initialize the live webcam stream. You can still snap a photo using the "Snap with Device Camera" button below.');
                    }
                });
        }

        return () => {
            isMounted = false;
            stopStream(activeStream);
            if (videoRef.current && videoRef.current.srcObject) {
                stopStream(videoRef.current.srcObject as MediaStream);
                videoRef.current.srcObject = null;
            }
        };
    }, [isOpen, facingMode, capturedPreview]);

    const handleToggleCamera = () => {
        stopStream(stream);
        setStream(null);
        setIsVideoReady(false);
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    // Center crop to 400x400 passport standard
    const handleCaptureFromVideo = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            
            const vWidth = video.videoWidth || 640;
            const vHeight = video.videoHeight || 480;
            const cropSize = Math.min(vWidth, vHeight);
            const startX = Math.max(0, (vWidth - cropSize) / 2);
            const startY = Math.max(0, (vHeight - cropSize) / 2);

            const targetDim = 400;
            canvas.width = targetDim;
            canvas.height = targetDim;

            const context = canvas.getContext('2d');
            if (context) {
                context.imageSmoothingEnabled = true;
                context.imageSmoothingQuality = 'high';
                context.drawImage(video, startX, startY, cropSize, cropSize, 0, 0, targetDim, targetDim);

                let dataUrl: string;
                try {
                    dataUrl = canvas.toDataURL('image/webp', 0.88);
                    if (!dataUrl.startsWith('data:image/webp')) {
                        dataUrl = canvas.toDataURL('image/jpeg', 0.88);
                    }
                } catch {
                    dataUrl = canvas.toDataURL('image/jpeg', 0.88);
                }

                // Stop live stream and show preview
                stopStream(stream);
                setStream(null);
                setCapturedPreview(dataUrl);
            }
        }
    };

    // Handle photo taken via native device camera (HTML Media Capture)
    const handleNativeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                const canvas = canvasRef.current || document.createElement('canvas');
                const cropSize = Math.min(img.width, img.height);
                const startX = (img.width - cropSize) / 2;
                const startY = (img.height - cropSize) / 2;

                const targetDim = 400;
                canvas.width = targetDim;
                canvas.height = targetDim;

                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, startX, startY, cropSize, cropSize, 0, 0, targetDim, targetDim);

                    let dataUrl: string;
                    try {
                        dataUrl = canvas.toDataURL('image/webp', 0.88);
                        if (!dataUrl.startsWith('data:image/webp')) {
                            dataUrl = canvas.toDataURL('image/jpeg', 0.88);
                        }
                    } catch {
                        dataUrl = canvas.toDataURL('image/jpeg', 0.88);
                    }

                    stopStream(stream);
                    setStream(null);
                    setCapturedPreview(dataUrl);
                }
            };
            img.src = reader.result as string;
        };
        reader.readAsDataURL(file);

        // Reset input value so it can be re-triggered
        e.target.value = '';
    };

    const handleConfirmCapture = () => {
        if (capturedPreview) {
            onCapture(capturedPreview);
            handleClose();
        }
    };

    const handleRetake = () => {
        setCapturedPreview(null);
        setCameraError(null);
    };

    const handleClose = () => {
        stopStream(stream);
        setStream(null);
        setCapturedPreview(null);
        setCameraError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div 
            id="webcam-capture-modal-backdrop"
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[200] flex justify-center items-center p-3 sm:p-4 transition-all duration-200" 
            onClick={handleClose}
        >
            <div 
                id="webcam-capture-modal-dialog"
                className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Hidden File / Camera Inputs */}
                <input 
                    type="file" 
                    accept="image/*" 
                    capture="user" 
                    ref={nativeCameraInputRef} 
                    onChange={handleNativeFileChange} 
                    className="hidden" 
                />
                <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileUploadInputRef} 
                    onChange={handleNativeFileChange} 
                    className="hidden" 
                />

                {/* Modal Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                    <div className="flex items-center space-x-3">
                        <span className="p-2 bg-primary-100 dark:bg-primary-950/70 text-primary-600 dark:text-primary-400 rounded-xl">
                            <Camera className="w-5 h-5" />
                        </span>
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                {capturedPreview ? 'Review Portrait' : title}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                                {capturedPreview ? 'Check alignment before saving' : description}
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

                {/* Viewfinder / Preview Container */}
                <div className="relative p-4 sm:p-6 bg-slate-950 flex flex-col items-center justify-center min-h-[340px]">
                    {/* State 1: Captured Photo Preview */}
                    {capturedPreview ? (
                        <div className="flex flex-col items-center space-y-4 animate-in fade-in duration-200">
                            <div className="relative w-64 h-64 rounded-2xl overflow-hidden shadow-2xl border-4 border-primary-500/80 bg-black">
                                <img 
                                    src={capturedPreview} 
                                    alt="Captured Portrait" 
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute top-2 right-2 px-2.5 py-1 bg-emerald-600/90 backdrop-blur-xs text-white text-[10px] font-bold rounded-full flex items-center gap-1 shadow-sm">
                                    <Check className="w-3 h-3" />
                                    Ready
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 text-center">
                                Standard 400x400 ID portrait ready for official records
                            </p>
                        </div>
                    ) : cameraError ? (
                        /* State 2: Camera Stream Error with Device Camera Fallback */
                        <div className="p-4 sm:p-6 text-center text-white max-w-md space-y-3.5 animate-in fade-in duration-200">
                            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <h4 className="text-sm font-bold text-white">Live Viewfinder Unavailable</h4>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                {cameraError}
                            </p>
                            
                            <div className="pt-2 flex flex-col sm:flex-row justify-center gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => nativeCameraInputRef.current?.click()}
                                    className="inline-flex items-center justify-center px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
                                >
                                    <Smartphone className="w-4 h-4 mr-1.5" />
                                    Snap with Device Camera
                                </button>
                                <button
                                    type="button"
                                    onClick={() => fileUploadInputRef.current?.click()}
                                    className="inline-flex items-center justify-center px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
                                >
                                    <Upload className="w-4 h-4 mr-1.5" />
                                    Upload Photo File
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => { setCameraError(null); setIsLoading(true); handleToggleCamera(); }}
                                className="text-[11px] text-slate-400 hover:text-slate-200 underline pt-1 block mx-auto"
                            >
                                Try reconnecting live webcam
                            </button>
                        </div>
                    ) : (
                        /* State 3: Active Live Webcam Viewfinder */
                        <div className="relative w-full aspect-square max-w-[320px] rounded-2xl overflow-hidden bg-black flex items-center justify-center shadow-2xl border border-slate-800">
                            {isLoading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-white space-y-3 z-10 bg-slate-950/90">
                                    <RefreshCw className="w-8 h-8 animate-spin text-primary-400" />
                                    <p className="text-xs font-medium text-slate-300">Activating camera sensor...</p>
                                </div>
                            )}

                            <video 
                                ref={videoRef} 
                                autoPlay 
                                playsInline 
                                muted 
                                className="w-full h-full object-cover"
                            />
                            
                            {/* Passport Oval Alignment Guide */}
                            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                                <div className="w-[74%] h-[84%] border-2 border-dashed border-white/80 rounded-full shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] flex items-center justify-center">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-black/60 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                                        Align Face Here
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <canvas ref={canvasRef} className="hidden" />
                </div>

                {/* Helpful Tip Banner */}
                {!capturedPreview && (
                    <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5 text-primary-500" />
                            <span>Camera blocked? Click <strong>Device Camera</strong> to use your phone/laptop camera app directly.</span>
                        </span>
                    </div>
                )}

                {/* Footer Controls */}
                <div className="p-4 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                    {capturedPreview ? (
                        /* Review Actions */
                        <div className="flex items-center justify-between w-full">
                            <button
                                type="button"
                                onClick={handleRetake}
                                className="inline-flex items-center px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                            >
                                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                                Retake Photo
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    id="btn-confirm-captured-photo"
                                    type="button"
                                    onClick={handleConfirmCapture}
                                    className="inline-flex items-center px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
                                >
                                    <Check className="w-4 h-4 mr-1.5" />
                                    Use This Photo
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Active Live Controls */
                        <>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleToggleCamera}
                                    disabled={isLoading || !!cameraError}
                                    className="inline-flex items-center px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-40"
                                    title="Flip Camera (Front/Back Lens)"
                                >
                                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                                    Flip Lens
                                </button>

                                <button
                                    type="button"
                                    onClick={() => nativeCameraInputRef.current?.click()}
                                    className="inline-flex items-center px-3 py-2 text-xs font-semibold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/60 hover:bg-primary-100 dark:hover:bg-primary-900/60 rounded-xl transition-colors border border-primary-200 dark:border-primary-800"
                                    title="Open native device camera application"
                                >
                                    <Smartphone className="w-3.5 h-3.5 mr-1 text-primary-600" />
                                    Device Camera
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <button 
                                    type="button" 
                                    onClick={handleClose} 
                                    className="px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    id="btn-capture-webcam-photo"
                                    type="button" 
                                    onClick={handleCaptureFromVideo} 
                                    disabled={isLoading || !isVideoReady || !!cameraError}
                                    className="inline-flex items-center px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-40"
                                >
                                    <Camera className="w-4 h-4 mr-1.5" />
                                    Snap Photo
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WebcamCaptureModal;

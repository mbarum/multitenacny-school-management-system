
import React, { useState, useEffect, useRef } from 'react';

interface WebcamCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (imageDataUrl: string) => void;
}

const WebcamCaptureModal: React.FC<WebcamCaptureModalProps> = ({ isOpen, onClose, onCapture }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    useEffect(() => {
        if (isOpen) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                    setStream(stream);
                })
                .catch(err => {
                    console.error("Error accessing webcam:", err);
                    alert("Could not access the webcam. Please ensure permissions are granted.");
                    onClose();
                });
        } else {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                setStream(null);
            }
        }
        // Cleanup function
        return () => {
             if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        }
    }, [isOpen, stream]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const dataUrl = canvas.toDataURL('image/jpeg');
            onCapture(dataUrl);
            onClose();
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center" onClick={onClose}>
            <div className="bg-white p-4 rounded-lg" onClick={e => e.stopPropagation()}>
                <video ref={videoRef} autoPlay className="rounded-md w-full max-w-lg"></video>
                <canvas ref={canvasRef} className="hidden"></canvas>
                <div className="mt-4 flex justify-center">
                    <button onClick={handleCapture} className="px-6 py-2 bg-primary-600 text-white font-bold rounded-lg shadow-lg hover:bg-primary-700">Capture Photo</button>
                </div>
            </div>
        </div>
    )
};

export default WebcamCaptureModal;


import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let currentIdentifiedUser: any = null;

export const connectSocket = () => {
    if (!socket) {
        // In development or production, connects through the proxy or current origin
        const url = window.location.origin;
        socket = io(url, {
            path: '/socket.io',
            transports: ['websocket', 'polling'],
            autoConnect: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
        });
        
        socket.on('connect', () => {
            console.log('[Socket] Connected with ID:', socket?.id);
            if (currentIdentifiedUser) {
                identifySocketUser(currentIdentifiedUser);
            }
        });
        
        socket.on('disconnect', (reason) => {
            console.log('[Socket] Disconnected:', reason);
        });

        socket.on('connect_error', (err) => {
            // Log quietly to avoid spamming console if backend socket gateway is optional
            console.debug('[Socket] Connection status:', err.message);
        });
    }
    return socket;
};

export const identifySocketUser = (user: any, schoolInfo?: any) => {
    currentIdentifiedUser = { ...user, schoolInfo };
    const s = connectSocket();
    if (s && user) {
        s.emit('identify', {
            userId: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            schoolId: user.schoolId || schoolInfo?.id,
            schoolName: schoolInfo?.name || (user.role === 'SuperAdmin' ? 'Central Platform Operations' : 'Institution'),
            currentPath: window.location.pathname || '/',
            userAgent: navigator.userAgent
        });
    }
};

export const sendSocketHeartbeat = (currentPath?: string) => {
    if (socket && socket.connected) {
        socket.emit('heartbeat', {
            currentPath: currentPath || window.location.pathname || '/',
            timestamp: new Date().toISOString()
        });
    }
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
        currentIdentifiedUser = null;
    }
};

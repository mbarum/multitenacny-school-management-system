
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const connectSocket = () => {
    if (!socket) {
        // In development, this connects to the proxy or backend URL
        // The URL should match where the backend is serving
        const url = window.location.origin.includes('5173') ? 'http://localhost:3000' : window.location.origin;
        socket = io(url, {
            transports: ['websocket'],
            autoConnect: true,
        });
        
        socket.on('connect', () => {
            console.log('Socket connected:', socket?.id);
        });
        
        socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });
    }
    return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

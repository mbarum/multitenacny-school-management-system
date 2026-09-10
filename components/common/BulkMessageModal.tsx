
import React, { useState } from 'react';
import type { Student } from '../../types';
import Modal from './Modal';

interface BulkMessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentsToMessage: Student[];
    onSend: (message: string) => void;
}

const BulkMessageModal: React.FC<BulkMessageModalProps> = ({ isOpen, onClose, studentsToMessage, onSend }) => {
    const [message, setMessage] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) {
            alert('Message cannot be empty.');
            return;
        }
        onSend(message);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Send Message to ${studentsToMessage.length} Guardians`}
            size="lg"
            footer={
                <div className="flex space-x-2">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700">Send Message</button>
                </div>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Recipients:</label>
                    <div className="p-2 border rounded-md max-h-32 overflow-y-auto bg-slate-50 text-sm text-slate-600">
                        {studentsToMessage.map(s => s.guardianName).join(', ')}
                    </div>
                </div>
                <div>
                    <label htmlFor="bulk-message" className="block text-sm font-medium text-slate-700 mb-1">Message:</label>
                    <textarea
                        id="bulk-message"
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        rows={6}
                        className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Type your message here..."
                        required
                    />
                </div>
            </form>
        </Modal>
    );
};

export default BulkMessageModal;

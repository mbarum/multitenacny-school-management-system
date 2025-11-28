import React, { useState } from 'react';
import Modal from './Modal';

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    templateUrl: string;
    onUpload: (file: File) => void;
    processing: boolean;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, title, templateUrl, onUpload, processing }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedFile) {
            onUpload(selectedFile);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="p-4 border-2 border-dashed border-slate-300 rounded-lg text-center">
                    <p className="mb-2 text-slate-600">Download the template, fill it out, and upload it here.</p>
                    <a href={templateUrl} download className="font-semibold text-primary-600 hover:underline">
                        Download Template CSV
                    </a>
                </div>
                <div>
                    <label htmlFor="file-upload" className="block text-sm font-medium text-slate-700">
                        Upload CSV File
                    </label>
                    <input
                        id="file-upload"
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                        required
                    />
                </div>
                <div className="flex justify-end pt-4 border-t">
                    <button type="submit" disabled={!selectedFile || processing} className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 disabled:bg-slate-400">
                        {processing ? 'Processing...' : 'Upload & Import'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ImportModal;
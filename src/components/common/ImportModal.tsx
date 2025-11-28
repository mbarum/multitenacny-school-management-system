
import React, { useState } from 'react';
import Modal from './Modal';

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    templateUrl: string;
    onUpload: (file: File) => Promise<{ imported: number; failed: number; errors: any[] } | void>;
    processing: boolean;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, title, templateUrl, onUpload, processing }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [importResult, setImportResult] = useState<{ imported: number; failed: number; errors: any[] } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
            setImportResult(null); // Reset previous results
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedFile) {
            const result = await onUpload(selectedFile);
            if (result) {
                setImportResult(result);
            }
        }
    };

    const handleClose = () => {
        setImportResult(null);
        setSelectedFile(null);
        onClose();
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={title}>
            {!importResult ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="p-4 border-2 border-dashed border-slate-300 rounded-lg text-center bg-slate-50">
                        <p className="mb-2 text-slate-600 font-medium">Step 1: Get the Template</p>
                        <a href={templateUrl} download className="inline-flex items-center px-4 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Download CSV Template
                        </a>
                        <p className="mt-2 text-xs text-slate-500">Fill in the data exactly as formatted in the header.</p>
                    </div>
                    
                    <div>
                        <label htmlFor="file-upload" className="block text-sm font-medium text-slate-700 mb-2">
                            Step 2: Upload Filled CSV
                        </label>
                        <input
                            id="file-upload"
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                            required
                        />
                    </div>
                    
                    <div className="flex justify-end pt-4 border-t">
                        <button type="submit" disabled={!selectedFile || processing} className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 disabled:bg-slate-400 flex items-center">
                            {processing && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                            {processing ? 'Importing Data...' : 'Start Import'}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-full ${importResult.failed === 0 ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                            {importResult.failed === 0 ? (
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            ) : (
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            )}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Import Complete</h3>
                            <p className="text-sm text-slate-600">
                                <span className="font-semibold text-green-600">{importResult.imported}</span> imported, 
                                <span className="font-semibold text-red-600 ml-1">{importResult.failed}</span> failed.
                            </p>
                        </div>
                    </div>

                    {importResult.errors.length > 0 && (
                        <div className="mt-4">
                            <h4 className="font-semibold text-sm text-red-700 mb-2">Error Log:</h4>
                            <div className="bg-red-50 border border-red-200 rounded-md max-h-60 overflow-y-auto p-2 text-sm">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-red-200"><th className="pb-1 text-red-800">Row</th><th className="pb-1 text-red-800">Name</th><th className="pb-1 text-red-800">Reason</th></tr>
                                    </thead>
                                    <tbody>
                                        {importResult.errors.map((err, idx) => (
                                            <tr key={idx} className="text-red-700">
                                                <td className="py-1">{err.row}</td>
                                                <td className="py-1">{err.name}</td>
                                                <td className="py-1">{err.error}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        <button onClick={handleClose} className="px-6 py-2 bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700">
                            Close
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default ImportModal;

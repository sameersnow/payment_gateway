
import { useState } from 'react';
import { Button, Modal, useToast } from '../ui';
import { Upload, FileSpreadsheet, Download } from 'lucide-react';

interface ImportOrdersModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function ImportOrdersModal({ isOpen, onClose, onSuccess }: ImportOrdersModalProps) {
    const { success, error: showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        try {
            setLoading(true);

            // TODO: Implement actual import logic when backend endpoint is available
            // const formData = new FormData();
            // formData.append('file', file);
            // await call(formData);

            // Simulation for now
            await new Promise(resolve => setTimeout(resolve, 1500));

            success('Success', `File "${file.name}" uploaded successfully. Processing started.`);
            onSuccess();
            onClose();
            setFile(null);
        } catch (err: any) {
            console.error('Import failed:', err);
            showError('Error', err.message || 'Failed to import orders');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Import Orders"
        >
            <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex gap-3">
                        <div className="flex-shrink-0">
                            <Download className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-blue-900">Download Template</h4>
                            <p className="text-sm text-blue-700 mt-1">
                                Use our standard template to bulk import orders.
                            </p>
                            <a href="#" className="text-sm font-medium text-blue-800 hover:text-blue-900 underline mt-2 inline-block">
                                Download CSV Template
                            </a>
                        </div>
                    </div>
                </div>

                <div
                    className={`
                        border-2 border-dashed rounded-xl p-8 text-center transition-colors
                        ${file ? 'border-primary-500 bg-primary-50' : 'border-slate-300 hover:border-slate-400'}
                    `}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                >
                    {file ? (
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-3">
                                <FileSpreadsheet className="w-6 h-6 text-primary-600" />
                            </div>
                            <p className="text-sm font-medium text-slate-900">{file.name}</p>
                            <p className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                            <button
                                onClick={() => setFile(null)}
                                className="mt-4 text-sm text-red-600 hover:text-red-700 font-medium"
                            >
                                Remove file
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                                <Upload className="w-6 h-6 text-slate-400" />
                            </div>
                            <p className="text-sm font-medium text-slate-900">
                                Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                CSV, Excel files supported (max 10MB)
                            </p>
                            <input
                                type="file"
                                className="hidden"
                                id="file-upload"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleFileChange}
                            />
                            <label
                                htmlFor="file-upload"
                                className="mt-4 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
                            >
                                Select File
                            </label>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpload}
                        loading={loading}
                        disabled={!file}
                    >
                        Import Orders
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

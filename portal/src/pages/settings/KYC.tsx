import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, FileText, Send } from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import { Card, Badge, Button } from '../../components/ui';
import { useFrappePostCall } from 'frappe-react-sdk';
import { useKYC } from '../../hooks';
import { toast } from 'sonner';

interface DocumentInfo {
    label: string;
    file_url: string | null;
    uploaded: boolean;
    requires_reupload: boolean;
}

const STATUS_COLORS = {
    Draft: 'slate',
    Submitted: 'warning',
    Approved: 'success',
    Rejected: 'error',
    Terminated: 'error'
} as const;

const STATUS_LABELS = {
    Draft: 'Draft',
    Submitted: 'Under Review',
    Approved: 'Approved',
    Rejected: 'Rejected',
    Terminated: 'Terminated'
} as const;

export function KYC() {
    const [uploading, setUploading] = useState<Record<string, boolean>>({});

    // Use new SDK hook
    const { kycStatus: kycData, isLoading: loading, uploadDocument } = useKYC();
    const { call: submitKYC, loading: submitting } = useFrappePostCall('iswitch.merchant_portal_api.submit_kyc');


    const handleFileUpload = async (documentType: string, file: File) => {
        try {
            setUploading(prev => ({ ...prev, [documentType]: true }));

            // Use hook's uploadDocument method (handles file upload + doc update)
            await uploadDocument(
                documentType as 'director_pan' | 'director_adhar' | 'company_pan' | 'company_gst',
                file
            );

            // Toast shown by hook
        } catch (err) {
            console.error('Upload error:', err);
            // Error toast already shown by hook
        } finally {
            setUploading(prev => ({ ...prev, [documentType]: false }));
        }
    };

    const handleSubmitKYC = async () => {
        try {
            const response = await submitKYC({});
            const result = response.message;

            if (result && result.success) {
                toast.success('KYC submitted for review successfully');
            } else {
                throw new Error(result?.message || 'Failed to submit KYC');
            }
        } catch (err) {
            console.error('Submit error:', err);
            toast.error('Failed to submit KYC. Please try again.');
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (!kycData) {
        return (
            <DashboardLayout>
                <div className="text-center py-12">
                    <p className="text-slate-500">Failed to load KYC status</p>
                </div>
            </DashboardLayout>
        );
    }

    const statusColor = STATUS_COLORS[kycData.status as keyof typeof STATUS_COLORS] || 'slate';
    const statusLabel = STATUS_LABELS[kycData.status as keyof typeof STATUS_LABELS] || kycData.status;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">KYC Verification</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Upload required documents for account verification
                        </p>
                    </div>
                    <Badge variant={statusColor as any}>
                        {statusLabel}
                    </Badge>
                </div>

                {/* Status Banner */}
                {kycData.status === 'Rejected' && kycData.remark && (
                    <Card className="border-error-200 bg-error-50">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-error-600 mt-0.5" />
                            <div>
                                <h3 className="font-medium text-error-900">Action Required</h3>
                                <p className="text-sm text-error-700 mt-1">{kycData.remark}</p>
                            </div>
                        </div>
                    </Card>
                )}

                {kycData.status === 'Submitted' && (
                    <Card className="border-warning-200 bg-warning-50">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-warning-600 mt-0.5" />
                            <div>
                                <h3 className="font-medium text-warning-900">Under Review</h3>
                                <p className="text-sm text-warning-700 mt-1">
                                    Your KYC documents are being under review. We'll notify you once the review is complete.
                                </p>
                            </div>
                        </div>
                    </Card>
                )}

                {kycData.status === 'Approved' && (
                    <Card className="border-success-200 bg-success-50">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-success-600 mt-0.5" />
                            <div>
                                <h3 className="font-medium text-success-900">Verified</h3>
                                <p className="text-sm text-success-700 mt-1">
                                    Your account has been successfully verified. You can now access all features.
                                </p>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Documents Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(kycData.documents).map(([key, doc]) => (
                        <DocumentCard
                            key={key}
                            documentType={key}
                            document={doc}
                            uploading={uploading[key] || false}
                            onUpload={handleFileUpload}
                            disabled={kycData.status === 'Submitted' || kycData.status === 'Approved'}
                            kycStatus={kycData.status}
                        />
                    ))}
                </div>

                {/* Submit Button */}
                {kycData.can_submit && (
                    <div className="flex justify-end">
                        <Button
                            onClick={handleSubmitKYC}
                            disabled={submitting}
                            size="lg"
                        >
                            <Send className="w-4 h-4" />
                            {submitting ? 'Submitting...' : 'Submit for Review'}
                        </Button>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

interface DocumentCardProps {
    documentType: string;
    document: DocumentInfo;
    uploading: boolean;
    onUpload: (documentType: string, file: File) => void;
    disabled: boolean;
    kycStatus: string;
}

function DocumentCard({ documentType, document, uploading, onUpload, disabled, kycStatus }: DocumentCardProps) {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onUpload(documentType, file);
        }
    };

    return (
        <Card className={`relative ${document.requires_reupload ? 'border-error-300' : ''}`}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${document.uploaded && !document.requires_reupload
                        ? 'bg-success-100'
                        : document.requires_reupload
                            ? 'bg-error-100'
                            : 'bg-slate-100'
                        }`}>
                        {document.uploaded && !document.requires_reupload ? (
                            <CheckCircle className="w-5 h-5 text-success-600" />
                        ) : document.requires_reupload ? (
                            <AlertCircle className="w-5 h-5 text-error-600" />
                        ) : (
                            <FileText className="w-5 h-5 text-slate-600" />
                        )}
                    </div>
                    <div>
                        <h3 className="font-medium text-slate-900">{document.label}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {document.uploaded && !document.requires_reupload
                                ? 'Uploaded'
                                : document.requires_reupload
                                    ? 'Re-upload required'
                                    : 'Not uploaded'}
                        </p>
                    </div>
                </div>
                {/* Show Verified badge only when KYC is Approved */}
                {document.uploaded && !document.requires_reupload && kycStatus === 'Approved' && (
                    <Badge variant="success" size="sm">Verified</Badge>
                )}
                {/* Show Uploaded badge when document is uploaded but KYC not yet approved */}
                {document.uploaded && !document.requires_reupload && kycStatus !== 'Approved' && (
                    <Badge variant="primary" size="sm">Uploaded</Badge>
                )}
                {document.requires_reupload && (
                    <Badge variant="error" size="sm">Action Required</Badge>
                )}
            </div>

            {document.file_url && !document.requires_reupload && (
                <div className="mb-4">
                    <a
                        href={document.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
                    >
                        View Document
                    </a>
                </div>
            )}

            {/* Only show upload button if: 1) Not uploaded yet, OR 2) Requires reupload */}
            {(!document.uploaded || document.requires_reupload) && (
                <div className="relative">
                    <input
                        type="file"
                        id={`upload-${documentType}`}
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".pdf,.jpg,.jpeg,.png"
                        disabled={disabled || uploading}
                    />
                    <label
                        htmlFor={`upload-${documentType}`}
                        className={`
                            flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg
                            transition-colors cursor-pointer
                            ${disabled
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : uploading
                                    ? 'bg-slate-100 text-slate-600 cursor-wait'
                                    : document.requires_reupload
                                        ? 'bg-error-600 text-white hover:bg-error-700'
                                        : 'bg-slate-900 text-white hover:bg-slate-800'
                            }
                        `}
                    >
                        <Upload className="w-4 h-4" />
                        {uploading ? 'Uploading...' : document.requires_reupload ? 'Re-upload' : 'Upload'}
                    </label>

                    <p className="text-xs text-slate-500 mt-2">
                        Accepted formats: PDF, JPG, PNG (Max 5MB)
                    </p>
                </div>
            )}
        </Card>
    );
}

import { useState } from 'react';
import {
  CheckCircle, Clock, XCircle, Upload, FileText, User, Building2,
  Landmark, MapPin, AlertCircle, Eye
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import { Card, Badge, Button, Modal } from '../../components/ui';
import { formatDateTime } from '../../utils/formatters';
import { useAuth } from '../../hooks';

const verificationSteps = [
  {
    id: 'business_info',
    title: 'Business Information',
    description: 'Company details and contact information',
    icon: Building2,
    status: 'verified' as const,
  },
  {
    id: 'identity',
    title: 'Identity Verification',
    description: 'Government-issued ID for business owner',
    icon: User,
    status: 'verified' as const,
  },
  {
    id: 'bank',
    title: 'Bank Account',
    description: 'Bank account for receiving payouts',
    icon: Landmark,
    status: 'verified' as const,
  },
  {
    id: 'address',
    title: 'Address Verification',
    description: 'Proof of business address',
    icon: MapPin,
    status: 'verified' as const,
  },
];

function getStatusIcon(status: string) {
  switch (status) {
    case 'verified':
      return <CheckCircle className="w-5 h-5 text-success-500" />;
    case 'pending_review':
      return <Clock className="w-5 h-5 text-warning-500" />;
    case 'rejected':
      return <XCircle className="w-5 h-5 text-error-500" />;
    default:
      return <Clock className="w-5 h-5 text-slate-400" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'verified':
      return <Badge variant="success">Verified</Badge>;
    case 'pending_review':
      return <Badge variant="warning">Under Review</Badge>;
    case 'rejected':
      return <Badge variant="error">Rejected</Badge>;
    case 'not_submitted':
      return <Badge variant="slate">Not Submitted</Badge>;
    default:
      return <Badge variant="slate">{status}</Badge>;
  }
}

function getDocumentLabel(type: string) {
  switch (type) {
    case 'id_proof':
      return 'Government ID';
    case 'business_registration':
      return 'Business Registration';
    case 'bank_statement':
      return 'Bank Statement';
    case 'address_proof':
      return 'Address Proof';
    default:
      return type;
  }
}

export function Verification() {
  const { user } = useAuth();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<string | null>(null);

  const verifiedCount = verificationSteps.filter(s => s.status === 'verified').length;
  const progress = (verifiedCount / verificationSteps.length) * 100;

  // Get KYC status from auth context
  const isFullyVerified = user?.merchant?.kyc_status === 'Verified' || user?.merchant?.status === 'Active';

  const openUploadModal = (docType: string) => {
    setSelectedDocType(docType);
    setShowUploadModal(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Verification</h1>
            <p className="text-sm text-slate-500 mt-1">
              Complete verification to enable live payments
            </p>
          </div>
        </div>

        {isFullyVerified ? (
          <Card className="bg-success-50 border-success-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-success-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-success-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-success-900">
                  Verification Complete
                </h3>
                <p className="text-sm text-success-700">
                  Your account is fully verified. You can accept live payments.
                </p>
              </div>
              <Badge variant="success" size="md">Live Mode Enabled</Badge>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-slate-900">Verification Progress</h3>
                <p className="text-xs text-slate-500">{verifiedCount} of {verificationSteps.length} steps complete</p>
              </div>
              <span className="text-sm font-medium text-slate-900">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </Card>
        )}

        <Card>
          <h3 className="text-lg font-medium text-slate-900 mb-6">Verification Steps</h3>
          <div className="space-y-4">
            {verificationSteps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center
                      ${step.status === 'verified' ? 'bg-success-100' : 'bg-slate-100'}
                    `}>
                      <Icon className={`w-5 h-5 ${step.status === 'verified' ? 'text-success-600' : 'text-slate-500'
                        }`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{step.title}</p>
                      <p className="text-xs text-slate-500">{step.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusIcon(step.status)}
                    {getStatusBadge(step.status)}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-medium text-slate-900 mb-6">Documents</h3>
          <div className="text-center py-8 text-slate-500">
            <p>KYC documents are managed through the Settings → KYC page.</p>
          </div>
          {/* Removed mock KYC documents display - use Settings > KYC page instead */}
          <div className="hidden grid-cols-2 gap-4">
            {[].map((doc: any) => (
              <div
                key={doc.id}
                className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center
                      ${doc.status === 'verified' ? 'bg-success-100' :
                        doc.status === 'rejected' ? 'bg-error-100' :
                          doc.status === 'pending_review' ? 'bg-warning-100' : 'bg-slate-100'}
                    `}>
                      <FileText className={`w-5 h-5 ${doc.status === 'verified' ? 'text-success-600' :
                        doc.status === 'rejected' ? 'text-error-600' :
                          doc.status === 'pending_review' ? 'text-warning-600' : 'text-slate-500'
                        }`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {getDocumentLabel(doc.type)}
                      </p>
                      <p className="text-xs text-slate-500">{doc.fileName}</p>
                    </div>
                  </div>
                  {getStatusBadge(doc.status)}
                </div>

                {doc.rejectionReason && (
                  <div className="mb-3 p-2 bg-error-50 border border-error-100 rounded text-xs text-error-700">
                    <strong>Rejection reason:</strong> {doc.rejectionReason}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Submitted {formatDateTime(doc.submittedAt)}</span>
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 hover:bg-slate-100 rounded transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    {doc.status === 'rejected' && (
                      <Button size="sm" variant="secondary" onClick={() => openUploadModal(doc.type)}>
                        <Upload className="w-3 h-3" />
                        Reupload
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {!isFullyVerified && (
          <Card className="bg-slate-50 border-slate-200">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-900">Need Help?</h3>
                <p className="text-sm text-slate-500 mt-1">
                  If you have questions about verification or need to make changes to your submitted information, our support team is here to help.
                </p>
                <Button variant="secondary" size="sm" className="mt-3">
                  Contact Support
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Document"
        description={`Upload a new ${selectedDocType ? getDocumentLabel(selectedDocType) : 'document'}`}
      >
        <div className="space-y-4">
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-slate-400 transition-colors cursor-pointer">
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-900">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-slate-500 mt-1">
              PDF, JPG, or PNG up to 10MB
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowUploadModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowUploadModal(false)}>
              Upload
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

import { useState } from 'react';
import { FileText, Clock, CheckCircle, AlertTriangle, Building2, Eye, X, Download } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Badge, Button, Tabs, TabsList, TabsTrigger, TabsContent, Modal, useToast } from '../../components/ui';
import { formatRelativeTime } from '../../utils/formatters';
import { useFrappeGetCall } from 'frappe-react-sdk';
import { adminMethods } from '../../services/methods';
import { useAdminKYC } from '../../hooks';

export function KYCReviews() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('status') || searchParams.get('tab') || localStorage.getItem('kyc-reviews-tab') || 'pending';
  const [selectedTab, setSelectedTab] = useState(initialTab);
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [remark, setRemark] = useState('');
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectWarning, setShowRejectWarning] = useState(false);
  const { success: showSuccess, error: showError, warning: showWarning } = useToast();

  // Handle tab change with localStorage persistence
  const handleTabChange = (value: string) => {
    localStorage.setItem('kyc-reviews-tab', value);
    setSelectedTab(value);
  };

  // Use new SDK hook for KYC actions
  const { approveKYC, rejectKYC, approving, rejecting } = useAdminKYC();
  const processing = approving || rejecting;

  // Fetch ALL submissions for stats
  const { data: { message: allSubmissionsData } = {} } = useFrappeGetCall(
    adminMethods.getKYCSubmissions,
    {},
    'admin-kyc-submissions-all'
  );

  const allSubmissions = allSubmissionsData?.submissions || [];

  // Fetch KYC submissions based on selected tab
  const statusMap: Record<string, string | undefined> = {
    pending: 'Submitted',
    approved: 'Approved',
    rejected: 'Rejected'
  };

  const { data: { message: submissionsData } = {}, isLoading: loading, mutate: refetch } = useFrappeGetCall(
    adminMethods.getKYCSubmissions,
    { status: statusMap[selectedTab] },
    `admin-kyc-submissions-${selectedTab}`
  );

  const submissions = submissionsData?.submissions || [];

  // Fetch details for selected merchant
  const { data: { message: merchantDetails } = {}, isLoading: loadingDetails } = useFrappeGetCall(
    selectedMerchant ? adminMethods.getMerchantKYCDetails : '',
    { merchant_id: selectedMerchant?.name || '' },
    selectedMerchant ? `admin-merchant-kyc-details-${selectedMerchant.name}` : null as any
  );

  const openReview = (merchant: any) => {
    setSelectedMerchant(merchant);
    setShowReviewModal(true);
    setSelectedDocuments([]);
    setRemark('');
  };

  const handleApprove = async () => {
    if (!selectedMerchant) return;
    setShowApproveConfirm(true);
  };

  const confirmApprove = async () => {
    if (!selectedMerchant) return;

    try {
      await approveKYC(selectedMerchant.name);
      setShowApproveConfirm(false);
      setShowReviewModal(false);
      refetch();
    } catch (err: any) {
      // Error already shown by hook
    }
  };

  const handleReject = async () => {
    if (!selectedMerchant) return;

    if (!remark.trim()) {
      showWarning('Required', 'Please provide a reason for rejection');
      return;
    }

    if (selectedDocuments.length === 0) {
      setShowRejectWarning(true);
      return;
    }

    await performReject();
  };

  const performReject = async () => {
    if (!selectedMerchant) return;

    try {
      await rejectKYC(selectedMerchant.name, remark, selectedDocuments);
      setShowRejectWarning(false);
      setShowReviewModal(false);
      refetch();
    } catch (err: any) {
      // Error already shown by hook
    }
  };

  const toggleDocumentSelection = (docType: string) => {
    setSelectedDocuments(prev =>
      prev.includes(docType)
        ? prev.filter(d => d !== docType)
        : [...prev, docType]
    );
  };

  // Calculate stats from ALL submissions
  const pendingCount = allSubmissions.filter((s: any) => s.status === 'Submitted').length;
  const approvedCount = allSubmissions.filter((s: any) => s.status === 'Approved').length;
  const rejectedCount = allSubmissions.filter((s: any) => s.status === 'Rejected').length;

  return (
    <DashboardLayout isAdmin>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">KYC Reviews</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review and approve merchant verification documents
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-warning-50 border-warning-200">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-warning-600" />
              <div>
                <p className="text-2xl font-semibold text-warning-700">{pendingCount}</p>
                <p className="text-sm text-warning-600">Pending Review</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-success-500" />
              <div>
                <p className="text-2xl font-semibold text-slate-900">{approvedCount}</p>
                <p className="text-sm text-slate-500">Approved</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-error-500" />
              <div>
                <p className="text-2xl font-semibold text-slate-900">{rejectedCount}</p>
                <p className="text-sm text-slate-500">Rejected</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-slate-400" />
              <div>
                <p className="text-2xl font-semibold text-slate-900">{allSubmissions.length}</p>
                <p className="text-sm text-slate-500">Total</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs value={selectedTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({approvedCount})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejectedCount})</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab}>
            <Card padding="none">
              {loading ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-slate-500">Loading...</p>
                </div>
              ) : submissions.length === 0 ? (
                <div className="py-12 text-center">
                  <CheckCircle className="w-12 h-12 text-success-300 mx-auto mb-4" />
                  <p className="text-sm text-slate-500">No {selectedTab} reviews.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {submissions.map((merchant: any) => (
                    <div
                      key={merchant.name}
                      className="p-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-primary-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-slate-900">{merchant.company_name}</p>
                              {merchant.status === 'Rejected' && (
                                <Badge variant="error">Rejected</Badge>
                              )}
                              {merchant.status === 'Approved' && (
                                <Badge variant="success">Approved</Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-500">{merchant.personal_email}</p>
                            <p className="text-xs text-slate-400 mt-1">
                              Submitted {formatRelativeTime(merchant.modified)}
                            </p>
                            {merchant.remark && (
                              <p className="text-xs text-error-600 mt-1">
                                Remark: {merchant.remark}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button onClick={() => openReview(merchant)}>
                          <Eye className="w-4 h-4" />
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="KYC Document Review"
        description={selectedMerchant?.company_name}
        size="xl"
      >
        {loadingDetails ? (
          <div className="py-12 text-center">
            <p className="text-sm text-slate-500">Loading merchant details...</p>
          </div>
        ) : merchantDetails ? (
          <div className="space-y-6">
            {/* Merchant Info */}
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Company Name</p>
                  <p className="font-medium text-slate-900">{merchantDetails.company_name}</p>
                </div>
                <div>
                  <p className="text-slate-500">Email</p>
                  <p className="font-medium text-slate-900">{merchantDetails.email}</p>
                </div>
                <div>
                  <p className="text-slate-500">Status</p>
                  <Badge variant={
                    merchantDetails.status === 'Approved' ? 'success' :
                      merchantDetails.status === 'Rejected' ? 'error' : 'warning'
                  }>
                    {merchantDetails.status}
                  </Badge>
                </div>
                {merchantDetails.remark && (
                  <div className="col-span-2">
                    <p className="text-slate-500">Previous Remark</p>
                    <p className="text-error-600 text-sm">{merchantDetails.remark}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Documents */}
            <div>
              <h4 className="text-sm font-medium text-slate-900 mb-3">Submitted Documents</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(merchantDetails.documents).map(([key, doc]: [string, any]) => (
                  <div
                    key={key}
                    className={`p-4 border rounded-lg transition-colors ${selectedDocuments.includes(key)
                      ? 'border-error-500 bg-error-50'
                      : 'border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{doc.label}</p>
                          <p className="text-xs text-slate-500">
                            {doc.uploaded ? 'Uploaded' : 'Not uploaded'}
                          </p>
                        </div>
                      </div>
                      {doc.requires_reupload && (
                        <Badge variant="error" size="sm">Re-upload Required</Badge>
                      )}
                    </div>

                    {doc.file_url && (
                      <div className="flex gap-2">
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-xs text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          View Document
                        </a>
                        <a
                          href={doc.file_url}
                          download
                          className="text-xs text-slate-600 hover:text-slate-700 flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </a>
                      </div>
                    )}

                    {selectedTab === 'pending' && doc.uploaded && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedDocuments.includes(key)}
                            onChange={() => toggleDocumentSelection(key)}
                            className="rounded border-slate-300"
                          />
                          <span className="text-xs text-slate-600">Mark for re-upload</span>
                        </label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Review Actions - Only show for pending */}
            {selectedTab === 'pending' && (
              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-sm font-medium text-slate-900 mb-3">Review Action</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Rejection Reason (required if rejecting)
                    </label>
                    <textarea
                      rows={3}
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      placeholder="e.g., Document is blurry, expired, or information doesn't match..."
                    />
                  </div>

                  {selectedDocuments.length > 0 && (
                    <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
                      <p className="text-sm text-warning-800 font-medium mb-1">
                        Documents marked for re-upload:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedDocuments.map(docKey => (
                          <Badge key={docKey} variant="warning" size="sm">
                            {merchantDetails.documents[docKey].label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    variant="secondary"
                    onClick={() => setShowReviewModal(false)}
                    disabled={processing}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleReject}
                    disabled={processing}
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={processing}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-sm text-error-500">Error loading merchant details</p>
          </div>
        )}
      </Modal>

      {/* Approve Confirmation Modal */}
      <Modal
        isOpen={showApproveConfirm}
        onClose={() => setShowApproveConfirm(false)}
        title="Confirm KYC Approval"
      >
        <div className="space-y-4">
          <p className="text-slate-600">
            Are you sure you want to approve <strong>{selectedMerchant?.company_name}</strong>?
          </p>
          <div className="p-3 bg-success-50 text-success-700 text-sm rounded-lg">
            This will mark the merchant as Verified and grant them access to live features.
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="secondary"
              onClick={() => setShowApproveConfirm(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmApprove}
              disabled={processing}
            >
              Confirm Approval
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Warning Modal */}
      <Modal
        isOpen={showRejectWarning}
        onClose={() => setShowRejectWarning(false)}
        title="Reject without Documents?"
      >
        <div className="space-y-4">
          <p className="text-slate-600">
            You are rejecting this application without marking any documents for re-upload.
          </p>
          <div className="p-3 bg-warning-50 text-warning-700 text-sm rounded-lg">
            The merchant will be notified of the rejection with your remarks, but won't be explicitly asked to re-upload specific files.
          </div>
          <p className="text-sm font-medium text-slate-700">Remark provided:</p>
          <div className="p-3 bg-slate-50 text-slate-600 text-sm rounded-lg italic">
            "{remark}"
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="secondary"
              onClick={() => setShowRejectWarning(false)}
              disabled={processing}
            >
              Go Back
            </Button>
            <Button
              variant="danger"
              onClick={performReject}
              disabled={processing}
            >
              Reject Application
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

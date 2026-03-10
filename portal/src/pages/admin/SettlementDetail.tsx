import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useFrappeGetCall, useFrappePostCall } from 'frappe-react-sdk';
import { adminMethods } from '../../services/methods';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { ArrowLeft, Check, X, AlertCircle } from 'lucide-react';
import { useToast } from '../../components/ui';

export function SettlementDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [processing, setProcessing] = useState(false);
    const { success: showSuccess, error: showError } = useToast();

    const { call: approveTopup } = useFrappePostCall(adminMethods.approveTopup);
    const { call: rejectTopup } = useFrappePostCall(adminMethods.rejectTopup);

    const { data: { message: response } = {}, isLoading: loading } = useFrappeGetCall(
        adminMethods.getVANLogDetails,
        { log_id: id },
        `admin-van-log-details-${id}`
    );

    const log = response?.log || response;

    const handleApprove = async () => {
        if (!log) return;

        setProcessing(true);
        try {
            const result = await approveTopup({ log_id: log.id });
            if (result.message?.success) {
                showSuccess('Success', 'Top-up request approved successfully!');
                navigate('/admin/van-logs');
            } else {
                showError('Error', result.message?.message || 'Failed to approve');
            }
        } catch (err: any) {
            showError('Error', err.message || 'Failed to approve top-up');
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!log) return;

        setProcessing(true);
        try {
            const result = await rejectTopup({ log_id: log.id });
            if (result.message?.success) {
                showSuccess('Success', 'Top-up request rejected successfully!');
                navigate('/admin/van-logs');
            } else {
                showError('Error', result.message?.message || 'Failed to reject');
            }
        } catch (err: any) {
            showError('Error', err.message || 'Failed to reject top-up');
        } finally {
            setProcessing(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'Success': 'bg-green-100 text-green-800 border-green-200',
            'Failed': 'bg-red-100 text-red-800 border-red-200',
        };
        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                {status}
            </span>
        );
    };

    if (loading) {
        return (
            <DashboardLayout isAdmin>
                <div className="flex items-center justify-center h-96">
                    <p className="text-slate-500">Loading...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!log) {
        return (
            <DashboardLayout isAdmin>
                <div className="flex flex-col items-center justify-center h-96">
                    <p className="text-slate-500 mb-4">Top-up request not found</p>
                    <button
                        onClick={() => navigate('/admin/van-logs')}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Settlements
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout isAdmin>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin/van-logs')}
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">Top-up Request Details</h1>
                            <p className="text-sm text-slate-500 mt-1">Transaction ID: {log.id}</p>
                        </div>
                    </div>
                    {getStatusBadge(log.status)}
                </div>

                {/* Action Buttons for Pending */}
                {log.status === 'Pending' && (
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowApproveDialog(true)}
                            className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <Check className="w-4 h-4" />
                            Approve Top-up
                        </button>
                        <button
                            onClick={() => setShowRejectDialog(true)}
                            className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                        >
                            <X className="w-4 h-4" />
                            Reject Top-up
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Merchant Information */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Merchant Information</h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider">Merchant Name</p>
                                <p className="text-base font-medium text-slate-900 mt-1">{log.merchant_name || 'Unknown'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider">Virtual Account Number</p>
                                <p className="text-base font-mono text-slate-900 mt-1">{log.account_number}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider">Transaction Type</p>
                                <p className="text-base font-medium text-slate-900 mt-1 capitalize">{log.type || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Remitter Details */}
                    <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
                        <h3 className="text-lg font-semibold text-blue-900 mb-4">Remitter Details</h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-blue-700 uppercase tracking-wider">Remitter Name</p>
                                <p className="text-base font-medium text-blue-900 mt-1">{log.remitter_name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-blue-700 uppercase tracking-wider">Account Number</p>
                                <p className="text-base font-mono text-blue-900 mt-1">{log.remitter_account_number || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-blue-700 uppercase tracking-wider">IFSC Code</p>
                                <p className="text-base font-mono text-blue-900 mt-1">{log.remitter_ifsc_code || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Transaction Details */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 lg:col-span-2">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Transaction Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider">UTR Number</p>
                                <p className="text-base font-mono text-slate-900 mt-1">{log.utr || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider">Amount</p>
                                <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(log.amount || 0)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider">Date & Time</p>
                                <p className="text-base text-slate-900 mt-1">{formatDateTime(log.date)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider">Opening Balance</p>
                                <p className="text-base font-medium text-slate-900 mt-1">{formatCurrency(log.opening_balance || 0)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider">Closing Balance</p>
                                <p className="text-base font-medium text-slate-900 mt-1">{formatCurrency(log.closing_balance || 0)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider">Status</p>
                                <div className="mt-1">{getStatusBadge(log.status)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Approve Dialog */}
            {showApproveDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <Check className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-slate-900">Approve Top-up Request</h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    Are you sure you want to approve this wallet top-up request?
                                </p>
                                <div className="mt-4 p-4 bg-slate-50 rounded-lg space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Merchant:</span>
                                        <span className="font-medium text-slate-900">{log.merchant_name}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Amount:</span>
                                        <span className="font-bold text-green-600">{formatCurrency(log.amount)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">UTR:</span>
                                        <span className="font-mono text-slate-900">{log.utr}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowApproveDialog(false)}
                                disabled={processing}
                                className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleApprove}
                                disabled={processing}
                                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                                {processing ? 'Processing...' : 'Approve'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Dialog */}
            {showRejectDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-slate-900">Reject Top-up Request</h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    Are you sure you want to reject this wallet top-up request?
                                </p>
                                <div className="mt-4 p-4 bg-slate-50 rounded-lg space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Merchant:</span>
                                        <span className="font-medium text-slate-900">{log.merchant_name}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Amount:</span>
                                        <span className="font-bold text-red-600">{formatCurrency(log.amount)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">UTR:</span>
                                        <span className="font-mono text-slate-900">{log.utr}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowRejectDialog(false)}
                                disabled={processing}
                                className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={processing}
                                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                                {processing ? 'Processing...' : 'Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

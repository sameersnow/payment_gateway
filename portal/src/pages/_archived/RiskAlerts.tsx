import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, CheckCircle, Clock, Eye, Ban, AlertTriangle } from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import { Card, Badge, Button, Modal } from '../../components/ui';
import { riskAlerts } from '../../data/mockData';
import { formatDateTime, truncateId } from '../../utils/formatters';

export function RiskAlerts() {
    const navigate = useNavigate();
    const [selectedAlert, setSelectedAlert] = useState<typeof riskAlerts[0] | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const openDetail = (alert: typeof riskAlerts[0]) => {
        setSelectedAlert(alert);
        setShowDetailModal(true);
    };

    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'high':
                return <Badge variant="error" dot>High</Badge>;
            case 'medium':
                return <Badge variant="warning" dot>Medium</Badge>;
            case 'low':
                return <Badge variant="slate" dot>Low</Badge>;
            default:
                return <Badge variant="slate">{severity}</Badge>;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'open':
                return <Badge variant="error">Open</Badge>;
            case 'investigating':
                return <Badge variant="warning">Investigating</Badge>;
            case 'resolved':
                return <Badge variant="success">Resolved</Badge>;
            default:
                return <Badge variant="slate">{status}</Badge>;
        }
    };

    return (
        <DashboardLayout isAdmin>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">Risk Alerts</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Monitor and resolve high-risk transactions and activities
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-error-50 border-error-200">
                        <div className="flex items-center gap-3">
                            <ShieldAlert className="w-8 h-8 text-error-600" />
                            <div>
                                <p className="text-2xl font-semibold text-error-700">
                                    {riskAlerts.filter(a => a.status === 'open').length}
                                </p>
                                <p className="text-sm text-error-600">Open Alerts</p>
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <div className="flex items-center gap-3">
                            <Clock className="w-8 h-8 text-warning-500" />
                            <div>
                                <p className="text-2xl font-semibold text-slate-900">
                                    {riskAlerts.filter(a => a.status === 'investigating').length}
                                </p>
                                <p className="text-sm text-slate-500">Investigating</p>
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-8 h-8 text-success-500" />
                            <div>
                                <p className="text-2xl font-semibold text-slate-900">
                                    {riskAlerts.filter(a => a.status === 'resolved').length}
                                </p>
                                <p className="text-sm text-slate-500">Resolved Today</p>
                            </div>
                        </div>
                    </Card>
                </div>

                <Card padding="none">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Alert Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Severity</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Merchant</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Details</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {riskAlerts.map((alert) => (
                                    <tr key={alert.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle className="w-4 h-4 text-warning-500" />
                                                <span className="text-sm font-medium text-slate-900 capitalize">
                                                    {alert.type.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getSeverityBadge(alert.severity)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-slate-900">{alert.merchantName}</p>
                                            <p className="text-xs text-secondary-500 hover:text-primary-600 cursor-pointer" onClick={() => navigate(`/admin/merchants/${alert.merchantId}`)}>
                                                {truncateId(alert.merchantId)}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-slate-600 truncate max-w-xs">{alert.details}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(alert.status)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-500">{formatDateTime(alert.createdAt)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button variant="secondary" size="sm" onClick={() => openDetail(alert)}>
                                                <Eye className="w-3 h-3" />
                                                Details
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            <Modal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                title="Alert Details"
                description={`Alert ID: ${selectedAlert?.id}`}
                size="lg"
            >
                {selectedAlert && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <h4 className="text-sm font-medium text-slate-900 mb-2">Alert Information</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between py-2 border-b border-slate-100">
                                        <span className="text-slate-500">Type</span>
                                        <span className="font-medium capitalize">{selectedAlert.type.replace('_', ' ')}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-slate-100">
                                        <span className="text-slate-500">Severity</span>
                                        {getSeverityBadge(selectedAlert.severity)}
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-slate-100">
                                        <span className="text-slate-500">Status</span>
                                        {getStatusBadge(selectedAlert.status)}
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-slate-100">
                                        <span className="text-slate-500">Date</span>
                                        <span>{formatDateTime(selectedAlert.createdAt)}</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-slate-900 mb-2">Merchant & Transaction</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between py-2 border-b border-slate-100">
                                        <span className="text-slate-500">Merchant</span>
                                        <span className="text-primary-600 cursor-pointer">{selectedAlert.merchantName}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-slate-100">
                                        <span className="text-slate-500">Transaction ID</span>
                                        <span className="font-mono text-xs">{selectedAlert.transactionId}</span>
                                    </div>
                                </div>
                                <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
                                    <p className="text-xs font-medium text-red-800 mb-1">Risk Details</p>
                                    <p className="text-sm text-red-700">{selectedAlert.details}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                            <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
                                Cancel
                            </Button>
                            <Button variant="danger" leftIcon={<Ban className="w-4 h-4" />}>
                                Suspend Merchant
                            </Button>
                            <Button onClick={() => setShowDetailModal(false)}>
                                <CheckCircle className="w-4 h-4" />
                                Resolve Alert
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </DashboardLayout>
    );
}


import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowLeft, RefreshCw, AlertTriangle, CheckCircle, XCircle, Search } from 'lucide-react';
import { Card, Button, Modal } from '../../components/ui';
import { formatDateTime } from '../../utils/formatters';
import { useWebhooks } from '../../hooks';

function getStatusColor(status: string) {
    switch (status) {
        case 'Success':
            return 'text-success-600';
        case 'Failed':
        case 'Error':
            return 'text-error-600';
        default:
            return 'text-warning-600';
    }
}

function getStatusIcon(status: string) {
    switch (status) {
        case 'Success':
            return <CheckCircle className="w-4 h-4 text-success-500" />;
        case 'Failed':
        case 'Error':
            return <XCircle className="w-4 h-4 text-error-500" />;
        default:
            return <AlertTriangle className="w-4 h-4 text-warning-500" />;
    }
}

export function WebhookLogs() {
    const { webhookId } = useParams();
    const navigate = useNavigate();
    const [selectedLog, setSelectedLog] = useState<any | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const pageSize = 20;

    // Fetch logs using the centralized hook
    const { webhooks, logs, logsLoading: loading, refreshLogs } = useWebhooks();

    // Find current webhook to filter logs (if accessing via specific webhook route)
    const currentWebhook = webhooks.find(w => w.name === webhookId);

    // Client-side filtering if searching
    const filteredLogs = logs.filter((log: any) => {
        // Filter by webhook if we are in specific webhook view
        if (currentWebhook && log.url !== currentWebhook.url) return false;

        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            log.url?.toLowerCase().includes(query) ||
            log.data?.toLowerCase().includes(query) ||
            log.response?.toLowerCase().includes(query)
        );
    });

    // Pagination logic (client-side since hook fetches all/limit 100)
    const total = filteredLogs.length;
    const totalPages = Math.ceil(total / pageSize);
    const paginatedLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize);

    const viewDetails = (log: any) => {
        setSelectedLog(log);
        setShowDetailModal(true);
    };

    const formatJson = (jsonString: string) => {
        try {
            if (!jsonString) return 'No data';
            if (typeof jsonString === 'object') return JSON.stringify(jsonString, null, 2);
            const parsed = JSON.parse(jsonString);
            return JSON.stringify(parsed, null, 2);
        } catch (e) {
            return jsonString;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" className="p-2" onClick={() => navigate('/developers/webhooks')}>
                        <ArrowLeft className="w-5 h-5 text-slate-500" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">Webhook Logs</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Delivery history for webhook endpoint
                        </p>
                    </div>
                </div>
                <Button variant="secondary" onClick={() => refreshLogs()} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <Card padding="none">
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by URL, status, or payload content..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow"
                        />
                    </div>
                </div>

                <div className="divide-y divide-slate-100">
                    {loading && logs.length === 0 ? (
                        <div className="py-12 text-center">
                            <p className="text-sm text-slate-500">Loading logs...</p>
                        </div>
                    ) : paginatedLogs.length > 0 ? (
                        paginatedLogs.map((log: any) => {
                            // Infer status if not provided (DocType usually has status, but if not: error -> Failed, else Success)
                            const status = log.status || (log.error ? 'Failed' : 'Success');
                            return (
                                <div
                                    key={log.id}
                                    className="flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                                    onClick={() => viewDetails(log)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="min-w-[40px] flex justify-center">
                                            {getStatusIcon(status)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-sm font-medium ${getStatusColor(status)}`}>
                                                    {status}
                                                </span>
                                                {log.error && (
                                                    <span className="text-xs text-error-600 bg-error-50 px-2 py-0.5 rounded-full truncate max-w-[200px]">
                                                        {log.error}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-500 font-mono">{log.url}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500">
                                                {formatDateTime(log.creation)}
                                            </p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-400" />
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="py-12 text-center">
                            <p className="text-sm text-slate-500">
                                {searchQuery ? 'No logs match your search' : 'No logs found'}
                            </p>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                        Showing {logs.length} of {total} logs
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                        >
                            Previous
                        </Button>
                        <span className="text-sm text-slate-600">
                            Page {page} of {totalPages || 1}
                        </span>
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => p + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </Card>

            <Modal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                title="Delivery Details"
                description={selectedLog ? `Delivery to ${selectedLog.url}` : ''}
                size="lg"
            >
                {selectedLog && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Status</p>
                                <div className="flex items-center gap-2">
                                    {getStatusIcon(selectedLog.status || (selectedLog.error ? 'Failed' : 'Success'))}
                                    <span className={`text-sm font-medium ${getStatusColor(selectedLog.status || (selectedLog.error ? 'Failed' : 'Success'))}`}>
                                        {selectedLog.status || (selectedLog.error ? 'Failed' : 'Success')}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Timestamp</p>
                                <p className="text-sm font-medium text-slate-900">
                                    {formatDateTime(selectedLog.creation)}
                                </p>
                            </div>
                        </div>

                        {selectedLog.error && (
                            <div className="bg-error-50 p-3 rounded-lg border border-error-100">
                                <p className="text-xs font-semibold text-error-700 uppercase mb-1">Error</p>
                                <p className="text-sm text-error-800 font-mono break-all">{selectedLog.error}</p>
                            </div>
                        )}

                        <div>
                            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Request Payload</h4>
                            <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                                <pre className="text-sm text-slate-100 font-mono">
                                    {formatJson(selectedLog.data)}
                                </pre>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Response Body</h4>
                            <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                                <pre className="text-sm text-slate-100 font-mono">
                                    {formatJson(selectedLog.response)}
                                </pre>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div >
    );
}

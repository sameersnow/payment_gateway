import { useState, useEffect } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { Card, Button, Modal } from '../../components/ui';
import { formatDateTime } from '../../utils/formatters';
import { useFrappeGetCall } from 'frappe-react-sdk';
import { merchantMethods } from '../../services';
import { useDebounce } from '../../hooks';

function getMethodColor(method: string) {
  switch (method) {
    case 'GET':
      return 'bg-primary-100 text-primary-700';
    case 'POST':
      return 'bg-success-100 text-success-700';
    case 'PUT':
      return 'bg-warning-100 text-warning-700';
    case 'DELETE':
      return 'bg-error-100 text-error-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

function getStatusColor(status: number) {
  if (status >= 200 && status < 300) return 'text-success-600';
  if (status >= 400 && status < 500) return 'text-warning-600';
  if (status >= 500) return 'text-error-600';
  return 'text-slate-600';
}

export function APILogs() {

  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [methodFilter, setMethodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // Build filter data
  const filterData: any = {};
  if (methodFilter !== 'all') filterData.method = methodFilter;
  if (statusFilter === 'success') filterData.status_code = 200;
  if (statusFilter === 'error') filterData.status_code = 400;
  if (debouncedSearch) filterData.endpoint = debouncedSearch;

  const { data: { message: logsData } = {}, isLoading: loading } = useFrappeGetCall(
    merchantMethods.getAPILogs,
    { page, page_size: pageSize, filter_data: filterData },
    ['api-logs', page, methodFilter, statusFilter, debouncedSearch]
  );

  const logs = logsData?.logs || [];
  const total = logsData?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const viewDetails = (log: any) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">API Logs</h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor your API request history
          </p>
        </div>
      </div>

      <Card padding="none">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by endpoint..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-colors"
              />
            </div>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
            >
              <option value="all">All methods</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
            >
              <option value="all">All statuses</option>
              <option value="success">Success (2xx)</option>
              <option value="error">Error (4xx, 5xx)</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="py-12 text-center">
              <p className="text-sm text-slate-500">Loading logs...</p>
            </div>
          ) : logs.length > 0 ? (
            logs.map((log: any) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => viewDetails(log)}
              >
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getMethodColor(log.method)}`}>
                    {log.method}
                  </span>
                  <div>
                    <p className="text-sm font-mono text-slate-900">{log.endpoint}</p>
                    <p className="text-xs text-slate-500">
                      {formatDateTime(log.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`text-sm font-medium ${getStatusColor(log.status_code)}`}>
                      {log.status_code}
                    </p>
                    <p className="text-xs text-slate-500">{log.ip_address || 'N/A'}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm text-slate-500">No logs found</p>
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
        title="Request Details"
        description={selectedLog ? `${selectedLog.method} ${selectedLog.endpoint}` : ''}
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Status</p>
                <p className={`text-sm font-medium ${getStatusColor(selectedLog.status_code)}`}>
                  {selectedLog.status_code}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">IP Address</p>
                <p className="text-sm font-medium text-slate-900">{selectedLog.ip_address || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Timestamp</p>
                <p className="text-sm font-medium text-slate-900">
                  {formatDateTime(selectedLog.timestamp)}
                </p>
              </div>
            </div>

            {selectedLog.request_data && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Request Data
                </label>
                <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-slate-100 font-mono">
                    {typeof selectedLog.request_data === 'string'
                      ? selectedLog.request_data
                      : JSON.stringify(selectedLog.request_data, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Response Data
              </label>
              <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-slate-100 font-mono">
                  {selectedLog.response_data
                    ? (typeof selectedLog.response_data === 'string'
                      ? selectedLog.response_data
                      : JSON.stringify(selectedLog.response_data, null, 2))
                    : 'No response data'}
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

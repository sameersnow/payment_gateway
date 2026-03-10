import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import {
  ArrowLeft, Copy, CheckCircle, XCircle, Eye, EyeOff,
  RefreshCw, Webhook, Clock
} from 'lucide-react';
import { Card, Badge, Button, Modal } from '../../components/ui';
import { webhooks, webhookLogs } from '../../data/mockData';
import { formatDateTime } from '../../utils/formatters';

export function WebhookDetail() {
  const { id } = useParams();
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPayloadModal, setShowPayloadModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<typeof webhookLogs[0] | null>(null);

  const webhook = webhooks.find((w) => w.id === id);
  const logs = webhookLogs.filter((l) => l.webhookId === id);

  if (!webhook) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-medium text-slate-900">Webhook not found</h2>
        <Link to="/developers/webhooks" className="text-primary-600 hover:text-primary-700 mt-2 inline-block">
          Back to webhooks
        </Link>
      </div>
    );
  }

  const copySecret = () => {
    navigator.clipboard.writeText(webhook.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const viewPayload = (log: typeof webhookLogs[0]) => {
    setSelectedLog(log);
    setShowPayloadModal(true);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            to="/developers/webhooks"
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-slate-900 font-mono truncate">
                {webhook.url}
              </h1>
              <Badge variant={webhook.status === 'active' ? 'success' : 'slate'} dot>
                {webhook.status}
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Created {formatDateTime(webhook.createdAt)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <Card>
              <h3 className="text-sm font-medium text-slate-900 mb-4">Recent Deliveries</h3>
              {logs.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No webhook deliveries yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      onClick={() => viewPayload(log)}
                    >
                      <div className="flex items-center gap-3">
                        {log.status === 'delivered' ? (
                          <CheckCircle className="w-5 h-5 text-success-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-error-500" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-slate-900 font-mono">
                            {log.event}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDateTime(log.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {log.responseCode && (
                          <Badge variant={log.status === 'delivered' ? 'success' : 'error'}>
                            {log.responseCode}
                          </Badge>
                        )}
                        {log.status === 'failed' && (
                          <Button variant="secondary" size="sm">
                            <RefreshCw className="w-3 h-3" />
                            Retry
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <h3 className="text-sm font-medium text-slate-900 mb-4">Signing Secret</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono text-slate-600 bg-slate-100 px-3 py-2 rounded-lg truncate">
                    {showSecret ? webhook.secret : '•'.repeat(32)}
                  </code>
                  <button
                    onClick={() => setShowSecret(!showSecret)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    {showSecret ? (
                      <EyeOff className="w-4 h-4 text-slate-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                  <button
                    onClick={copySecret}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4 text-success-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Use this secret to verify webhook signatures
                </p>
              </div>
            </Card>

            <Card>
              <h3 className="text-sm font-medium text-slate-900 mb-4">Subscribed Events</h3>
              <div className="space-y-2">
                {webhook.events.map((event) => (
                  <div
                    key={event}
                    className="text-sm font-mono text-slate-700 bg-slate-100 px-3 py-2 rounded-lg"
                  >
                    {event}
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="text-sm font-medium text-slate-900 mb-4">Delivery Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-semibold text-success-600">
                    {logs.filter(l => l.status === 'delivered').length}
                  </p>
                  <p className="text-xs text-slate-500">Successful</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-error-600">
                    {logs.filter(l => l.status === 'failed').length}
                  </p>
                  <p className="text-xs text-slate-500">Failed</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showPayloadModal}
        onClose={() => setShowPayloadModal(false)}
        title="Webhook Payload"
        description={selectedLog ? `${selectedLog.event} - ${formatDateTime(selectedLog.createdAt)}` : ''}
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Badge variant={selectedLog.status === 'delivered' ? 'success' : 'error'}>
                {selectedLog.status}
              </Badge>
              {selectedLog.responseCode && (
                <span className="text-sm text-slate-500">
                  HTTP {selectedLog.responseCode}
                </span>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Request Payload
              </label>
              <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-slate-100 font-mono">
                  {JSON.stringify(JSON.parse(selectedLog.payload), null, 2)}
                </pre>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowPayloadModal(false)}>
                Close
              </Button>
              {selectedLog.status === 'failed' && (
                <Button>
                  <RefreshCw className="w-4 h-4" />
                  Retry Delivery
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import {
  ArrowLeft, Copy, CheckCircle, User, Building,
  TrendingUp
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import { Card, Badge } from '../../components/ui';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { useFrappeGetCall } from 'frappe-react-sdk';
import { merchantMethods } from '../../services';

function getStatusBadge(status: string) {
  const statusLower = status?.toLowerCase() || '';

  if (statusLower.includes('success') || statusLower.includes('approved')) {
    return <Badge variant="success" dot size="md">Success</Badge>;
  } else if (statusLower.includes('pending')) {
    return <Badge variant="warning" dot size="md">Pending</Badge>;
  } else if (statusLower.includes('fail')) {
    return <Badge variant="error" dot size="md">Failed</Badge>;
  }
  return <Badge variant="slate" size="md">{status}</Badge>;
}

export function SettlementDetail() {
  const { id } = useParams();
  const [copied, setCopied] = useState(false);

  // Use getSettlementDetails instead of getLedgerDetails
  // Use getSettlementDetails instead of getLedgerDetails
  const { data: { message: entry } = {}, isLoading: loading } = useFrappeGetCall(
    merchantMethods.getSettlementDetails,
    { settlement_id: id },
    ['settlement-detail', id]
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  if (!entry) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-lg font-medium text-slate-900">Settlement entry not found</h2>
          <Link to="/settlements" className="text-primary-600 hover:text-primary-700 mt-2 inline-block">
            Back to settlements
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  // VAN Logs are typically credits (deposits)


  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            to="/settlements"
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-900">
                {formatCurrency(entry.amount || 0)}
              </h1>
              {getStatusBadge(entry.status || 'Unknown')}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-slate-500 font-mono">{entry.name}</span>
              <button
                onClick={() => copyToClipboard(entry.name)}
                className="p-1 hover:bg-slate-100 rounded transition-colors"
              >
                {copied ? (
                  <CheckCircle className="w-4 h-4 text-success-500" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-400" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <Card>
              <h3 className="text-sm font-medium text-slate-900 mb-4">Transaction Details</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Transaction Type</p>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-success-500" />
                    <p className="text-sm font-medium text-slate-900 capitalize">
                      Settlement
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Amount</p>
                  <p className="text-sm font-medium text-slate-900">
                    {formatCurrency(entry.amount || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Payment Mode</p>
                  <p className="text-sm font-medium text-slate-900 capitalize">
                    {entry.payment_mode || 'Bank Transfer'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">UTR Number</p>
                  <p className="text-sm font-medium text-slate-900 font-mono">
                    {entry.utr || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Transaction Date</p>
                  <p className="text-sm font-medium text-slate-900">
                    {formatDateTime(entry.date || entry.creation)}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            {entry.remitter_name && (
              <Card>
                <h3 className="text-sm font-medium text-slate-900 mb-4">Remitter Details</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {entry.remitter_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {entry.remitter_account_number ? `Account: ${entry.remitter_account_number}` : 'Remitter'}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            <Card>
              <h3 className="text-sm font-medium text-slate-900 mb-4">Balance Summary</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Building className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {formatCurrency(entry.opening_balance || 0)}
                    </p>
                    <p className="text-xs text-slate-500">Opening Balance</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-success-50 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-success-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-success-600">
                      +{formatCurrency(entry.amount || 0)}
                    </p>
                    <p className="text-xs text-slate-500">Settled Amount</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                      <Building className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatCurrency(entry.closing_balance || 0)}
                      </p>
                      <p className="text-xs text-slate-500">Closing Balance</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

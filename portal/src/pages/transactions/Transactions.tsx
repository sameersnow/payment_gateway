import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Download } from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import { Card, Badge, Button } from '../../components/ui';
import { formatCurrency, formatDateTime, truncateId } from '../../utils/formatters';
import { useFrappeGetCall } from 'frappe-react-sdk';
import { merchantMethods } from '../../services';
import { useExportData } from '../../hooks';

function getStatusBadge(status: string) {
  const statusLower = status?.toLowerCase() || '';

  if (statusLower.includes('success') || statusLower.includes('paid')) {
    return <Badge variant="success" dot>Success</Badge>;
  } else if (statusLower.includes('pending') || statusLower.includes('processing')) {
    return <Badge variant="warning" dot>Pending</Badge>;
  } else if (statusLower.includes('fail') || statusLower.includes('cancelled')) {
    return <Badge variant="error" dot>Failed</Badge>;
  } else if (statusLower.includes('refund')) {
    return <Badge variant="slate" dot>Refunded</Badge>;
  }
  return <Badge variant="slate">{status}</Badge>;
}

export function Transactions() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  // Initialize status filter from localStorage
  const [statusFilter, setStatusFilter] = useState(localStorage.getItem('merchant-transactions-status') || 'all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Build filter data
  const filterData = statusFilter !== 'all' ? { status: statusFilter } : undefined;

  // Initialize export hook
  const { exportData, loading: exporting } = useExportData(merchantMethods.exportTransactions);

  // Fetch transactions using frappe-react-sdk
  const { data: { message: transactionsData } = {}, isLoading: loading } = useFrappeGetCall(
    merchantMethods.getTransactions,
    {
      page: currentPage,
      page_size: pageSize,
      filter_data: filterData
    },
    ['transactions', currentPage, statusFilter]
  );

  const transactions = transactionsData?.transactions || [];
  const total = transactionsData?.total || 0;

  // Filter by search query
  const filteredTransactions = transactions.filter((txn: any) =>
    searchQuery === '' ||
    txn.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    txn.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    txn.customer_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle export
  const handleExport = async () => {
    await exportData(filterData);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Transactions</h1>
            <p className="text-sm text-slate-500 mt-1">
              View and manage all payment transactions
            </p>
          </div>
          <Button variant="secondary" onClick={handleExport} disabled={exporting}>
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>

        <div className="flex gap-2">
          {(['all', 'Success', 'Pending', 'Failed', 'Refunded'] as const).map((status) => (
            <button
              key={status}
              onClick={() => {
                localStorage.setItem('merchant-transactions-status', status);
                setStatusFilter(status);
              }}
              className={`
                px-4 py-2 text-sm font-medium rounded-lg transition-colors
                ${statusFilter === status
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }
              `}
            >
              {status === 'all' ? 'All' : status}
            </button>
          ))}
        </div>

        <Card padding="none">
          <div className="p-4 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by ID, customer name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-sm text-slate-500 mt-4">Loading transactions...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Transaction ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Payment Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredTransactions.map((transaction: any) => (
                      <tr
                        key={transaction.id}
                        onClick={() => navigate(`/transactions/${transaction.id}`)}
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-slate-900 font-mono">
                              {truncateId(transaction.id || transaction.name, 16)}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                              {truncateId(transaction.order_id, 16)}
                            </p>

                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm text-slate-900">{transaction.customer_name || '-'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(transaction.status)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-700 capitalize">
                            {transaction.payment_method?.replace('_', ' ') || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-500">
                            {formatDateTime(transaction.creation || transaction.created_at)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-medium text-slate-900">
                            {formatCurrency(transaction.amount)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredTransactions.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-sm text-slate-500">No transactions found</p>
                </div>
              )}

              <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Showing {filteredTransactions.length} of {total} transactions
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={transactions.length < pageSize}
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}

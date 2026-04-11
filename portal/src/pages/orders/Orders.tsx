import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Download, Plus, Clock, Calendar } from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import { Card, Badge, Button, Select, Modal, DateTimePicker, useToast } from '../../components/ui';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { useFrappeGetCall } from 'frappe-react-sdk';
import { merchantMethods } from '../../services';
import { CreateOrderModal, ImportOrdersModal } from '../../components/orders';
import { useExportData } from '../../hooks';
import { format, subDays, parseISO } from 'date-fns';

function getStatusBadge(status: string) {
  const statusLower = status?.toLowerCase() || '';

  if (statusLower.includes('processed') || statusLower.includes('success') || statusLower === 'paid') {
    return <Badge variant="success" dot>Processed</Badge>;
  } else if (statusLower.includes('processing') || statusLower.includes('pending')) {
    return <Badge variant="warning" dot>Processing</Badge>;
  } else if (statusLower.includes('cancelled') || statusLower.includes('fail') || statusLower.includes('reversed')) {
    return <Badge variant="error" dot>Cancelled</Badge>;
  } else if (statusLower.includes('refunded')) {
    return <Badge variant="slate" dot>Refunded</Badge>;
  }
  return <Badge variant="slate">{status}</Badge>;
}

export function Orders() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  // Initialize status filter from localStorage
  const [statusFilter, setStatusFilter] = useState(localStorage.getItem('merchant-orders-status') || 'all');
  const [orderTypeFilter, setOrderTypeFilter] = useState(localStorage.getItem('merchant-orders-type') || 'all');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Date filter state
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  const [isCustomRangeModalOpen, setIsCustomRangeModalOpen] = useState(false);
  const [tempDates, setTempDates] = useState<{ start?: string; end?: string }>({ 
    start: undefined, 
    end: undefined 
  });

  const { exportData, loading: exporting } = useExportData(merchantMethods.exportOrders);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const pageSize = 20;

  const activeFilterCount = [
    orderTypeFilter !== 'all',
    !!startDate,
    !!endDate
  ].filter(Boolean).length;

  const handleApplyCustomRange = () => {
    if (tempDates.start && tempDates.end) {
      if (new Date(tempDates.start) > new Date(tempDates.end)) {
        toast({
          title: "Invalid Range",
          message: "Start date cannot be after end date",
          type: "error"
        });
        return;
      }
      setStartDate(tempDates.start);
      setEndDate(tempDates.end);
      setIsCustomRangeModalOpen(false);
      setCurrentPage(1);
    }
  };

  const clearDateFilter = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setTempDates({ start: undefined, end: undefined });
    setCurrentPage(1);
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Build filter data
  const filterData = {
    ...(statusFilter !== 'all' && { status: statusFilter }),
    ...(orderTypeFilter !== 'all' && { order_type: orderTypeFilter }),
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(startDate && { from_date: startDate }),
    ...(endDate && { to_date: endDate }),
  };

  // Fetch orders with filters using frappe-react-sdk
  const { data: { message: ordersData } = {}, isLoading: loading, mutate: refetch } = useFrappeGetCall(
    merchantMethods.getOrders,
    {
      page: currentPage,
      page_size: pageSize,
      sort_by: 'creation',
      sort_order: 'desc',
      filter_data: Object.keys(filterData).length > 0 ? filterData : undefined
    },
    ['orders', currentPage, pageSize, statusFilter, orderTypeFilter, debouncedSearch, startDate, endDate]
  );

  const orders = ordersData?.orders || [];
  const total = ordersData?.total || 0;

  // Handle export
  const handleExport = async () => {
    await exportData(filterData);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Orders</h1>
            <p className="text-sm text-slate-500 mt-1">
              View and manage customer orders
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleExport} disabled={exporting}>
              <Download className="w-4 h-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export'}
            </Button>
            {/* <Button variant="secondary" onClick={() => setShowImportModal(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button> */}
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Order
            </Button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {(['all', 'Processed', 'Pending', 'Cancelled', 'Refunded'] as const).map((status) => (
            <button
              key={status}
              onClick={() => {
                localStorage.setItem('merchant-orders-status', status);
                setStatusFilter(status);
              }}
              className={`
                px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap
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
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-colors"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`
                flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap border
                ${showFilters 
                  ? 'bg-slate-900 text-white border-slate-900' 
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }
              `}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${showFilters ? 'bg-primary-500 text-white' : 'bg-primary-600 text-white'}`}>
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          <div 
            className={`
              overflow-hidden transition-all duration-300 ease-in-out border-b border-slate-200 bg-slate-50/50
              ${showFilters ? 'max-h-96 opacity-100 py-4 px-4' : 'max-h-0 opacity-0'}
            `}
          >
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Order Type Filter */}
              <div className="w-full sm:w-64">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Order Type
                </label>
                <Select
                  value={orderTypeFilter}
                  onChange={(e) => {
                    setOrderTypeFilter(e.target.value);
                    localStorage.setItem('merchant-orders-type', e.target.value);
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: 'all', label: 'All Types' },
                    { value: 'Payin', label: 'Payin' },
                    { value: 'Payout', label: 'Payout' }
                  ]}
                />
              </div>

              {/* Date Range Selection */}
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Date Range
                </label>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="secondary" 
                    onClick={() => {
                      setTempDates({ start: startDate, end: endDate });
                      setIsCustomRangeModalOpen(true);
                    }}
                    className={`w-full justify-start font-normal ${startDate || endDate ? "border-primary-500 bg-primary-50 text-primary-700" : "bg-white"}`}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    {startDate && endDate ? (
                      `${format(parseISO(startDate), 'MMM d, yyyy HH:mm')} - ${format(parseISO(endDate), 'MMM d, yyyy HH:mm')}`
                    ) : "Select date range..."}
                  </Button>
                  {(startDate || endDate) && (
                    <Button variant="ghost" size="sm" onClick={clearDateFilter} className="text-slate-500 hover:text-error-600">
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-sm text-slate-500 mt-4">Loading orders...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Order
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {orders.map((order: any) => (
                      <tr
                        key={order.id}
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-slate-900 font-mono">
                            {order.id}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-slate-900">{order.customer || 'N/A'}</p>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-500">
                            {formatDateTime(order.date)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-medium text-slate-900">
                            {formatCurrency(order.amount)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {orders.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-sm text-slate-500">No orders found</p>
                </div>
              )}

              <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Showing {orders.length} of {total} orders
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
                    disabled={orders.length < pageSize}
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

      <CreateOrderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => refetch()}
      />

      <ImportOrdersModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => refetch()}
      />

      <Modal
        isOpen={isCustomRangeModalOpen}
        onClose={() => setIsCustomRangeModalOpen(false)}
        title="Select Date Range"
      >
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary-500" />
                START DATE & TIME
              </label>
              <DateTimePicker
                value={tempDates.start || format(subDays(new Date(), 30), "yyyy-MM-dd'T'HH:mm:ss")}
                onChange={(date) => setTempDates(prev => ({ ...prev, start: date }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary-500" />
                END DATE & TIME
              </label>
              <DateTimePicker
                value={tempDates.end || format(new Date(), "yyyy-MM-dd'T'HH:mm:ss")}
                onChange={(date) => setTempDates(prev => ({ ...prev, end: date }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsCustomRangeModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApplyCustomRange}>
              Apply Range
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

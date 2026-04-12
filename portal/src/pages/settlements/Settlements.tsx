import { useState } from 'react';
import { Download, Clock, CheckCircle, Building, Calendar, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Badge, Button, Modal, DateTimePicker } from '../../components/ui';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useFrappeGetCall } from 'frappe-react-sdk';
import { merchantMethods } from '../../services';
import { useExportData } from '../../hooks';
import { format, parseISO } from 'date-fns';

export function Settlements() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>(
    (localStorage.getItem('merchant-settlements-tab') as 'upcoming' | 'completed') || 'upcoming'
  );
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  const [isCustomRangeModalOpen, setIsCustomRangeModalOpen] = useState(false);
  const [tempDates, setTempDates] = useState<{ start?: string; end?: string }>({ 
    start: undefined, 
    end: undefined 
  });
  // const [exporting, setExporting] = useState(false);
  const { exportData, loading: exporting } = useExportData(merchantMethods.exportVANLogs);

  // Fetch VAN account for payout account display
  const { data: { message: vanAccount } = {} } = useFrappeGetCall(
    merchantMethods.getVANAccount,
    undefined,
    'van-account'
  );

  // Build filters
  const filters: any = {};
  if (startDate) filters.from_date = startDate;
  if (endDate) filters.to_date = endDate;

  // Fetch VAN logs - Now includes stats in the response
  const { data: { message: vanData } = {}, isLoading: loading } = useFrappeGetCall(
    merchantMethods.getVANLogs,
    {
      page: 1,
      page_size: 100,
      filter_data: Object.keys(filters).length > 0 ? filters : undefined
    },
    `van-logs-merchant-${JSON.stringify(filters)}`
  );

  const stats = vanData?.stats;
  const logs = vanData?.logs || [];

  // Separate upcoming (pending) and completed settlements
  const upcomingSettlements = logs.filter((log: any) =>
    log.status?.toLowerCase().includes('pending')
  );
  const completedSettlements = logs.filter((log: any) =>
    !log.status?.toLowerCase().includes('pending')
  );

  const displayedSettlements = activeTab === 'upcoming' ? upcomingSettlements : completedSettlements;

  // Get next payout date from upcoming settlements
  const nextPayoutDate = upcomingSettlements.length > 0
    ? formatDate(upcomingSettlements[0].date)
    : 'No upcoming payouts';

  // Handle export
  const handleExport = async () => {
    await exportData(filters);
  };

  const handleApplyCustomRange = () => {
    if (tempDates.start && tempDates.end) {
      if (new Date(tempDates.start) > new Date(tempDates.end)) {
        // We don't have useToast here yet, but let's assume it's available or use alert
        alert('Start date cannot be after end date');
        return;
      }
      setStartDate(tempDates.start);
      setEndDate(tempDates.end);
      setIsCustomRangeModalOpen(false);
    }
  };

  const clearDateFilter = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setTempDates({ start: undefined, end: undefined });
  };

  const activeFilterCount = [
    !!startDate,
    !!endDate
  ].filter(Boolean).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Settlements</h1>
            <p className="text-sm text-slate-500 mt-1">
              View your payout schedule and settlement history
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 ${showFilters ? 'bg-slate-100 border-slate-300' : ''}`}
            >
              <Search className="w-4 h-4" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-primary-600 text-white rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            <Button variant="secondary" onClick={handleExport} disabled={exporting}>
              <Download className="w-4 h-4" />
              {exporting ? 'Downloading...' : 'Download Statement'}
            </Button>
          </div>
        </div>

        {/* Collapsible Filter Panel */}
        <div 
          className={`
            overflow-hidden transition-all duration-300 ease-in-out
            ${showFilters ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}
          `}
        >
          <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
            <div className="max-w-xl">
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
                  className={`w-auto justify-start font-normal ${startDate || endDate ? "border-primary-500 bg-primary-50 text-primary-700" : ""}`}
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

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pending Settlement Card */}
          <Card className="relative">
            <div className="absolute top-4 right-4">
              <div className="w-10 h-10 rounded-full bg-warning-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning-600" />
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Pending Settlement</p>
              <p className="text-3xl font-semibold text-slate-900">
                {formatCurrency(stats?.pending_amount || 0)}
              </p>
              <p className="text-xs text-slate-400 mt-1">{stats?.pending_count || 0} scheduled</p>
            </div>
          </Card>

          {/* Total Settled Card */}
          <Card className="relative">
            <div className="absolute top-4 right-4">
              <div className="w-10 h-10 rounded-full bg-success-50 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success-600" />
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Total Settled</p>
              <p className="text-3xl font-semibold text-slate-900">
                {formatCurrency(stats?.settled_amount || 0)}
              </p>
              <p className="text-xs text-slate-400 mt-1">{stats?.settled_count || 0} completed</p>
            </div>
          </Card>

          {/* Payout Account Card - Now showing Virtual Account */}
          <Card className="relative">
            <div className="absolute top-4 right-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                <Building className="w-5 h-5 text-slate-600" />
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Payout Account</p>
              <p className="text-base font-semibold text-slate-900">
                {vanAccount?.bank_name || 'Virtual Account'} ****{vanAccount?.account_number?.slice(-4) || '****'}
              </p>
              <p className="text-xs text-slate-400 mt-1">Next payout: {nextPayoutDate}</p>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-slate-200">
          <button
            onClick={() => {
              localStorage.setItem('merchant-settlements-tab', 'upcoming');
              setActiveTab('upcoming');
            }}
            className={`pb-3 px-1 text-sm font-medium transition-colors relative ${activeTab === 'upcoming'
              ? 'text-slate-900'
              : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            Upcoming ({upcomingSettlements.length})
            {activeTab === 'upcoming' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
            )}
          </button>
          <button
            onClick={() => {
              localStorage.setItem('merchant-settlements-tab', 'completed');
              setActiveTab('completed');
            }}
            className={`pb-3 px-1 text-sm font-medium transition-colors relative ${activeTab === 'completed'
              ? 'text-slate-900'
              : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            Completed ({completedSettlements.length})
            {activeTab === 'completed' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
            )}
          </button>
        </div>

        {/* Settlements List */}
        {loading ? (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-sm text-slate-500 mt-4">Loading settlements...</p>
          </div>
        ) : displayedSettlements.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-slate-500">
              No {activeTab} settlements
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedSettlements.map((settlement: any) => (
              <Link
                key={settlement.id}
                to={`/settlements/${settlement.id}`}
                className="block"
              >
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activeTab === 'upcoming' ? 'bg-warning-50' : 'bg-success-50'
                        }`}>
                        {activeTab === 'upcoming' ? (
                          <Clock className="w-5 h-5 text-warning-600" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-success-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          Settlement {settlement.id}
                        </p>
                        <p className="text-xs text-slate-500">
                          {settlement.remitter_name || 'Unknown'} | {formatDate(settlement.date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-slate-900">
                        {formatCurrency(settlement.amount)}
                      </p>
                      {activeTab === 'upcoming' ? (
                        <Badge variant="primary" size="sm">Scheduled</Badge>
                      ) : (
                        <p className="text-xs text-slate-500">
                          Expected {formatDate(settlement.date)}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

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
                value={tempDates.start || format(parseISO(new Date().toISOString()), "yyyy-MM-dd'T'00:00:00")}
                onChange={(date) => setTempDates(prev => ({ ...prev, start: date }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary-500" />
                END DATE & TIME
              </label>
              <DateTimePicker
                value={tempDates.end || format(parseISO(new Date().toISOString()), "yyyy-MM-dd'T'23:59:59")}
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

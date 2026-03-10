import { useState } from 'react';
import { Download, Clock, CheckCircle, Building } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Badge, Button } from '../../components/ui';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useFrappeGetCall } from 'frappe-react-sdk';
import { merchantMethods } from '../../services';
import { useExportData } from '../../hooks';

export function Settlements() {
  // Initialize active tab from localStorage
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>(
    (localStorage.getItem('merchant-settlements-tab') as 'upcoming' | 'completed') || 'upcoming'
  );
  // const [exporting, setExporting] = useState(false);
  const { exportData, loading: exporting } = useExportData(merchantMethods.exportVANLogs);

  // Fetch settlement statistics
  const { data: { message: stats } = {} } = useFrappeGetCall(
    merchantMethods.getSettlementStats,
    undefined,
    'settlement-stats'
  );

  // Fetch VAN account for payout account display
  const { data: { message: vanAccount } = {} } = useFrappeGetCall(
    merchantMethods.getVANAccount,
    undefined,
    'van-account'
  );

  // Fetch VAN logs
  const { data: { message: vanData } = {}, isLoading: loading } = useFrappeGetCall(
    merchantMethods.getVANLogs,
    {
      page: 1,
      page_size: 50,
      filter_data: undefined
    },
    'van-logs-50'
  );

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
    await exportData();
  };

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
          <Button variant="secondary" onClick={handleExport} disabled={exporting}>
            <Download className="w-4 h-4" />
            {exporting ? 'Downloading...' : 'Download Statement'}
          </Button>
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
    </DashboardLayout>
  );
}

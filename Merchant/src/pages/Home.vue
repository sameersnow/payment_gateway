<template>
  <div class="max-w-[1400px] mx-auto">
    <div class="dashboard-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Welcome back, {{ userName }}! Here's what's happening today.</p>
      </div>
      <!-- <div class="header-actions">
        <select class="period-selector">
          <option>Last 7 days</option>
          <option>Last 30 days</option>
          <option>Last 90 days</option>
          <option>This year</option>
        </select>
      </div> -->
    </div>

    <!-- Rejection Remark Banner -->
    <div v-if="merchantStatus === 'Rejected' && rejectionRemark" class="mb-6 rounded-lg border-2 border-red-200 bg-red-50 p-6 shadow-sm">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0">
          <svg class="h-6 w-6 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-red-900 mb-2">KYC Verification Rejected</h3>
          <p class="text-sm text-red-800 mb-3">Your KYC verification has been rejected for the following reason:</p>
          <div class="rounded-md bg-white border border-red-200 p-4">
            <p class="text-sm text-red-900 font-medium">{{ rejectionRemark }}</p>
          </div>
          <p class="text-xs text-red-700 mt-3">Please update your documents and resubmit for verification. Contact support if you need assistance.</p>
        </div>
      </div>
    </div>

    <!-- Metrics Grid -->
    <div class="metrics-grid-four">
      <StatCard
        label="Total Orders"
        :value="metrics.transactions.toLocaleString()"
        :trend="0"
        :description="formatCurrency(metrics.totalOrdersAmount)"
        variant="info"
      >
        <template #icon>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
        </template>
      </StatCard>

      <StatCard
        label="Processed Orders"
        :value="metrics.processedOrders.toLocaleString()"
        :trend="0"
        :description="formatCurrency(metrics.totalRevenue)"
        variant="success"
      >
        <template #icon>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </template>
      </StatCard>

      <StatCard
        label="Pending Orders"
        :value="metrics.pendingOrders.toLocaleString()"
        :trend="0"
        :description="formatCurrency(metrics.totalPendingAmount)"
        variant="warning"
      >
        <template #icon>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </template>
      </StatCard>

      <StatCard
        label="Failed Orders"
        :value="metrics.cancelledOrders.toLocaleString()"
        :trend="0"
        :description="formatCurrency(metrics.totalCancelledAmount)"
        variant="destructive"
      >
        <template #icon>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        </template>
      </StatCard>
    </div>

    <!-- Charts Section -->
    <div class="charts-section">
      <div class="charts-header">
        <div>
          <h2 class="section-title">Analytics Overview</h2>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm text-muted-foreground">Period:</span>
          <select v-model="chartPeriod" class="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
          </select>
        </div>
      </div>

      <div v-if="chartLabels.length > 0" class="w-full">
        <DashboardAreaChart
          title="Revenue & Orders Overview"
          subtitle="Track your business performance over time"
          :data="chartData"
          :labels="chartLabels"
          :series="chartSeries"
        />
      </div>
      <div v-else class="w-full h-[350px] bg-card rounded-xl border p-6 shadow-sm flex items-center justify-center">
        <p class="text-muted-foreground">Loading chart data...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { session } from '../data/session'
import StatCard from '@/components/StatCard.vue'
import DashboardAreaChart from '@/components/DashboardAreaChart.vue'
import { call } from 'frappe-ui'

const userName = computed(() => session.user || 'User')

// Filters
const filters = ref({
  status: '',
  fromDate: '',
  toDate: ''
})

// Wallet and metrics data
// Wallet and metrics data
const walletData = ref({
  balance: 0,
  status: 'Inactive'
})

const metrics = ref({
  totalRevenue: 0,
  transactions: 0,
  processedOrders: 0,
  pendingOrders: 0,
  cancelledOrders: 0,
  totalPendingAmount: 0,
  totalCancelledAmount: 0,
  totalOrdersAmount: 0
})

// Merchant profile data
const merchantStatus = ref('')
const rejectionRemark = ref('')

const statusData = ref({
  success: 0,
  pending: 0,
  failed: 0
})

// Fetch dashboard stats
const fetchDashboardStats = async () => {
  try {
    const response = await call('iswitch.merchant_portal_api.get_dashboard_stats')
    
    // Frappe wraps response in 'message' object
    const data = response?.message || response
    
    if (data) {
      // Update wallet data
      if (data.wallet) {
        walletData.value.balance = data.wallet.balance || 0
        walletData.value.status = data.wallet.status || 'Inactive'
      }
      
      // Update metrics with proper field mapping
      if (data.stats) {
        metrics.value = {
          totalRevenue: data.stats.total_processed_amount || 0,
          transactions: data.stats.total_orders || 0,
          processedOrders: data.stats.processed_orders || 0,
          pendingOrders: data.stats.pending_orders || 0,
          cancelledOrders: data.stats.cancelled_orders || 0,
          totalPendingAmount: data.stats.total_pending_amount || 0,
          totalCancelledAmount: data.stats.total_cancelled_amount || 0,
          totalOrdersAmount: data.stats.total_orders_amount || 0
        }

        // Update status data for charts
        statusData.value = {
          success: metrics.value.processedOrders,
          pending: metrics.value.pendingOrders,
          failed: metrics.value.cancelledOrders
        }
      }
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    // Clear metrics on error
    metrics.value = {
      totalRevenue: 0,
      transactions: 0,
      processedOrders: 0,
      pendingOrders: 0,
      cancelledOrders: 0,
      totalPendingAmount: 0,
      totalCancelledAmount: 0,
      totalOrdersAmount: 0
    }
  }
}

// Fetch merchant profile to get status and rejection remark
const fetchMerchantProfile = async () => {
  try {
    const response = await call('iswitch.merchant_portal_api.get_merchant_profile')
    const data = response?.message || response
    
    if (data) {
      merchantStatus.value = data.status || ''
      rejectionRemark.value = data.remark || ''
    }
  } catch (error) {
    console.error('Error fetching merchant profile:', error)
  }
}

// Chart Period
const chartPeriod = ref('Last 7 days')
const chartLabels = ref([])
const chartData = ref([])

// Chart series configuration (using computed for reactivity)
const chartSeries = computed(() => [
  { name: 'Revenue', key: 'revenue', color: '#10b981', prefix: '₹' },
  { name: 'Orders', key: 'orders', color: '#3b82f6', prefix: '' }
])

// Fetch chart data
const fetchChartData = async () => {
  try {
    const response = await call('iswitch.merchant_portal_api.get_dashboard_chart_data', {
      period: chartPeriod.value
    })
    
    const data = response?.message || response
    console.log('Chart API Response:', data)
    
    if (data && data.labels) {
      chartLabels.value = data.labels
      // Transform data into array of objects with revenue and orders keys
      chartData.value = data.labels.map((_, index) => ({
        revenue: Number(data.revenue?.[index]) || 0,
        orders: Number(data.orders?.[index]) || 0
      }))
      
      console.log('Transformed Chart Data:', chartData.value)
      console.log('Chart Labels:', chartLabels.value)
      console.log('Chart Series:', chartSeries.value)
    } else {
      console.error('Invalid chart data structure:', data)
      chartLabels.value = []
      chartData.value = []
    }
  } catch (error) {
    console.error('Error fetching chart data:', error)
    chartLabels.value = []
    chartData.value = []
  }
}

// Watch period change
watch(chartPeriod, () => {
  fetchChartData()
})

// Helper function
const formatCurrency = (value) => {
  // Handle null, undefined, or NaN values
  const numValue = parseFloat(value)
  if (isNaN(numValue)) return '₹0.00'
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue)
}

onMounted(() => {
  fetchDashboardStats()
  fetchMerchantProfile()
  fetchChartData()
})
</script>

<style scoped>
.dashboard {
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 0.25rem;
}

.page-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.period-selector {
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.625rem 1rem;
  color: var(--color-text-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.period-selector:focus {
  outline: none;
  border-color: var(--color-primary);
}


.metrics-grid-four {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.transactions-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.transactions-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.filters-section {
  padding: 1.5rem;
  display: flex;
  align-items: flex-end;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-width: 200px;
}

.filter-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.filter-select,
.filter-input {
  width: 100%;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.625rem 1rem;
  color: var(--color-text-primary);
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.filter-select:focus,
.filter-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.charts-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.charts-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chart-card {
  padding: 1.5rem;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.chart-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.chart-legend {
  display: flex;
  gap: 1.5rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.chart-body {
  position: relative;
}

.chart-body canvas {
  width: 100% !important;
  height: auto !important;
}

.status-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.status-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-info {
  flex: 1;
}

.status-label {
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
  margin-bottom: 0.25rem;
}

.status-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.customer-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.customer-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.75rem;
  color: white;
  flex-shrink: 0;
}

.action-btn {
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.5rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-primary);
  border-color: var(--color-primary);
}

@media (max-width: 1200px) {
  .metrics-grid-four {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .metrics-grid-four {
    grid-template-columns: 1fr;
  }
  
  .status-stats {
    grid-template-columns: 1fr;
  }
  
  .filters-section {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .filter-group {
    width: 100%;
  }

  .transactions-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .charts-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}
</style>


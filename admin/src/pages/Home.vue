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

      <!-- Chart Section -->
      <div v-if="metrics.chartData" class="mb-8">
        <div class="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <div class="flex items-center justify-between mb-6">
                 <div>
                    <h3 class="text-base font-semibold text-card-foreground">Analytics Overview</h3>
                 </div>
                 <div class="flex items-center gap-2">
                     <span class="text-sm text-muted-foreground mr-1">Period:</span>
                    <select v-model="selectedPeriod" @change="fetchDashboardStats" class="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                        <option value="Last 7 days">Last 7 days</option>
                        <option value="Last 30 days">Last 30 days</option>
                        <option value="Last 90 days">Last 90 days</option>
                        <option value="This Year">This Year</option>
                    </select>
                 </div>
            </div>
            <AdminDashboardChart
                :data="metrics.chartData"
                :loading="loading"
            />
        </div>
      </div>
  </div>

</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { session } from '../data/session'
import StatCard from '@/components/StatCard.vue'
import AdminDashboardChart from '@/components/AdminDashboardChart.vue'
import { call } from 'frappe-ui'

const userName = computed(() => session.user || 'User')
const loading = ref(false)
const selectedPeriod = ref('Last 30 days')

// Metrics data
const metrics = ref({
  totalRevenue: 0,
  transactions: 0,
  processedOrders: 0,
  pendingOrders: 0,
  cancelledOrders: 0,
  totalPendingAmount: 0,
  totalCancelledAmount: 0,
  totalOrdersAmount: 0,
  chartData: null
})

// Fetch dashboard stats
const fetchDashboardStats = async () => {
  loading.value = true
  try {
    const response = await call('iswitch.admin_portal_api.get_dashboard_stats', {
        period: selectedPeriod.value
    })
    const data = response?.message || response
    
    if (data && data.stats) {
        metrics.value = {
          totalRevenue: data.stats.total_processed_amount || 0,
          transactions: data.stats.total_orders || 0,
          processedOrders: data.stats.processed_orders || 0,
          pendingOrders: data.stats.pending_orders || 0,
          cancelledOrders: data.stats.cancelled_orders || 0,
          totalPendingAmount: data.stats.total_pending_amount || 0,
          totalCancelledAmount: data.stats.total_cancelled_amount || 0,
          totalOrdersAmount: data.stats.total_orders_amount || 0,
          chartData: data.chart_data || null
        }
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
  } finally {
    loading.value = false
  }
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

onMounted(() => {
  fetchDashboardStats()
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

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
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
  
  .charts-grid {
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
}
</style>


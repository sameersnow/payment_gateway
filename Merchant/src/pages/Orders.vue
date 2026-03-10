<template>
  <div class="max-w-[1400px] mx-auto">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-foreground">Orders</h1>

        <p class="text-muted-foreground mt-1">View and track all your transaction orders.</p>
      </div>
      <button 
        class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2" 
        @click="exportOrders"
      >
        <svg class="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Export
      </button>
    </div>

    <!-- Filters -->
    <div class="rounded-xl border bg-card text-card-foreground shadow-sm p-4 md:p-6 mb-6">
      <h3 class="text-lg font-semibold mb-4">Filters</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div>
          <label class="block text-sm font-medium text-muted-foreground mb-2">STATUS</label>
          <select v-model="filters.status" class="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <option value="All Status">All Status</option>
            <option value="Queued">Queued</option>
            <option value="Processing">Processing</option>
            <option value="Processed">Processed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Reversed">Reversed</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-muted-foreground mb-2">FROM DATE & TIME</label>
          <input 
            type="datetime-local" 
            v-model="filters.fromDate" 
            class="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-muted-foreground mb-2">TO DATE & TIME</label>
          <input 
            type="datetime-local" 
            v-model="filters.toDate" 
            class="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>

        <button 
          class="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6"
          @click="applyFilters"
        >
          Apply Filters
        </button>
      </div>
    </div>

    <DataTable
      :columns="orderColumns"
      :data="orders"
      :per-page="10"
    >
      <template #cell-id="{ row }">
        <button 
          @click="openOrderSheet(row)"
          class="font-medium text-primary hover:underline hover:text-primary/80 transition-colors"
        >
          {{ row.id }}
        </button>
      </template>
      <template #cell-customer="{ value }">
        <span class="font-medium">{{ value }}</span>
      </template>
    </DataTable>

    <!-- Order Details Sheet -->
    <Sheet v-model:open="isSheetOpen">
      <SheetContent class="w-full sm:max-w-2xl overflow-y-auto bg-background p-0">
        <div v-if="selectedOrder" class="h-full flex flex-col">
          <!-- Header Banner -->
          <div class="p-6 bg-card border-b">
            <div class="flex items-center gap-4 mb-4">
              <button @click="isSheetOpen = false" class="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <svg class="h-5 w-5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
              <div class="flex-1">
                <div class="flex items-center gap-3">
                  <h2 class="text-2xl font-bold">Order {{ selectedOrder.id }}</h2>
                  <span 
                    class="px-2 py-0.5 rounded-full text-xs font-semibold"
                    :class="{
                      'bg-green-100 text-green-700': selectedOrder.status === 'Processed',
                      'bg-blue-100 text-blue-700': selectedOrder.status === 'Processing',
                      'bg-yellow-100 text-yellow-700': selectedOrder.status === 'Queued',
                      'bg-red-100 text-red-700': selectedOrder.status === 'Cancelled' || selectedOrder.status === 'Reversed'
                    }"
                  >
                    {{ selectedOrder.status }}
                  </span>
                </div>
                <div class="flex items-center gap-2 mt-1">
                  <p class="text-xs text-slate-500">Created {{ formatDateTime(selectedOrder.date) }}</p>
                  <button @click="copyToClipboard(selectedOrder.id)" class="p-1 hover:bg-slate-100 rounded transition-colors" title="Copy ID">
                    <svg class="h-3.5 w-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1-0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="flex-1 p-6 space-y-6 bg-slate-50/50">
          <!-- Two Column Layout -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <!-- Left Column - Order Summary -->
            <div class="lg:col-span-2 space-y-4">
              <!-- Order Summary -->
              <div class="rounded-lg border bg-card p-4">
                <h3 class="font-semibold mb-4">Order Summary</h3>
                <div class="space-y-2">
                  <div class="flex justify-between text-sm">
                    <span class="text-muted-foreground">Subtotal</span>
                    <span>{{ formatCurrency(selectedOrder.amount) }}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-muted-foreground">Tax</span>
                    <span>{{ formatCurrency(selectedOrder.tax || 0) }}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-muted-foreground">Fee</span>
                    <span>{{ formatCurrency(selectedOrder.fee || 0) }}</span>
                  </div>
                  <div class="pt-2 border-t flex justify-between font-semibold">
                    <span>Total</span>
                    <span class="text-lg">{{ formatCurrency(selectedOrder.transaction_amount || selectedOrder.amount) }}</span>
                  </div>
                </div>
              </div>

              <!-- Transaction Details -->
              <div class="rounded-lg border bg-card p-4">
                <h3 class="font-semibold mb-4">Transaction Details</h3>
                <div class="space-y-3">
                  <div class="flex justify-between text-sm">
                    <span class="text-muted-foreground">Order ID</span>
                    <span class="font-mono">{{ selectedOrder.id }}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-muted-foreground">UTR</span>
                    <span class="font-mono">{{ selectedOrder.utr }}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-muted-foreground">Status</span>
                    <span 
                      class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
                      :class="{
                        'bg-green-100 text-green-800': selectedOrder.status === 'Processed',
                        'bg-blue-100 text-blue-800': selectedOrder.status === 'Processing',
                        'bg-yellow-100 text-yellow-800': selectedOrder.status === 'Queued',
                        'bg-red-100 text-red-800': selectedOrder.status === 'Cancelled' || selectedOrder.status === 'Reversed'
                      }"
                    >
                      {{ selectedOrder.status }}
                    </span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-muted-foreground">Created</span>
                    <span>{{ formatDateTime(selectedOrder.date) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column - Customer, Payment, Timeline -->
            <div class="space-y-4">
              <!-- Customer -->
              <div class="rounded-lg border bg-card p-4">
                <h3 class="font-semibold mb-3">Customer</h3>
                <div class="space-y-3">
                  <div class="flex items-center gap-2">
                    <div class="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <svg class="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                    <div>
                      <div class="font-medium text-sm">{{ selectedOrder.customer }}</div>
                      <div class="text-xs text-muted-foreground">Customer</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Payment & Ledger -->
              <div class="rounded-lg border bg-card p-4">
                <h3 class="font-semibold mb-3">Payment</h3>
                <div class="space-y-3">
                  <div class="flex items-center gap-2">
                    <div class="h-8 w-8 rounded bg-muted flex items-center justify-center">
                      <svg class="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect width="20" height="14" x="2" y="5" rx="2"/>
                        <path d="M2 10h20"/>
                      </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="font-medium text-sm capitalize">{{ selectedOrder.payment_method || 'UPI' }} Payment</div>
                      <div class="text-xs text-muted-foreground">Payment Method</div>
                    </div>
                  </div>

                  <!-- Related Ledger Entries -->
                <div v-if="selectedOrder.ledger_ids && selectedOrder.ledger_ids.length > 0" class="mt-4 pt-4 border-t border-slate-100">
                  <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Related Ledger Entries</h4>
                  <div class="space-y-2">
                    <router-link 
                      v-for="ledgerId in selectedOrder.ledger_ids" 
                      :key="ledgerId"
                      :to="`/ledger?id=${ledgerId}`"
                      class="flex items-center justify-between p-3 rounded-xl bg-card border hover:border-primary/30 hover:shadow-sm transition-all group"
                    >
                      <div class="flex items-center gap-3 min-w-0">
                        <div class="h-8 w-8 rounded-lg bg-slate-50 flex-shrink-0 flex items-center justify-center">
                          <svg class="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                          </svg>
                        </div>
                        <span class="text-xs font-mono text-slate-600 font-medium truncate min-w-0" :title="ledgerId">{{ ledgerId }}</span>
                      </div>
                      <svg class="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/>
                      </svg>
                    </router-link>
                  </div>
                </div>
                  <div v-else class="pt-2 border-t">
                    <div class="text-xs text-muted-foreground">No ledger entries found</div>
                  </div>
                </div>
              </div>

              <!-- Timeline -->
              <div class="rounded-lg border bg-card p-4">
                <h3 class="font-semibold mb-3">Timeline</h3>
                <div class="space-y-3">
                  <div class="flex gap-3">
                    <div class="flex flex-col items-center">
                      <div class="h-2 w-2 rounded-full bg-green-500"></div>
                      <div class="w-px h-full bg-border"></div>
                    </div>
                    <div class="flex-1 pb-3">
                      <div class="text-sm font-medium">Order created</div>
                      <div class="text-xs text-muted-foreground">{{ formatDateTime(selectedOrder.date) }}</div>
                    </div>
                  </div>
                  <div class="flex gap-3">
                    <div class="flex flex-col items-center">
                      <div 
                        class="h-2 w-2 rounded-full"
                        :class="{
                          'bg-green-500': selectedOrder.status === 'Processed',
                          'bg-red-500': selectedOrder.status === 'Cancelled' || selectedOrder.status === 'Failed',
                          'bg-muted': selectedOrder.status === 'Pending'
                        }"
                      ></div>
                    </div>
                    <div class="flex-1">
                      <div class="text-sm font-medium">
                        <span v-if="selectedOrder.status === 'Processed'">Payment received</span>
                        <span v-else-if="selectedOrder.status === 'Cancelled'">Payment cancelled</span>
                        <span v-else-if="selectedOrder.status === 'Failed'">Payment failed</span>
                        <span v-else>Payment pending</span>
                      </div>
                      <div class="text-xs text-muted-foreground">
                        <span v-if="selectedOrder.status === 'Processed' || selectedOrder.status === 'Cancelled' || selectedOrder.status === 'Failed'">{{ formatDateTime(selectedOrder.modified) }}</span>
                        <span v-else>Waiting...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import DataTable from '@/components/DataTable.vue'

import { call } from 'frappe-ui'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

// Filters
const filters = ref({
  status: 'All Status',
  fromDate: '',
  toDate: ''
})

// Order columns
const orderColumns = [
  { key: 'id', label: 'ORDER ID', sortable: true },
  { key: 'customer', label: 'CUSTOMER', sortable: true },
  { key: 'amount', label: 'AMOUNT', type: 'currency', sortable: true },
  { key: 'status', label: 'STATUS', type: 'badge', sortable: true },
  { key: 'utr', label: 'UTR', sortable: true },
  { key: 'date', label: 'DATE', type: 'datetime', sortable: true }
]

// Order data and pagination
const orders = ref([])
const totalOrders = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const loading = ref(false)

// Fetch orders from API
const fetchOrders = async () => {
  loading.value = true
  try {
    const filterData = {
      status: filters.value.status !== 'All Status' ? filters.value.status : null,
      from_date: filters.value.fromDate || null,
      to_date: filters.value.toDate || null
    }
    
    const response = await call('iswitch.merchant_portal_api.get_orders', {
      filter_data: JSON.stringify(filterData),
      page: currentPage.value,
      page_size: pageSize.value,
      sort_by: 'creation',
      sort_order: 'desc'
    })
    
    // Frappe wraps response in 'message' object
    const data = response?.message || response
    
    if (data && data.orders) {
      orders.value = data.orders.map(order => ({
        ...order,
        id: order.id,
        customer: order.customer || 'N/A',
        amount: parseFloat(order.amount || 0),
        transaction_amount: parseFloat(order.transaction_amount || 0),
        tax: parseFloat(order.tax || 0),
        fee: parseFloat(order.fee || 0),
        status: order.status,
        utr: order.utr || '-',
        date: order.date,
        modified: order.modified,
        ledger_ids: order.ledger_ids || []
      }))
      totalOrders.value = data.total || 0
    }
  } catch (error) {
    console.error('Error fetching orders:', error)
    orders.value = []
    totalOrders.value = 0
  } finally {
    loading.value = false
  }
}

// Filtered orders (API already handles filtering, this is for client-side refinement only)
const filteredOrders = computed(() => {
  let filtered = [...orders.value]
  
  // Only apply client-side filters if they are explicitly set
  // API handles the main filtering, this is just for additional refinement
  if (filters.value.status && filters.value.status !== 'All Status' && filters.value.status !== '') {
    filtered = filtered.filter(t => t.status.toLowerCase() === filters.value.status.toLowerCase())
  }
  
  if (filters.value.fromDate) {
    const fromDate = new Date(filters.value.fromDate)
    filtered = filtered.filter(t => new Date(t.date) >= fromDate)
  }
  
  if (filters.value.toDate) {
    const toDate = new Date(filters.value.toDate)
    filtered = filtered.filter(t => new Date(t.date) <= toDate)
  }
  
  return filtered
})

const applyFilters = () => {
  currentPage.value = 1 // Reset to first page when filtering
  fetchOrders()
}

const exportOrders = () => {
  try {
    const filterData = {
      status: filters.value.status !== 'All Status' ? filters.value.status : null,
      from_date: filters.value.fromDate || null,
      to_date: filters.value.toDate || null
    }
    
    const queryParams = new URLSearchParams({
      filters: JSON.stringify(filterData)
    }).toString()
    
    window.location.href = `/api/method/iswitch.merchant_portal_api.export_orders_to_excel?${queryParams}`
  } catch (error) {
    console.error('Error exporting orders:', error)
  }
}

const isSheetOpen = ref(false)
const selectedOrder = ref(null)

const openOrderSheet = async (order) => {
  try {
    // Call the API to get full order details
    const response = await call('iswitch.merchant_portal_api.get_order_details', {
      order_id: order.id
    })
    
    if (response) {
      selectedOrder.value = response
      isSheetOpen.value = true
    } else {
      // Fallback to list data if API fails
      selectedOrder.value = order
      isSheetOpen.value = true
    }
  } catch (error) {
    console.error('Error fetching order details:', error)
    // Fallback to list data on error
    selectedOrder.value = order
    isSheetOpen.value = true
  }
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 3
  }).format(value)
}

const formatDateTime = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleString('en-US', {
     year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const viewOrder = (order) => {
  openOrderSheet(order)
}

// Fetch orders when component mounts
// Fetch orders when component mounts
onMounted(() => {
  fetchOrders()
  
  // Handle auto-opening order if ID is in query params
  const route = useRoute()
  const orderId = route.query.id
  if (orderId) {
    handleDeepLink(orderId)
  }
})

// Also watch for route changes
const route = useRoute()
watch(() => route.query.id, (newId) => {
  if (newId) {
    handleDeepLink(newId)
  }
})

const handleDeepLink = async (orderId) => {
  // First check if already in list
  const existing = orders.value.find(o => o.id === orderId)
  if (existing) {
    openOrderSheet(existing)
    return
  }

  // If not in list, fetch single order details
  try {
    const response = await call('iswitch.merchant_portal_api.get_order_details', { order_id: orderId })
    const order = response?.message || response
    if (order) {
      const mappedOrder = {
        ...order,
        amount: parseFloat(order.amount || 0),
        transaction_amount: parseFloat(order.transaction_amount || 0),
        tax: parseFloat(order.tax || 0),
        fee: parseFloat(order.fee || 0),
        ledger_ids: order.ledger_ids || []
      }
      openOrderSheet(mappedOrder)
    }
  } catch (error) {
    console.error('Error fetching deep-linked order:', error)
  }
}
const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text)
  toast.success('Copied to clipboard')
}
</script>

<style scoped>
/* Scoped styles removed in favor of Tailwind utility classes */
</style>

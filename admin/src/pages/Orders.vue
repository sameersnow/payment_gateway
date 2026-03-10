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
    <Card class="border-none shadow-none bg-muted/30 mb-6">
        <div class="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div class="space-y-2">
                <label class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Status</label>
                <div class="relative">
                    <select v-model="filters.status" class="flex h-10 w-full rounded-md border border-muted-foreground/20 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 appearance-none cursor-pointer shadow-sm">
                        <option value="All Status">All Status</option>
                        <option value="Queued">Queued</option>
                        <option value="Processing">Processing</option>
                        <option value="Processed">Processed</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Reversed">Reversed</option>
                    </select>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"><path d="m6 9 6 6 6-6"/></svg>
                </div>
            </div>

            <div class="space-y-2">
                <label class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">From Date & Time</label>
                <input 
                    type="datetime-local" 
                    v-model="filters.fromDate" 
                    class="w-full h-10 rounded-md border border-muted-foreground/20 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 shadow-sm"
                />
            </div>

            <div class="space-y-2">
                <label class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">To Date & Time</label>
                <input 
                    type="datetime-local" 
                    v-model="filters.toDate" 
                    class="w-full h-10 rounded-md border border-muted-foreground/20 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 shadow-sm"
                />
            </div>

            <Button 
                class="w-full h-10 px-6 font-bold shadow-md hover:shadow-lg transition-all"
                @click="applyFilters"
            >
                Apply Filters
            </Button>
        </div>
    </Card>

    <!-- Data Table -->
    <DataTable
      :columns="orderColumns"
      :data="orders"
      :per-page="10"
    >
      <template #cell-id="{ value, row }">
        <button 
          class="font-medium text-primary hover:underline focus:outline-none"
          @click="viewOrder(row)"
        >
          {{ value }}
        </button>
      </template>
      <template #cell-customer="{ value }">
        <span class="font-medium text-muted-foreground transition-colors hover:text-foreground">{{ value }}</span>
      </template>
      <template #cell-amount="{ value }">
        <span class="font-semibold text-foreground">₹ {{ value.toLocaleString() }}</span>
      </template>
    </DataTable>

    <!-- Order Details Sheet -->
    <Sheet v-model:open="isSheetOpen">
      <SheetContent class="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader class="mb-6">
          <div class="flex items-start justify-between">
            <div class="space-y-1">
              <SheetTitle class="text-2xl font-bold">Order {{ selectedOrder?.id }}</SheetTitle>
              <SheetDescription>
                Created on {{ formatDateTime(selectedOrder?.date) }}
              </SheetDescription>
            </div>
            <Badge :class="getBadgeClass(selectedOrder?.status)" class="text-sm px-3 py-1">
              {{ selectedOrder?.status }}
            </Badge>
          </div>
        </SheetHeader>

        <div v-if="selectedOrder" class="space-y-8">
          <!-- Order Information -->
          <div>
            <h3 class="font-semibold text-lg mb-4">Order Information</h3>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <p class="text-sm text-muted-foreground">Amount</p>
                <p class="font-medium text-lg">{{ formatCurrency(selectedOrder.amount) }}</p>
              </div>
               <div class="space-y-1">
                <p class="text-sm text-muted-foreground">Subtotal</p>
                <p class="font-medium">{{ formatCurrency(selectedOrder.subtotal || selectedOrder.amount) }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-sm text-muted-foreground">Tax</p>
                <p class="font-medium">{{ formatCurrency(selectedOrder.tax || 0) }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-sm text-muted-foreground">Fee</p>
                <p class="font-medium">{{ formatCurrency(selectedOrder.fee || 0) }}</p>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <!-- Transaction Details -->
           <div>
            <h3 class="font-semibold text-lg mb-4">Transaction Details</h3>
            <div class="grid grid-cols-2 gap-4">
               <div class="space-y-1">
                <p class="text-sm text-muted-foreground">UTR Reference</p>
                <div class="flex items-center gap-2">
                    <p class="font-mono">{{ selectedOrder.utr || '-' }}</p>
                    <button v-if="selectedOrder.utr" @click="copyToClipboard(selectedOrder.utr)" class="text-muted-foreground hover:text-foreground">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    </button>
                </div>
              </div>
               <div class="space-y-1">
                <p class="text-sm text-muted-foreground">Payment Method</p>
                <p class="font-medium capitalize">{{ selectedOrder.payment_method || 'UPI' }}</p>
              </div>
            </div>
           </div>

           <Separator />

          <!-- Customer & Merchant -->
          <div class="grid grid-cols-2 gap-8">
            <div>
               <h3 class="font-semibold text-lg mb-4">Customer</h3>
               <div class="flex items-center gap-3">
                   <div class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                       {{ selectedOrder.customer?.charAt(0).toUpperCase() }}
                   </div>
                   <div>
                       <p class="font-medium">{{ selectedOrder.customer }}</p>
                       <p class="text-sm text-muted-foreground">Customer</p>
                   </div>
               </div>
            </div>
             <div>
               <h3 class="font-semibold text-lg mb-4">Merchant</h3>
               <div class="flex items-center gap-3">
                   <div class="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                       M
                   </div>
                   <div>
                       <p class="font-medium">{{ selectedOrder.merchant }}</p>
                       <p class="text-sm text-muted-foreground">Merchant Partner</p>
                   </div>
               </div>
            </div>
          </div>

          <Separator v-if="selectedOrder.ledger_ids?.length" />

          <!-- Related Ledger -->
           <div v-if="selectedOrder.ledger_ids?.length">
            <h3 class="font-semibold text-lg mb-4">Related Ledger Entries</h3>
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
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import DataTable from '@/components/DataTable.vue'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { call } from 'frappe-ui'
import { Separator } from '@/components/ui/separator'
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

const isSheetOpen = ref(false)
const selectedOrder = ref(null)

// Order columns
const orderColumns = [
  { key: 'id', label: 'ORDER ID', sortable: true },
  { key: 'merchant', label: 'MERCHANT', sortable: true },
  { key: 'customer', label: 'CUSTOMER', sortable: true },
  { key: 'amount', label: 'AMOUNT', sortable: true },
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
    
    const response = await call('iswitch.admin_portal_api.get_orders', {
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
        id: order.id,
        merchant: order.merchant_name || 'N/A',
        customer: order.customer || 'N/A',
        amount: parseFloat(order.amount || 0),
        fee: parseFloat(order.fee || 0),
        status: order.status,
        utr: order.utr || '-',
        date: order.date
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
    
    window.location.href = `/api/method/iswitch.admin_portal_api.export_orders_to_excel?${queryParams}`
  } catch (error) {
    console.error('Error exporting orders:', error)
  }
}

const viewOrder = async (order) => {
  isSheetOpen.value = true
  try {
    const response = await call('iswitch.admin_portal_api.get_order_details', {
      order_id: order.id
    })
    const data = response?.message || response
    if (data) {
        selectedOrder.value = data
    } else {
        selectedOrder.value = order
    }
  } catch (error) {
    console.error('Error fetching order details:', error)
    selectedOrder.value = order
  }
}

const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(value)
}

const formatDateTime = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

const getBadgeClass = (value) => {
  const status = value?.toLowerCase() || ''
  if (status === 'processed' || status === 'success') {
    return 'bg-green-100 text-green-700 hover:bg-green-100'
  }
  if (status === 'processing') {
    return 'bg-blue-100 text-blue-700 hover:bg-blue-100'
  }
  if (status === 'queued' || status === 'pending') {
    return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
  }
  if (status === 'cancelled' || status === 'failed' || status === 'rejected' || status === 'reversed') {
    return 'bg-red-100 text-red-700 hover:bg-red-100'
  }
  return 'bg-slate-100 text-slate-700 hover:bg-slate-100'
}

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
    viewOrder(existing)
    return
  }

  // If not in list, fetch single order details
  try {
    const response = await call('iswitch.admin_portal_api.get_order_details', { order_id: orderId })
    const data = response?.message || response
    if (data) {
      viewOrder(data)
    }
  } catch (error) {
    console.error('Error fetching deep-linked order:', error)
  }
}
</script>

<style scoped>
/* Scoped styles removed in favor of Tailwind utility classes */
</style>

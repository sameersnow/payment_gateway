<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-foreground">Ledger</h1>
        <p class="text-muted-foreground mt-1">View and manage financial transactions across all merchants.</p>
      </div>
      <button class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2" @click="exportLedger">
        <svg class="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Export
      </button>
    </div>

    <!-- Filters -->
    <div class="rounded-xl border bg-card text-card-foreground shadow-sm p-6 mb-6">
      <h3 class="text-lg font-semibold mb-4">Filters</h3>
      <div class="flex flex-wrap items-end gap-4">
        <div class="flex-1 min-w-[200px]">
          <label class="block text-sm font-medium text-muted-foreground mb-2">TRANSACTION TYPE</label>
          <select v-model="filters.type" class="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <option value="">All Types</option>
            <option value="Credit">Credit</option>
            <option value="Debit">Debit</option>
          </select>
        </div>

        <div class="flex-1 min-w-[200px]">
          <label class="block text-sm font-medium text-muted-foreground mb-2">FROM DATE & TIME</label>
          <input 
            type="datetime-local" 
            v-model="filters.fromDate" 
            class="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>

        <div class="flex-1 min-w-[200px]">
          <label class="block text-sm font-medium text-muted-foreground mb-2">TO DATE & TIME</label>
          <input 
            type="datetime-local" 
            v-model="filters.toDate" 
            class="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>

        <button 
          class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6"
          @click="applyFilters"
        >
          Apply Filters
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
      <DataTable
        :columns="ledgerColumns"
        :data="ledgerData"
        :per-page="10"
      >
        <template #cell-id="{ row }">
          <button 
            @click="openLedgerSheet(row)"
            class="font-medium text-primary hover:underline hover:text-primary/80 transition-colors uppercase"
          >
            {{ row.id }}
          </button>
        </template>
        <template #cell-status="{ value }">
          <span 
            class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            :class="{
              'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300': value === 'success',
              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300': value === 'processing',
              'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300': value === 'failed'
            }"
          >
            {{ value.charAt(0).toUpperCase() + value.slice(1) }}
          </span>
        </template>
      </DataTable>
    </div>

    <!-- Transaction Details Sheet -->
    <Sheet v-model:open="isSheetOpen">
      <SheetContent class="w-full sm:max-w-2xl overflow-y-auto bg-background p-0">
        <div v-if="selectedEntry" class="h-full flex flex-col">
          <!-- Header -->
          <div class="p-6 bg-card border-b">
            <div class="flex items-center gap-4 mb-4">
              <button @click="isSheetOpen = false" class="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <svg class="h-5 w-5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
              <div class="flex-1">
                <div class="flex items-center gap-3">
                  <span class="text-3xl font-bold">{{ formatCurrency(selectedEntry.transaction_amount) }}</span>
                  <span 
                    class="px-2 py-0.5 rounded-full text-xs font-semibold"
                    :class="{
                      'bg-green-100 text-green-700': selectedEntry.order_status === 'Processed',
                      'bg-yellow-100 text-yellow-700': selectedEntry.order_status === 'Processing' || selectedEntry.order_status === 'Queued',
                      'bg-red-100 text-red-700': selectedEntry.order_status === 'Cancelled' || selectedEntry.order_status === 'Failed'
                    }"
                  >
                    {{ selectedEntry.order_status === 'Processed' ? 'Succeeded' : selectedEntry.order_status }}
                  </span>
                </div>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-slate-500 font-mono text-sm uppercase">{{ selectedEntry.id }}</span>
                  <button @click="copyToClipboard(selectedEntry.id)" class="p-1 hover:bg-slate-100 rounded transition-colors" title="Copy ID">
                    <svg class="h-3.5 w-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="flex-1 p-6 space-y-6 bg-slate-50/50">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <!-- Left: Payment Details & Timeline -->
              <div class="lg:col-span-2 space-y-6">
                <!-- Payment Details -->
                <div class="bg-card rounded-xl border p-6 shadow-sm">
                  <h3 class="text-sm font-semibold text-slate-900 mb-6">Payment Details</h3>
                  <div class="grid grid-cols-2 gap-y-6">
                    <div>
                      <p class="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Amount</p>
                      <p class="text-sm font-semibold">{{ formatCurrency(selectedEntry.transaction_amount) }}</p>
                    </div>
                    <div>
                      <p class="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Currency</p>
                      <p class="text-sm font-semibold">INR</p>
                    </div>
                    <div>
                      <p class="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Payment Method</p>
                      <div class="flex items-center gap-2">
                        <div class="h-5 w-8 bg-slate-100 rounded border flex items-center justify-center">
                          <span class="text-[8px] font-bold text-slate-400">UPI</span>
                        </div>
                        <p class="text-sm font-medium">{{ selectedEntry.product || 'UPI' }}</p>
                      </div>
                    </div>
                    <div>
                      <p class="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Description</p>
                      <p class="text-sm font-medium">Payment Transaction</p>
                    </div>
                  </div>
                </div>

                <!-- Timeline -->
                <div class="bg-card rounded-xl border p-6 shadow-sm">
                  <h3 class="text-sm font-semibold text-slate-900 mb-6">Timeline</h3>
                  <div class="space-y-6">
                    <div class="flex gap-4">
                      <div class="relative flex flex-col items-center">
                        <div class="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center z-10">
                          <svg class="h-4 w-4 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/>
                          </svg>
                        </div>
                        <div class="absolute top-8 w-px h-[calc(100%+1.5rem)] bg-slate-100"></div>
                      </div>
                      <div class="pb-2">
                        <p class="text-sm font-semibold">Payment initiated</p>
                        <p class="text-xs text-slate-500">{{ formatDateTime(selectedEntry.date) }}</p>
                      </div>
                    </div>
                    <div v-if="selectedEntry.order_status === 'Processed'" class="flex gap-4">
                      <div class="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center z-10">
                        <svg class="h-4 w-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </div>
                      <div>
                        <p class="text-sm font-semibold">Payment succeeded</p>
                        <p class="text-xs text-slate-500">{{ formatDateTime(selectedEntry.completion_date) }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right: Customer, Merchant, Related, Summary -->
              <div class="space-y-6">
                <!-- Customer & Merchant -->
                <div class="bg-card rounded-xl border p-6 shadow-sm">
                  <h3 class="text-sm font-semibold text-slate-900 mb-4">Customer Details</h3>
                  <div class="space-y-4">
                    <!-- Customer Info -->
                    <div class="flex items-center gap-3">
                      <div class="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                        <svg class="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                      </div>
                      <div>
                        <p class="text-sm font-semibold">{{ selectedEntry.customer_name || 'N/A' }}</p>
                        <p class="text-xs text-slate-500">Customer</p>
                      </div>
                    </div>

                    <!-- Merchant Info -->
                    <div class="flex items-center gap-3 pt-3 border-t">
                      <div class="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                        <span class="text-blue-600 font-bold text-sm">M</span>
                      </div>
                      <div>
                        <p class="text-sm font-semibold">{{ selectedEntry.merchant_name || 'N/A' }}</p>
                        <p class="text-xs text-slate-500">Merchant</p>
                      </div>
                    </div>

                    <!-- Related Order Link -->
                    <div class="mt-4 pt-4 border-t border-slate-100">
                      <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Related Order</h4>
                      <router-link 
                        :to="`/orders?id=${selectedEntry.order_id}`"
                        class="flex items-center justify-between p-3 rounded-xl bg-card border hover:border-primary/30 hover:shadow-sm transition-all group"
                      >
                        <div class="flex items-center gap-3 min-w-0">
                          <div class="h-8 w-8 rounded-lg bg-slate-50 flex-shrink-0 flex items-center justify-center">
                            <svg class="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                            </svg>
                          </div>
                          <div class="flex flex-col min-w-0">
                            <span class="text-xs font-semibold text-slate-900">Order</span>
                            <span class="text-[10px] font-mono text-slate-500 truncate" :title="selectedEntry.order_id">{{ selectedEntry.order_id }}</span>
                          </div>
                        </div>
                        <svg class="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/>
                        </svg>
                      </router-link>
                    </div>
                  </div>
                </div>

                <!-- Summary -->
                <div class="bg-card rounded-xl border p-6 shadow-sm">
                  <h3 class="text-sm font-semibold text-slate-900 mb-4">Summary</h3>
                  <div class="space-y-3">
                    <div class="flex justify-between text-xs">
                      <span class="text-slate-500">Opening Balance</span>
                      <span class="font-medium">{{ formatCurrency(selectedEntry.opening_balance) }}</span>
                    </div>
                    <div class="flex justify-between text-xs">
                      <span class="text-slate-500">Amount</span>
                      <span 
                        class="font-medium"
                        :class="selectedEntry.type === 'credit' ? 'text-green-600' : 'text-red-600'"
                      >
                        {{ selectedEntry.type === 'credit' ? '+' : '-' }}{{ formatCurrency(selectedEntry.transaction_amount) }}
                      </span>
                    </div>
                    <div class="pt-2 border-t flex justify-between">
                      <span class="text-sm font-bold text-slate-900">Net</span>
                      <span class="text-sm font-bold text-slate-900">{{ formatCurrency(selectedEntry.closing_balance) }}</span>
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
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import DataTable from '@/components/DataTable.vue'
import { call } from 'frappe-ui'
import { toast } from 'vue-sonner'
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet'

// Filters
const filters = ref({
  type: '',
  fromDate: '',
  toDate: ''
})

const ledgerColumns = [
  { key: 'id', label: 'TRANSACTION ID', sortable: true },
  { key: 'merchant_name', label: 'MERCHANT', sortable: true },
  { key: 'order_id', label: 'ORDER ID', sortable: true },
  { key: 'type', label: 'Transaction Type', type: 'badge', sortable: true },
  { key: 'transaction_amount', label: 'Transaction Amount', type: 'currency', sortable: true },
  { key: 'opening_balance', label: 'Opening Balance', type: 'currency', sortable: true },
  { key: 'closing_balance', label: 'Closing Balance', type: 'currency', sortable: true },
  { key: 'date', label: 'Date', type: 'datetime', sortable: true }
]

const ledgerData = ref([])
const loading = ref(false)
const isSheetOpen = ref(false)
const selectedEntry = ref(null)

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text)
  toast.success('Copied to clipboard')
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

// Open Ledger Sheet
const openLedgerSheet = (entry) => {
  selectedEntry.value = entry
  isSheetOpen.value = true
}

// Fetch ledger entries from API
const fetchLedger = async () => {
  loading.value = true
  try {
    const filterData = {
      type: filters.value.type || null,
      from_date: filters.value.fromDate || null,
      to_date: filters.value.toDate || null
    }

    const response = await call('iswitch.admin_portal_api.get_ledger_entries', {
      filter_data: JSON.stringify(filterData),
      page: 1,
      page_size: 50
    })
    
    // Frappe wraps response in 'message' object
    const data = response?.message || response
    
    if (data && data.entries) {
      ledgerData.value = data.entries.map(entry => ({
        ...entry,
        id: entry.id,
        order_id: entry.order_id || '-',
        type: entry.type.toLowerCase(),
        transaction_amount: parseFloat(entry.transaction_amount || 0),
        opening_balance: parseFloat(entry.opening_balance || 0),
        closing_balance: parseFloat(entry.closing_balance || 0),
        date: entry.date,
        merchant_name: entry.merchant_name || 'N/A',
        customer_name: entry.customer_name,
        order_status: entry.order_status,
        fee: parseFloat(entry.fee || 0),
        tax: parseFloat(entry.tax || 0),
        order_amount: parseFloat(entry.order_amount || 0),
        product: entry.product,
        completion_date: entry.completion_date
      }))
    }
  } catch (error) {
    console.error('Error fetching ledger:', error)
    ledgerData.value = []
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  fetchLedger()
}

const exportLedger = async () => {
  try {
    const filterParams = {
      type: filters.value.type,
      from_date: filters.value.fromDate,
      to_date: filters.value.toDate
    }
    
    const response = await fetch('/api/method/iswitch.admin_portal_api.export_ledger_to_excel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Frappe-CSRF-Token': window.csrf_token || ''
      },
      body: JSON.stringify({ filters: JSON.stringify(filterParams) })
    })
    
    if (!response.ok) {
      throw new Error('Export failed')
    }
    
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ledger.xlsx'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    toast.success('Ledger exported successfully')
  } catch (error) {
    console.error('Error exporting ledger:', error)
    toast.error('Failed to export ledger')
  }
}

// Fetch ledger when component mounts
onMounted(() => {
  fetchLedger()
  
  // Handle auto-opening ledger entry if ID is in query params
  const route = useRoute()
  const ledgerId = route.query.id
  if (ledgerId) {
    handleDeepLink(ledgerId)
  }
})

// Also watch for route changes
const route = useRoute()
watch(() => route.query.id, (newId) => {
  if (newId) {
    handleDeepLink(newId)
  }
})

const handleDeepLink = async (ledgerId) => {
  // First check if already in list
  const existing = ledgerData.value.find(e => e.id === ledgerId)
  if (existing) {
    openLedgerSheet(existing)
    return
  }

  // If not in list, fetch single ledger details
  try {
    const response = await call('iswitch.admin_portal_api.get_ledger_details', { ledger_id: ledgerId })
    const entry = response?.message || response
    if (entry) {
      const mappedEntry = {
        ...entry,
        id: entry.id,
        order_id: entry.order_id || '-',
        type: entry.type.toLowerCase(),
        transaction_amount: parseFloat(entry.transaction_amount || 0),
        opening_balance: parseFloat(entry.opening_balance || 0),
        closing_balance: parseFloat(entry.closing_balance || 0),
        date: entry.date,
        merchant_name: entry.merchant_name || 'N/A',
        customer_name: entry.customer_name,
        order_status: entry.order_status,
        fee: parseFloat(entry.fee || 0),
        tax: parseFloat(entry.tax || 0),
        order_amount: parseFloat(entry.order_amount || 0),
        product: entry.product,
        completion_date: entry.completion_date
      }
      openLedgerSheet(mappedEntry)
    }
  } catch (error) {
    console.error('Error fetching deep-linked ledger entry:', error)
  }
}
</script>

<style scoped>
.space-y-6 > * + * {
  margin-top: 1.5rem;
}
</style>

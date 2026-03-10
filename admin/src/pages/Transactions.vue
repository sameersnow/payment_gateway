<template>
  <div class="p-6 max-w-7xl mx-auto space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-foreground">Transactions</h1>
        <p class="text-muted-foreground mt-1 text-sm font-medium">View and manage all financial transactions across the platform.</p>
      </div>
      <Button variant="outline" @click="exportLedger" class="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
        Export
      </Button>
    </div>

    <!-- Filters -->
    <Card class="border-none shadow-none bg-muted/30 mb-6">
        <CardContent class="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div class="space-y-2 lg:col-span-1">
                <label class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Status</label>
                <Select v-model="filters.status">
                    <SelectTrigger class="w-full bg-background border-muted-foreground/20 h-10">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All Status">All Status</SelectItem>
                        <SelectItem value="Success">Success</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Processing">Processing</SelectItem>
                        <SelectItem value="Failed">Failed</SelectItem>
                        <SelectItem value="Reversed">Reversed</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div class="space-y-2">
                <label class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">From Date</label>
                <Input 
                    type="datetime-local" 
                    v-model="filters.fromDate" 
                    class="h-10 bg-background border-muted-foreground/20 focus:border-primary transition-all shadow-sm"
                />
            </div>
            <div class="space-y-2">
                <label class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">To Date</label>
                <Input 
                    type="datetime-local" 
                    v-model="filters.toDate" 
                    class="h-10 bg-background border-muted-foreground/20 focus:border-primary transition-all shadow-sm"
                />
            </div>
            <Button @click="applyFilters" class="h-10 px-6 font-bold shadow-md hover:shadow-lg transition-all">
                Apply Filters
            </Button>
        </CardContent>
    </Card>

    <!-- Table -->
    <div class="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
      <DataTable
        :columns="transactionColumns"
        :data="transactionData"
        :per-page="20"
      >
        <template #cell-id="{ row, value }">
          <button 
            type="button"
            class="font-mono font-bold text-primary hover:underline hover:text-primary/80 transition-colors focus:outline-none uppercase"
            @click="viewTransaction(row)"
          >
            {{ value }}
          </button>
        </template>
        <template #cell-status="{ value }">
          <Badge
            variant="secondary"
            class="font-bold text-[10px] uppercase tracking-tighter h-5 px-2 rounded-full border-none shadow-none"
            :class="getBadgeClass(value)"
          >
            {{ value }}
          </Badge>
        </template>
      </DataTable>
    </div>

    <!-- Transaction Details Sheet -->
    <Sheet v-model:open="isSheetOpen">
      <SheetContent class="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader class="mb-6">
          <div class="flex items-start justify-between">
            <div class="space-y-1">
              <SheetTitle class="text-2xl font-bold uppercase">Transaction {{ selectedTransaction?.id }}</SheetTitle>
              <SheetDescription>
                Initiated on {{ formatDateTime(selectedTransaction?.date) }}
              </SheetDescription>
            </div>
            <Badge :class="getBadgeClass(selectedTransaction?.status)" class="text-sm px-3 py-1">
              {{ selectedTransaction?.status }}
            </Badge>
          </div>
        </SheetHeader>

        <div v-if="selectedTransaction" class="space-y-8">
           <!-- Transaction Summary -->
           <div>
            <h3 class="font-semibold text-lg mb-4">Transaction Summary</h3>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <p class="text-sm text-muted-foreground">Amount</p>
                <p class="font-medium text-lg">{{ formatCurrency(selectedTransaction.amount) }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-sm text-muted-foreground">Order ID</p>
                <p class="font-mono">{{ selectedTransaction.order_id }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-sm text-muted-foreground">Integration</p>
                <p class="font-medium uppercase">{{ selectedTransaction.integration }}</p>
              </div>
               <div class="space-y-1">
                <p class="text-sm text-muted-foreground">Product</p>
                <p class="font-medium">{{ selectedTransaction.product_name }}</p>
              </div>
            </div>
           </div>

           <Separator />

           <!-- Technical Details -->
           <div>
            <h3 class="font-semibold text-lg mb-4">Technical Details</h3>
            <div class="grid grid-cols-2 gap-4">
               <div class="space-y-1">
                <p class="text-sm text-muted-foreground">Bank Ref (UTR)</p>
                <div class="flex items-center gap-2">
                    <p class="font-mono text-sm">{{ selectedTransaction.utr || '-' }}</p>
                    <button v-if="selectedTransaction.utr" @click="copyToClipboard(selectedTransaction.utr)" class="text-muted-foreground hover:text-foreground">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    </button>
                </div>
              </div>
              <div class="space-y-1">
                <p class="text-sm text-muted-foreground">CRN</p>
                <div class="flex items-center gap-2">
                    <p class="font-mono text-sm">{{ selectedTransaction.crn || '-' }}</p>
                    <button v-if="selectedTransaction.crn" @click="copyToClipboard(selectedTransaction.crn)" class="text-muted-foreground hover:text-foreground">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    </button>
                </div>
              </div>
              <div class="space-y-1">
                <p class="text-sm text-muted-foreground">Client Ref ID</p>
                <div class="flex items-center gap-2">
                    <p class="font-mono text-sm">{{ selectedTransaction.client_ref_id || '-' }}</p>
                    <button v-if="selectedTransaction.client_ref_id" @click="copyToClipboard(selectedTransaction.client_ref_id)" class="text-muted-foreground hover:text-foreground">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    </button>
                </div>
              </div>
              <div class="space-y-1">
                <p class="text-sm text-muted-foreground">Last Updated</p>
                <p class="font-medium text-sm">{{ formatDateTime(selectedTransaction.modified || selectedTransaction.date) }}</p>
              </div>
            </div>
            
            <!-- Remark Section (if exists) -->
            <div v-if="selectedTransaction.remark" class="mt-4 pt-4 border-t">
              <p class="text-sm text-muted-foreground mb-2">Remark</p>
              <div class="rounded-md bg-muted/30 p-3">
                <p class="text-sm">{{ selectedTransaction.remark }}</p>
              </div>
            </div>
           </div>

           <Separator />

           <!-- Merchant -->
           <div>
               <h3 class="font-semibold text-lg mb-4">Merchant</h3>
               <div class="flex items-center gap-3">
                   <div class="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                       M
                   </div>
                   <div>
                       <p class="font-medium">{{ selectedTransaction.merchant_name || selectedTransaction.merchant }}</p>
                       <p class="text-sm text-muted-foreground">Merchant Partner</p>
                   </div>
               </div>
            </div>

            <Separator />
            
            <!-- Timeline (Simplified) -->
             <div>
            <h3 class="font-semibold text-lg mb-4">Timeline</h3>
            <div class="relative pl-6 space-y-6 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 before:content-['']">
                <!-- Initiated -->
                <div class="relative pb-2">
                    <div class="absolute -left-[19px] top-1.5 h-3 w-3 rounded-full border border-background bg-slate-300 z-10"></div>
                     <div class="space-y-1">
                        <p class="text-sm font-medium">Transaction Initiated</p>
                        <p class="text-xs text-muted-foreground">{{ formatDateTime(selectedTransaction.date) }}</p>
                    </div>
                </div>
                <!-- Status -->
                <div class="relative">
                    <div class="absolute -left-[19px] top-1.5 h-3 w-3 rounded-full border border-background z-10"
                        :class="selectedTransaction.status === 'success' ? 'bg-green-500' : 'bg-slate-300'"></div>
                     <div class="space-y-1">
                        <p class="text-sm font-medium capitalize">{{ selectedTransaction.status }}</p>
                        <p class="text-xs text-muted-foreground">
                            {{ selectedTransaction.status === 'success' ? 'Completed successfully' : 'Current Status' }}
                        </p>
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
import { ref, onMounted } from 'vue'
import DataTable from '@/components/DataTable.vue'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { call } from 'frappe-ui'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { toast } from 'vue-sonner'

// Filters
const filters = ref({
  status: '',
  fromDate: '',
  toDate: ''
})

const transactionColumns = [
  { key: 'id', label: 'TRANSACTION ID', sortable: true },
  { key: 'merchant', label: 'MERCHANT', sortable: true },
  { key: 'order_id', label: 'ORDER ID', sortable: true },
  { key: 'product_name', label: 'PRODUCT', sortable: true },
  { key: 'amount', label: 'AMOUNT', type: 'currency', sortable: true },
  { key: 'status', label: 'STATUS', type: 'custom', sortable: true },
  { key: 'integration', label: 'INTEGRATION', sortable: true },
  { key: 'utr', label: 'UTR', sortable: true },
  { key: 'date', label: 'DATE', type: 'datetime', sortable: true }
]

const transactionData = ref([])
const loading = ref(false)
const isSheetOpen = ref(false)
const selectedTransaction = ref(null)

// Fetch transactions from API
const fetchTransactions = async () => {
  loading.value = true
  try {
    const filterData = {
      status: filters.value.status || null,
      from_date: filters.value.fromDate || null,
      to_date: filters.value.toDate || null
    }

    const response = await call('iswitch.admin_portal_api.get_transactions', {
      filter_data: JSON.stringify(filterData),
      page: 1,
      page_size: 50
    })
    
    const data = response?.message || response
    
    if (data && data.transactions) {
      transactionData.value = data.transactions.map(entry => ({
        ...entry,
        status: entry.status.toLowerCase()
      }))
    }
  } catch (error) {
    console.error('Error fetching transactions:', error)
    transactionData.value = []
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  fetchTransactions()
}

// Fetch transactions when component mounts
onMounted(() => {
  fetchTransactions()
})

const viewTransaction = async (entry) => {
  isSheetOpen.value = true
  selectedTransaction.value = entry
  
  try {
    const response = await call('iswitch.admin_portal_api.get_transaction_details', {
        transaction_id: entry.id
    })
    const data = response?.message || response
    if (data) {
        selectedTransaction.value = {
            ...data,
            status: data.status.toLowerCase()
        }
    }
  } catch (error) {
    console.error('Error fetching transaction details:', error)
  }
}

const exportLedger = async () => {
    try {
        const filterParams = {
            status: filters.value.status,
            from_date: filters.value.fromDate,
            to_date: filters.value.toDate
        }
        
        const response = await fetch('/api/method/iswitch.admin_portal_api.export_transactions_to_excel', {
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
        a.download = 'transactions.xlsx'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast.success('Transactions exported successfully')
    } catch (error) {
        console.error('Error exporting transactions:', error)
        toast.error('Failed to export transactions')
    }
}

const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied ID to clipboard')
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
  if (status === 'success' || status === 'processed') {
    return 'bg-green-100 text-green-700 hover:bg-green-100'
  }
  if (status === 'processing' || status === 'pending') {
    return 'bg-blue-100 text-blue-700 hover:bg-blue-100'
  }
  if (status === 'queued') {
    return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
  }
  if (status === 'failed' || status === 'cancelled' || status === 'rejected' || status === 'reversed') {
    return 'bg-red-100 text-red-700 hover:bg-red-100'
  }
  return 'bg-slate-100 text-slate-700 hover:bg-slate-100'
}
</script>


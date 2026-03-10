<template>
  <div class="p-6 max-w-7xl mx-auto space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-foreground">VAN Logs</h1>
        <p class="text-muted-foreground mt-1 text-sm font-medium">Monitor Virtual Account Number (VAN) activity and log entries.</p>
      </div>
      <Button variant="outline" @click="exportVANLogs" class="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="12" x2="12" y2="3"/>
        </svg>
        Export
      </Button>
    </div>

    <!-- Filters -->
    <Card class="border-none shadow-none bg-muted/30 mb-6">
        <CardContent class="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div class="space-y-2">
                <label class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Status</label>
                <Select v-model="filters.status">
                    <SelectTrigger class="w-full bg-background border-muted-foreground/20 h-10">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All Status">All Status</SelectItem>
                        <SelectItem value="Success">Success</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Failed">Failed</SelectItem>
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
        :columns="vanColumns"
        :data="vanLogs"
        :per-page="20"
      >
        <template #cell-id="{ row, value }">
          <button 
            type="button"
            class="font-mono font-bold text-primary hover:underline hover:text-primary/80 transition-colors focus:outline-none"
            @click="viewLog(row)"
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
        <template #cell-type="{ value }">
            <Badge variant="outline" class="font-bold text-[10px] uppercase h-5 border-muted-foreground/20 text-muted-foreground">
                {{ value }}
            </Badge>
        </template>
      </DataTable>
    </div>

    <!-- VAN Log Details Sheet -->
    <Sheet v-model:open="isSheetOpen">
      <SheetContent class="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader class="mb-6">
          <div class="flex items-center justify-between">
            <div class="space-y-1">
              <SheetTitle class="text-2xl font-bold">Log {{ selectedLog?.id }}</SheetTitle>
              <SheetDescription>
                Logged on {{ formatDateTime(selectedLog?.date) }}
              </SheetDescription>
            </div>
            <Badge :class="getBadgeClass(selectedLog?.status)" class="text-sm px-3 py-1">
              {{ selectedLog?.status }}
            </Badge>
          </div>
        </SheetHeader>

        <div v-if="selectedLog" class="space-y-8">
            <!-- Approval Actions for Pending Credits -->
            <div v-if="selectedLog.status === 'pending' && selectedLog.type && selectedLog.type.toLowerCase() === 'credit'" class="flex gap-3 pb-4 border-b">
                <Button 
                    class="bg-green-600 hover:bg-green-700 text-white font-bold h-10 px-6 flex-1 shadow-sm"
                    :loading="processingId === selectedLog.id && processingAction === 'approve'"
                    @click="handleAction('approve', selectedLog)"
                >
                    Approve Credit
                </Button>
                <Button 
                    variant="outline"
                    class="border-red-200 text-red-700 hover:bg-red-50 font-bold h-10 px-6 flex-1" 
                    :loading="processingId === selectedLog.id && processingAction === 'reject'"
                    @click="handleAction('reject', selectedLog)"
                >
                    Reject
                </Button>
            </div>

            <!-- Log Summary -->
            <div>
                <h3 class="font-semibold text-lg mb-4">Log Summary</h3>
                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                        <p class="text-sm text-muted-foreground">Amount</p>
                        <p class="font-medium text-lg">{{ formatCurrency(selectedLog.amount) }}</p>
                    </div>
                     <div class="space-y-1">
                        <p class="text-sm text-muted-foreground">Account Number</p>
                        <p class="font-mono">{{ selectedLog.account_number }}</p>
                    </div>
                     <div class="space-y-1">
                        <p class="text-sm text-muted-foreground">Transaction Type</p>
                         <Badge variant="outline" class="font-bold text-[10px] uppercase">{{ selectedLog.type }}</Badge>
                    </div>
                </div>
            </div>

            <Separator />

             <!-- Remitter Info -->
            <div v-if="selectedLog.remitter_name">
                <h3 class="font-semibold text-lg mb-4">Remitter Information</h3>
                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1 col-span-2">
                        <p class="text-sm text-muted-foreground">Name</p>
                        <p class="font-bold">{{ selectedLog.remitter_name }}</p>
                    </div>
                    <div class="space-y-1">
                        <p class="text-sm text-muted-foreground">Account</p>
                        <p class="font-mono text-sm">{{ selectedLog.remitter_account_number || '-' }}</p>
                    </div>
                    <div class="space-y-1">
                        <p class="text-sm text-muted-foreground">IFSC</p>
                        <p class="font-mono text-sm">{{ selectedLog.remitter_ifsc_code || '-' }}</p>
                    </div>
                </div>
            </div>

            <Separator v-if="selectedLog.remitter_name" />

            <!-- Technical Data -->
            <div>
                 <h3 class="font-semibold text-lg mb-4">Technical Data</h3>
                 <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                        <p class="text-sm text-muted-foreground">Bank Ref (UTR)</p>
                        <div class="flex items-center gap-2">
                            <p class="font-mono">{{ selectedLog.utr || '-' }}</p>
                            <button v-if="selectedLog.utr" @click="copyToClipboard(selectedLog.utr)" class="text-muted-foreground hover:text-foreground">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                            </button>
                        </div>
                    </div>
                    <div class="space-y-1">
                        <p class="text-sm text-muted-foreground">Opening Balance</p>
                        <p class="font-medium">{{ formatCurrency(selectedLog.opening_balance) }}</p>
                    </div>
                    <div class="space-y-1">
                        <p class="text-sm text-muted-foreground">Closing Balance</p>
                         <p class="font-medium">{{ formatCurrency(selectedLog.closing_balance) }}</p>
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
                       <p class="font-medium">{{ selectedLog.merchant_name || selectedLog.merchant }}</p>
                       <p class="text-sm text-muted-foreground">Merchant</p>
                   </div>
               </div>
            </div>

            <Separator />
            
             <!-- Timeline -->
             <div>
            <h3 class="font-semibold text-lg mb-4">Activity Timeline</h3>
            <div class="relative pl-6 space-y-6 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 before:content-['']">
                <!-- Recorded -->
                <div class="relative pb-2">
                    <div class="absolute -left-[19px] top-1.5 h-3 w-3 rounded-full border border-background bg-green-500 z-10"></div>
                     <div class="space-y-1">
                        <p class="text-sm font-medium">Log entry recorded</p>
                        <p class="text-xs text-muted-foreground">{{ formatDateTime(selectedLog.date) }}</p>
                    </div>
                </div>
                <!-- Status -->
                <div class="relative">
                    <div class="absolute -left-[19px] top-1.5 h-3 w-3 rounded-full border border-background z-10"
                         :class="selectedLog.status === 'success' ? 'bg-green-500' : 'bg-slate-300'"></div>
                     <div class="space-y-1">
                        <p class="text-sm font-medium capitalize">Status: {{ selectedLog.status }}</p>
                        <p class="text-xs text-muted-foreground">
                            {{ selectedLog.status === 'success' ? 'Finalized' : 'Action Required' }}
                        </p>
                    </div>
                </div>
            </div>
           </div>
        </div>
      </SheetContent>
    </Sheet>

    <!-- Confirmation Dialog -->
    <Dialog v-model:open="isConfirmDialogOpen">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirm Action</DialogTitle>
          <DialogDescription>
            Are you sure you want to {{ pendingAction }} this request?
          </DialogDescription>
        </DialogHeader>
        <div v-if="pendingLog" class="py-4">
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-muted-foreground">Amount:</span>
              <span class="font-medium">{{ formatCurrency(pendingLog.amount) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Account:</span>
              <span class="font-mono text-xs">{{ pendingLog.account_number }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Merchant:</span>
              <span class="font-medium">{{ pendingLog.merchant_name || pendingLog.merchant || 'N/A' }}</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="isConfirmDialogOpen = false">Cancel</Button>
          <Button 
            :class="pendingAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'"
            @click="confirmAction"
          >
            {{ pendingAction === 'approve' ? 'Approve' : 'Reject' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { call } from 'frappe-ui'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'vue-sonner'
import { Separator } from '@/components/ui/separator'

// Filters
const filters = ref({
  status: '',
  fromDate: '',
  toDate: ''
})

const processingId = ref(null)
const processingAction = ref(null)
const isSheetOpen = ref(false)
const selectedLog = ref(null)

// Confirmation dialog state
const isConfirmDialogOpen = ref(false)
const pendingAction = ref('')
const pendingLog = ref(null)

const vanColumns = [
  { key: 'id', label: 'TRANSACTION ID', sortable: true },
  { key: 'merchant', label: 'MERCHANT', sortable: true },
  { key: 'account_number', label: 'ACCOUNT NUMBER', sortable: true },
  { key: 'amount', label: 'AMOUNT', type: 'currency', sortable: true },
  { key: 'type', label: 'TYPE', type: 'custom', sortable: true },
  { key: 'utr', label: 'UTR', sortable: true },
  { key: 'status', label: 'STATUS', type: 'custom', sortable: true },
  { key: 'date', label: 'DATE', type: 'datetime', sortable: true }
]

const vanLogs = ref([])
const loading = ref(false)

// Fetch VAN logs from API
const fetchVANLogs = async () => {
  loading.value = true
  try {
    const filterData = {
      status: filters.value.status || null,
      from_date: filters.value.fromDate || null,
      to_date: filters.value.toDate || null
    }

    const response = await call('iswitch.admin_portal_api.get_van_logs', {
      filter_data: JSON.stringify(filterData),
      page: 1,
      page_size: 50
    })
    
    const data = response?.message || response
    
    if (data && data.logs) {
      vanLogs.value = data.logs.map(log => ({
        ...log,
        // log.id from API is the transaction ID (v.name)
        // Keep it as is for display
        merchant: log.merchant_name || log.merchant || 'N/A',
        status: log.status.toLowerCase()
      }))
    }
  } catch (error) {
    console.error('Error fetching VAN logs:', error)
    vanLogs.value = []
  } finally {
    loading.value = false
  }
}

const handleAction = async (action, row) => {
    // Open confirmation dialog instead of using native confirm
    pendingAction.value = action
    pendingLog.value = row
    isConfirmDialogOpen.value = true
}

const confirmAction = async () => {
    const action = pendingAction.value
    const row = pendingLog.value
    
    // Close dialog first
    isConfirmDialogOpen.value = false
    
    // Prevent duplicate calls
    if (processingId.value) return

    processingId.value = row.id
    processingAction.value = action
    
    try {
        const method = action === 'approve' 
            ? 'iswitch.admin_portal_api.approve_wallet_topup'
            : 'iswitch.admin_portal_api.reject_wallet_topup'
            
        const response = await call(method, {
            log_id: row.id
        })
        
        const data = response?.message || response
        if (data.success) {
            toast.success(data.message || `Request ${action}ed successfully`)
        } else {
            toast.error(data.error || `Failed to ${action} request`)
        }
    } catch (error) {
        console.error(`Error ${action}ing request:`, error)
        toast.error(`An error occurred while ${action}ing the request`)
    } finally {
        processingId.value = null
        processingAction.value = null
        
        // Always refresh data after action completes (success or failure)
        // Reload the table
        await fetchVANLogs()
        
        // Refresh the sheet if it's still open
        if (isSheetOpen.value && selectedLog.value && selectedLog.value.id === row.id) {
            await viewLog(row)
        }
    }
}

const viewLog = async (log) => {
    isSheetOpen.value = true
    selectedLog.value = log
    
    try {
        const response = await call('iswitch.admin_portal_api.get_van_log_details', {
            log_id: log.id
        })
        const data = response?.message || response
        if (data) {
            selectedLog.value = {
                ...data,
                status: data.status.toLowerCase()
            }
        }
    } catch (error) {
        console.error('Error fetching log details:', error)
    }
}

const applyFilters = () => {
  fetchVANLogs()
}

const exportVANLogs = async () => {
  try {
    const filterData = {
      status: filters.value.status || null,
      from_date: filters.value.fromDate || null,
      to_date: filters.value.toDate || null
    }
    
    const queryParams = new URLSearchParams({
      filters: JSON.stringify(filterData)
    }).toString()
    
    window.location.href = `/api/method/iswitch.admin_portal_api.export_van_logs_to_excel?${queryParams}`
  } catch (error) {
    console.error('Error exporting VAN logs:', error)
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

onMounted(() => {
  fetchVANLogs()
})
</script>

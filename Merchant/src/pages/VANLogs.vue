<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-foreground">Wallet</h1>
        <p class="text-muted-foreground mt-1">Manage your wallet balance and transaction history.</p>
      </div>
      <div class="flex items-center gap-2">
        <button 
          class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          @click="openTopUpDialog"
        >
          <svg class="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Top Up
        </button>
        <button class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2" @click="exportVANLogs">
          <svg class="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="rounded-xl border bg-card text-card-foreground shadow-sm p-6 mb-6">
      <h3 class="text-lg font-semibold mb-4">Filters</h3>
      <div class="flex flex-wrap items-end gap-4">
        <div class="flex-1 min-w-[200px]">
          <label class="block text-sm font-medium text-muted-foreground mb-2">STATUS</label>
          <select v-model="filters.status" class="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <option value="">All Status</option>
            <option value="Success">Success</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
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
        :columns="vanColumns"
        :data="vanLogs"
        :per-page="10"
      >
        <template #cell-id="{ row }">
          <button 
            @click="openVANSheet(row)"
            class="font-medium text-primary hover:underline hover:text-primary/80 transition-colors"
          >
            {{ row.id }}
          </button>
        </template>
      </DataTable>
    </div>

    <!-- VAN Log Details Sheet -->
    <Sheet v-model:open="isSheetOpen">
      <SheetContent class="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader class="mb-6">
          <SheetTitle>VAN Log Details</SheetTitle>
          <SheetDescription>
            Transaction details for {{ selectedLog?.id }}
          </SheetDescription>
        </SheetHeader>
        
        <div v-if="selectedLog" class="space-y-6">
          <!-- Status Banner -->
          <div 
            class="flex items-center justify-between p-4 rounded-lg border"
            :class="{
              'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800': selectedLog.status === 'success',
              'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800': selectedLog.status === 'pending',
              'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800': selectedLog.status === 'failed'
            }"
          >
            <div class="flex flex-col">
              <span class="text-sm text-muted-foreground">Status</span>
              <span class="text-lg font-semibold capitalize">{{ selectedLog.status }}</span>
            </div>
            <div class="flex flex-col items-end">
              <span class="text-sm text-muted-foreground">Amount</span>
              <span class="text-2xl font-bold">₹{{ selectedLog.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }}</span>
            </div>
          </div>

          <!-- Transaction Information -->
          <div class="space-y-4">
            <h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Transaction Information</h3>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <p class="text-sm text-muted-foreground">Transaction ID</p>
                <p class="font-mono text-sm font-medium">{{ selectedLog.id }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-sm text-muted-foreground">Transaction Type</p>
                <p class="text-sm font-medium capitalize">{{ selectedLog.type }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-sm text-muted-foreground">Account Number</p>
                <p class="font-mono text-sm font-medium">{{ selectedLog.account_number }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-sm text-muted-foreground">UTR</p>
                <p class="font-mono text-sm font-medium">{{ selectedLog.utr }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-sm text-muted-foreground">Date & Time</p>
                <p class="text-sm font-medium">{{ selectedLog.date }}</p>
              </div>
            </div>
          </div>

          <!-- Balance Information -->
          <div class="space-y-4">
            <h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Balance Information</h3>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <p class="text-sm text-muted-foreground">Opening Balance</p>
                <p class="text-sm font-semibold">₹{{ selectedLog.opening_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-sm text-muted-foreground">Closing Balance</p>
                <p class="text-sm font-semibold">₹{{ selectedLog.closing_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }}</p>
              </div>
            </div>
          </div>

          <!-- Remitter Information -->
          <div class="space-y-4">
            <h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Remitter Information</h3>
            <div class="space-y-3">
              <div class="space-y-1">
                <p class="text-sm text-muted-foreground">Remitter Name</p>
                <p class="text-sm font-medium">{{ selectedLog.remitter_name || '-' }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-sm text-muted-foreground">Remitter Account Number</p>
                <p class="font-mono text-sm font-medium">{{ selectedLog.remitter_account_number || '-' }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-sm text-muted-foreground">Remitter IFSC Code</p>
                <p class="font-mono text-sm font-medium">{{ selectedLog.remitter_ifsc_code || '-' }}</p>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>

    <!-- Top Up Dialog -->
    <Sheet v-model:open="isTopUpDialogOpen">
      <SheetContent class="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader class="mb-6">
          <SheetTitle>Request Wallet Top-Up</SheetTitle>
          <SheetDescription>
            Enter the amount you want to add to your wallet
          </SheetDescription>
        </SheetHeader>
        
        <form @submit.prevent="submitTopUpRequest" class="space-y-6">
          <!-- Amount Field (Required) -->
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="amount">
              Amount <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
              <input
                id="amount"
                v-model.number="topUpForm.amount"
                type="number"
                step="0.01"
                min="1"
                required
                placeholder="0.00"
                class="flex h-10 w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <p class="text-xs text-muted-foreground">Enter the amount you want to top up</p>
          </div>

          <!-- UTR/Reference (Required) -->
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="utr">
              UTR / Reference Number <span class="text-red-500">*</span>
            </label>
            <input
              id="utr"
              v-model="topUpForm.utr"
              type="text"
              required
              placeholder="Enter UTR or reference number"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p class="text-xs text-muted-foreground">Transaction reference number for tracking</p>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3 pt-4">
            <button
              type="button"
              @click="isTopUpDialogOpen = false"
              class="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSubmitting || !topUpForm.amount || !topUpForm.utr"
              class="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {{ isSubmitting ? 'Submitting...' : 'Submit Request' }}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import DataTable from '@/components/DataTable.vue'
import { call } from 'frappe-ui'
import { toast } from 'vue-sonner'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

// Filters
const filters = ref({
  status: '',
  fromDate: '',
  toDate: ''
})

const vanColumns = [
  { key: 'id', label: 'Transaction ID', sortable: true },
  { key: 'account_number', label: 'Account Number', sortable: true },
  { key: 'amount', label: 'Amount', type: 'currency', sortable: true },
  { key: 'type', label: 'Type', type: 'badge', sortable: true },
  { key: 'utr', label: 'UTR', sortable: true },
  { key: 'status', label: 'Status', type: 'badge', sortable: true },
  { key: 'date', label: 'Date', type: 'datetime', sortable: true }
]

const vanLogs = ref([])
const loading = ref(false)
const isSheetOpen = ref(false)
const selectedLog = ref(null)

// Open VAN Log Sheet
const openVANSheet = (log) => {
  selectedLog.value = log
  isSheetOpen.value = true
}

// Fetch VAN logs from API
const fetchVANLogs = async () => {
  loading.value = true
  try {
    const filterData = {
      status: filters.value.status || null,
      from_date: filters.value.fromDate || null,
      to_date: filters.value.toDate || null
    }

    const response = await call('iswitch.merchant_portal_api.get_van_logs', {
      filter_data: JSON.stringify(filterData),
      page: 1,
      page_size: 50
    })
    
    // Frappe wraps response in 'message' object
    const data = response?.message || response
    
    if (data && data.logs) {
      vanLogs.value = data.logs.map(log => ({
        id: log.id,
        account_number: log.account_number,
        amount: parseFloat(log.amount || 0),
        type: log.type,
        utr: log.utr || '-',
        status: log.status.toLowerCase(),
        opening_balance: parseFloat(log.opening_balance || 0),
        closing_balance: parseFloat(log.closing_balance || 0),
        remitter_name: log.remitter_name,
        remitter_account_number: log.remitter_account_number,
        remitter_ifsc_code: log.remitter_ifsc_code,
        date: log.date
      }))
    }
  } catch (error) {
    console.error('Error fetching VAN logs:', error)
    vanLogs.value = []
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  fetchVANLogs()
}

// Top-up dialog state
const isTopUpDialogOpen = ref(false)
const isSubmitting = ref(false)
const topUpForm = ref({
  amount: null,
  utr: ''
})

// Open top-up dialog
const openTopUpDialog = () => {
  // Reset form
  topUpForm.value = {
    amount: null,
    utr: ''
  }
  isTopUpDialogOpen.value = true
}

// Submit top-up request
const submitTopUpRequest = async () => {
  if (!topUpForm.value.amount || topUpForm.value.amount <= 0) {
    toast.error('Please enter a valid amount')
    return
  }

  if (!topUpForm.value.utr || topUpForm.value.utr.trim() === '') {
    toast.error('Please enter a UTR/Reference number')
    return
  }

  isSubmitting.value = true
  
  try {
    const response = await call('iswitch.merchant_portal_api.request_wallet_topup', {
      amount: topUpForm.value.amount,
      utr: topUpForm.value.utr.trim()
    })

    const data = response
    
    if (data?.status === 'success') {
      toast.success(data.message || 'Top-up request submitted successfully! Your request is pending approval.')
      isTopUpDialogOpen.value = false
      // Refresh the VAN logs to show the new pending entry
      await fetchVANLogs()
    } else {
      toast.error(data?.message || 'Failed to submit top-up request')
    }
  } catch (error) {
    console.error('Error submitting top-up request:', error)
    toast.error('An error occurred while submitting your request. Please try again.')
  } finally {
    isSubmitting.value = false
  }
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
    
    window.location.href = `/api/method/iswitch.merchant_portal_api.export_van_logs_to_excel?${queryParams}`
  } catch (error) {
    console.error('Error exporting VAN logs:', error)
  }
}

// Fetch VAN logs when component mounts
onMounted(() => {
  fetchVANLogs()
})
</script>

<style scoped>
.space-y-6 > * + * {
  margin-top: 1.5rem;
}
</style>

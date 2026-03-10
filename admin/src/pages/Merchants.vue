<template>
  <div class="p-6 max-w-7xl mx-auto space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">Merchants</h2>
        <p class="text-muted-foreground mt-2">Manage merchants and their pricing configurations.</p>
      </div>
      <Button variant="outline" @click="exportMerchants" class="flex items-center gap-2">
           <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
      </Button>
    </div>

    <!-- Filters -->
    <Card class="border-none shadow-none bg-muted/30 mb-6">
        <CardContent class="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div class="space-y-2">
                <label class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Search Merchant</label>
                <div class="relative group">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                    <Input 
                        v-model="searchQuery" 
                        placeholder="ID, Company or Email..." 
                        class="h-10 pl-10 bg-background border-muted-foreground/20 focus:border-primary transition-all shadow-sm"
                    />
                </div>
            </div>
            <div class="space-y-2">
                <label class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Account Status</label>
                <Select v-model="filters.status">
                  <SelectTrigger class="w-full bg-background border-muted-foreground/20 h-10">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Status">All Status</SelectItem>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Submitted">Submitted</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                    <SelectItem value="Terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
            </div>
            <div class="flex gap-2">
                <Button @click="fetchMerchants" class="h-10 px-6 font-bold flex-1 shadow-md hover:shadow-lg transition-all">
                    Apply Filters
                </Button>
            </div>
        </CardContent>
    </Card>

    <!-- Merchants Table -->
    <div class="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div class="p-4 border-b bg-muted/40 flex items-center justify-between" v-if="selectedRows.length > 0">
            <span class="text-sm font-medium">{{ selectedRows.length }} selected</span>
            <div class="flex gap-2">
                <Button variant="outline" size="sm" @click="openBulkStatusUpdate">
                    Bulk Update Status
                </Button>
                <Button variant="outline" size="sm" @click="openBulkIntegrationUpdate">
                    Update Integration
                </Button>
            </div>
        </div>

      <DataTable
        :columns="merchantColumns"
        :data="merchants"
        :per-page="20"
        :selectable="true"
        @update:selection="selectedRows = $event"
      >
        <template #cell-name="{ row, value }">
          <button 
            type="button"
            class="font-medium text-primary hover:underline focus:outline-none"
            @click="editMerchant(row)"
          >
            {{ value }}
          </button>
        </template>
        <template #cell-status="{ value }">
          <Badge
            variant="secondary"
            class="font-bold text-[10px] uppercase tracking-tighter h-5 px-2"
            :class="{
              'bg-green-100 text-green-700': value === 'Approved',
              'bg-blue-100 text-blue-700': value === 'Submitted',
              'bg-red-100 text-red-700': value === 'Rejected' || value === 'Terminated',
              'bg-slate-100 text-slate-700': value === 'Draft'
            }"
          >
            {{ value }}
          </Badge>
        </template>
        <template #cell-wallet_balance="{ value }">
           ₹ {{ value }}
        </template>
      </DataTable>
    </div>
    <!-- Bulk Update Dialog -->
    <Dialog v-model:open="showBulkDialog">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bulk Update {{ bulkAction === 'update_status' ? 'Status' : 'Integration' }}</DialogTitle>
          <DialogDescription>
             Update {{ selectedRows.length }} selected merchants.
          </DialogDescription>
        </DialogHeader>

        <div class="py-4">
             <div v-if="bulkAction === 'update_status'">
                <label class="block text-sm font-medium mb-2">New Status</label>
                <Select v-model="bulkValue">
                    <SelectTrigger>
                        <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Draft">Draft</SelectItem>
                        <SelectItem value="Submitted">Submitted</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                        <SelectItem value="Terminated">Terminated</SelectItem>
                    </SelectContent>
                </Select>
             </div>
             <div v-else-if="bulkAction === 'update_integration'">
                <label class="block text-sm font-medium mb-2">New Integration</label>
                <Select v-model="bulkValue">
                    <SelectTrigger>
                        <SelectValue placeholder="Select Integration" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem v-for="intg in integrations" :key="intg.name" :value="intg.name">
                            {{ intg.integration_name }}
                        </SelectItem>
                    </SelectContent>
                </Select>
             </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showBulkDialog = false" :disabled="saving">Cancel</Button>
          <Button @click="performBulkUpdate" :loading="saving">Update All</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Merchant Details Sheet -->
    <Sheet v-model:open="isSheetOpen">
      <SheetContent class="w-full sm:max-w-[1000px] overflow-y-auto">
        <SheetHeader class="mb-6">
          <SheetTitle>Merchant Details</SheetTitle>
          <SheetDescription>
            View and manage merchant information.
          </SheetDescription>
        </SheetHeader>
        <MerchantDetails 
            v-if="selectedMerchantId" 
            :id="selectedMerchantId" 
            :is-sheet="true" 
        />
      </SheetContent>
    </Sheet>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { call } from 'frappe-ui'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog'
import DataTable from '@/components/DataTable.vue'
import MerchantDetails from './MerchantDetails.vue'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const router = useRouter()
const searchQuery = ref('')
const loading = ref(false)
const filters = ref({
    status: 'All Status'
})
const selectedRows = ref([])
const isSheetOpen = ref(false)
const selectedMerchantId = ref('')

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(10)
const merchants = ref([])
const totalItems = ref(0)
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))

// Bulk Update Dialog
const showBulkDialog = ref(false)
const bulkAction = ref('') // 'update_status' or 'update_integration'
const bulkValue = ref('')
const integrations = ref([])
const saving = ref(false)

const merchantColumns = [
  { key: 'name', label: 'MERCHANT ID', sortable: true },
  { key: 'company_name', label: 'COMPANY', sortable: true },
  { key: 'wallet_balance', label: 'WALLET', sortable: true },
  { key: 'integration', label: 'INTEGRATION', sortable: true },
  { key: 'status', label: 'STATUS', sortable: true },
  { key: 'creation', label: 'DATE', sortable: true }
]

const openBulkStatusUpdate = () => {
    bulkAction.value = 'update_status'
    bulkValue.value = 'Approved' // Default
    showBulkDialog.value = true
}

const openBulkIntegrationUpdate = () => {
    bulkAction.value = 'update_integration'
    bulkValue.value = ''
    showBulkDialog.value = true
}

const performBulkUpdate = async () => {
    if (!bulkValue.value) return
    
    saving.value = true
    try {
        const merchantNames = selectedRows.value.map(row => row.name)
        await call('iswitch.admin_portal_api.bulk_update_merchants', {
            merchants: JSON.stringify(merchantNames),
            action: bulkAction.value,
            value: bulkValue.value
        })
        
        toast.success('Merchants updated successfully')
        showBulkDialog.value = false
        selectedRows.value = [] // clear selection
        await fetchMerchants()
    } catch (error) {
        console.error('Error performing bulk update:', error)
        toast.error('Failed to update merchants')
    } finally {
        saving.value = false
    }
}

const fetchMerchants = async () => {
    loading.value = true
    try {
        const response = await call('iswitch.admin_portal_api.get_merchants', {
            page: currentPage.value,
            page_size: itemsPerPage.value,
            search_text: searchQuery.value,
            filter_data: JSON.stringify({
                status: filters.value.status !== 'All Status' ? filters.value.status : null
            })
        })
        
        const data = response?.message || response
        if (data) {
            if (data.merchants) {
                merchants.value = data.merchants
            }
            if (data.total_count !== undefined) {
                totalItems.value = data.total_count
            }
        }
    } catch (error) {
        console.error('Error fetching merchants:', error)
        toast.error('Failed to fetch merchants')
    } finally {
        loading.value = false
    }
}

const fetchIntegrations = async () => {
  try {
    const response = await call('iswitch.admin_portal_api.get_processors')
    const data = response?.message || response
    if (data && data.processors) {
      integrations.value = data.processors
    }
  } catch (error) {
    console.error('Error fetching integrations:', error)
  }
}

const editMerchant = (merchant) => {
    selectedMerchantId.value = merchant.name
    isSheetOpen.value = true
}

const exportMerchants = () => {
    try {
        const filterParams = {
            search_text: searchQuery.value || null,
            status: filters.value.status !== 'All Status' ? filters.value.status : null
        }
        
        const queryParams = new URLSearchParams({
            filters: JSON.stringify(filterParams)
        }).toString()
        
        window.location.href = `/api/method/iswitch.admin_portal_api.export_merchants_to_excel?${queryParams}`
    } catch (error) {
        console.error('Error exporting merchants:', error)
        toast.error('Failed to export merchants')
    }
}

// Watchers and Lifecycle
watch(searchQuery, () => {
  currentPage.value = 1
  fetchMerchants()
})

watch([currentPage, itemsPerPage], () => {
  fetchMerchants()
})

onMounted(() => {
  fetchMerchants()
  fetchIntegrations()
})
</script>

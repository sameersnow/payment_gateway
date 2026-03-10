<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-foreground">Processors</h1>
        <p class="text-muted-foreground mt-1">Manage payment processors and integrations.</p>
      </div>
    </div>

    <!-- Processors Table -->
    <div class="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
      <DataTable
        :columns="processorColumns"
        :data="processors"
        :per-page="20"
      >
        <template #cell-name="{ row, value }">
          <button 
            type="button"
            class="font-medium text-primary hover:underline focus:outline-none"
            @click="viewProcessor(row)"
          >
            {{ value }}
          </button>
        </template>
        <template #cell-is_active="{ value }">
          <span 
            class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
            :class="{
              'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300': value,
              'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300': !value
            }"
          >
            {{ value ? 'Active' : 'Inactive' }}
          </span>
        </template>
        <template #cell-products="{ value }">
            <div class="flex flex-wrap gap-1">
                <span v-for="product in value" :key="product" class="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                    {{ product }}
                </span>
                <span v-if="!value || value.length === 0" class="text-muted-foreground italic">None</span>
            </div>
        </template>
      </DataTable>
    </div>

    <!-- Processor Details Sheet -->
    <Sheet v-model:open="isSheetOpen">
      <SheetContent class="w-full sm:max-w-[800px] overflow-y-auto">
        <SheetHeader class="mb-6">
          <SheetTitle>Processor Details</SheetTitle>
          <SheetDescription>
            Reference: {{ selectedProcessor?.integration_name }}
          </SheetDescription>
        </SheetHeader>
        
        <div v-if="selectedProcessor" class="space-y-6">
            <!-- Header with Status -->
            <div class="flex items-center justify-between pb-4 border-b">
                <div>
                    <h3 class="text-xl font-bold">{{ selectedProcessor.integration_name }}</h3>
                    <p class="text-sm text-muted-foreground mt-1">{{ selectedProcessor.integration_type }}</p>
                </div>
                <span 
                    class="inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold"
                    :class="{
                        'bg-green-100 text-green-800': selectedProcessor.is_active,
                        'bg-gray-100 text-gray-800': !selectedProcessor.is_active
                    }"
                >
                    {{ selectedProcessor.is_active ? 'Active' : 'Inactive' }}
                </span>
            </div>

            <!-- Balance Card -->
            <div class="rounded-lg border bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-muted-foreground">Current Balance</p>
                        <p class="text-3xl font-bold mt-2">₹{{ formatNumber(selectedProcessor.balance) }}</p>
                    </div>
                    <div class="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-blue-600 dark:text-blue-400">
                            <rect width="20" height="14" x="2" y="5" rx="2"/>
                            <line x1="2" x2="22" y1="10" y2="10"/>
                        </svg>
                    </div>
                </div>
            </div>

            <!-- API Configuration -->
            <div>
                <h3 class="font-semibold text-lg mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                    API Configuration
                </h3>
                <div class="space-y-4 border rounded-lg p-4 bg-muted/20">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="col-span-2">
                            <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">API Endpoint</label>
                            <div class="mt-1.5 flex items-center gap-2">
                                <code class="flex-1 text-sm bg-background border rounded px-3 py-2 font-mono break-all">{{ selectedProcessor.api_endpoint || 'Not configured' }}</code>
                                <button v-if="selectedProcessor.api_endpoint" @click="copyToClipboard(selectedProcessor.api_endpoint)" class="p-2 hover:bg-muted rounded transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div>
                            <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client ID</label>
                            <div class="mt-1.5 flex items-center gap-2">
                                <code class="flex-1 text-sm bg-background border rounded px-3 py-2 font-mono">{{ selectedProcessor.client_id ? '••••••••' : 'Not set' }}</code>
                                <span class="text-xs text-muted-foreground">(Hidden)</span>
                            </div>
                        </div>
                        <div>
                            <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Secret Key</label>
                            <div class="mt-1.5 flex items-center gap-2">
                                <code class="flex-1 text-sm bg-background border rounded px-3 py-2 font-mono">{{ selectedProcessor._secret_key ? '••••••••' : 'Not set' }}</code>
                                <span class="text-xs text-muted-foreground">(Hidden)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Supported Services -->
            <div>
                <h3 class="font-semibold text-lg mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 3h18v18H3zM21 9H3M21 15H3M12 3v18"/>
                    </svg>
                    Supported Services
                </h3>
                <div v-if="selectedProcessor.products && selectedProcessor.products.length > 0" class="flex flex-wrap gap-2">
                    <span v-for="product in selectedProcessor.products" :key="product" 
                        class="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium bg-primary/5 border-primary/20 text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        {{ product }}
                    </span>
                </div>
                <div v-else class="text-sm text-muted-foreground italic border rounded-lg p-4 bg-muted/20">
                    No services configured
                </div>
            </div>

            <!-- Metadata -->
            <div class="pt-4 border-t">
                <h3 class="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">System Information</h3>
                <div class="grid grid-cols-2 gap-3 text-sm">
                    <div class="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-muted-foreground">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        <span class="text-muted-foreground">Integration ID:</span>
                        <code class="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{{ selectedProcessor.name }}</code>
                    </div>
                    <div class="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-muted-foreground">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        <span class="text-muted-foreground">Type:</span>
                        <span class="font-medium">{{ selectedProcessor.integration_type }}</span>
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
import { call } from 'frappe-ui'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

const processorColumns = [
  { key: 'name', label: 'NAME', sortable: true },
  { key: 'integration_type', label: 'TYPE', sortable: true },
  { key: 'api_endpoint', label: 'API ENDPOINT', sortable: true },
  { key: 'balance', label: 'BALANCE', type: 'currency', sortable: true },
  { key: 'is_active', label: 'STATUS', sortable: true },
  { key: 'products', label: 'SERVICES', sortable: false }
]

const processors = ref([])
const loading = ref(false)
const isSheetOpen = ref(false)
const selectedProcessor = ref(null)

const fetchProcessors = async () => {
  loading.value = true
  try {
    const response = await call('iswitch.admin_portal_api.get_processors')
    const data = response?.message || response
    if (data && data.processors) {
      processors.value = data.processors
    }
  } catch (error) {
    console.error('Error fetching processors:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProcessors()
})

const viewProcessor = (processor) => {
    selectedProcessor.value = processor
    isSheetOpen.value = true
}

const formatNumber = (value) => {
  if (!value) return '0.00'
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text)
  // You can add a toast notification here if you have the toast library imported
  console.log('Copied to clipboard:', text)
}

</script>

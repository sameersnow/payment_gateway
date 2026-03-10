<template>
    <div class="p-6 space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">Virtual Accounts</h1>
          <p class="text-muted-foreground mt-2">Manage your virtual bank accounts.</p>
        </div>
        <button
          @click="handleRequestNewAccount"
          class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4"
        >
          Request New Account
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center h-64">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>

      <!-- Data Table -->
      <div v-else class="rounded-md border bg-card">
        <div class="relative w-full overflow-auto">
          <table class="w-full caption-bottom text-sm">
            <thead class="[&_tr]:border-b">
              <tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Account Number</th>
                <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">IFSC Code</th>
                <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Merchant Name</th>
                <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody class="[&_tr:last-child]:border-0">
              <tr 
                v-for="account in virtualAccounts" 
                :key="account.name"
                class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
              >
                <td class="p-4 align-middle font-mono font-medium">{{ account.account_number }}</td>
                <td class="p-4 align-middle">{{ account.ifsc }}</td>
                <td class="p-4 align-middle">
                  <span 
                    class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                    :class="{
                      'bg-green-100 text-green-800 border-green-200': account.status === 'Active',
                      'bg-yellow-100 text-yellow-800 border-yellow-200': account.status === 'Inactive',
                      'bg-red-100 text-red-800 border-red-200': account.status === 'Frozen',
                      'bg-secondary text-secondary-foreground': !['Active', 'Inactive', 'Frozen'].includes(account.status)
                    }"
                  >
                    {{ account.status }}
                  </span>
                </td>
                <td class="p-4 align-middle">{{ account.merchant_name }}</td>
                <td class="p-4 align-middle">
                  <button 
                    @click="openAccountSheet(account)"
                    class="text-sm font-medium text-primary hover:underline hover:text-primary/80 transition-colors"
                  >
                    View Details
                  </button>
                </td>
              </tr>
              <tr v-if="virtualAccounts.length === 0">
                <td colspan="5" class="p-4 align-middle text-center text-muted-foreground">
                  No virtual accounts found.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Virtual Account Details Sheet -->
      <Sheet v-model:open="isSheetOpen">
        <SheetContent class="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader class="mb-6">
            <SheetTitle>Virtual Account Details</SheetTitle>
            <SheetDescription>
              Account information for {{ selectedAccount?.account_number }}
            </SheetDescription>
          </SheetHeader>
          
          <div v-if="selectedAccount" class="space-y-6">
            <!-- Status Banner -->
            <div 
              class="flex items-center justify-between p-4 rounded-lg border"
              :class="{
                'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800': selectedAccount.status === 'Active',
                'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800': selectedAccount.status === 'Inactive',
                'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800': selectedAccount.status === 'Frozen'
              }"
            >
              <div class="flex flex-col">
                <span class="text-sm text-muted-foreground">Account Status</span>
                <span class="text-lg font-semibold">{{ selectedAccount.status }}</span>
              </div>
              <div class="flex items-center justify-center h-12 w-12 rounded-full bg-background/50">
                <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
            </div>

            <!-- Account Information -->
            <div class="space-y-4">
              <h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Account Information</h3>
              <div class="space-y-3">
                <div class="flex items-center justify-between p-3 rounded-md bg-muted/50">
                  <span class="text-sm text-muted-foreground">Account Number</span>
                  <span class="font-mono text-sm font-semibold">{{ selectedAccount.account_number }}</span>
                </div>
                <div class="flex items-center justify-between p-3 rounded-md bg-muted/50">
                  <span class="text-sm text-muted-foreground">IFSC Code</span>
                  <span class="font-mono text-sm font-semibold">{{ selectedAccount.ifsc }}</span>
                </div>
                <div class="flex items-center justify-between p-3 rounded-md bg-muted/50">
                  <span class="text-sm text-muted-foreground">Account ID</span>
                  <span class="font-mono text-sm font-medium">{{ selectedAccount.name }}</span>
                </div>
              </div>
            </div>

            <!-- Merchant Information -->
            <div class="space-y-4">
              <h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Merchant Information</h3>
              <div class="space-y-3">
                <div class="space-y-1">
                  <p class="text-sm text-muted-foreground">Merchant Name</p>
                  <p class="text-sm font-medium">{{ selectedAccount.merchant_name }}</p>
                </div>
                <div class="space-y-1">
                  <p class="text-sm text-muted-foreground">Prefix</p>
                  <p class="font-mono text-sm font-medium">{{ selectedAccount.prefix || '-' }}</p>
                </div>
              </div>
            </div>

            <!-- Additional Information -->
            <div class="rounded-lg bg-muted/30 p-4 space-y-2">
              <div class="flex items-start gap-2">
                <svg class="h-5 w-5 text-muted-foreground mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 16v-4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
                <div class="flex-1">
                  <p class="text-sm font-medium">Virtual Account Usage</p>
                  <p class="text-xs text-muted-foreground mt-1">
                    This virtual account can be used to receive payments. Share the account number and IFSC code with your customers for seamless transactions.
                  </p>
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
import { call } from 'frappe-ui'
import { toast } from 'vue-sonner'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

const loading = ref(true)
const virtualAccounts = ref([])
const isSheetOpen = ref(false)
const selectedAccount = ref(null)

// Handle Request New Account
const handleRequestNewAccount = () => {
  toast.info('This feature is not implemented yet')
}

// Open Virtual Account Sheet
const openAccountSheet = (account) => {
  selectedAccount.value = account
  isSheetOpen.value = true
}

const fetchVirtualAccounts = async () => {
  try {
    const response = await call('iswitch.merchant_portal_api.get_virtual_accounts')
    // Handle both wrapped and unwrapped responses
    let data = response
    if (response.message && typeof response.message === 'object' && !Array.isArray(response.message)) {
      data = response.message
    }
    
    if (data.success && Array.isArray(data.accounts)) {
      virtualAccounts.value = data.accounts
    } else if (Array.isArray(data)) { // Legacy fallback
      virtualAccounts.value = data
    }
  } catch (error) {
    console.error('Error fetching virtual accounts:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchVirtualAccounts()
})
</script>

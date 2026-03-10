<template>
  <div class="max-w-5xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold tracking-tight">Settings</h1>
      
      <!-- Tabs -->
      <div class="flex gap-6 mt-6 border-b">
        <button 
          v-for="tab in tabs" 
          :key="tab.value"
          @click="currentTab = tab.value"
          class="pb-2 text-sm font-medium transition-colors relative"
          :class="currentTab === tab.value ? 'text-primary border-b-2 border-primary -mb-px' : 'text-muted-foreground hover:text-foreground'"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Bank Account Tab -->
    <div v-if="currentTab === 'bank_account'" class="space-y-6">
      
      <!-- Bank Accounts Table -->
      <div class="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div class="p-6 border-b flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold">Your Bank Accounts</h3>
            <p class="text-sm text-muted-foreground mt-1">Manage your bank account details</p>
          </div>
          <button
            @click="showAddAccountDialog = true"
            class="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4"
          >
            <svg class="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Account
          </button>
        </div>

        <!-- Table -->
        <div class="relative w-full overflow-auto">
          <table class="w-full caption-bottom text-sm">
            <thead class="[&_tr]:border-b">
              <tr class="border-b transition-colors hover:bg-muted/50">
                <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-16">#</th>
                <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Account Holder</th>
                <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Bank Name</th>
                <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Account Number</th>
                <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">IFSC Code</th>
                <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Cancel Cheque</th>
              </tr>
            </thead>
            <tbody class="[&_tr:last-child]:border-0">
              <tr v-for="(account, index) in bankAccounts" :key="account.account_number" class="border-b transition-colors hover:bg-muted/50">
                <td class="p-4 align-middle text-muted-foreground">{{ index + 1 }}</td>
                <td class="p-4 align-middle font-medium">{{ account.account_holder_name }}</td>
                <td class="p-4 align-middle">{{ account.bank_name }}</td>
                <td class="p-4 align-middle">{{ account.account_number }}</td>
                <td class="p-4 align-middle">{{ account.ifsc_code }}</td>
                <td class="p-4 align-middle">
                  <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    :class="{
                      'bg-yellow-100 text-yellow-800': account.status === 'Pending',
                      'bg-green-100 text-green-800': account.status === 'Approved',
                      'bg-red-100 text-red-800': account.status === 'Rejected'
                    }">
                    {{ account.status }}
                  </span>
                </td>
                <td class="p-4 align-middle">
                  <a v-if="account.cancel_cheque" :href="account.cancel_cheque" target="_blank" class="text-xs text-primary hover:underline inline-flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    View
                  </a>
                  <span v-else class="text-xs text-muted-foreground">-</span>
                </td>
              </tr>
              <tr v-if="bankAccounts.length === 0">
                <td colspan="7" class="p-8 text-center text-muted-foreground">
                  No bank accounts added yet. Click "Add Account" to get started.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Add Account Dialog -->
    <Dialog v-model:open="showAddAccountDialog">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Bank Account</DialogTitle>
          <DialogDescription>
            Enter your bank account details below. All fields except Branch Name are required.
          </DialogDescription>
        </DialogHeader>
        
        <div class="py-4 space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Bank Name -->
            <div class="space-y-2">
              <label class="text-sm font-medium leading-none">Bank Name <span class="text-destructive">*</span></label>
              <input
                v-model="form.bank_name"
                type="text"
                placeholder="e.g. HDFC Bank"
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            
            <!-- Account Number -->
            <div class="space-y-2">
              <label class="text-sm font-medium leading-none">Account Number <span class="text-destructive">*</span></label>
              <input
                v-model="form.account_number"
                type="text"
                placeholder="Enter account number"
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <!-- IFSC Code -->
            <div class="space-y-2">
              <label class="text-sm font-medium leading-none">IFSC Code <span class="text-destructive">*</span></label>
              <input
                v-model="form.ifsc_code"
                type="text"
                placeholder="e.g. HDFC0001234"
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <!-- Account Holder Name -->
            <div class="space-y-2">
              <label class="text-sm font-medium leading-none">Account Holder Name <span class="text-destructive">*</span></label>
              <input
                v-model="form.account_holder_name"
                type="text"
                placeholder="Enter account holder name"
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <!-- Branch Name -->
            <div class="space-y-2">
              <label class="text-sm font-medium leading-none">Branch Name</label>
              <input
                v-model="form.branch_name"
                type="text"
                placeholder="Enter branch name (optional)"
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            
            <!-- Cancel Cheque Upload -->
            <div class="space-y-2">
              <label class="text-sm font-medium leading-none">Cancel Cheque <span class="text-destructive">*</span></label>
              <input
                type="file"
                ref="chequeInput"
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                accept=".pdf,.png,.jpg,.jpeg"
              />
              <p class="text-xs text-muted-foreground">Upload PDF, PNG, or JPG (max 5MB)</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <button
            @click="showAddAccountDialog = false"
            class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 mt-2 sm:mt-0"
          >
            Cancel
          </button>
          <button
            @click="addAccount"
            :disabled="loading"
            class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Adding...' : 'Add Account' }}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Password Reset Tab -->
    <div v-if="currentTab === 'password_reset'" class="space-y-6">
        <div class="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div class="p-6 border-b">
                <h3 class="text-lg font-semibold">Change Password</h3>
            </div>
            <div class="p-6 space-y-4 max-w-md">
                <div class="space-y-2">
                    <label class="text-sm font-medium leading-none">Current Password</label>
                    <input v-model="passwordForm.current_password" type="password" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                </div>
                <div class="space-y-2">
                    <label class="text-sm font-medium leading-none">New Password</label>
                    <input v-model="passwordForm.new_password" type="password" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                </div>
                <div class="space-y-2">
                    <label class="text-sm font-medium leading-none">Confirm Password</label>
                    <input v-model="passwordForm.confirm_password" type="password" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                </div>
            </div>
            <div class="p-6 border-t flex justify-end">
                <button
                @click="changePassword"
                :disabled="passLoading"
                class="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 disabled:cursor-not-allowed"
                >
                {{ passLoading ? 'Updating...' : 'Update Password' }}
                </button>
            </div>
        </div>
    </div>

    <!-- Activity Logs Tab -->
    <div v-if="currentTab === 'activity_logs'" class="space-y-6">
         <div class="rounded-xl border bg-card text-card-foreground shadow-sm">
             <div class="p-6 border-b">
                <h3 class="text-lg font-semibold">Activity Logs</h3>
             </div>
             <div class="relative w-full overflow-auto">
                 <table class="w-full caption-bottom text-sm text-left">
                     <thead class="[&_tr]:border-b">
                         <tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                             <th class="h-12 px-4 align-middle font-medium text-muted-foreground">Subject</th>
                             <th class="h-12 px-4 align-middle font-medium text-muted-foreground">Action</th>
                             <th class="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                             <th class="h-12 px-4 align-middle font-medium text-muted-foreground">IP Address</th>
                             <th class="h-12 px-4 align-middle font-medium text-muted-foreground">Timestamp</th>
                         </tr>
                     </thead>
                     <tbody class="[&_tr:last-child]:border-0">
                         <tr v-for="log in activityLogs" :key="log.name" class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                             <td class="p-4 align-middle font-medium">{{ log.subject }}</td>
                             <td class="p-4 align-middle">{{ log.operation }}</td>
                             <td class="p-4 align-middle">{{ log.status }}</td>
                             <td class="p-4 align-middle">{{ log.ip_address || '-' }}</td>
                             <td class="p-4 align-middle">{{ log.modified }}</td>
                         </tr>
                         <tr v-if="activityLogs.length === 0">
                             <td colspan="5" class="p-4 text-center text-muted-foreground">No recent activity found.</td>
                         </tr>
                     </tbody>
                 </table>
             </div>
        </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed, h } from 'vue'
import { createResource, call } from 'frappe-ui'
import { toast } from 'vue-sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const currentTab = ref('bank_account')
const tabs = [
  { label: 'Bank Account', value: 'bank_account' },
  { label: 'Password Reset', value: 'password_reset' },
  { label: 'Activity Logs', value: 'activity_logs' }
]

const loading = ref(false)
const passLoading = ref(false)
const bankAccounts = ref([])
const activityLogs = ref([])
const showAddAccountDialog = ref(false)

const chequeInput = ref(null)

const form = ref({
  bank_name: '',
  account_number: '',
  ifsc_code: '',
  account_holder_name: '',
  branch_name: ''
})

const passwordForm = ref({
    current_password: '',
    new_password: '',
    confirm_password: ''
})

const fetchBankAccounts = async () => {
  try {
    const response = await call('iswitch.merchant_portal_api.get_merchant_profile')
    if (response && response.bank_accounts) {
        bankAccounts.value = response.bank_accounts
    }
  } catch (error) {
    console.error('Error fetching bank accounts:', error)
  }
}

const fetchActivityLogs = async () => {
    try {
        const response = await call('iswitch.merchant_portal_api.get_activity_logs')
        if (response) {
            activityLogs.value = response
        }
    } catch (error) {
        console.error('Error fetching logs:', error)
    }
}

const addAccount = async () => {
    // Validation
    const errors = []
    if (!form.value.bank_name) errors.push('Bank Name')
    if (!form.value.account_number) errors.push('Account Number')
    if (!form.value.ifsc_code) errors.push('IFSC Code')
    if (!form.value.account_holder_name) errors.push('Account Holder Name')
    // Check file
    if (!chequeInput.value || chequeInput.value.files.length === 0) {
        errors.push('Cancel Cheque')
    }

    if (errors.length > 0) {
        toast.error('Missing Required Fields', {
            description: `Please fill: ${errors.join(', ')}`
        })
        return
    }

    loading.value = true
    try {
        const formData = new FormData()
        formData.append('bank_name', form.value.bank_name)
        formData.append('account_number', form.value.account_number)
        formData.append('ifsc_code', form.value.ifsc_code)
        formData.append('account_holder_name', form.value.account_holder_name)
        formData.append('branch_name', form.value.branch_name)

        if (chequeInput.value && chequeInput.value.files.length > 0) {
            formData.append('cancel_cheque', chequeInput.value.files[0])
        }

        const response = await fetch('/api/method/iswitch.merchant_portal_api.add_bank_account', {
            method: 'POST',
            body: formData,
            headers: {
                'X-Frappe-CSRF-Token': window.csrf_token || '' 
            }
        })
        
        if (!response.ok) {
             const errorText = await response.text()
             let errorMsg = 'Failed to add bank account'
             try {
                const errorJson = JSON.parse(errorText)
                errorMsg = errorJson.message || errorJson._server_messages || errorMsg
                // Clean up server messages if JSON string
                if (typeof errorMsg === 'string' && errorMsg.startsWith('["')) {
                    const parsed = JSON.parse(errorMsg)
                    const message = JSON.parse(parsed[0]).message
                    errorMsg = message || errorMsg
                }

             } catch (e) {}
             throw new Error(errorMsg)
        }
        
        // Reset form
        form.value = {
            bank_name: '',
            account_number: '',
            ifsc_code: '',
            account_holder_name: '',
            branch_name: ''
        }
        if (chequeInput.value) chequeInput.value.value = ''
        
        toast.success('Success', {
            description: 'Bank account added successfully!'
        })
        
        // Close dialog
        showAddAccountDialog.value = false
        
        await fetchBankAccounts() // Refresh list
        
    } catch (error) {
        console.error('Error adding bank account:', error)
        toast.error('Error', {
            description: error.message || 'Failed to add bank account.'
        })
    } finally {
        loading.value = false
    }
}

const changePassword = async () => {
    if (!passwordForm.value.current_password || !passwordForm.value.new_password || !passwordForm.value.confirm_password) {
        toast.error('Validation Error', { description: 'Please fill all fields' })
        return
    }

    if (passwordForm.value.new_password !== passwordForm.value.confirm_password) {
        toast.error('Validation Error', { description: 'New passwords do not match' })
        return
    }

    passLoading.value = true
    try {
        await call('iswitch.merchant_portal_api.change_password', {
            current_password: passwordForm.value.current_password,
            new_password: passwordForm.value.new_password
        })
        toast.success('Success', { description: 'Password changed successfully' })
        passwordForm.value = { current_password: '', new_password: '', confirm_password: '' }
    } catch (error) {
        console.error('Error changing password:', error)
        toast.error('Error', { description: error.message || 'Failed to change password' })
    } finally {
        passLoading.value = false
    }
}

onMounted(() => {
  fetchBankAccounts()
  fetchActivityLogs()
})
</script>

<template>

  <div :class="[
    'space-y-6',
    isSheet ? '' : 'p-6 max-w-7xl mx-auto'
  ]">
    <!-- Header (Simple) -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <Button v-if="!isSheet" variant="outline" size="icon" @click="$router.push('/merchants')">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="m15 18-6-6 6-6"/></svg>
        </Button>
        <div>
          <h2 class="text-3xl font-bold tracking-tight">{{ merchant?.company_name || 'Loading...' }}</h2>
          <div class="flex items-center gap-2 mt-2">
            <Badge 
              :variant="merchant?.status === 'Approved' ? 'default' : merchant?.status === 'Draft' ? 'secondary' : 'destructive'"
              :class="{
                'bg-green-500 hover:bg-green-600 text-white': merchant?.status === 'Approved',
                'bg-yellow-500 hover:bg-yellow-600 text-white': merchant?.status === 'Submitted',
              }"
            >
              {{ merchant?.status }}
            </Badge>
            <span class="text-muted-foreground text-sm font-mono bg-muted/50 px-1.5 py-0.5 rounded">{{ merchant?.name }}</span>
          </div>
        </div>
      </div>
      
      <!-- Header Actions -->
      <div v-if="isDirty" class="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
          <div class="flex flex-col items-end mr-2">
              <span class="text-[10px] text-primary font-bold uppercase tracking-widest animate-pulse">Unsaved Changes</span>
          </div>
          <Button variant="outline" @click="fetchMerchantDetails" :disabled="saving">
              Discard
          </Button>
          <Button :loading="saving" @click="saveChanges">
              Save Changes
          </Button>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center p-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>

    <div v-else class="space-y-6">
      <!-- Top Row: Profile, KYC, and Integration -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Profile Card -->
        <Card>
          <CardHeader class="border-b pb-4 mb-4">
            <CardTitle class="text-lg">Merchant Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div>
                <label class="text-sm font-medium text-muted-foreground">Company Email</label>
                <div class="text-sm font-semibold mt-0.5">{{ merchant?.company_email }}</div>
              </div>
              <div>
                <label class="text-sm font-medium text-muted-foreground">Contact Detail</label>
                <div class="text-sm font-semibold mt-0.5">{{ merchant?.contact_detail || 'N/A' }}</div>
              </div>
               <div>
                <label class="text-sm font-medium text-muted-foreground">Registered On</label>
                <div class="text-sm font-semibold mt-0.5">{{ merchant?.creation?.split(' ')[0] }}</div>
              </div>
              <div>
                <label class="text-sm font-medium text-muted-foreground">Account Status</label>
                <select v-model="merchant.status" class="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                    <option value="Draft">Draft</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Terminated">Terminated</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- KYC Documents -->
        <Card>
          <CardHeader class="border-b pb-4 mb-4">
             <CardTitle class="text-lg">KYC Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <!-- Rejection Remark Display -->
            <div v-if="merchant?.remark && (merchant?.status === 'Rejected' || merchant?.status === 'Submitted')" class="mb-4 rounded-lg border-2 border-orange-200 bg-orange-50 p-4">
              <div class="flex items-start gap-3">
                <svg class="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                <div class="flex-1">
                  <h4 class="text-sm font-semibold text-orange-900 mb-1">
                    {{ merchant?.status === 'Rejected' ? 'Rejection Reason' : 'Previous Rejection Reason' }}
                  </h4>
                  <p class="text-sm text-orange-800">{{ merchant.remark }}</p>
                  <p v-if="merchant?.status === 'Submitted'" class="text-xs text-orange-700 mt-2">
                    ⚠️ Merchant has resubmitted documents. Please verify the fix.
                  </p>
                </div>
              </div>
            </div>

            <div class="space-y-3">
                <div v-for="(label, key) in kycFields" :key="key" class="flex items-center justify-between p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group">
                    <div class="flex flex-col">
                        <span class="text-sm font-semibold">{{ label }}</span>
                        <span v-if="!merchant[key]" class="text-[10px] text-muted-foreground uppercase font-bold mt-0.5">Missing Document</span>
                    </div>
                    <a v-if="merchant[key]" :href="getDocUrl(merchant[key])" target="_blank" class="h-8 px-3 rounded-md bg-background border text-primary hover:bg-primary hover:text-white transition-all text-xs font-bold flex items-center gap-1.5 shadow-sm">
                        View
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    </a>
                </div>
            </div>
          </CardContent>
        </Card>

        <!-- Integration Settings -->
        <Card>
            <CardHeader class="border-b pb-4 mb-4">
                <CardTitle class="text-lg">Integration Settings</CardTitle>
            </CardHeader>
            <CardContent>
                 <div class="space-y-4">
                    <div class="grid gap-2">
                        <label class="text-sm font-medium">Processor</label>
                        <select v-model="merchant.integration" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                            <option value="">Select Integration</option>
                            <option v-for="intg in integrations" :key="intg.name" :value="intg.name">
                                {{ intg.integration_name }}
                            </option>
                        </select>
                    </div>
                    <div class="grid gap-2">
                        <label class="text-sm font-medium">Webhook URL</label>
                        <Input type="text" v-model="merchant.webhook" placeholder="https://..." class="h-10" />
                    </div>
                 </div>
            </CardContent>
        </Card>
      </div>

      <!-- Bottom Section: Product Pricing (Full Width) -->
      <Card class="overflow-hidden border-none shadow-none bg-transparent">
          <CardHeader class="px-0 pb-6">
              <div class="flex items-center justify-between">
                  <div>
                      <CardTitle class="text-2xl font-bold tracking-tight">Product Pricing</CardTitle>
                      <p class="text-sm text-muted-foreground mt-1">Define processing fees and transaction limits per service.</p>
                  </div>
                  <Button @click="openAddPricing" class="flex items-center gap-2 px-6 shadow-md transition-all hover:scale-[1.02]">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                      Add Pricing
                  </Button>
              </div>
          </CardHeader>
          <CardContent class="p-0 border rounded-xl bg-card shadow-sm overflow-hidden">
              <div class="overflow-hidden rounded-md border-t bg-background">
                  <Table>
                      <TableHeader class="bg-muted/30">
                          <TableRow>
                              <TableHead class="px-6 h-12 w-[240px]">Service Product</TableHead>
                              <TableHead class="px-6 h-12">Processing Fee</TableHead>
                              <TableHead class="px-6 h-12">Tax (GST)</TableHead>
                              <TableHead class="px-6 h-12 w-[280px]">Transaction Range</TableHead>
                              <TableHead class="px-6 h-12 text-center w-[120px]">Actions</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          <TableRow v-for="(price, index) in (merchant?.product_pricing || [])" :key="index" class="group transition-colors">
                              <TableCell class="p-6 font-medium">
                                  {{ getProductName(price.product) }}
                              </TableCell>
                               <TableCell class="p-6">
                                  <div class="flex items-center gap-2">
                                      <span class="text-base font-semibold">{{ price.fee }}</span>
                                      <Badge variant="secondary" class="font-bold text-[10px] h-5 px-1.5">
                                          {{ price.fee_type === 'Percentage' ? '%' : '₹' }}
                                      </Badge>
                                  </div>
                              </TableCell>
                              <TableCell class="p-6">
                                  <div class="flex items-center gap-2">
                                      <span class="text-base font-semibold">{{ price.tax_fee }}</span>
                                      <Badge variant="secondary" class="font-bold text-[10px] h-5 px-1.5">
                                          {{ price.tax_fee_type === 'Percentage' ? '%' : '₹' }}
                                      </Badge>
                                  </div>
                              </TableCell>
                              <TableCell class="p-6">
                                  <div class="flex items-center gap-2 text-sm font-semibold">
                                      <Badge variant="outline" class="bg-primary/5 text-primary border-primary/10">₹{{ (Number(price.start_value) || 0).toLocaleString() }}</Badge>
                                      <span class="text-muted-foreground font-medium text-[10px]">to</span>
                                      <Badge variant="outline" class="bg-primary/5 text-primary border-primary/10">₹{{ (Number(price.end_value) || 0).toLocaleString() }}</Badge>
                                  </div>
                              </TableCell>
                              <TableCell class="p-6 text-center">
                                  <div class="flex items-center justify-center gap-2">
                                      <Button variant="ghost" size="icon" @click="openEditPricing(index)" class="h-8 w-8 text-muted-foreground hover:text-primary">
                                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                                      </Button>
                                      <Button variant="ghost" size="icon" @click="removePricingRow(index)" class="h-8 w-8 text-muted-foreground hover:text-destructive">
                                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                      </Button>
                                  </div>
                              </TableCell>
                          </TableRow>
                          <TableRow v-if="!merchant?.product_pricing?.length">
                              <TableCell colspan="5" class="h-[200px] text-center">
                                  <div class="flex flex-col items-center gap-4 text-muted-foreground">
                                      <div class="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-50"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                                      </div>
                                      <div>
                                          <p class="text-sm font-semibold text-foreground">No Pricing Set</p>
                                          <p class="text-xs">Add your first pricing rule to get started.</p>
                                      </div>
                                      <Button size="sm" @click="openAddPricing">Add Pricing</Button>
                                  </div>
                              </TableCell>
                          </TableRow>
                      </TableBody>
                  </Table>
              </div>
          </CardContent>
      </Card>
      
      <!-- Bank Accounts Section -->
      <Card>
        <CardHeader class="border-b pb-4 mb-4">
          <CardTitle class="text-2xl font-bold tracking-tight">Bank Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="merchant?.bank_accounts?.length" class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead class="w-[200px]">Account Holder</TableHead>
                  <TableHead>Bank Name</TableHead>
                  <TableHead>Account Number</TableHead>
                  <TableHead>IFSC Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead class="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="account in merchant.bank_accounts" :key="account.name">
                  <TableCell class="font-medium">{{ account.account_holder_name }}</TableCell>
                  <TableCell>{{ account.bank_name }}</TableCell>
                  <TableCell class="font-mono text-sm">{{ account.account_number }}</TableCell>
                  <TableCell class="font-mono text-sm">{{ account.ifsc_code }}</TableCell>
                  <TableCell>
                    <Badge 
                      :class="{
                        'bg-yellow-500 hover:bg-yellow-600 text-white': account.status === 'Pending',
                        'bg-green-500 hover:bg-green-600 text-white': account.status === 'Approved',
                        'bg-red-500 hover:bg-red-600 text-white': account.status === 'Rejected'
                      }"
                    >
                      {{ account.status }}
                    </Badge>
                  </TableCell>
                  <TableCell class="text-center">
                    <div class="flex items-center justify-center gap-2">
                      <Button 
                        v-if="account.cancel_cheque" 
                        variant="ghost" 
                        size="sm"
                        @click="viewCancelledCheque(account.cancel_cheque)"
                        class="text-xs"
                      >
                        View Cheque
                      </Button>
                      <Button 
                        v-if="account.status === 'Pending'" 
                        variant="default" 
                        size="sm"
                        @click="updateBankAccountStatus(account, 'Approved')"
                        :disabled="updatingBankAccount"
                        class="bg-green-600 hover:bg-green-700 text-xs"
                      >
                        Approve
                      </Button>
                      <Button 
                        v-if="account.status === 'Pending'" 
                        variant="destructive" 
                        size="sm"
                        @click="updateBankAccountStatus(account, 'Rejected')"
                        :disabled="updatingBankAccount"
                        class="text-xs"
                      >
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <div v-else class="flex flex-col items-center gap-4 text-muted-foreground py-12">
            <div class="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-50">
                <rect width="20" height="14" x="2" y="5" rx="2"/>
                <line x1="2" x2="22" y1="10" y2="10"/>
              </svg>
            </div>
            <div class="text-center">
              <p class="text-sm font-semibold text-foreground">No Bank Accounts</p>
              <p class="text-xs">Merchant hasn't added any bank accounts yet.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    
    <!-- Pricing Item Dialog -->
    <Dialog v-model:open="isPricingDialogOpen">
        <DialogContent class="sm:max-w-[500px]">
            <DialogHeader>
                <DialogTitle>{{ editingPricingIndex > -1 ? 'Edit Pricing' : 'Add New Pricing' }}</DialogTitle>
                <DialogDescription>
                    Configure the service product and its associated fees.
                </DialogDescription>
            </DialogHeader>
            <div class="grid gap-6 py-4">
                <div class="grid gap-2">
                    <label class="text-sm font-semibold">Service Product</label>
                    <select v-model="tempPricing.product" class="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                        <option value="" disabled>Select Service</option>
                        <option v-for="prod in products" :key="prod.name" :value="prod.name">
                        {{ prod.product_name }}
                        </option>
                    </select>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div class="grid gap-2">
                        <label class="text-sm font-semibold">Processing Fee</label>
                        <div class="flex items-center">
                            <Input type="number" step="0.01" v-model="tempPricing.fee" class="rounded-r-none h-11" />
                            <select v-model="tempPricing.fee_type" class="h-11 rounded-r-md border border-l-0 border-input bg-muted/50 px-3 text-xs font-bold focus-visible:outline-none">
                                <option value="Fixed">₹</option>
                                <option value="Percentage">%</option>
                            </select>
                        </div>
                    </div>
                    <div class="grid gap-2">
                        <label class="text-sm font-semibold">Tax (GST)</label>
                        <div class="flex items-center">
                            <Input type="number" step="0.01" v-model="tempPricing.tax_fee" class="rounded-r-none h-11" />
                            <select v-model="tempPricing.tax_fee_type" class="h-11 rounded-r-md border border-l-0 border-input bg-muted/50 px-3 text-xs font-bold focus-visible:outline-none">
                                <option value="Fixed">₹</option>
                                <option value="Percentage">%</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="grid gap-2">
                    <label class="text-sm font-semibold">Transaction Amount Range (₹)</label>
                    <div class="flex items-center gap-2">
                        <div class="relative flex-1">
                            <span class="absolute left-3 top-3.5 text-[10px] text-muted-foreground font-bold z-20">MIN</span>
                            <Input type="number" v-model="tempPricing.start_value" class="pl-10 h-11" />
                        </div>
                        <span class="text-muted-foreground">→</span>
                        <div class="relative flex-1">
                            <span class="absolute left-3 top-3.5 text-[10px] text-muted-foreground font-bold z-20">MAX</span>
                            <Input type="number" v-model="tempPricing.end_value" class="pl-10 h-11" />
                        </div>
                    </div>
                </div>
                
                <div v-if="dialogValidationError" class="text-xs text-destructive bg-destructive/5 p-3 rounded-md border border-destructive/10 flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span>{{ dialogValidationError }}</span>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" @click="isPricingDialogOpen = false">Cancel</Button>
                <Button @click="confirmPricing">{{ editingPricingIndex > -1 ? 'Update Pricing' : 'Add Pricing' }}</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    <!-- Rejection Remark Dialog -->
    <Dialog v-model:open="isRejectionDialogOpen">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Rejection Remark Required</DialogTitle>
          <DialogDescription>
            Please provide a reason for rejecting this merchant's KYC. This will be shown to the merchant.
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid gap-2">
            <label class="text-sm font-semibold">Rejection Reason</label>
            <textarea 
              v-model="rejectionRemark" 
              class="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="e.g., PAN card image is not clear, GST certificate is missing, etc."
            ></textarea>
          </div>
          
          <div class="grid gap-2">
            <label class="text-sm font-semibold">Select Documents to Re-upload (Optional)</label>
            <p class="text-xs text-muted-foreground mb-2">If no documents are selected, merchant can re-upload all documents.</p>
            <div class="space-y-2 border rounded-md p-3 bg-muted/20">
              <label v-for="(label, key) in kycFields" :key="key" class="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors">
                <input 
                  type="checkbox" 
                  :value="key"
                  v-model="selectedDocumentsForReupload"
                  class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span class="text-sm">{{ label }}</span>
              </label>
            </div>
          </div>
          
          <div v-if="rejectionRemarkError" class="text-xs text-destructive bg-destructive/5 p-3 rounded-md border border-destructive/10 flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>{{ rejectionRemarkError }}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="cancelRejection">Cancel</Button>
          <Button @click="confirmRejection" variant="destructive">Confirm Rejection</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Bank Account Confirmation Dialog -->
    <Dialog v-model:open="isBankAccountDialogOpen">
      <DialogContent class="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{{ bankAccountAction === 'Approved' ? 'Approve' : 'Reject' }} Bank Account</DialogTitle>
          <DialogDescription>
            Are you sure you want to {{ bankAccountAction?.toLowerCase() }} this bank account?
          </DialogDescription>
        </DialogHeader>
        <div v-if="selectedBankAccount" class="py-4 space-y-2">
          <div class="text-sm">
            <span class="font-semibold">Account Holder:</span> {{ selectedBankAccount.account_holder_name }}
          </div>
          <div class="text-sm">
            <span class="font-semibold">Bank:</span> {{ selectedBankAccount.bank_name }}
          </div>
          <div class="text-sm">
            <span class="font-semibold">Account Number:</span> {{ selectedBankAccount.account_number }}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="isBankAccountDialogOpen = false" :disabled="updatingBankAccount">Cancel</Button>
          <Button 
            @click="confirmBankAccountAction" 
            :variant="bankAccountAction === 'Approved' ? 'default' : 'destructive'"
            :class="bankAccountAction === 'Approved' ? 'bg-green-600 hover:bg-green-700' : ''"
            :disabled="updatingBankAccount"
          >
            {{ updatingBankAccount ? 'Processing...' : 'Confirm' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { call } from 'frappe-ui'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'


const props = defineProps({
  id: {
    type: String,
    default: ''
  },
  isSheet: {
    type: Boolean,
    default: false
  }
})

const route = useRoute()
const router = useRouter()
const merchantId = computed(() => props.id || route.params.id)

const loading = ref(true)
const saving = ref(false)
const merchant = ref(null)
const initialMerchantJson = ref('')
const integrations = ref([])
const products = ref([])
const validationError = ref('')

// Pricing Dialog State
const isPricingDialogOpen = ref(false)
const editingPricingIndex = ref(-1)
const dialogValidationError = ref('')
const tempPricing = ref({
    product: '',
    fee: 0,
    fee_type: 'Percentage',
    tax_fee: 0,
    tax_fee_type: 'Percentage',
    start_value: 0,
    end_value: 10000000
})

// Rejection Remark State
const isRejectionDialogOpen = ref(false)
const rejectionRemark = ref('')
const rejectionRemarkError = ref('')
const previousStatus = ref('')
const selectedDocumentsForReupload = ref([])

const isDirty = computed(() => {
    if (!merchant.value) return false
    return JSON.stringify(merchant.value) !== initialMerchantJson.value
})

const kycFields = {
    'director_pan': 'Director PAN',
    'director_adhar': 'Director Adhar',
    'company_pan': 'Company PAN',
    'company_gst': 'Company GST'
}

const fetchMerchantDetails = async () => {
    loading.value = true
    try {
        const response = await call('iswitch.admin_portal_api.get_merchant_details', {
            merchant_name: merchantId.value
        })
        const data = response?.message || response
        if (data.success) {
            merchant.value = data.merchant
            if (!merchant.value.product_pricing) {
                merchant.value.product_pricing = []
            }
            // Store initial state as JSON string for easy deep comparison
            initialMerchantJson.value = JSON.stringify(merchant.value)
        } else {
            toast.error(data.error || 'Failed to fetch merchant details')
            router.push('/merchants')
        }
    } catch (error) {
        console.error('Error fetching details:', error)
        toast.error('An error occurred')
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

const fetchProducts = async () => {
  try {
    const response = await call('iswitch.admin_portal_api.get_services')
    const data = response?.message || response
    if (data && data.services) {
      products.value = data.services
    }
  } catch (error) {
    console.error('Error fetching products:', error)
  }
}

const getDocUrl = (path) => {
    if (!path) return '#'
    // Handle potential full URL vs relative path
    return path.startsWith('http') ? path : window.location.origin + path
}

const getProductName = (name) => {
    const product = products.value.find(p => p.name === name)
    return product ? product.product_name : name
}

const openAddPricing = () => {
    tempPricing.value = {
        product: '',
        fee: 0,
        fee_type: 'Percentage',
        tax_fee: 0,
        tax_fee_type: 'Percentage',
        start_value: 0,
        end_value: 10000000
    }
    editingPricingIndex.value = -1
    dialogValidationError.value = ''
    isPricingDialogOpen.value = true
}

const openEditPricing = (index) => {
    const price = merchant.value.product_pricing[index]
    tempPricing.value = { ...price }
    editingPricingIndex.value = index
    dialogValidationError.value = ''
    isPricingDialogOpen.value = true
}

const confirmPricing = () => {
    if (!tempPricing.value.product) {
        dialogValidationError.value = 'Please select a product service'
        return
    }
    
    // Check for duplicate products if adding new
    if (editingPricingIndex.value === -1) {
        const existing = merchant.value.product_pricing.find(p => p.product === tempPricing.value.product)
        if (existing) {
            dialogValidationError.value = 'Pricing for this product already exists'
            return
        }
    }

    if (editingPricingIndex.value > -1) {
        merchant.value.product_pricing[editingPricingIndex.value] = { ...tempPricing.value }
    } else {
        if (!merchant.value.product_pricing) merchant.value.product_pricing = []
        merchant.value.product_pricing.push({ ...tempPricing.value })
    }
    
    isPricingDialogOpen.value = false
}

const addPricingRow = () => {
    // Legacy function, redirected to dialog
    openAddPricing()
}

const removePricingRow = (index) => {
    merchant.value.product_pricing.splice(index, 1)
    validationError.value = ''
}

const validatePricing = () => {
    validationError.value = ''
    const pricing = merchant.value.product_pricing || []
    const productRanges = {}

    // Group by product
    for (const p of pricing) {
        if (!p.product) continue 
        if (!productRanges[p.product]) {
            productRanges[p.product] = []
        }
        productRanges[p.product].push({
            start: parseFloat(p.start_value) || 0,
            end: parseFloat(p.end_value) || 0
        })
    }

    // Check overlaps
    for (const product in productRanges) {
        const ranges = productRanges[product].sort((a, b) => a.start - b.start)
        
        for (let i = 0; i < ranges.length - 1; i++) {
            const current = ranges[i]
            const next = ranges[i+1]
            if (current.end >= next.start) {
                validationError.value = `Overlapping ranges for '${product}': ${current.start}-${current.end} overlaps with ${next.start}-${next.end}`
                return false
            }
        }
    }
    return true
}

const saveChanges = async () => {
    if (!merchant.value) return
    if (!validatePricing()) return
    
    // Check if status is being changed to Rejected and we need a remark
    if (merchant.value.status === 'Rejected' && previousStatus.value !== 'Rejected') {
        if (!rejectionRemark.value || rejectionRemark.value.trim() === '') {
            // Open rejection dialog to get remark
            isRejectionDialogOpen.value = true
            return
        }
    }
    
    saving.value = true
    try {
        const apiParams = {
            merchant: merchant.value.name,
            status: merchant.value.status,
            integration: merchant.value.integration,
            webhook: merchant.value.webhook,
            pricing: JSON.stringify(merchant.value.product_pricing || [])
        }
        
        // Add rejection remark if status is Rejected
        if (merchant.value.status === 'Rejected') {
            apiParams.rejection_remark = rejectionRemark.value
            
            // Add selected documents for reupload
            if (selectedDocumentsForReupload.value.length > 0) {
                apiParams.documents_to_reupload = JSON.stringify(selectedDocumentsForReupload.value)
            }
        }
        
        const response = await call('iswitch.admin_portal_api.update_merchant', apiParams)
        
        const data = response?.message || response
        if (data.success) {
            toast.success('Merchant details updated successfully')
            rejectionRemark.value = '' // Clear remark after successful save
            selectedDocumentsForReupload.value = [] // Clear selected documents
            fetchMerchantDetails() // refresh
        } else {
            toast.error(data.error || 'Failed to update merchant')
        }
    } catch (error) {
        console.error('Error updating merchant:', error)
        toast.error('An error occurred while saving')
    } finally {
        saving.value = false
    }
}

const confirmRejection = () => {
    rejectionRemarkError.value = ''
    
    if (!rejectionRemark.value || rejectionRemark.value.trim() === '') {
        rejectionRemarkError.value = 'Please provide a rejection reason'
        return
    }
    
    isRejectionDialogOpen.value = false
    // Proceed with save
    saveChanges()
}

const cancelRejection = () => {
    // Revert status to previous value
    merchant.value.status = previousStatus.value
    rejectionRemark.value = ''
    rejectionRemarkError.value = ''
    selectedDocumentsForReupload.value = []
    isRejectionDialogOpen.value = false
}

// Watch for status changes to detect when changing to Rejected
watch(() => merchant.value?.status, (newStatus, oldStatus) => {
    if (oldStatus) {
        previousStatus.value = oldStatus
    }
    
    // If changing to Rejected from another status, open dialog
    if (newStatus === 'Rejected' && oldStatus && oldStatus !== 'Rejected') {
        // Dialog will be opened in saveChanges if remark is not provided
    }
    
    // Clear rejection remark if changing away from Rejected
    if (oldStatus === 'Rejected' && newStatus !== 'Rejected') {
        rejectionRemark.value = ''
    }
})


// Bank Account Management
const updatingBankAccount = ref(false)
const isBankAccountDialogOpen = ref(false)
const selectedBankAccount = ref(null)
const bankAccountAction = ref(null)

const updateBankAccountStatus = (account, status) => {
  selectedBankAccount.value = account
  bankAccountAction.value = status
  isBankAccountDialogOpen.value = true
}

const confirmBankAccountAction = async () => {
  if (!selectedBankAccount.value || !bankAccountAction.value) return
  
  updatingBankAccount.value = true
  try {
    const response = await call('iswitch.admin_portal_api.update_bank_account_status', {
      bank_account_id: selectedBankAccount.value.name,
      status: bankAccountAction.value
    })
    
    // Handle nested response structure
    const data = response?.message || response
    
    if (data?.success) {
      toast.success(data.message || `Bank account ${bankAccountAction.value.toLowerCase()} successfully`)
    } else {
      toast.error(data?.error || 'Failed to update bank account status')
    }
  } catch (error) {
    console.error('Error updating bank account status:', error)
    toast.error('An error occurred while updating bank account status')
  } finally {
    updatingBankAccount.value = false
    // Always close dialog and refresh data
    isBankAccountDialogOpen.value = false
    await fetchMerchantDetails()
  }
}

const viewCancelledCheque = (chequeUrl) => {
  if (chequeUrl) {
    window.open(chequeUrl, '_blank')
  }
}


onMounted(() => {
    fetchMerchantDetails()
    fetchIntegrations()
    fetchProducts()
})
</script>

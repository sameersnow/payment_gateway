<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold tracking-tight">Developers</h1>
      <p class="text-muted-foreground mt-2">Manage your API integrations and developer settings.</p>
    </div>

    <!-- Shadcn Tabs -->
    <div class="rounded-xl border bg-card text-card-foreground shadow-sm">
      <!-- Tabs List -->
      <div class="border-b overflow-x-auto">
        <div class="flex h-14 items-center px-6 space-x-6 min-w-max">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="currentTab = tab.id"
            :class="[
              'inline-flex items-center justify-center whitespace-nowrap py-4 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              currentTab === tab.id
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            ]"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- Tab Content -->
      <div class="p-6">
        <!-- API Documentation Tab -->
        <div v-if="currentTab === 'api-docs'" class="space-y-8">
          <!-- Base URL -->
          <div>
            <h3 class="text-2xl font-bold mb-2">API Documentation</h3>
            <p class="text-muted-foreground mb-4">Complete reference for integrating with BlinkPe payment services.</p>
            
            <div class="rounded-lg border bg-muted/30 p-4">
              <h4 class="text-sm font-semibold mb-2">Base URL</h4>
              <code class="block bg-background rounded px-3 py-2 font-mono text-sm border">https://portal.blinkpe.com</code>
            </div>
          </div>

          <!-- Authentication -->
          <div class="space-y-4">
            <div>
              <h3 class="text-xl font-bold mb-2">Authentication</h3>
              <p class="text-sm text-muted-foreground">The BlinkPe API uses token-based authentication. Once generated, tokens remain valid for the lifetime of the account unless regenerated.</p>
            </div>

            <!-- Generate Token -->
            <div class="rounded-lg border bg-card p-6 space-y-4">
              <div>
                <h4 class="text-lg font-semibold mb-1">Generate Token</h4>
                <p class="text-sm text-muted-foreground">Generate API credentials for accessing BlinkPe services.</p>
              </div>

              <div class="space-y-2">
                <p class="text-sm font-medium">Endpoint</p>
                <code class="block bg-muted rounded px-3 py-2 font-mono text-sm">POST /api/method/generate_token</code>
              </div>

              <div class="space-y-2">
                <p class="text-sm font-medium">Headers</p>
                <pre class="bg-muted rounded p-3 overflow-x-auto text-xs font-mono border"><code>Content-Type: application/json</code></pre>
              </div>

              <div class="space-y-2">
                <p class="text-sm font-medium">Request Body</p>
                <pre class="bg-muted rounded p-3 overflow-x-auto text-xs font-mono border"><code>{
  "usr": "merchant@example.com",
  "pwd": "your_secure_password"
}</code></pre>
              </div>

              <div class="space-y-2">
                <p class="text-sm font-medium">Response</p>
                <pre class="bg-muted rounded p-3 overflow-x-auto text-xs font-mono border"><code>{
  "message": {
    "code": "0x0200",
    "message": "Logged in",
    "user_id": "merchant@example.com",
    "api_key": "a1b2c3d4e5f6789",
    "api_secret": "9z8y7x6w5v4u3t2s1r0q9p8o7n6m5l"
  },
  "home_page": "/app",
  "full_name": "John Merchant"
}</code></pre>
              </div>

              <div class="rounded-md bg-blue-50 dark:bg-blue-900/20 p-3 border border-blue-200 dark:border-blue-900/50">
                <p class="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">Authentication for Subsequent Requests</p>
                <p class="text-xs text-blue-800 dark:text-blue-200 mb-2">Use the returned api_key and api_secret in the Authorization header:</p>
                <code class="block bg-blue-100 dark:bg-blue-900/40 rounded px-2 py-1 text-xs font-mono">Authorization: Token {api_key}:{api_secret}</code>
                <p class="text-xs text-blue-700 dark:text-blue-300 mt-2">Example:</p>
                <code class="block bg-blue-100 dark:bg-blue-900/40 rounded px-2 py-1 text-xs font-mono">Authorization: Token a1b2c3d4e5f6789:9z8y7x6w5v4u3t2s1r0q9p8o7n6m5l</code>
              </div>
            </div>
          </div>

          <!-- Orders -->
          <div class="space-y-4">
            <h3 class="text-xl font-bold">Orders</h3>

            <!-- Create Order -->
            <div class="rounded-lg border bg-card p-6 space-y-4">
              <div>
                <h4 class="text-lg font-semibold mb-1">Create Order</h4>
                <p class="text-sm text-muted-foreground">Create a new payout order for bank transfer.</p>
              </div>

              <div class="space-y-2">
                <p class="text-sm font-medium">Endpoint</p>
                <code class="block bg-muted rounded px-3 py-2 font-mono text-sm">POST /api/method/order</code>
              </div>

              <div class="space-y-2">
                <p class="text-sm font-medium">Headers</p>
                <pre class="bg-muted rounded p-3 overflow-x-auto text-xs font-mono border"><code>Content-Type: application/json
Authorization: Token {api_key}:{api_secret}</code></pre>
              </div>

              <div class="space-y-2">
                <p class="text-sm font-medium">Request Body</p>
                <pre class="bg-muted rounded p-3 overflow-x-auto text-xs font-mono border"><code>{
  "customer_name": "Yash Kumar",
  "accountNo": "123456789012",
  "ifsc": "HDFC0001234",
  "bank": "HDFC Bank",
  "amount": "2500",
  "purpose": "OTHERS",
  "mode": "imps",
  "narration": "Salary payment for employee",
  "remark": "Monthly salary transfer",
  "clientRefId": "TXN_20250908_001"
}</code></pre>
              </div>

              <div class="space-y-2">
                <p class="text-sm font-medium">Parameters</p>
                <div class="text-xs space-y-1 text-muted-foreground">
                  <p><code class="bg-muted px-1 py-0.5 rounded">customer_name</code> (string, required): Name of the beneficiary</p>
                  <p><code class="bg-muted px-1 py-0.5 rounded">accountNo</code> (string, required): Bank account number</p>
                  <p><code class="bg-muted px-1 py-0.5 rounded">ifsc</code> (string, required): IFSC code of the bank</p>
                  <p><code class="bg-muted px-1 py-0.5 rounded">bank</code> (string, required): Bank name</p>
                  <p><code class="bg-muted px-1 py-0.5 rounded">amount</code> (string, required): Transfer amount in INR</p>
                  <p><code class="bg-muted px-1 py-0.5 rounded">purpose</code> (string, required): Purpose of transfer (e.g., "OTHERS", "SALARY", "VENDOR_PAYMENT")</p>
                  <p><code class="bg-muted px-1 py-0.5 rounded">mode</code> (string, required): Transfer mode ("imps", "neft", "rtgs")</p>
                  <p><code class="bg-muted px-1 py-0.5 rounded">narration</code> (string, required): Transaction narration</p>
                  <p><code class="bg-muted px-1 py-0.5 rounded">remark</code> (string, required): Additional remarks</p>
                  <p><code class="bg-muted px-1 py-0.5 rounded">clientRefId</code> (string, required): Unique reference ID from your system</p>
                </div>
              </div>

              <div class="space-y-2">
                <p class="text-sm font-medium">Response</p>
                <pre class="bg-muted rounded p-3 overflow-x-auto text-xs font-mono border"><code>{
  "message": {
    "code": "0x0200",
    "message": "Order accepted successfully",
    "status": "SUCCESS",
    "data": {
      "clientRefId": "TXN_20250908_001",
      "orderRefId": "SVORD2509080083106",
      "status": "Queued"
    }
  }
}</code></pre>
              </div>
            </div>

            <!-- Check Order Status -->
            <div class="rounded-lg border bg-card p-6 space-y-4">
              <div>
                <h4 class="text-lg font-semibold mb-1">Check Order Status</h4>
                <p class="text-sm text-muted-foreground">Check the status of a previously created order.</p>
              </div>

              <div class="space-y-2">
                <p class="text-sm font-medium">Endpoint</p>
                <code class="block bg-muted rounded px-3 py-2 font-mono text-sm">POST /api/method/requery</code>
              </div>

              <div class="space-y-2">
                <p class="text-sm font-medium">Headers</p>
                <pre class="bg-muted rounded p-3 overflow-x-auto text-xs font-mono border"><code>Authorization: Token {api_key}:{api_secret}</code></pre>
              </div>

              <div class="space-y-2">
                <p class="text-sm font-medium">Request Body</p>
                <pre class="bg-muted rounded p-3 overflow-x-auto text-xs font-mono border"><code>{
  "clientRefId": "TXN_20250908_001"
}</code></pre>
              </div>

              <div class="space-y-2">
                <p class="text-sm font-medium">Response</p>
                <pre class="bg-muted rounded p-3 overflow-x-auto text-xs font-mono border"><code>{
  "message": {
    "code": "0x0200",
    "status": "SUCCESS",
    "message": "Record fetched successfully.",
    "data": {
      "clientRefId": "TXN_20250908_001",
      "accountNo": "123456789012",
      "orderRefId": "SVORD2509080083106",
      "currency": "INR",
      "amount": 2500.0,
      "fee": 5.0,
      "tax": 0.9,
      "mode": "IMPS",
      "utr": "425020416966",
      "status": "Processed"
    }
  }
}</code></pre>
              </div>

              <div class="rounded-md bg-amber-50 dark:bg-amber-900/20 p-3 border border-amber-200 dark:border-amber-900/50">
                <p class="text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">Order Status Values</p>
                <div class="text-xs text-amber-800 dark:text-amber-200 space-y-1">
                  <p><strong>Queued:</strong> Order is in queue for processing</p>
                  <p><strong>Processing:</strong> Order is being processed by the bank</p>
                  <p><strong>Processed:</strong> Transfer completed successfully</p>
                  <p><strong>Cancelled:</strong> Order was cancelled before processing</p>
                  <p><strong>Reversed:</strong> Transfer was reversed after completion</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Wallet -->
          <div class="space-y-4">
            <h3 class="text-xl font-bold">Wallet</h3>

            <div class="rounded-lg border bg-card p-6 space-y-4">
              <div>
                <h4 class="text-lg font-semibold mb-1">Get Wallet Balance</h4>
                <p class="text-sm text-muted-foreground">Retrieve current wallet balance and status.</p>
              </div>

              <div class="space-y-2">
                <p class="text-sm font-medium">Endpoint</p>
                <code class="block bg-muted rounded px-3 py-2 font-mono text-sm">POST /api/method/wallet</code>
              </div>

              <div class="space-y-2">
                <p class="text-sm font-medium">Headers</p>
                <pre class="bg-muted rounded p-3 overflow-x-auto text-xs font-mono border"><code>Authorization: Token {api_key}:{api_secret}</code></pre>
              </div>

              <div class="space-y-2">
                <p class="text-sm font-medium">Response</p>
                <pre class="bg-muted rounded p-3 overflow-x-auto text-xs font-mono border"><code>{
  "message": {
    "message": "Wallet fetched successfully",
    "balance": 95500.75,
    "status": "Active"
  }
}</code></pre>
              </div>

              <div class="space-y-2">
                <p class="text-sm font-medium">Response Parameters</p>
                <div class="text-xs space-y-1 text-muted-foreground">
                  <p><code class="bg-muted px-1 py-0.5 rounded">balance</code> (number): Available balance in INR</p>
                  <p><code class="bg-muted px-1 py-0.5 rounded">status</code> (string): Wallet status ("Active", "Inactive", "Suspended")</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Webhooks -->
          <div class="space-y-4">
            <div>
              <h3 class="text-xl font-bold mb-2">Webhooks</h3>
              <p class="text-sm text-muted-foreground">BlinkPe sends webhook notifications for order status updates to your configured endpoint URL.</p>
            </div>

            <div class="rounded-lg border bg-card p-6 space-y-4">
              <div>
                <h4 class="text-lg font-semibold mb-1">Webhook Configuration</h4>
                <p class="text-sm text-muted-foreground">Configure your webhook endpoint URL in the Webhooks tab or contact support to set up webhook notifications.</p>
              </div>

              <div class="space-y-2">
                <p class="text-sm font-medium">Webhook Payload</p>
                <div class="text-xs space-y-1 text-muted-foreground mb-2">
                  <p><strong>HTTP Method:</strong> POST</p>
                  <p><strong>Content-Type:</strong> application/json</p>
                </div>
                <pre class="bg-muted rounded p-3 overflow-x-auto text-xs font-mono border"><code>{
  "clientRefID": "TXN_20250908_001",
  "crn": "SVORD2509080083106",
  "status": "Success",
  "utr": "425020416966"
}</code></pre>
              </div>

              <div class="space-y-2">
                <p class="text-sm font-medium">Parameters</p>
                <div class="text-xs space-y-1 text-muted-foreground">
                  <p><code class="bg-muted px-1 py-0.5 rounded">clientRefID</code> (string): Your original client reference ID</p>
                  <p><code class="bg-muted px-1 py-0.5 rounded">crn</code> (string): BlinkPe's internal order reference number</p>
                  <p><code class="bg-muted px-1 py-0.5 rounded">status</code> (string): Transaction status from webhook</p>
                  <p><code class="bg-muted px-1 py-0.5 rounded">utr</code> (string): Unique Transaction Reference (bank UTR number, null if failed)</p>
                </div>
              </div>

              <div class="rounded-md bg-purple-50 dark:bg-purple-900/20 p-3 border border-purple-200 dark:border-purple-900/50">
                <p class="text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">Webhook Status Values</p>
                <div class="text-xs text-purple-800 dark:text-purple-200 space-y-1">
                  <p><strong>Success:</strong> Transaction completed successfully</p>
                  <p><strong>Failed:</strong> Transaction failed</p>
                  <p><strong>Reversed:</strong> Transaction was reversed</p>
                </div>
              </div>
            </div>

            <!-- Webhook Examples -->
            <div class="rounded-lg border bg-card p-6 space-y-4">
              <h4 class="text-lg font-semibold">Webhook Examples</h4>

              <div class="space-y-3">
                <div>
                  <p class="text-sm font-medium mb-2">Successful Transaction</p>
                  <pre class="bg-muted rounded p-3 overflow-x-auto text-xs font-mono border"><code>{
  "clientRefID": "TXN_20250908_001",
  "crn": "SVORD2509080083106",
  "status": "Success",
  "utr": "425020416966"
}</code></pre>
                </div>

                <div>
                  <p class="text-sm font-medium mb-2">Failed Transaction</p>
                  <pre class="bg-muted rounded p-3 overflow-x-auto text-xs font-mono border"><code>{
  "clientRefID": "TXN_20250908_002",
  "crn": "SVORD2509080083107",
  "status": "Failed",
  "utr": null
}</code></pre>
                </div>

                <div>
                  <p class="text-sm font-medium mb-2">Reversed Transaction</p>
                  <pre class="bg-muted rounded p-3 overflow-x-auto text-xs font-mono border"><code>{
  "clientRefID": "TXN_20250908_003",
  "crn": "SVORD2509080083108",
  "status": "Reversed",
  "utr": "425020416967"
}</code></pre>
                </div>
              </div>
            </div>
          </div>

          <!-- Changelog -->
          <div class="rounded-lg border bg-card p-6 space-y-3">
            <h3 class="text-xl font-bold">Changelog</h3>
            <div>
              <h4 class="text-sm font-semibold mb-1">Version 1.0</h4>
              <ul class="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                <li>Initial API release</li>
                <li>Basic authentication and order management</li>
                <li>Webhook notifications</li>
                <li>Wallet balance inquiry</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- API Keys Tab -->
        <div v-if="currentTab === 'api-keys'" class="space-y-6">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold">API Keys</h3>
              <p class="text-sm text-muted-foreground mt-1">Manage your API keys for integration.</p>
            </div>
          </div>

          <!-- Active Keys View -->
          <div v-if="apiKeysState.hasKeys" class="space-y-6">
            <div class="rounded-lg border bg-card p-6 space-y-4">
              <div class="space-y-2">
                 <label class="text-sm font-medium">Current API Key</label>
                 <div class="flex gap-2">
                    <code class="flex-1 rounded bg-muted px-3 py-2 font-mono text-sm border flex items-center min-w-0 break-all whitespace-pre-wrap">
                      {{ apiKeysState.currentKey }}
                    </code>
                    <button
                      @click="copyToClipboard(apiKeysState.currentKey)"
                      title="Copy API Key"
                      class="shrink-0 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 w-10"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    </button>
                 </div>
              </div>

              <div class="pt-2 flex justify-end">
                <button
                  @click="generateApiKey"
                  class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 px-4"
                >
                  Regenerate Secret
                </button>
              </div>
               <p class="text-xs text-muted-foreground text-right">
                  Regenerating will invalidate the current secret immediately.
               </p>
            </div>
          </div>

          <!-- Empty State / Generate New -->
          <div v-else class="rounded-lg border bg-card p-12 text-center">
             <div class="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
             </div>
             <h3 class="text-lg font-medium mb-2">No API Keys Found</h3>
             <p class="text-muted-foreground mb-6 max-w-sm mx-auto">
               Generate an API key pair to authenticate your requests. You will need to save the secret immediately.
             </p>
             <button
                @click="generateApiKey"
                class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6"
              >
                Generate API Credentials
              </button>
          </div>
        </div>

        <!-- API Credentials Dialog (Show Once) -->
        <Dialog v-model:open="showCredentialsDialog">
          <DialogContent>
            <DialogHeader>
              <DialogTitle>API Credentials Generated</DialogTitle>
              <DialogDescription>
                Please copy these credentials immediately. The secret cannot be shown again.
              </DialogDescription>
            </DialogHeader>
            
            <div class="space-y-4 py-4">
              <div class="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md border border-yellow-200 dark:border-yellow-900/50 flex gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-yellow-600 dark:text-yellow-500 shrink-0"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M3.34 17a10 10 0 1 1 17.32 0"/></svg>
                 <p class="text-sm text-yellow-800 dark:text-yellow-400">
                   Store your <strong>API Secret</strong> securely. It will not be displayed again.
                 </p>
              </div>

              <div class="space-y-2">
                <label class="text-sm font-medium">API Key</label>
                <div class="flex gap-2">
                  <code class="flex-1 rounded bg-muted px-3 py-2 font-mono text-sm border min-w-0 break-all whitespace-pre-wrap">{{ newApiCredentials.key }}</code>
                  <button @click="copyToClipboard(newApiCredentials.key)" class="shrink-0 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 w-9">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                  </button>
                </div>
              </div>

              <div class="space-y-2">
                <label class="text-sm font-medium">API Secret</label>
                <div class="flex gap-2">
                  <code class="flex-1 rounded bg-muted px-3 py-2 font-mono text-sm border min-w-0 break-all whitespace-pre-wrap">{{ newApiCredentials.secret }}</code>
                  <button @click="copyToClipboard(newApiCredentials.secret)" class="shrink-0 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 w-9">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                  </button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <button
                @click="showCredentialsDialog = false"
                class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 w-full sm:w-auto"
              >
                I have saved these credentials
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <!-- General Confirmation Dialog -->
        <Dialog v-model:open="confirmDialog.open">
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{{ confirmDialog.title }}</DialogTitle>
              <DialogDescription>{{ confirmDialog.description }}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <button
                @click="confirmDialog.open = false"
                class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 mt-2 sm:mt-0"
              >
                Cancel
              </button>
              <button
                @click="confirmDialog.action"
                class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 px-4"
              >
                Confirm
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <!-- Webhooks Tab -->
        <div v-if="currentTab === 'webhooks'" class="space-y-6">
          <div>
            <h3 class="text-lg font-semibold">Webhook Configuration</h3>
            <p class="text-sm text-muted-foreground mt-1">Configure webhook URLs for receiving notifications.</p>
          </div>

          <div class="space-y-4 max-w-2xl">
            <div class="space-y-2">
              <label class="text-sm font-medium leading-none">Webhook URL</label>
              <input
                type="url"
                v-model="webhooks.url"
                placeholder="https://your-domain.com/webhook"
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <p class="text-xs text-muted-foreground">We'll send POST requests to this URL for transaction events.</p>
            </div>

            <div class="pt-4">
              <button
                @click="showWebhookDialog = true"
                :disabled="loading || !webhooks.url"
                class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ loading ? 'Saving...' : 'Save Webhook' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Webhook Confirmation Dialog -->
        <Dialog v-model:open="showWebhookDialog">
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Webhook Update</DialogTitle>
              <DialogDescription>
                Are you sure you want to update the webhook URL?
              </DialogDescription>
            </DialogHeader>

            <div class="py-4">
              <p class="text-sm text-muted-foreground mb-4">
                You are about to update the webhook URL to:
              </p>
              <div class="bg-muted/50 rounded-md p-3 mb-4 break-all text-sm font-mono border">
                {{ webhooks.url }}
              </div>
              
              <div v-if="webhooks.url === webhooks.originalUrl" class="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-3 border border-yellow-200 dark:border-yellow-900/50">
                <div class="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 text-yellow-600 dark:text-yellow-500"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/></svg>
                  <p class="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                    Same as current URL
                  </p>
                </div>
                <p class="text-xs text-yellow-700 dark:text-yellow-500 mt-1 pl-6">
                  Updating to the same URL will not change your configuration.
                </p>
              </div>
            </div>

            <DialogFooter>
              <button
                @click="showWebhookDialog = false"
                class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 mt-2 sm:mt-0"
              >
                Cancel
              </button>
              <button
                @click="confirmSaveWebhook"
                :disabled="loading"
                class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 disabled:opacity-50"
              >
                {{ loading ? 'Saving...' : 'Confirm Update' }}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <!-- IP Whitelist Tab -->
        <div v-if="currentTab === 'ip-whitelist'" class="space-y-6">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold">IP Whitelist</h3>
              <p class="text-sm text-muted-foreground mt-1">Manage whitelisted IP addresses for API access.</p>
            </div>
            <button
              @click="showAddIpDialog = true"
              class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4"
            >
              <svg class="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add IP Address
            </button>
          </div>


          <div class="space-y-2">
            <div
              v-for="ip in ipWhitelist"
              :key="ip.id"
              class="rounded-lg border bg-card p-4 flex items-center justify-between"
            >
              <div class="flex-1">
                <div class="font-mono font-medium">{{ ip.address }}</div>
                <p class="text-xs text-muted-foreground mt-1">Added on {{ formatDate(ip.createdAt) }}</p>
              </div>
              <button
                @click="deleteIp(ip)"
                class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 text-destructive"
              >
                Remove
              </button>
            </div>

            <div v-if="ipWhitelist.length === 0" class="text-center py-12 text-muted-foreground">
              <p>No IP addresses whitelisted yet.</p>
            </div>
          </div>
          <Dialog v-model:open="showAddIpDialog">
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add IP Address</DialogTitle>
                <DialogDescription>
                  Whitelist an IP address to allow API access from that source.
                </DialogDescription>
              </DialogHeader>
              
              <div class="py-4 space-y-4">
                 <div class="space-y-2">
                   <label class="text-sm font-medium">IP Address</label>
                   <input
                      v-model="newIpAddress"
                      placeholder="e.g. 203.0.113.1"
                      class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                    <p v-if="errorMessage" class="text-sm font-medium text-destructive mt-1">
                      {{ errorMessage }}
                    </p>
                 </div>
              </div>

              <DialogFooter>
                <button
                  @click="showAddIpDialog = false"
                  class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 mt-2 sm:mt-0"
                >
                  Cancel
                </button>
                <button
                  @click="addIpAddress"
                  :disabled="loading || !newIpAddress"
                  class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 disabled:opacity-50"
                >
                  {{ loading ? 'Adding...' : 'Add IP' }}
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { call } from 'frappe-ui'
import { toast } from 'vue-sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const currentTab = ref('api-docs')

const tabs = [
  { id: 'api-docs', label: 'API Documentation' },
  { id: 'api-keys', label: 'API Keys' },
  { id: 'webhooks', label: 'Webhooks' },
  { id: 'ip-whitelist', label: 'IP Whitelist' }
]

const loading = ref(false)






// API Keys
const apiKeysState = ref({
  hasKeys: false,
  currentKey: ''
})
const showCredentialsDialog = ref(false)
const newApiCredentials = ref({
  key: '',
  secret: ''
})

// Dialog state
const confirmDialog = ref({
  open: false,
  title: '',
  description: '',
  action: null
})

// Fetch API Key
const fetchApiKey = async () => {
  try {
    const response = await call('iswitch.merchant_portal_api.get_api_keys')
    const data = response?.message || response
    
    if (data.success) {
      apiKeysState.value = {
        hasKeys: true,
        currentKey: data.api_key
      }
    } else {
      apiKeysState.value = {
        hasKeys: false,
        currentKey: ''
      }
    }
  } catch (error) {
    console.error('Error fetching API key:', error)
  }
}

// Generate API Keys
const generateApiKey = async () => {
  // Always show confirmation if keys exist, as this is destructive
  if (apiKeysState.value.hasKeys) {
    confirmDialog.value = {
      open: true,
      title: 'Regenerate API Secret?',
      description: 'This will invalidate your existing API secret immediately. You will need to update all your integrations.',
      action: () => performGeneration()
    }
  } else {
    performGeneration()
  }
}

const performGeneration = async () => {
  loading.value = true
  confirmDialog.value.open = false
  
  try {
    // New backend function takes no arguments
    const response = await call('iswitch.merchant_portal_api.generate_api_keys')
    
    const data = response?.message || response
    
    if (data.success) {
      newApiCredentials.value = {
        key: data.api_key,
        secret: data.api_secret
      }
      showCredentialsDialog.value = true
      // Update local state
      apiKeysState.value.hasKeys = true
      apiKeysState.value.currentKey = data.api_key
    } else {
       console.error('API Generation Error:', data.error)
       // Optional: show error toast/alert here if needed
    }
  } catch (error) {
    console.error('Error generating keys:', error)
  } finally {
    loading.value = false
  }
}

const copyToClipboard = async (text) => {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
  } catch (err) {
    console.error('Failed to copy', err)
  }
}



// Webhooks
const webhooks = ref({
  url: '',
  originalUrl: ''
})
const showWebhookDialog = ref(false)
const webhookMessage = ref('')
const webhookError = ref('')

const fetchWebhook = async () => {
    try {
        const response = await call('iswitch.merchant_portal_api.get_merchant_profile')
        const data = response?.message || response
        if (data && data.webhook) {
            webhooks.value.url = data.webhook
            webhooks.value.originalUrl = data.webhook
        }
    } catch (error) {
        console.error('Error fetching webhook:', error)
    }
}

const confirmSaveWebhook = async () => {
  webhookMessage.value = ''
  webhookError.value = ''
  
  if (!webhooks.value.url) {
    webhookError.value = 'Please enter a webhook URL'
    return
  }
  
  loading.value = true
  try {
    const response = await call('iswitch.webhook.update_webhook', {
      webhook_url: webhooks.value.url
    })
    
    const data = response?.message || response
    
    if (data.status === 'created' || data.status === 'updated') {
      webhookMessage.value = 'Webhook updated successfully!'
      webhooks.value.originalUrl = webhooks.value.url
      setTimeout(() => { showWebhookDialog.value = false }, 1500)
    } else if (data.status === 'unchanged') {
       webhookMessage.value = 'Webhook URL is already set to this value.'
    } else if (data.status === 'error') {
       webhookError.value = data.message || 'Error updating webhook'
    }
  } catch (error) {
    console.error('Error saving webhook:', error)
    webhookError.value = 'Error updating webhook. Please try again.'
  } finally {
    loading.value = false
  }
}

// IP Whitelist
const ipWhitelist = ref([])
const newIpAddress = ref('')
const showAddIpDialog = ref(false)

const fetchIpWhitelist = async () => {
  try {
    const response = await call('iswitch.merchant_portal_api.get_whitelist_ips')
    const data = response?.message || response
    
    // Handle both object { success: true, ips: [] } and direct array [] formats
    if (Array.isArray(data)) {
      ipWhitelist.value = data.map(ip => ({
        id: ip.name || ip.id, 
        address: ip.whitelisted_ip || ip.ip,
        createdAt: ip.creation || ip.date
      }))
    } else if (data.success && Array.isArray(data.ips)) {
      ipWhitelist.value = data.ips.map(ip => ({
        id: ip.name, 
        address: ip.whitelisted_ip,
        createdAt: ip.creation
      }))
    }
  } catch (error) {
    console.error('Error fetching whitelist:', error)
  }
}

const errorMessage = ref('')

const addIpAddress = async () => {
  if (!newIpAddress.value) return
  
  loading.value = true
  errorMessage.value = ''
  
  try {
    const response = await call('iswitch.merchant_portal_api.add_whitelist_ip', {
      ip_address: newIpAddress.value
    })
    
    // Fix: If response already has success (frappe-ui unwrapped), use it. 
    // Only use response.message if it's the wrapper object.
    // If response.message is a string (success message), we want the parent object.
    let data = response
    if (response.message && typeof response.message === 'object' && !Array.isArray(response.message)) {
      data = response.message
    }
    
    if (data.success) {
       await fetchIpWhitelist()
       newIpAddress.value = ''
       showAddIpDialog.value = false
    } else {
       errorMessage.value = data.error || 'Error adding IP'
    }
  } catch (error) {
    errorMessage.value = 'Failed to add IP address'
  } finally {
    loading.value = false
  }
}

const deleteIp = (ip) => {
  confirmDialog.value = {
      open: true,
      title: 'Remove IP Address?',
      description: `Are you sure you want to remove ${ip.address} from the whitelist?`,
      action: () => performIpDeletion(ip.id)
  }
}

const performIpDeletion = async (ipId) => {
  confirmDialog.value.open = false
  loading.value = true
  
  try {
    const response = await call('iswitch.merchant_portal_api.delete_whitelist_ip', {
      ip_name: ipId
    })
    
    let data = response
    if (response.message && typeof response.message === 'object' && !Array.isArray(response.message)) {
      data = response.message
    }
    
    // Handle success or array return (legacy)
    if (data.success || Array.isArray(data) || (data.ips && Array.isArray(data.ips))) {
      // Remove from local list
      ipWhitelist.value = ipWhitelist.value.filter(i => i.id !== ipId)
    } else {
      console.error('Error deleting IP:', data.error)
      toast.error('Failed to delete IP address', {
        description: data.error || 'An error occurred while deleting the IP address'
      })
    }
  } catch(error) {
     console.error('Error deleting IP:', error)
     toast.error('Failed to delete IP address', {
       description: error.message || 'An unexpected error occurred'
     })
  } finally {
     loading.value = false
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Fetch profile on mount
onMounted(() => {
  fetchApiKey()
  fetchIpWhitelist()
  fetchWebhook()
})
</script>

<style scoped>
/* Minimal scoped styles, relying on Tailwind */
</style>
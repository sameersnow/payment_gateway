<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold tracking-tight">Profile</h1>
      <p class="text-muted-foreground mt-2">Manage your company information and profile details.</p>
    </div>

    <div class="space-y-6">
      <!-- Status Card -->
      <div class="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
        <h3 class="text-lg font-semibold mb-4">Account Status</h3>
        <div class="flex items-center gap-4">
          <span 
            class="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium border"
            :class="getStatusVariant(profile.status)"
          >
            {{ profile.status || 'Unknown' }}
          </span>
          <p class="text-sm text-muted-foreground">
            {{ getStatusMessage(profile.status) }}
          </p>
        </div>
      </div>

      <!-- Profile Details -->
      <div class="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
        <h3 class="text-lg font-semibold mb-4">Company Details</h3>
        <div class="space-y-4 max-w-2xl">
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none">Company Name</label>
             <input
              type="text"
              v-model="profile.company"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div class="space-y-2">
             <label class="text-sm font-medium leading-none">Company Email</label>
             <input
              type="email"
              v-model="profile.email"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium leading-none">Company Website</label>
             <input
              type="url"
              v-model="profile.website"
              placeholder="https://example.com"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>



          <div class="pt-4">
             <button
              @click="saveProfile"
              :disabled="loading"
              class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ loading ? 'Saving...' : 'Save Details' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Rejection Remark Banner -->
      <div v-if="profile.status === 'Rejected' && profile.remark" class="rounded-lg border-2 border-red-200 bg-red-50 p-6 shadow-sm">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0">
            <svg class="h-6 w-6 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-red-900 mb-2">KYC Verification Rejected</h3>
            <p class="text-sm text-red-800 mb-3">Your KYC verification was rejected for the following reason:</p>
            <div class="rounded-md bg-white border border-red-200 p-4">
              <p class="text-sm text-red-900 font-medium">{{ profile.remark }}</p>
            </div>
            <p class="text-xs text-red-700 mt-3">📌 Please re-upload the corrected documents below and they will be reviewed again.</p>
          </div>
        </div>
      </div>

      <!-- Documents Section -->
      <div class="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
        <h3 class="text-lg font-semibold mb-4">Documents</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Director's Aadhaar -->
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none">Director's Aadhaar Card</label>
            <div v-if="shouldShowUpload('director_adhar')">
              <div class="flex items-center gap-2">
                 <input
                  type="file"
                  ref="aadhaarInput"
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <p class="text-xs text-muted-foreground mt-1">Upload front and back in a single file if possible.</p>
            </div>
            <div v-if="profile.director_adhar" class="text-sm">
              <div class="flex items-center gap-2 p-3 border rounded-md" :class="isDocumentMarkedForReupload('director_adhar') ? 'bg-orange-50 border-orange-200' : 'bg-muted/20'">
                <a :href="profile.director_adhar" target="_blank" class="text-primary font-medium hover:underline flex items-center gap-1">
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mr-1">
                     <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                     <polyline points="14 2 14 8 20 8"></polyline>
                     <line x1="16" y1="13" x2="8" y2="13"></line>
                     <line x1="16" y1="17" x2="8" y2="17"></line>
                     <polyline points="10 9 9 9 8 9"></polyline>
                   </svg>
                   View Uploaded Document
                </a>
                <span v-if="isDocumentMarkedForReupload('director_adhar')" class="text-xs text-orange-600 ml-auto font-semibold">⚠️ Re-upload Required</span>
                <span v-else-if="profile.status === 'Rejected' && !isDocumentMarkedForReupload('director_adhar')" class="text-xs text-green-600 ml-auto font-semibold">✓ Approved</span>
              </div>
            </div>
          </div>

          <!-- Director's PAN -->
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none">Director's PAN Card</label>
            <div v-if="shouldShowUpload('director_pan')">
              <div class="flex items-center gap-2">
                 <input
                  type="file"
                  ref="directorPanInput"
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
               <p class="text-xs text-muted-foreground mt-1">Upload clear copy of PAN Card.</p>
            </div>
             <div v-if="profile.director_pan" class="text-sm">
              <div class="flex items-center gap-2 p-3 border rounded-md" :class="isDocumentMarkedForReupload('director_pan') ? 'bg-orange-50 border-orange-200' : 'bg-muted/20'">
                <a :href="profile.director_pan" target="_blank" class="text-primary font-medium hover:underline flex items-center gap-1">
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mr-1">
                     <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                     <polyline points="14 2 14 8 20 8"></polyline>
                     <line x1="16" y1="13" x2="8" y2="13"></line>
                     <line x1="16" y1="17" x2="8" y2="17"></line>
                     <polyline points="10 9 9 9 8 9"></polyline>
                   </svg>
                   View Uploaded Document
                </a>
                <span v-if="isDocumentMarkedForReupload('director_pan')" class="text-xs text-orange-600 ml-auto font-semibold">⚠️ Re-upload Required</span>
                <span v-else-if="profile.status === 'Rejected' && !isDocumentMarkedForReupload('director_pan')" class="text-xs text-green-600 ml-auto font-semibold">✓ Approved</span>
              </div>
            </div>
          </div>

          <!-- Company PAN -->
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none">Company PAN Card</label>
            <div v-if="shouldShowUpload('company_pan')">
              <div class="flex items-center gap-2">
                 <input
                  type="file"
                  ref="companyPanInput"
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
               <p class="text-xs text-muted-foreground mt-1">Upload Company PAN Card.</p>
            </div>
             <div v-if="profile.company_pan" class="text-sm">
              <div class="flex items-center gap-2 p-3 border rounded-md" :class="isDocumentMarkedForReupload('company_pan') ? 'bg-orange-50 border-orange-200' : 'bg-muted/20'">
                <a :href="profile.company_pan" target="_blank" class="text-primary font-medium hover:underline flex items-center gap-1">
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mr-1">
                     <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                     <polyline points="14 2 14 8 20 8"></polyline>
                     <line x1="16" y1="13" x2="8" y2="13"></line>
                     <line x1="16" y1="17" x2="8" y2="17"></line>
                     <polyline points="10 9 9 9 8 9"></polyline>
                   </svg>
                   View Uploaded Document
                </a>
                <span v-if="isDocumentMarkedForReupload('company_pan')" class="text-xs text-orange-600 ml-auto font-semibold">⚠️ Re-upload Required</span>
                <span v-else-if="profile.status === 'Rejected' && !isDocumentMarkedForReupload('company_pan')" class="text-xs text-green-600 ml-auto font-semibold">✓ Approved</span>
              </div>
            </div>
          </div>

          <!-- GST Certificate -->
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none">GST Certificate</label>
            <div v-if="shouldShowUpload('company_gst')">
              <div class="flex items-center gap-2">
                 <input
                  type="file"
                  ref="gstInput"
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
               <p class="text-xs text-muted-foreground mt-1">Upload valid GST Registration Certificate.</p>
            </div>
             <div v-if="profile.company_gst" class="text-sm">
              <div class="flex items-center gap-2 p-3 border rounded-md" :class="isDocumentMarkedForReupload('company_gst') ? 'bg-orange-50 border-orange-200' : 'bg-muted/20'">
                <a :href="profile.company_gst" target="_blank" class="text-primary font-medium hover:underline flex items-center gap-1">
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mr-1">
                     <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                     <polyline points="14 2 14 8 20 8"></polyline>
                     <line x1="16" y1="13" x2="8" y2="13"></line>
                     <line x1="16" y1="17" x2="8" y2="17"></line>
                     <polyline points="10 9 9 9 8 9"></polyline>
                   </svg>
                   View Uploaded Document
                </a>
                <span v-if="isDocumentMarkedForReupload('company_gst')" class="text-xs text-orange-600 ml-auto font-semibold">⚠️ Re-upload Required</span>
                <span v-else-if="profile.status === 'Rejected' && !isDocumentMarkedForReupload('company_gst')" class="text-xs text-green-600 ml-auto font-semibold">✓ Approved</span>
              </div>
            </div>
          </div>
        </div>
        
      <div class="mt-4 pt-4 border-t" v-if="shouldShowUploadButton">
             <button
              @click="uploadDocuments"
              class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-6"
            >
              {{ profile.status === 'Rejected' ? 'Re-upload Documents' : 'Upload Documents' }}
            </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { call } from 'frappe-ui'

const profile = ref({
  name: '', // Merchant ID
  company_name: '',
  email: '',
  phone: '',
  company: '',
  website: '',
  status: 'Draft',
  remark: '',
  documents_to_reupload: '',
  director_pan: '',
  director_adhar: '',
  company_pan: '',
  company_gst: ''
})

const loading = ref(false)
const aadhaarInput = ref(null)
const directorPanInput = ref(null)
const companyPanInput = ref(null)
const gstInput = ref(null)

const allDocumentsUploaded = computed(() => {
  return profile.value.director_adhar && 
         profile.value.director_pan && 
         profile.value.company_pan && 
         profile.value.company_gst
})

const shouldShowUploadButton = computed(() => {
  if (!allDocumentsUploaded.value) return true
  if (profile.value.status !== 'Rejected') return false
  
  // If rejected, check if there are specific documents to reupload
  const docsToReupload = getDocumentsToReupload()
  if (docsToReupload.length > 0) {
    // Show button if at least one marked document exists
    return true
  }
  
  // If no specific documents marked, allow all uploads
  return true
})

const getDocumentsToReupload = () => {
  if (!profile.value.documents_to_reupload) return []
  try {
    return JSON.parse(profile.value.documents_to_reupload)
  } catch (e) {
    return []
  }
}

const isDocumentMarkedForReupload = (documentKey) => {
  const docsToReupload = getDocumentsToReupload()
  return docsToReupload.includes(documentKey)
}

const shouldShowUpload = (documentKey) => {
  // If document doesn't exist, always show upload
  if (!profile.value[documentKey]) return true
  
  // If status is not rejected, don't show upload (document already exists)
  if (profile.value.status !== 'Rejected') return false
  
  // If rejected, check if specific documents are marked
  const docsToReupload = getDocumentsToReupload()
  
  // If no specific documents marked, allow all uploads
  if (docsToReupload.length === 0) return true
  
  // Only show upload if this document is marked
  return docsToReupload.includes(documentKey)
}

const getStatusVariant = (status) => {
  const variants = {
    'Draft': 'bg-gray-100 text-gray-800 border-gray-200',
    'Submitted': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Approved': 'bg-green-100 text-green-800 border-green-200',
    'Rejected': 'bg-red-100 text-red-800 border-red-200',
    'Terminated': 'bg-red-100 text-red-800 border-red-200'
  }
  return variants[status] || 'bg-gray-100 text-gray-800 border-gray-200'
}

const getStatusMessage = (status) => {
  const messages = {
    'Draft': 'Your profile is currently in draft. Please complete all details and submit.',
    'Submitted': 'Your profile is under review by our team.',
    'Approved': 'Your account is active and approved.',
    'Rejected': 'Your application was rejected. Please contact support.',
    'Terminated': 'Your account has been terminated.'
  }
  return messages[status] || ''
}

const fetchProfile = async () => {
  loading.value = true
  try {
    const response = await call('iswitch.merchant_portal_api.get_merchant_profile')
    const data = response?.message || response
    
    if (data) {
      profile.value = {
        name: data.name || '',
        company_name: data.company_name || '',
        email: data.company_email || '',
        phone: data.contact_detail || '',
        company: data.company_name || '',
        website: data.website || '',
        status: data.status || 'Draft',
        remark: data.remark || '',
        documents_to_reupload: data.documents_to_reupload || '',
        director_pan: data.director_pan || '',
        director_adhar: data.director_adhar || '',
        company_pan: data.company_pan || '',
        company_gst: data.company_gst || ''
      }
    }
  } catch (error) {
    console.error('Error fetching profile:', error)
  } finally {
    loading.value = false
  }
}

const saveProfile = async () => {
  loading.value = true
  try {
    const response = await call('iswitch.merchant_portal_api.update_merchant_profile', {
      company_name: profile.value.company,
      company_email: profile.value.email,
      phone: profile.value.phone,
      website: profile.value.website
    })
    
    if (response) {
      // Update local state with returned data if needed
      // toast({ title: response.message, variant: "success" }); // If toast is available
      // alert(response.message) // Or simple alert/nothing
    }
  } catch (error) {
    console.error('Error saving profile:', error)
  } finally {
    loading.value = false
  }
}

const uploadDocuments = async () => {
  loading.value = true
  try {
    const formData = new FormData()
    let hasFiles = false
    
    if (aadhaarInput.value?.files?.length) {
       formData.append('director_adhar', aadhaarInput.value.files[0])
       hasFiles = true
    }
    
    if (directorPanInput.value?.files?.length) {
       formData.append('director_pan', directorPanInput.value.files[0])
       hasFiles = true
    }
    
    if (companyPanInput.value?.files?.length) {
       formData.append('company_pan', companyPanInput.value.files[0])
       hasFiles = true
    }
    
    if (gstInput.value?.files?.length) {
       formData.append('company_gst', gstInput.value.files[0])
       hasFiles = true
    }
    
    if (!hasFiles) {
      alert('Please select files to upload.')
      return
    }

    const response = await fetch('/api/method/iswitch.merchant_portal_api.upload_merchant_documents', {
      method: 'POST',
      body: formData,
      headers: {
        'X-Frappe-CSRF-Token': window.csrf_token || '' 
      }
    })

    if (!response.ok) {
       const errorText = await response.text()
       let errorMsg = 'Upload failed'
       try {
          const errorJson = JSON.parse(errorText)
          errorMsg = errorJson.message || errorJson._server_messages || errorMsg
       } catch (e) {}
       throw new Error(errorMsg)
    }
    
    const result = await response.json()
    const data = result.message || result.data

    if (data) {
       // Refresh profile to see new links and status
       await fetchProfile()
       
       // Clear inputs
       if (aadhaarInput.value) aadhaarInput.value.value = ''
       if (directorPanInput.value) directorPanInput.value.value = ''
       if (companyPanInput.value) companyPanInput.value.value = ''
       if (gstInput.value) gstInput.value.value = ''
    }

  } catch (error) {
    console.error('Error uploading documents:', error)
    alert(error.message || 'One or more uploads failed.')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProfile()
})
</script>

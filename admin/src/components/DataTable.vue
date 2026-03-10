<template>
  <div class="w-full">
    <div class="flex items-center py-4 px-2" v-if="title || $slots.actions">
      <h3 class="text-lg font-bold tracking-tight">{{ title }}</h3>
      <div class="ml-auto flex items-center gap-2">
        <slot name="actions"></slot>
      </div>
    </div>
    
    <div class="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div class="relative w-full overflow-x-auto">
        <Table>
          <TableHeader class="bg-muted/50">
            <TableRow class="hover:bg-transparent">
              <TableHead v-if="selectable" class="w-[50px] px-6">
                <input 
                  type="checkbox" 
                  :checked="isAllSelected"
                  :indeterminate="isIndeterminate"
                  class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                  @change="toggleSelectAll"
                />
              </TableHead>
              <TableHead 
                v-for="column in columns" 
                :key="column.key"
                class="px-6 font-semibold text-muted-foreground whitespace-nowrap h-12"
                :class="{ 'cursor-pointer select-none hover:text-foreground transition-colors': column.sortable }"
                @click="column.sortable && handleSort(column.key)"
              >
                <div class="flex items-center gap-1.5">
                  <span class="text-xs uppercase tracking-wider font-bold">{{ column.label }}</span>
                  <div v-if="column.sortable" class="flex flex-col opacity-40">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" :class="{ 'opacity-100 text-primary': sortKey === column.key && sortOrder === 'asc' }">
                      <path d="M18 15l-6-6-6 6" />
                    </svg>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" :class="{ 'opacity-100 text-primary': sortKey === column.key && sortOrder === 'desc' }">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow 
              v-for="(row, index) in paginatedData" 
              :key="index"
              :class="{ 'bg-muted/30': selectedRows.includes(row) }"
              class="group transition-colors border-b last:border-0"
            >
              <TableCell v-if="selectable" class="px-6 py-4">
                <input 
                  type="checkbox" 
                  :checked="selectedRows.includes(row)"
                  class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                  @change="toggleRowSelection(row)"
                />
              </TableCell>
              <TableCell 
                v-for="column in columns" 
                :key="column.key"
                class="px-6 py-4 whitespace-nowrap text-sm"
              >
                <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]">
                  <Badge v-if="column.type === 'badge'" 
                    variant="secondary"
                    class="font-bold text-[10px] uppercase tracking-tighter h-5 px-2"
                    :class="getBadgeVariant(row[column.key])"
                  >
                    {{ formatBadgeText(row[column.key]) }}
                  </Badge>
                  <span v-else-if="column.type === 'currency'" class="font-medium">
                    {{ formatCurrency(row[column.key]) }}
                  </span>
                  <span v-else-if="column.type === 'date'" class="text-muted-foreground font-medium">
                    {{ formatDate(row[column.key]) }}
                  </span>
                  <span v-else-if="column.type === 'datetime'" class="text-muted-foreground font-medium">
                    {{ formatDateTime(row[column.key]) }}
                  </span>
                  <span v-else>
                    {{ row[column.key] }}
                  </span>
                </slot>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
    
    <div class="flex items-center justify-between px-2 py-6" v-if="pagination">
      <div class="text-sm text-muted-foreground font-medium">
        Showing {{ startIndex + 1 }} to {{ endIndex }} of <span class="text-foreground font-bold">{{ data.length }}</span> entries
        <span v-if="selectable && selectedRows.length > 0" class="ml-2 text-primary font-bold">
            ({{ selectedRows.length }} selected)
        </span>
      </div>
      <div class="flex items-center space-x-2">
        <Button 
          variant="outline"
          size="icon"
          class="h-9 w-9 shadow-sm"
          :disabled="currentPage === 1"
          @click="goToPage(currentPage - 1)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Button>
        
        <div class="flex items-center gap-1.5">
          <Button 
            v-for="page in visiblePages" 
            :key="page"
            :variant="page === currentPage ? 'default' : 'outline'"
            size="sm"
            class="h-9 w-9 font-bold shadow-sm"
            @click="goToPage(page)"
          >
            {{ page }}
          </Button>
        </div>
        
        <Button 
          variant="outline"
          size="icon"
          class="h-9 w-9 shadow-sm"
          :disabled="currentPage === totalPages"
          @click="goToPage(currentPage + 1)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const props = defineProps({
  title: String,
  columns: {
    type: Array,
    required: true
  },
  data: {
    type: Array,
    required: true
  },
  pagination: {
    type: Boolean,
    default: true
  },
  perPage: {
    type: Number,
    default: 10
  },
  selectable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:selection'])

const currentPage = ref(1)
const sortKey = ref('')
const sortOrder = ref('asc')
const selectedRows = ref([])

const totalPages = computed(() => Math.ceil(props.data.length / props.perPage))

const startIndex = computed(() => (currentPage.value - 1) * props.perPage)
const endIndex = computed(() => Math.min(startIndex.value + props.perPage, props.data.length))

const paginatedData = computed(() => {
  let data = [...props.data]
  
  if (sortKey.value) {
    data.sort((a, b) => {
      const aVal = a[sortKey.value]
      const bVal = b[sortKey.value]
      
      if (sortOrder.value === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })
  }
  
  return data.slice(startIndex.value, endIndex.value)
})

const isAllSelected = computed(() => {
    return paginatedData.value.length > 0 && paginatedData.value.every(row => selectedRows.value.includes(row))
})

const isIndeterminate = computed(() => {
    const visibleSelected = paginatedData.value.filter(row => selectedRows.value.includes(row)).length
    return visibleSelected > 0 && visibleSelected < paginatedData.value.length
})

const toggleSelectAll = (e) => {
    if (e.target.checked) {
        // Add all visible rows to selection if not already present
        paginatedData.value.forEach(row => {
            if (!selectedRows.value.includes(row)) {
                selectedRows.value.push(row)
            }
        })
    } else {
        // Remove all visible rows from selection
        selectedRows.value = selectedRows.value.filter(row => !paginatedData.value.includes(row))
    }
    emit('update:selection', selectedRows.value)
}

const toggleRowSelection = (row) => {
    const index = selectedRows.value.indexOf(row)
    if (index === -1) {
        selectedRows.value.push(row)
    } else {
        selectedRows.value.splice(index, 1)
    }
    emit('update:selection', selectedRows.value)
}


const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)
  
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

const handleSort = (key) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

const formatDate = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatDateTime = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getBadgeVariant = (value) => {
  const status = value?.toLowerCase() || ''
  
  // Transaction types (for Ledger)
  if (status === 'credit') {
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200'
  }
  if (status === 'debit') {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-200'
  }
  
  // Order statuses
  // Success states
  if (status === 'processed' || status === 'success' || status === 'active' || status === 'approved') {
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200'
  }
  
  // Processing/Pending states
  if (status === 'processing' || status === 'pending' || status === 'queued' || status === 'submitted') {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-200'
  }
  
  // Failed/Cancelled states
  if (status === 'cancelled' || status === 'reversed' || status === 'failed' || status === 'rejected' || status === 'terminated') {
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-red-200'
  }
  
  // Default
  return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300 border-gray-200'
}

const formatBadgeText = (value) => {
  if (!value) return ''
  // Convert to Camel case: first letter uppercase, rest lowercase
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}
</script>

<style scoped>
/* Removed custom styles in favor of Tailwind classes */
</style>

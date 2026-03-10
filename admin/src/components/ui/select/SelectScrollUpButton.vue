<script setup>
import { computed } from 'vue'
import { SelectScrollUpButton, useForwardProps } from 'radix-vue'
import { ChevronUp } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = defineProps({
  asChild: { type: Boolean, required: false },
  as: { type: null, required: false },
  class: { type: null, required: false },
})

const forwardedProps = useForwardProps(props)
</script>

<template>
  <SelectScrollUpButton v-bind="forwardedProps" :class="cn('flex cursor-default items-center justify-center py-1', props.class)">
    <ChevronUp class="h-4 w-4" />
  </SelectScrollUpButton>
</template>

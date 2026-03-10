<script setup>
import { DialogTitle } from 'radix-vue'
import { cn } from '@/lib/utils'

const props = defineProps({
  class: { type: String, default: undefined },
  asChild: { type: Boolean, default: undefined },
  as: { type: null, default: undefined },
})
</script>

<template>
  <DialogTitle
    v-bind="props"
    :class="cn('text-lg font-semibold text-foreground', props.class)"
  >
    <slot />
  </DialogTitle>
</template>

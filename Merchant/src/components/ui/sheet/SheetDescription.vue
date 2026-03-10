<script setup>
import { DialogDescription } from 'radix-vue'
import { cn } from '@/lib/utils'

const props = defineProps({
  class: { type: String, default: undefined },
  asChild: { type: Boolean, default: undefined },
  as: { type: null, default: undefined },
})
</script>

<template>
  <DialogDescription
    v-bind="props"
    :class="cn('text-sm text-muted-foreground', props.class)"
  >
    <slot />
  </DialogDescription>
</template>

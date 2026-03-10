<script setup>
import { DialogTitle } from 'radix-vue'
import { cn } from '@/lib/utils'
</script>

<template>
  <DialogTitle
    :class="cn('text-lg font-semibold text-foreground', $attrs.class)"
  >
    <slot />
  </DialogTitle>
</template>

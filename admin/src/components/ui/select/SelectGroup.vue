<script setup>
import { SelectGroup } from 'radix-vue'
import { useForwardProps } from 'radix-vue'

const props = defineProps({
  asChild: { type: Boolean, required: false },
  as: { type: null, required: false },
})

const forwardedProps = useForwardProps(props)
</script>

<template>
  <SelectGroup v-bind="forwardedProps">
    <slot />
  </SelectGroup>
</template>

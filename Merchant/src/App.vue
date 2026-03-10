<template>
  <Toaster position="top-right" />
  <DashboardLayout>
    <router-view />
  </DashboardLayout>
</template>

<script setup>
import DashboardLayout from './components/DashboardLayout.vue'
import { Toaster } from 'vue-sonner'
</script>

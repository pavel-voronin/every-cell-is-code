<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useAutoRedirect } from '@/composables/useAutoRedirect'

useAutoRedirect()
</script>

<template>
  <RouterView />
</template>

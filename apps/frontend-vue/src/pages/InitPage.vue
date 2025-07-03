<script setup lang="ts">
// after 2 seconds redirect to the second page
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'

const router = useRouter()

onMounted(() => {
  setTimeout(() => {
    router.push('/second')
  }, 2000)
})
</script>

<template>
  <main>Initializing the app...</main>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { onMounted, onUnmounted } from 'vue'
import { useRealmStore } from '@/stores/realm'
import { RealmSchema } from '@every-cell-is-code/types'
import { config } from '@/config/main'

const router = useRouter()
let connectInterval: number | undefined

const tryConnect = async () => {
  try {
    const response = await fetch(`${config.apiUrl}/connect`)
    if (!response.ok) return

    try {
      const json = await response.json()
      if (!json) return
      const { data, success } = RealmSchema.safeParse(json)
      if (!success) return
      useRealmStore().setRealm(data)
    } catch {
      return
    }

    if (connectInterval !== undefined) {
      clearInterval(connectInterval)
      connectInterval = undefined
    }

    router.push({ name: 'main' })
  } catch {}
}

onMounted(() => {
  connectInterval = setInterval(tryConnect, config.reconnectDelay)
  tryConnect()
})

onUnmounted(() => {
  if (connectInterval !== undefined) {
    clearInterval(connectInterval)
  }
})
</script>

<template>
  <main>Initializing the app...</main>
</template>

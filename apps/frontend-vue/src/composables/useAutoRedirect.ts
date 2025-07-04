import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { useRealmStore } from '@/stores/realm'

export function useAutoRedirect() {
  const router = useRouter()
  const realm = useRealmStore()

  if (!realm.isConnected && router.currentRoute.value.path !== '/connect') {
    router.push('/connect')
  }

  watch(
    () => realm.isConnected,
    (newValue) => {
      if (!newValue && router.currentRoute.value.path !== '/connect') {
        router.push('/connect')
      }
    },
    { immediate: false },
  )
}

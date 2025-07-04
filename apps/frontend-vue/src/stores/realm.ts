import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { RealmSchema } from '@every-cell-is-code/types'

export const useRealmStore = defineStore('realm', () => {
  const realm = ref<RealmSchema | null>(null)
  const isConnected = computed(() => realm.value !== null)

  function setRealm(_realm: RealmSchema) {
    realm.value = _realm
  }

  return { realm, isConnected, setRealm }
})

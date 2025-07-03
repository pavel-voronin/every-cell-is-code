import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useTemplateStore = defineStore('template', () => {
  const val = ref(0)
  const comp = computed(() => val.value * 2)
  function func() {}

  return { val, comp, func }
})

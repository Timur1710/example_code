import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSplitterStore = defineStore('splitter', () => {
  
  const splitterWidtdh = ref(200);

  function setSplitterWidth(width: number) {
    splitterWidtdh.value = width
  };

  return {
    splitterWidtdh,
    setSplitterWidth,
  };
}, {
  persist: {
    key: 'splitter-width'
  }
});
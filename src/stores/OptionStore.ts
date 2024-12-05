import { defineStore } from "pinia";

interface Options {
  isDarkmode: boolean;
}

export const useCounterStore = defineStore<"counter", Options>("counter", {
  state: (): Options => ({
    isDarkmode: false
  }),
  getters: {
    getIsDarkmode: (state) => state.isDarkmode
  },
  actions: {
    triggerDarkmode() {
      this.isDarkmode = !this.isDarkmode;
    }
  }
});

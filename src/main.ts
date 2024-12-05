import "@/index.css";

import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import PrimeVue from "primevue/config";
import Aura from "@primevue/themes/aura";
import ConfirmationService from "primevue/confirmationservice";
import Tooltip from "primevue/tooltip";
import "primeicons/primeicons.css";
import { createPinia } from "pinia";

const pinia = createPinia();

const app = createApp(App);

app.use(router);

app.use(pinia);

app.use(PrimeVue, {
  theme: {
    preset: Aura
  },
  ripple: true,
  locale: {
    accept: "確認",
    reject: "取消",
    dayNames: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
    dayNamesShort: ["日", "一", "二", "三", "四", "五", "六"],
    dayNamesMin: ["日", "一", "二", "三", "四", "五", "六"],
    monthNames: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
    monthNamesShort: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"]
  }
});
app.use(ConfirmationService);
app.directive("tooltip", Tooltip);

app.mount("#app");

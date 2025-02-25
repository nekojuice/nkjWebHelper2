import { createRouter, createMemoryHistory } from "vue-router";
import Layout from "@/views/Layout.vue";

const router = createRouter({
  history: createMemoryHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "Layout",
      component: Layout
    }
  ]
});

export default router;

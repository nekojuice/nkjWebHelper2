<template>
  <div :class="{ dark: isDarkMode }">
    <div id="layout" class="bg-white dark:bg-slate-800">
      <Sidebar />
      <Page1 />
      <InputSwitch v-model="isDarkMode" @change="toggleDarkMode" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { onBeforeMount, ref } from "vue";
import InputSwitch from "primevue/inputswitch";
import Sidebar from "@/components/Sidebar.vue";
import Page1 from "@/views/Page1.vue";

onBeforeMount(() => {
  document.body.style.overflow = "hidden";
});

const isDarkMode = ref(false);

const toggleDarkMode = () => {
  if (isDarkMode.value) {
    document.documentElement.classList.add("dark");
    localStorage.theme = "dark";
  } else {
    document.documentElement.classList.remove("dark");
    localStorage.theme = "light";
  }
};
</script>

<style scoped>
#layout {
  width: 800px;
  height: 600px;
}
</style>

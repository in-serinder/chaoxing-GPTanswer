import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";

// const app = createApp(App);

// app.use(createPinia());

// app.mount("#app");

export function mount(selectorOrElement: string | HTMLElement) {
  const app = createApp(App);
  app.use(createPinia());
  app.mount(selectorOrElement);
  return app;
}

//在没有导出时自动挂载（用于独立运行）
if (import.meta.env?.DEV) {
  mount("#app");
}

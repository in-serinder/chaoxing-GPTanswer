import { defineStore } from "pinia";

export interface Log {
  time: string;
  level: "info" | "success" | "warning" | "error";
  message: string;
}

export const useLogStore = defineStore("log", {
  state() {
    return {
      logs: [] as Log[],
    };
  },
  actions: {
    init() {
      this.logs = [
        {
          time: new Date().toLocaleTimeString(),
          level: "info",
          message: "应用启动",
        },
        {
          time: new Date().toLocaleTimeString(),
          level: "success",
          message: "API Key配置加载成功",
        },
        {
          time: new Date().toLocaleTimeString(),
          level: "info",
          message: "准备就绪",
        },
      ];
    },
  },
});

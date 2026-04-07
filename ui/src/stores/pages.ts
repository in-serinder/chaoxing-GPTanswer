import { defineStore } from "pinia";

export const usePagesStore = defineStore("pages", {
  state() {
    return {
      isQuestionPage: false,
    };
  },
  actions: {
    /*注册类函数 */
    checkISQuestionPage() {
      this.isQuestionPage = document.getElementById("RightCon") !== null;
    },
  },
});

import { defineStore } from "pinia";

export const usePagesStore = defineStore("pages", {
  state() {
    return {
      isQuestionPage: false,
    };
  },
  actions: {
    checkISQuestionPage() {
      this.isQuestionPage = document.getElementById("RightCon") !== null;
    },
  },
});

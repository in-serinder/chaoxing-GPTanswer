import { defineStore } from "pinia";

// 题目类型选择接口
// Question用于整合整个字符串内容和题目类型提交到ai
export interface Question {
  questionId: number; //题号
  type: string;
  text: string;
}
// AI返回整合
export interface SingleQuestion {
  questionId: number; //题号
  questionContent: string; //题目内容 用于校准
  choices: string;
}

export interface MultipleChoiceQuestion {
  questionId: number; //题号
  choices: string[];
  questionContent: string; //题目内容 用于校准
}

export interface TrueFalseQuestion {
  questionId: number; //题号
  questionContent: string;
  answer: boolean;
}

export interface ShortAnswerQuestion {
  questionId: number; //题号
  questionContent: string;
  answer: string;
}

// 抓取的原始题目数据
interface RawQuestion {
  questionId: number;
  type: string;
  content: string;
  choices?: string[];
}

export const useQuestionsStore = defineStore("questions", {
  state() {
    return {
      rawQuestions: [] as RawQuestion[],
      questions: [] as Question[],
    };
  },
  actions: {
    // 抓取题目
    fetchQuestions() {
      this.rawQuestions = [];

      // 找到所有题目容器
      const questionElements = document.querySelectorAll(".singleQuesId");

      questionElements.forEach((element) => {
        // 获取题目ID
        const questionIdStr = element.getAttribute("data");
        const questionId = questionIdStr ? parseInt(questionIdStr) : 0;

        // 获取题目序号
        const questionNumberElement = element.querySelector(".Zy_TItle i");
        const questionNumber = questionNumberElement
          ? parseInt(questionNumberElement.textContent || "0")
          : 0;

        // 获取题目内容
        const contentElement = element.querySelector(".Zy_TItle .fontLabel");
        const content = contentElement
          ? contentElement.textContent?.trim() || ""
          : "";

        // 确定题目类型
        let type = "unknown";
        if (content.includes("【Single Choice】")) {
          type = "single";
        } else if (content.includes("【Multiple Choice】")) {
          type = "multiple";
        } else if (content.includes("【True or False】")) {
          type = "truefalse";
        } else if (content.includes("【Short Answer】")) {
          type = "shortanswer";
        }

        // 抓取选项（如果有）
        let choices: string[] = [];
        const choicesElements = element.querySelectorAll(".Zy_ulTk li");
        choicesElements.forEach((choiceElement) => {
          const choiceText = choiceElement.textContent?.trim() || "";
          if (choiceText) {
            choices.push(choiceText);
          }
        });

        // 存储原始题目数据
        this.rawQuestions.push({
          questionId: questionNumber, // 使用题目序号作为questionId
          type,
          content,
          choices: choices.length > 0 ? choices : undefined,
        });
      });

      console.log("抓取到的题目数据:", this.rawQuestions);
    },

    // 整合为Json数组 一个题目一个json簇 依据接口Question
    combineQuestions() {
      this.questions = [];

      this.rawQuestions.forEach((rawQuestion) => {
        // 构建题目文本
        let text = rawQuestion.content;
        if (rawQuestion.choices && rawQuestion.choices.length > 0) {
          text += "\n选项：\n" + rawQuestion.choices.join("\n");
        }

        // 创建Question对象
        const question: Question = {
          questionId: rawQuestion.questionId,
          type: rawQuestion.type,
          text,
        };

        this.questions.push(question);
      });

      console.log("整合后的题目数据:", this.questions);
      return this.questions;
    },

    // 根据题目类型获取特定类型的题目
    getQuestionsByType(type: string) {
      return this.rawQuestions.filter((q) => q.type === type);
    },

    // 清空题目数据
    clearQuestions() {
      this.rawQuestions = [];
      this.questions = [];
    },
  },
  getters: {
    // 获取题目数量
    questionCount(): number {
      return this.rawQuestions.length;
    },

    // 获取不同类型题目的数量
    questionTypeCount(): Record<string, number> {
      const count: Record<string, number> = {};
      this.rawQuestions.forEach((q) => {
        count[q.type] = (count[q.type] || 0) + 1;
      });
      return count;
    },
  },
});

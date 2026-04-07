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
  questionContent: string; //题目内容 用于校准题目在网页中位置
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
      // 字体加密还原
      //遍历 iframe 内的所有 <style> 标签，找到其中包含 font-cxsecret 的样式定义，从中提取字体文件的 Base64 编码数据
      //使用内置的 Typr 库将 Base64 数据还原为字体对象
      //通过油猴的 GM_getResourceText("ttf") 加载一个预置的 JSON 映射表（table），该表记录了每个汉字的“字形 MD5 → 正确字符”的对应关系。
      //计算每个汉字的字形指纹
      // 遍历 Unicode 基本汉字区间（19968 ~ 40870）：
      // 使用 Typr.U.codeToGlyph 获取该字符在加密字体中的字形索引。
      // 使用 Typr.U.glyphToPath 获取该字形的路径数据。
      // 对路径数据进行 MD5 哈希，取后 24 位作为“指纹”。
      // 用该指纹在映射表中查找对应的正确汉字。
      // 查找所有 class 为 font-cxsecret 的元素，将其内部 HTML 中的每个乱码字符按上述映射替换为真实汉字，并移除 font-cxsecret 类。
      // 在页面先抓取关键题目框架 class = "Zy_TItle clearfix" 为题目容器父级
      // 查找题目内的 class="fl"寻得题目的题号questionId
      // class="clearfix font-cxsecret fontLabel" 为题目内容
      // 题型判断 通过内的class="newZy_TItle"判断 【Short Answer】【Single Choice】 【Multiple Choice】 【True False】
      // 【Short Answer】 为简答题 【Single Choice】 为单选题 【Multiple Choice】 为多选题 【True False】 为判断题
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

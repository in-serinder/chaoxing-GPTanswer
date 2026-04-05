<template>
    <div class="answer-config">
        <h3>答题配置</h3>
        <!-- 答题配置内容 -->
        <div class="config-list">
            <!-- 配置选项 结构为 选项名称 水平切换单选框 -->
            <div class="config-item">
                <div class="config-header">
                    <label class="config-label">答题模式</label>
                </div>
                <div class="config-content">
                    <div class="radio-group">
                        <label class="radio-option" :class="{ 'active': config.answerMode === 'auto' }">
                            <input type="radio" name="answer-mode" value="auto" v-model="config.answerMode">
                            <span class="radio-text">自动</span>
                        </label>
                        <label class="radio-option" :class="{ 'active': config.answerMode === 'manual' }">
                            <input type="radio" name="answer-mode" value="manual" v-model="config.answerMode">
                            <span class="radio-text">手动</span>
                        </label>
                    </div>
                    <p class="config-description">当配置为自动时 进入页面自动答题</p>
                </div>
            </div>

            <!-- 请求方式 整合题目请求/单体请求 -->
            <div class="config-item">
                <div class="config-header">
                    <label class="config-label">请求方式</label>
                </div>
                <div class="config-content">
                    <div class="radio-group">
                        <label class="radio-option" :class="{ 'active': config.requestType === 'integrated' }">
                            <input type="radio" name="request-type" value="integrated" v-model="config.requestType">
                            <span class="radio-text">整合题目请求</span>
                        </label>
                        <label class="radio-option" :class="{ 'active': config.requestType === 'single' }">
                            <input type="radio" name="request-type" value="single" v-model="config.requestType">
                            <span class="radio-text">单体请求</span>
                        </label>
                    </div>
                    <p class="config-description">整合题目请求：将所有题目打包成一个请求，一次发送给模型。</p>
                    <p class="config-description">单体请求：每个题目单独发送给模型，模型会分别回答。</p>
                </div>
            </div>

            <!-- 答题速度 -->
            <div class="config-item">
                <div class="config-header">
                    <label class="config-label">答题间隔</label>
                </div>
                <div class="config-content">
                    <div class="input-group">
                        <input type="number" v-model.number="config.answerInterval" min="0" step="0.1"
                            class="config-input">
                        <span class="input-suffix">S</span>
                    </div>
                    <p class="config-description">答题间隔：每个题目之间的答题时间间隔，单位为秒。</p>
                </div>
            </div>

            <!-- 启用考试答题 -->
            <div class="config-item">
                <div class="config-header">
                    <label class="config-label">启用考试答题</label>
                    <div class="toggle-switch">
                        <input type="checkbox" id="enable-exam" v-model="config.enableExam">
                        <label for="enable-exam" class="toggle-label"></label>
                    </div>
                </div>
            </div>

            <!-- 错误题目进行随机答题 -->
            <div class="config-item">
                <div class="config-header">
                    <label class="config-label">错误题目进行随机答题</label>
                    <div class="toggle-switch">
                        <input type="checkbox" id="random-answer" v-model="config.randomAnswer">
                        <label for="random-answer" class="toggle-label"></label>
                    </div>
                </div>
                <div class="config-content">
                    <p class="config-description">当题目存在问题时，随机选择一个题目进行答题 如果是填空题 AI会随机回复相关内容</p>
                </div>
            </div>

            <!-- 这是个其他选项 将学习通配置为夜间模式 -->
            <div class="config-item">
                <div class="config-header">
                    <label class="config-label">将学习通配置为夜间模式</label>
                    <div class="toggle-switch">
                        <input type="checkbox" id="night-mode" v-model="config.nightMode">
                        <label for="night-mode" class="toggle-label"></label>
                    </div>
                </div>
                <div class="config-content">
                    <p class="config-description">将学习通配置为夜间模式，减少对眼睛的刺激</p>
                </div>
            </div>
        </div>

        <div class="config-actions">
            <button @click="resetConfig" class="reset-btn">重置配置</button>
            <button @click="saveConfig" class="save-btn">保存配置</button>
        </div>

    </div>
</template>

<script setup lang="ts">
import '@/style/answer-config.css'
import { ref } from 'vue'

interface Config {
    answerMode: 'auto' | 'manual';
    requestType: 'integrated' | 'single';
    answerInterval: number;
    enableExam: boolean;
    randomAnswer: boolean;
    nightMode: boolean;
}

const config = ref<Config>({
    answerMode: 'auto',
    requestType: 'integrated',
    answerInterval: 1,
    enableExam: false,
    randomAnswer: false,
    nightMode: false
});

const saveConfig = () => {
    // 保存配置到本地存储
    localStorage.setItem('answerConfig', JSON.stringify(config.value));
    console.log('配置已保存:', config.value);
};

const resetConfig = () => {
    // 重置配置到默认值
    config.value = {
        answerMode: 'auto',
        requestType: 'integrated',
        answerInterval: 1,
        enableExam: false,
        randomAnswer: false,
        nightMode: false
    };
};

// 从本地存储加载配置
const loadConfig = () => {
    const savedConfig = localStorage.getItem('answerConfig');
    if (savedConfig) {
        config.value = JSON.parse(savedConfig);
    }
};

// 初始化加载配置
loadConfig();
</script>
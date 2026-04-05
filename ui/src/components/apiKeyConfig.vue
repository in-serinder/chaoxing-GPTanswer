<template>
    <div class="apikey-config">
        <h3>API Key配置</h3>
        <div class="api-key-list">
            <!-- 多个行每个组件为 标签：输入框（粘贴按钮 粘贴apikey）模型类型下拉框 单选类型的radio 样式为左右滑动按钮  -->
            <div class="api-key-item">
                <div class="api-key-header">
                    <label class="api-key-label">ChatGPT API Key</label>
                    <div class="toggle-switch">
                        <input type="checkbox" id="chatgpt-toggle" v-model="apiKeys.chatgpt.enabled">
                        <label for="chatgpt-toggle" class="toggle-label"></label>
                    </div>
                </div>
                <div class="api-key-content">
                    <div class="input-group">
                        <input type="password" v-model="apiKeys.chatgpt.key" placeholder="请输入API Key"
                            class="api-key-input">
                        <button @click="pasteFromClipboard('chatgpt')" class="paste-btn">粘贴</button>
                    </div>
                    <div class="model-selector">
                        <label>模型类型:</label>
                        <select v-model="apiKeys.chatgpt.model" class="model-select">
                            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                            <option value="gpt-4">GPT-4</option>
                            <option value="gpt-4-turbo">GPT-4 Turbo</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="api-key-item">
                <div class="api-key-header">
                    <label class="api-key-label">OpenAI API Key</label>
                    <div class="toggle-switch">
                        <input type="checkbox" id="openai-toggle" v-model="apiKeys.openai.enabled">
                        <label for="openai-toggle" class="toggle-label"></label>
                    </div>
                </div>
                <div class="api-key-content">
                    <div class="input-group">
                        <input type="password" v-model="apiKeys.openai.key" placeholder="请输入API Key"
                            class="api-key-input">
                        <button @click="pasteFromClipboard('openai')" class="paste-btn">粘贴</button>
                    </div>
                    <div class="model-selector">
                        <label>模型类型:</label>
                        <select v-model="apiKeys.openai.model" class="model-select">
                            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                            <option value="gpt-4">GPT-4</option>
                            <option value="gpt-4-turbo">GPT-4 Turbo</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="api-key-item">
                <div class="api-key-header">
                    <label class="api-key-label">DeepSeek API Key</label>
                    <div class="toggle-switch">
                        <input type="checkbox" id="deepseek-toggle" v-model="apiKeys.deepseek.enabled">
                        <label for="deepseek-toggle" class="toggle-label"></label>
                    </div>
                </div>
                <div class="api-key-content">
                    <div class="input-group">
                        <input type="password" v-model="apiKeys.deepseek.key" placeholder="请输入API Key"
                            class="api-key-input">
                        <button @click="pasteFromClipboard('deepseek')" class="paste-btn">粘贴</button>
                    </div>
                    <div class="model-selector">
                        <label>模型类型:</label>
                        <select v-model="apiKeys.deepseek.model" class="model-select">
                            <option value="deepseek-chat">DeepSeek Chat</option>
                            <option value="deepseek-r1">DeepSeek R1</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
        <button @click="saveConfig" class="save-btn">保存配置</button>
    </div>
</template>

<script setup lang="ts">
import '@/style/apiKey-config.css'
import { ref } from 'vue'

interface APIKeyConfig {
    key: string;
    model: string;
    enabled: boolean;
}

interface APIKeys {
    chatgpt: APIKeyConfig;
    openai: APIKeyConfig;
    deepseek: APIKeyConfig;
}

const apiKeys = ref<APIKeys>({
    chatgpt: {
        key: '',
        model: 'gpt-3.5-turbo',
        enabled: false
    },
    openai: {
        key: '',
        model: 'gpt-3.5-turbo',
        enabled: false
    },
    deepseek: {
        key: '',
        model: 'deepseek-chat',
        enabled: false
    }
});

const pasteFromClipboard = async (type: keyof APIKeys) => {
    try {
        const text = await navigator.clipboard.readText();
        apiKeys.value[type].key = text;
    } catch (err) {
        console.error('无法从剪贴板读取内容:', err);
    }
};

const saveConfig = () => {
    // 保存配置到本地存储
    localStorage.setItem('apiKeys', JSON.stringify(apiKeys.value));
    // 这里可以添加保存成功的提示
    console.log('配置已保存:', apiKeys.value);
};

// 从本地存储加载配置
const loadConfig = () => {
    const savedConfig = localStorage.getItem('apiKeys');
    if (savedConfig) {
        apiKeys.value = JSON.parse(savedConfig);
    }
};

// 初始化加载配置
loadConfig();
</script>
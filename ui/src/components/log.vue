<template>
    <div class="log-container">
        <h3>日志</h3>
        <!-- 背景内容 重复播放 当播放完成时倒放以此循环-->
        <div class="log-background">
            <img src="https://pic1.imgdb.cn/item/69d2735b441d16110111279a.gif" alt="background">
        </div>
        <!-- 日志内容 以ul为容器内部滚动条 以li为一条 每条日志占一格 日志在容器内滚动 -->
        <div class="log-content">
            <ul ref="logList" class="log-list">
                <li v-for="(log, index) in logs" :key="index" :class="`log-item log-${log.level}`">
                    <span class="log-time">{{ log.time }}</span>
                    <span class="log-level">{{ log.level.toUpperCase() }}</span>
                    <span class="log-message">{{ log.message }}</span>
                </li>
            </ul>
        </div>
        <!-- 清空日志 -->
        <div class="log-actions">
            <button @click="clearLogs" class="clear-btn">清空日志</button>
            <button @click="addTestLog" class="test-btn">添加测试日志</button>
        </div>
    </div>
</template>

<script setup lang="ts">
import '@/style/log.css'
import { ref, onMounted, watch } from 'vue'

interface Log {
    time: string;
    level: 'info' | 'success' | 'warning' | 'error';
    message: string;
}

const logs = ref<Log[]>([
    {
        time: new Date().toLocaleTimeString(),
        level: 'info',
        message: '应用启动'
    },
    {
        time: new Date().toLocaleTimeString(),
        level: 'success',
        message: 'API Key配置加载成功'
    },
    {
        time: new Date().toLocaleTimeString(),
        level: 'info',
        message: '准备就绪'
    }
]);

const logList = ref<HTMLElement | null>(null);

// 自动滚动到最新日志
const scrollToBottom = () => {
    if (logList.value) {
        logList.value.scrollTop = logList.value.scrollHeight;
    }
};

// 监听日志变化，自动滚动
watch(logs, () => {
    scrollToBottom();
}, { deep: true });

// 清空日志
const clearLogs = () => {
    logs.value = [];
};

// 添加测试日志
const addTestLog = () => {
    const levels: Array<'info' | 'success' | 'warning' | 'error'> = ['info', 'success', 'warning', 'error'];
    const level = levels[Math.floor(Math.random() * levels.length)];
    logs.value.push({
        time: new Date().toLocaleTimeString(),
        level: level as Log['level'],
        message: `测试日志 - ${level}级别`
    });
};

// 初始化时滚动到底部
onMounted(() => {
    scrollToBottom();
});
</script>
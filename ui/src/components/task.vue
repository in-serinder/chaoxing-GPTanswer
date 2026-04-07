<template>
    <div class="task">
        <h3>任务管理</h3>
        <button @click="startTask" :disabled="isTaskRunning" class="primary-btn">
            {{ isTaskRunning ? '任务进行中...' : '一键答题' }}
        </button>
        <!-- 细分任务 -->
        <ul class="sub-task-list">
            <li @click="runSubTask('获取题目列表')" :class="{ 'running': currentTask === '获取题目列表' }">
                <span class="task-name">获取题目列表</span>
                <span class="task-status" :class="taskStatus['获取题目列表']">{{ taskStatus['获取题目列表'] }}</span>
            </li>
            <li @click="runSubTask('导出答题结果')" :class="{ 'running': currentTask === '导出答题结果' }">
                <span class="task-name">导出答题结果</span>
                <span class="task-status" :class="taskStatus['导出答题结果']">{{ taskStatus['导出答题结果'] }}</span>
            </li>
        </ul>
        <!-- 任务状态 -->
        <div class="task-status-container">
            <p class="task-status-title">任务状态：</p>
            <p class="task-status-value" :class="overallStatus">{{ overallStatus }}</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import '@/style/task.css'
import { ref, computed } from 'vue'
import { useQuestionsStore } from '@/stores/questions'
import { usePagesStore } from '@/stores/pages'

const questionsStore = useQuestionsStore()
const pagesStore = usePagesStore()

const isTaskRunning = ref(false)
const currentTask = ref('')
const taskStatus = ref({
    '获取题目列表': '未开始',
    '导出答题结果': '未开始'
})

const overallStatus = computed(() => {
    if (isTaskRunning.value) return '进行中'
    const allCompleted = Object.values(taskStatus.value).every(status => status === '已完成')
    if (allCompleted) return '已完成'
    const anyRunning = Object.values(taskStatus.value).some(status => status === '进行中')
    if (anyRunning) return '进行中'
    return '未开始'
})

const startTask = () => {
    isTaskRunning.value = true
    // 模拟任务执行
    setTimeout(() => {
        taskStatus.value['获取题目列表'] = '已完成'
        setTimeout(() => {
            taskStatus.value['导出答题结果'] = '已完成'
            isTaskRunning.value = false
        }, 1500)
    }, 1500)
}

const runSubTask = (taskName: string) => {
    if (isTaskRunning.value) return

    currentTask.value = taskName
    taskStatus.value[taskName as keyof typeof taskStatus.value] = '进行中'

    if (taskName === '获取题目列表') {
        console.info("开始获取题目列表")
        questionsStore.fetchQuestions()
        console.info("题目列表:", questionsStore.combineQuestions())
    }

    // 模拟子任务执行
    setTimeout(() => {
        taskStatus.value[taskName as keyof typeof taskStatus.value] = '已完成'
        currentTask.value = ''
    }, 1000)
}
</script>
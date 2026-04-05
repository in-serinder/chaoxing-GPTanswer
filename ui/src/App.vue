<template>
  <!-- 主容器 高度缩放内容 -->
  <div class="container" :class="{ 'minimized': isMinimized }">
    <div class="title" @click="toggleMinimize">
      <!-- <img src="https://pic1.imgdb.cn/item/69d24da0441d16110110747f.png" alt="titleIcon" class="title-icon"> -->
      <h2>学习通GPT答题</h2>
      <img :src="zoom" alt="zoom" class="zoom-icon" :class="{ 'rotated': isMinimized }">
    </div>
    <div class="content" :class="{ 'hidden': isMinimized }">
      <!-- 标签页nav -->
      <div class="tab-nav">
        <button class="tab-btn" id="task-btn" @click="switchTab('task')">任务</button>
        <button class="tab-btn active" id="api-key-config-btn" @click="switchTab('api-key-config')">APIkey配置</button>
        <button class="tab-btn" id="answer-config-btn" @click="switchTab('answer-config')">答题配置</button>
        <button class="tab-btn" id="log-btn" @click="switchTab('log')">日志</button>
      </div>
      <div class="tab-content">
        <!-- 任务 -->
        <div class="tab-pane " id="task-pane">
          <Task />
        </div>
        <!-- APIkey配置 -->
        <div class="tab-pane active" id="api-key-config-pane">
          <ApiKeyConfig />
        </div>
        <!-- 答题配置 -->
        <div class="tab-pane" id="answer-config-pane">
          <AnswerConfig />
        </div>
        <!-- 日志 -->
        <div class="tab-pane" id="log-pane">
          <Log />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import '@/main.css'
import { ref } from 'vue'
import zoom from '@/svg/zoom.svg'
import Task from '@/components/task.vue'
import ApiKeyConfig from '@/components/apiKeyConfig.vue'
import AnswerConfig from '@/components/answerConfig.vue'
import Log from '@/components/log.vue'


const isMinimized = ref(false)

const toggleMinimize = () => {
  isMinimized.value = !isMinimized.value
}

const switchTab = (tab: string) => {

  const tabPanes = document.querySelectorAll('.tab-pane')
  const tabBtns = document.querySelectorAll('.tab-nav button')
  // 标签页内容同步切换
  tabPanes.forEach((pane) => {
    pane.classList.remove('active')
  })
  const activePane = document.getElementById(`${tab}-pane`)
  if (activePane) {
    activePane.classList.add('active')
  }
  // 按钮样式同步切换
  tabBtns.forEach((btn) => {
    btn.classList.remove('active')
  })
  const activeBtn = document.getElementById(`${tab}-btn`)
  if (activeBtn) {
    activeBtn.classList.add('active')
  }

}

</script>
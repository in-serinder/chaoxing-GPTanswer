// ==UserScript==
// @name         chaoxing-GPTanswer
// @namespace    http://tampermonkey.net/
// @version      2026-04-05
// @description  学习通GPT答题 解决课程作业或章节题目无法在题库查找的情况 支持deepseek openai以及其他
// @author       Serinder
// @match        https://i.chaoxing.com/base?t=1775388045655
// @icon         https://www.google.com/s2/favicons?sz=64&domain=chaoxing.com
// @require      https://github.com/in-serinder/chaoxing-GPTanswer/raw/refs/heads/main/ui/dist/assets/index-HRZLvoqe.js
// @require      https://github.com/in-serinder/chaoxing-GPTanswer/raw/refs/heads/main/ui/dist/assets/index-CfsITAHE.css
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 引入样式
    document.head.appendChild(document.createElement('style')).textContent = `
        ${require('./index-CfsITAHE.css')}
    `;

  const div = document.createElement('div');
    div.id = 'app';
    document.body.appendChild(div);

    // if (window.MyApp && typeof window.MyApp.mount === 'function') {
    //     window.MyApp.mount(mountPoint);
    // } else if (window.MyApp && typeof window.MyApp.default?.mount === 'function') {
    //     window.MyApp.default.mount(mountPoint);
    // } else {
    //     console.error('Vue 应用未正确导出 mount 函数');
    // }

    // Your code here...
})();
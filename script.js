// ==UserScript==
// @name         动态加载资源示例
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  动态加载外部资源
// @author       You
// @match        https://*.chaoxing.com/*
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // 动态添加 CSS
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'https://cdn.jsdelivr.net/gh/in-serinder/chaoxing-GPTanswer@main/ui/dist/ui.css';
    document.head.appendChild(cssLink);

    // 动态添加 JavaScript
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/gh/in-serinder/chaoxing-GPTanswer@main/mount-test/index.js';
    script.onload = function () {
        console.log('脚本加载完成');
        // 执行挂载操作
        if (unsafeWindow.ChaoxingGPT) {
            const mountPoint = document.createElement('div');
            mountPoint.id = 'chaoxing-gpt-app';
            document.body.appendChild(mountPoint);
            unsafeWindow.ChaoxingGPT.mount(mountPoint);
        }
    };
    document.head.appendChild(script);
})();
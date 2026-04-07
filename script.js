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

    const MOUNTPOINT_CSS = 'https://cdn.jsdelivr.net/gh/in-serinder/chaoxing-GPTanswer@main/ext-style/mount-point.css';
    const UI_CSS = 'https://cdn.jsdelivr.net/gh/in-serinder/chaoxing-GPTanswer@main/ui/dist/ui.css';

    const INDEX_JS = 'https://cdn.jsdelivr.net/gh/in-serinder/chaoxing-GPTanswer@main/mount-test/index.js';

    function loadcss(url) {
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = url;
        document.head.appendChild(cssLink);
    }


    function loadjs(url) {
        const script = document.createElement('script');
        script.src = url;
        script.onload = function () {
            console.log('脚本加载完成');
            if (unsafeWindow.ChaoxingGPT) {
                const mountPoint = document.createElement('div');
                mountPoint.id = 'chaoxing-gpt-app';
                document.body.appendChild(mountPoint);
                unsafeWindow.ChaoxingGPT.mount(mountPoint);
            }
        };
        document.head.appendChild(script);
    }

    loadcss(MOUNTPOINT_CSS);
    loadcss(UI_CSS);
    loadjs(INDEX_JS);

})();
// ==UserScript==
// @name         chaoxing-GPTanswer
// @namespace    http://tampermonkey.net/
// @version      2026-04-05
// @description  学习通GPT答题
// @author       Serinder
// @match        https://mooc1.chaoxing.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=chaoxing.com
// @require      https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.prod.js
// @require      https://cdn.jsdelivr.net/npm/vue-demi@0.14.6/lib/index.iife.min.js
// @require      https://cdn.jsdelivr.net/npm/pinia@2/dist/pinia.iife.prod.js
// @require      https://cdn.jsdelivr.net/gh/in-serinder/chaoxing-GPTanswer@main/ui/dist/index.js
// @resource     appCss https://cdn.jsdelivr.net/gh/in-serinder/chaoxing-GPTanswer@main/ui/dist/index.css
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';
    console.log('Vue:', typeof Vue);
console.log('VueDemi:', typeof VueDemi);
console.log('Pinia:', typeof Pinia);

    const css = GM_getResourceText('appCss');
    if (css) GM_addStyle(css);

    const mountPoint = document.createElement('div');
    mountPoint.id = 'chaoxing-gpt-root';
    document.body.appendChild(mountPoint);

    const timer = setInterval(() => {
        if (window.ChaoxingGPT && typeof window.ChaoxingGPT.mount === 'function') {
            clearInterval(timer);
            window.ChaoxingGPT.mount(mountPoint);
        }
    }, 100);
    setTimeout(() => clearInterval(timer), 10000);
})();
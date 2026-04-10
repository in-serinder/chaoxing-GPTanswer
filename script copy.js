// ==UserScript==
// @name         学习通GPT答题
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  自动加载并挂载 ChaoxingGPT 应用
// @author       You
// @match        https://*.chaoxing.com/*
// @require      https://cdn.staticfile.org/blueimp-md5/2.19.0/js/md5.min.js
// @resource     ttf           https://www.forestpolice.org/ttf/2.0/table.json
// @grant        GM_getResourceText
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // 防重复执行标记
    if (window._chaoxingGPTLoaded) return;
    window._chaoxingGPTLoaded = true;

    // 确保只在主页面执行，不在 iframe 中执行
    if (window.self !== window.top) return;

    const UI_CSS = 'https://cdn.jsdelivr.net/gh/in-serinder/chaoxing-GPTanswer@4eeea35/ui/dist/ui.css';
    const INDEX_JS = 'https://cdn.jsdelivr.net/gh/in-serinder/chaoxing-GPTanswer@90ae72a/ui/dist/index.js';

    // 动态加载 CSS
    function loadcss(url) {
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = url;
        document.head.appendChild(cssLink);
    }

    // 动态加载 JavaScript
    function loadjs(url) {
        const script = document.createElement('script');
        script.src = url;
        script.onload = function () {
            console.log('脚本加载完成');
            if (unsafeWindow.ChaoxingGPT) {
                // 检查是否已经存在挂载点
                let mountPoint = document.getElementById('chaoxing-gpt-app');
                if (!mountPoint) {
                    mountPoint = document.createElement('div');
                    mountPoint.id = 'chaoxing-gpt-app';
                    // 确保挂载到 body 元素
                    document.body.appendChild(mountPoint);
                    console.log('创建新的挂载点');
                } else {
                    console.log('挂载点已存在，使用现有挂载点');
                }
                // 挂载应用
                unsafeWindow.ChaoxingGPT.mount(mountPoint);
                console.log('ChaoxingGPT 应用挂载成功');
            }
        };
        script.onerror = function () {
            console.error('脚本加载失败');
        };
        document.head.appendChild(script);
    }

    // 字体解密函数
    function decodeFont(iframeWindow) {
        const styleElements = iframeWindow.document.querySelectorAll("style");
        let tipElement = null;

        // 1. 查找包含字体加密信息的 style 标签
        styleElements.forEach((styleElement) => {
            if (styleElement.textContent && styleElement.textContent.indexOf("font-cxsecret") !== -1) {
                tipElement = styleElement;
            }
        });

        if (!tipElement) return;

        // 2. 从 style 中提取字体文件的 Base64 数据
        const fontMatch = tipElement.textContent.match(/base64,([\w\W]+?)'/);
        if (!fontMatch) return;

        // 3. 将 Base64 解码为二进制数组
        const fontData = (base64) => {
            const decodedData = atob(base64);
            const array = new Uint8Array(decodedData.length);
            for (let i = 0; i < decodedData.length; i++) {
                array[i] = decodedData.charCodeAt(i);
            }
            return array;
        }(fontMatch[1]);

        // 4. 加载 Typr 库
        function loadTypr() {
            return new Promise((resolve) => {
                if (window.Typr) {
                    resolve(window.Typr);
                    return;
                }

                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/typr@0.2.3/build/typr.min.js';
                script.onload = () => {
                    resolve(window.Typr);
                };
                document.head.appendChild(script);
            });
        }

        // 5. 加载 md5 库
        function loadMd5() {
            return new Promise((resolve) => {
                if (window.md5) {
                    resolve(window.md5);
                    return;
                }

                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/md5@2.3.0/md5.min.js';
                script.onload = () => {
                    resolve(window.md5);
                };
                document.head.appendChild(script);
            });
        }

        // 6. 执行解密
        async function decrypt() {
            try {
                const Typr = await loadTypr();
                const md5 = await loadMd5();

                // 7. 使用 Typr 库解析字体文件
                const font = Typr.parse(fontData);

                // 8. 获取预置的字符映射表
                const table = JSON.parse(GM_getResourceText("ttf"));

                let text = {};
                // 9. 遍历常用 Unicode 汉字区间，计算每个字符的字形指纹
                for (let i = 19968; i < 40870; i++) {
                    let t = Typr.U.codeToGlyph(font, i);
                    if (t) {
                        t = Typr.U.glyphToPath(font, t);
                        t = md5(JSON.stringify(t)).slice(24); // 取 MD5 的后 24 位作为指纹
                        text[i] = table[t];
                    }
                }

                // 10. 替换页面中所有加密元素内的乱码字符
                iframeWindow.document.querySelectorAll(".font-cxsecret").forEach((fontElement) => {
                    let html = fontElement.innerHTML;
                    Object.keys(text).forEach((key) => {
                        const regex = new RegExp(String.fromCharCode(key), "g");
                        html = html.replace(regex, String.fromCharCode(text[key]));
                    });
                    fontElement.innerHTML = html;
                    fontElement.classList.remove("font-cxsecret");
                });

                console.log('字体解密完成');
            } catch (error) {
                console.error('字体解密失败:', error);
            }
        }

        decrypt();

    }



    /**----------------------------------------------------------------------------- */

    console.log('开始字体解密...');
    decodeFont(window);

    // 执行加载
    setTimeout(() => {
        loadcss(UI_CSS);
        loadjs(INDEX_JS);
    }, 1000);
})();
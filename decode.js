// 学习通字符解码脚本
// 参考 ref_script.js 中的解码功能

// 引入必要的库
// 注意：在实际使用中，需要确保这些库已经加载
// - Typr：用于解析字体文件
// - md5：用于生成字体路径的哈希值

/**
 * 解码学习通加密字符
 * @param {Window} iframeWindow - iframe 窗口对象
 */
function decode(iframeWindow) {
    // 查找包含 font-cxsecret 样式的元素
    const styleElements = iframeWindow.document.querySelectorAll("style");
    let tipElement = null;

    styleElements.forEach((styleElement) => {
        if (styleElement.textContent && styleElement.textContent.indexOf("font-cxsecret") !== -1) {
            tipElement = styleElement;
        }
    });

    if (!tipElement) {
        console.log("未找到加密字体样式");
        return;
    }

    // 提取 base64 编码的字体数据
    const fontMatch = tipElement.textContent.match(/base64,([\w\W]+?)'/);
    if (!fontMatch) {
        console.log("未找到字体数据");
        return;
    }

    // 解码字体数据
    const fontData = (base64) => {
        const decodedData = atob(base64);
        const array = new Uint8Array(decodedData.length);
        for (let i = 0; i < decodedData.length; i++) {
            array[i] = decodedData.charCodeAt(i);
        }
        return array;
    }(fontMatch[1]);

    // 解析字体
    const font = Typr.parse(fontData);

    // 加载映射表（这里需要确保 ttf 资源已经加载）
    // 注意：在实际使用中，可能需要调整获取 ttf 资源的方式
    const table = JSON.parse(GM_getResourceText("ttf"));

    // 构建字符映射
    let text = {};
    for (let i = 19968; i < 40870; i++) {
        let t = Typr.U.codeToGlyph(font, i);
        if (t) {
            t = Typr.U.glyphToPath(font, t);
            t = md5(JSON.stringify(t)).slice(24);
            text[i] = table[t];
        }
    }

    // 替换加密字符
    iframeWindow.document.querySelectorAll(".font-cxsecret").forEach((fontElement) => {
        let html = fontElement.innerHTML;
        Object.keys(text).forEach((key) => {
            const regex = new RegExp(String.fromCharCode(key), "g");
            html = html.replace(regex, String.fromCharCode(text[key]));
        });
        fontElement.innerHTML = html;
        fontElement.classList.remove("font-cxsecret");
    });

    console.log("字符解码完成");
}

/**
 * 复写内容到指定元素
 * @param {string} answer - 答案内容
 * @param {Object} questionData - 问题数据
 * @param {HTMLElement} html - 问题元素
 * @param {Window} iframeWindow - iframe 窗口对象
 * @returns {boolean|string} - 复写是否成功
 */
function fillAnswer(answer, questionData, html, iframeWindow) {
    // 过滤空答案
    answer = answer.filter((item) => item.answer.length > 0);
    console.log("获取到的答案:", answer);

    for (let i = 0; i < answer.length; i++) {
        if (typeof answer[i].answer === "string") {
            // 跳过无效答案
            if (answer[i].answer.indexOf("付费题库") !== -1 ||
                answer[i].answer.indexOf("暂无答案") !== -1 ||
                answer[i].answer === "略") {
                continue;
            }
            answer[i].answer = [answer[i].answer];
        }

        let tmp = setAnswer(answer[i].answer, questionData, html, iframeWindow);
        if (tmp) {
            return tmp;
        }
    }
    return false;
}

/**
 * 设置答案到对应元素
 * @param {Array} answer - 答案数组
 * @param {Object} questionData - 问题数据
 * @param {HTMLElement} html - 问题元素
 * @param {Window} iframeWindow - iframe 窗口对象
 * @returns {boolean|string} - 设置是否成功
 */
function setAnswer(answer, questionData, html, iframeWindow) {
    switch (questionData.type) {
        case "0": // 单选题
        case "1": // 多选题
            const matchArr = matchAnswer(answer, questionData.options);
            if (matchArr.length > 0) {
                clearCurrent(html, iframeWindow);
                for (let i = 0; i < matchArr.length; i++) {
                    // 点击对应的选项
                    $(html).find("ul:eq(0) li :radio,:checkbox,textarea").eq(matchArr[i]).click();
                    $(html).find(".answerBg").eq(matchArr[i]).click();
                    $(html).find("li").eq(matchArr[i]).click();
                }
                return answer;
            }
            break;
        case "3": // 判断题
            clearCurrent(html, iframeWindow);
            if (Array.isArray(answer)) {
                answer = answer[0];
            }
            $(html).find("ul:eq(0) li :radio,:checkbox,textarea").each(function () {
                if ($(this).val() === "true") {
                    if (answer.match(/(^|,)(True|true|正确|是|对|√|T|ri)(,|$)/)) {
                        $(this).click();
                    }
                } else {
                    if (answer.match(/(^|,)(False|false|错误|否|错|×|F|wr)(,|$)/)) {
                        $(this).click();
                    }
                }
            });
            $(html).find(".answerBg").each(function () {
                if ($(this).find(".num_option").attr("data") === "true") {
                    if (answer.match(/(^|,)(True|true|正确|是|对|√|T|ri)(,|$)/)) {
                        $(this).click();
                    }
                } else {
                    if (answer.match(/(^|,)(False|false|错误|否|错|×|F|wr)(,|$)/)) {
                        $(this).click();
                    }
                }
            });
            if ($(html).find("ul:eq(0) li :radio,:checkbox,textarea").is(":checked") ||
                $(html).find(".check_answer").length > 0 ||
                $(html).find(".check_answer_dx").length > 0) {
                return answer;
            }
            break;
        case "2": // 填空题
        case "9": // 其他类型
        case "4": // 简答题
        case "5": // 名词解释
        case "6": // 论述题
        case "7": // 计算题
            if ($(html).find("textarea").length === answer.length) {
                clearCurrent(html, iframeWindow);
                $(html).find("textarea").each(function (index) {
                    $(this).val(answer[index]);
                });
                return answer;
            }
            break;
    }
    return false;
}

/**
 * 匹配答案与选项
 * @param {Array} answer - 答案数组
 * @param {Array} options - 选项数组
 * @returns {Array} - 匹配的选项索引
 */
function matchAnswer(answer, options) {
    const matchArr = [];
    answer.forEach((ans) => {
        options.forEach((option, index) => {
            if (ans && option && ans.trim() === option.trim()) {
                matchArr.push(index);
            }
        });
    });
    return matchArr;
}

/**
 * 清除当前选中的答案
 * @param {HTMLElement} html - 问题元素
 * @param {Window} iframeWindow - iframe 窗口对象
 */
function clearCurrent(html, iframeWindow) {
    $(html).find("ul:eq(0) li :radio,:checkbox").prop("checked", false);
    $(html).find(".answerBg").removeClass("checked");
}

// 导出函数
if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        decode,
        fillAnswer,
        setAnswer,
        matchAnswer,
        clearCurrent
    };
}
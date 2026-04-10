// ==UserScript==
// @name         学习通GPT答题（含字体解密）
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  自动加载 ChaoxingGPT 应用，内置字体反爬解密（基于 Typr + md5）
// @author       You
// @match        https://*.chaoxing.com/*
// @resource     ttf  https://www.forestpolice.org/ttf/2.0/table.json
// @require      https://cdn.jsdelivr.net/npm/blueimp-md5@2.19.0/js/md5.min.js
// @grant        GM_getResourceText
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    if (window._chaoxingGPTLoaded) return;
    window._chaoxingGPTLoaded = true;
    if (window.self !== window.top) return;

    // ---------- 配置 ----------
    const UI_CSS = 'https://cdn.jsdelivr.net/gh/in-serinder/chaoxing-GPTanswer@c8b5139/ui/dist/ui.css';
    const INDEX_JS = 'https://cdn.jsdelivr.net/gh/in-serinder/chaoxing-GPTanswer@90ae72a/ui/dist/index.js';
    // 使用更稳定的 CDN 源（jsdelivr 或备用）
    const TYPR_JS = 'https://cdn.jsdelivr.net/npm/typr@0.2.3/build/typr.min.js';
    const MD5_JS = 'https://cdn.jsdelivr.net/npm/blueimp-md5@2.19.0/js/md5.min.js';

    // ---------- 辅助函数 ----------
    function loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load ${url}`));
            document.head.appendChild(script);
        });
    }

    function loadCss(url) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        document.head.appendChild(link);
    }

    function waitForGlobal(name, timeout = 10000) {
        return new Promise((resolve, reject) => {
            if (window[name]) return resolve(window[name]);
            const start = Date.now();
            const interval = setInterval(() => {
                if (window[name]) {
                    clearInterval(interval);
                    resolve(window[name]);
                } else if (Date.now() - start > timeout) {
                    clearInterval(interval);
                    reject(new Error(`Timeout waiting for ${name}`));
                }
            }, 100);
        });
    }

    var Typr = {
        parse: function (buff) {
            var bin = Typr._bin,
                data = new Uint8Array(buff),
                offset = 0;
            bin.readFixed(data, offset), offset += 4;
            var numTables = bin.readUshort(data, offset);
            offset += 2, bin.readUshort(data, offset), offset += 2, bin.readUshort(data, offset), offset += 2, bin.readUshort(data, offset), offset += 2;
            for (var tags = ["cmap", "head", "hhea", "maxp", "hmtx", "name", "OS/2", "post", "loca", "glyf", "kern", "CFF ", "GPOS", "GSUB", "SVG "], obj = {
                    _data: data
                }, tabs = {}, i = 0; i < numTables; i++) {
                var tag = bin.readASCII(data, offset, 4);
                offset += 4, bin.readUint(data, offset), offset += 4;
                var toffset = bin.readUint(data, offset);
                offset += 4;
                var length = bin.readUint(data, offset);
                offset += 4, tabs[tag] = {
                    offset: toffset,
                    length
                };
            }
            for (i = 0; i < tags.length; i++) {
                var t = tags[i];
                tabs[t] && (obj[t.trim()] = Typr[t.trim()].parse(data, tabs[t].offset, tabs[t].length, obj));
            }
            return obj;
        },
        _tabOffset: function (data, tab) {
            for (var bin = Typr._bin, numTables = bin.readUshort(data, 4), offset = 12, i = 0; i < numTables; i++) {
                var tag = bin.readASCII(data, offset, 4);
                offset += 4, bin.readUint(data, offset), offset += 4;
                var toffset = bin.readUint(data, offset);
                if (offset += 4, bin.readUint(data, offset), offset += 4, tag == tab)
                    return toffset;
            }
            return 0;
        }
    };
    Typr._bin = {
        readFixed: function (data, o) {
            return (data[o] << 8 | data[o + 1]) + (data[o + 2] << 8 | data[o + 3]) / 65540;
        },
        readF2dot14: function (data, o) {
            return Typr._bin.readShort(data, o) / 16384;
        },
        readInt: function (buff, p) {
            var a = Typr._bin.t.uint8;
            return a[0] = buff[p + 3], a[1] = buff[p + 2], a[2] = buff[p + 1], a[3] = buff[p], Typr._bin.t.int32[0];
        },
        readInt8: function (buff, p) {
            return Typr._bin.t.uint8[0] = buff[p], Typr._bin.t.int8[0];
        },
        readShort: function (buff, p) {
            var a = Typr._bin.t.uint8;
            return a[1] = buff[p], a[0] = buff[p + 1], Typr._bin.t.int16[0];
        },
        readUshort: function (buff, p) {
            return buff[p] << 8 | buff[p + 1];
        },
        readUshorts: function (buff, p, len) {
            for (var arr = [], i = 0; i < len; i++)
                arr.push(Typr._bin.readUshort(buff, p + 2 * i));
            return arr;
        },
        readUint: function (buff, p) {
            var a = Typr._bin.t.uint8;
            return a[3] = buff[p], a[2] = buff[p + 1], a[1] = buff[p + 2], a[0] = buff[p + 3], Typr._bin.t.uint32[0];
        },
        readUint64: function (buff, p) {
            return 4294967296 * Typr._bin.readUint(buff, p) + Typr._bin.readUint(buff, p + 4);
        },
        readASCII: function (buff, p, l) {
            for (var s = "", i = 0; i < l; i++)
                s += String.fromCharCode(buff[p + i]);
            return s;
        },
        readUnicode: function (buff, p, l) {
            for (var s = "", i = 0; i < l; i++) {
                var c = buff[p++] << 8 | buff[p++];
                s += String.fromCharCode(c);
            }
            return s;
        },
        _tdec: window.TextDecoder ? new window.TextDecoder() : null,
        readUTF8: function (buff, p, l) {
            var tdec = Typr._bin._tdec;
            return tdec && 0 == p && l == buff.length ? tdec.decode(buff) : Typr._bin.readASCII(buff, p, l);
        },
        readBytes: function (buff, p, l) {
            for (var arr = [], i = 0; i < l; i++)
                arr.push(buff[p + i]);
            return arr;
        },
        readASCIIArray: function (buff, p, l) {
            for (var s = [], i = 0; i < l; i++)
                s.push(String.fromCharCode(buff[p + i]));
            return s;
        }
    }, Typr._bin.t = {
        buff: new ArrayBuffer(8)
    }, Typr._bin.t.int8 = new Int8Array(Typr._bin.t.buff), Typr._bin.t.uint8 = new Uint8Array(Typr._bin.t.buff), Typr._bin.t.int16 = new Int16Array(Typr._bin.t.buff), Typr._bin.t.uint16 = new Uint16Array(Typr._bin.t.buff), Typr._bin.t.int32 = new Int32Array(Typr._bin.t.buff), Typr._bin.t.uint32 = new Uint32Array(Typr._bin.t.buff), Typr._lctf = {}, Typr._lctf.parse = function (data, offset, length, font, subt) {
        var bin = Typr._bin,
            obj = {},
            offset0 = offset;
        bin.readFixed(data, offset), offset += 4;
        var offScriptList = bin.readUshort(data, offset);
        offset += 2;
        var offFeatureList = bin.readUshort(data, offset);
        offset += 2;
        var offLookupList = bin.readUshort(data, offset);
        return offset += 2, obj.scriptList = Typr._lctf.readScriptList(data, offset0 + offScriptList), obj.featureList = Typr._lctf.readFeatureList(data, offset0 + offFeatureList), obj.lookupList = Typr._lctf.readLookupList(data, offset0 + offLookupList, subt), obj;
    }, Typr._lctf.readLookupList = function (data, offset, subt) {
        var bin = Typr._bin,
            offset0 = offset,
            obj = [],
            count = bin.readUshort(data, offset);
        offset += 2;
        for (var i = 0; i < count; i++) {
            var noff = bin.readUshort(data, offset);
            offset += 2;
            var lut = Typr._lctf.readLookupTable(data, offset0 + noff, subt);
            obj.push(lut);
        }
        return obj;
    }, Typr._lctf.readLookupTable = function (data, offset, subt) {
        var bin = Typr._bin,
            offset0 = offset,
            obj = {
                tabs: []
            };
        obj.ltype = bin.readUshort(data, offset), offset += 2, obj.flag = bin.readUshort(data, offset), offset += 2;
        var cnt = bin.readUshort(data, offset);
        offset += 2;
        for (var i = 0; i < cnt; i++) {
            var noff = bin.readUshort(data, offset);
            offset += 2;
            var tab = subt(data, obj.ltype, offset0 + noff);
            obj.tabs.push(tab);
        }
        return obj;
    }, Typr._lctf.numOfOnes = function (n) {
        for (var num = 0, i = 0; i < 32; i++)
            0 != (n >>> i & 1) && num++;
        return num;
    }, Typr._lctf.readClassDef = function (data, offset) {
        var bin = Typr._bin,
            obj = [],
            format = bin.readUshort(data, offset);
        if (offset += 2, 1 == format) {
            var startGlyph = bin.readUshort(data, offset);
            offset += 2;
            var glyphCount = bin.readUshort(data, offset);
            offset += 2;
            for (var i = 0; i < glyphCount; i++)
                obj.push(startGlyph + i), obj.push(startGlyph + i), obj.push(bin.readUshort(data, offset)), offset += 2;
        }
        if (2 == format) {
            var count = bin.readUshort(data, offset);
            offset += 2;
            for (i = 0; i < count; i++)
                obj.push(bin.readUshort(data, offset)), offset += 2, obj.push(bin.readUshort(data, offset)), offset += 2, obj.push(bin.readUshort(data, offset)), offset += 2;
        }
        return obj;
    }, Typr._lctf.getInterval = function (tab, val) {
        for (var i = 0; i < tab.length; i += 3) {
            var start = tab[i],
                end = tab[i + 1];
            if (tab[i + 2], start <= val && val <= end)
                return i;
        }
        return -1;
    }, Typr._lctf.readValueRecord = function (data, offset, valFmt) {
        var bin = Typr._bin,
            arr = [];
        return arr.push(1 & valFmt ? bin.readShort(data, offset) : 0), offset += 1 & valFmt ? 2 : 0, arr.push(2 & valFmt ? bin.readShort(data, offset) : 0), offset += 2 & valFmt ? 2 : 0, arr.push(4 & valFmt ? bin.readShort(data, offset) : 0), offset += 4 & valFmt ? 2 : 0, arr.push(8 & valFmt ? bin.readShort(data, offset) : 0), offset += 8 & valFmt ? 2 : 0, arr;
    }, Typr._lctf.readCoverage = function (data, offset) {
        var bin = Typr._bin,
            cvg = {};
        cvg.fmt = bin.readUshort(data, offset), offset += 2;
        var count = bin.readUshort(data, offset);
        return offset += 2, 1 == cvg.fmt && (cvg.tab = bin.readUshorts(data, offset, count)), 2 == cvg.fmt && (cvg.tab = bin.readUshorts(data, offset, 3 * count)), cvg;
    }, Typr._lctf.coverageIndex = function (cvg, val) {
        var tab = cvg.tab;
        if (1 == cvg.fmt)
            return tab.indexOf(val);
        if (2 == cvg.fmt) {
            var ind = Typr._lctf.getInterval(tab, val);
            if (-1 != ind)
                return tab[ind + 2] + (val - tab[ind]);
        }
        return -1;
    }, Typr._lctf.readFeatureList = function (data, offset) {
        var bin = Typr._bin,
            offset0 = offset,
            obj = [],
            count = bin.readUshort(data, offset);
        offset += 2;
        for (var i = 0; i < count; i++) {
            var tag = bin.readASCII(data, offset, 4);
            offset += 4;
            var noff = bin.readUshort(data, offset);
            offset += 2, obj.push({
                tag: tag.trim(),
                tab: Typr._lctf.readFeatureTable(data, offset0 + noff)
            });
        }
        return obj;
    }, Typr._lctf.readFeatureTable = function (data, offset) {
        var bin = Typr._bin;
        bin.readUshort(data, offset), offset += 2;
        var lookupCount = bin.readUshort(data, offset);
        offset += 2;
        for (var indices = [], i = 0; i < lookupCount; i++)
            indices.push(bin.readUshort(data, offset + 2 * i));
        return indices;
    }, Typr._lctf.readScriptList = function (data, offset) {
        var bin = Typr._bin,
            offset0 = offset,
            obj = {},
            count = bin.readUshort(data, offset);
        offset += 2;
        for (var i = 0; i < count; i++) {
            var tag = bin.readASCII(data, offset, 4);
            offset += 4;
            var noff = bin.readUshort(data, offset);
            offset += 2, obj[tag.trim()] = Typr._lctf.readScriptTable(data, offset0 + noff);
        }
        return obj;
    }, Typr._lctf.readScriptTable = function (data, offset) {
        var bin = Typr._bin,
            offset0 = offset,
            obj = {},
            defLangSysOff = bin.readUshort(data, offset);
        offset += 2, obj.default = Typr._lctf.readLangSysTable(data, offset0 + defLangSysOff);
        var langSysCount = bin.readUshort(data, offset);
        offset += 2;
        for (var i = 0; i < langSysCount; i++) {
            var tag = bin.readASCII(data, offset, 4);
            offset += 4;
            var langSysOff = bin.readUshort(data, offset);
            offset += 2, obj[tag.trim()] = Typr._lctf.readLangSysTable(data, offset0 + langSysOff);
        }
        return obj;
    }, Typr._lctf.readLangSysTable = function (data, offset) {
        var bin = Typr._bin,
            obj = {};
        bin.readUshort(data, offset), offset += 2, obj.reqFeature = bin.readUshort(data, offset), offset += 2;
        var featureCount = bin.readUshort(data, offset);
        return offset += 2, obj.features = bin.readUshorts(data, offset, featureCount), obj;
    }, Typr.CFF = {}, Typr.CFF.parse = function (data, offset, length) {
        var bin = Typr._bin;
        (data = new Uint8Array(data.buffer, offset, length))[offset = 0], data[++offset], data[++offset], data[++offset], offset++;
        var ninds = [];
        offset = Typr.CFF.readIndex(data, offset, ninds);
        for (var names = [], i = 0; i < ninds.length - 1; i++)
            names.push(bin.readASCII(data, offset + ninds[i], ninds[i + 1] - ninds[i]));
        offset += ninds[ninds.length - 1];
        var tdinds = [];
        offset = Typr.CFF.readIndex(data, offset, tdinds);
        var topDicts = [];
        for (i = 0; i < tdinds.length - 1; i++)
            topDicts.push(Typr.CFF.readDict(data, offset + tdinds[i], offset + tdinds[i + 1]));
        offset += tdinds[tdinds.length - 1];
        var topdict = topDicts[0],
            sinds = [];
        offset = Typr.CFF.readIndex(data, offset, sinds);
        var strings = [];
        for (i = 0; i < sinds.length - 1; i++)
            strings.push(bin.readASCII(data, offset + sinds[i], sinds[i + 1] - sinds[i]));
        if (offset += sinds[sinds.length - 1], Typr.CFF.readSubrs(data, offset, topdict), topdict.CharStrings) {
            offset = topdict.CharStrings;
            sinds = [];
            offset = Typr.CFF.readIndex(data, offset, sinds);
            var cstr = [];
            for (i = 0; i < sinds.length - 1; i++)
                cstr.push(bin.readBytes(data, offset + sinds[i], sinds[i + 1] - sinds[i]));
            topdict.CharStrings = cstr;
        }
        topdict.Encoding && (topdict.Encoding = Typr.CFF.readEncoding(data, topdict.Encoding, topdict.CharStrings.length)), topdict.charset && (topdict.charset = Typr.CFF.readCharset(data, topdict.charset, topdict.CharStrings.length)), topdict.Private && (offset = topdict.Private[1], topdict.Private = Typr.CFF.readDict(data, offset, offset + topdict.Private[0]), topdict.Private.Subrs && Typr.CFF.readSubrs(data, offset + topdict.Private.Subrs, topdict.Private));
        var obj = {};
        for (var p in topdict)
            -
            1 != ["FamilyName", "FullName", "Notice", "version", "Copyright"].indexOf(p) ? obj[p] = strings[topdict[p] - 426 + 35] : obj[p] = topdict[p];
        return obj;
    }, Typr.CFF.readSubrs = function (data, offset, obj) {
        var bin = Typr._bin,
            gsubinds = [];
        offset = Typr.CFF.readIndex(data, offset, gsubinds);
        var bias, nSubrs = gsubinds.length;
        bias = nSubrs < 1240 ? 107 : nSubrs < 33900 ? 1131 : 32768, obj.Bias = bias, obj.Subrs = [];
        for (var i = 0; i < gsubinds.length - 1; i++)
            obj.Subrs.push(bin.readBytes(data, offset + gsubinds[i], gsubinds[i + 1] - gsubinds[i]));
    }, Typr.CFF.tableSE = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 0, 111, 112, 113, 114, 0, 115, 116, 117, 118, 119, 120, 121, 122, 0, 123, 0, 124, 125, 126, 127, 128, 129, 130, 131, 0, 132, 133, 0, 134, 135, 136, 137, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 138, 0, 139, 0, 0, 0, 0, 140, 141, 142, 143, 0, 0, 0, 0, 0, 144, 0, 0, 0, 145, 0, 0, 146, 147, 148, 149, 0, 0, 0, 0], Typr.CFF.glyphByUnicode = function (cff, code) {
        for (var i = 0; i < cff.charset.length; i++)
            if (cff.charset[i] == code)
                return i;
        return -1;
    }, Typr.CFF.glyphBySE = function (cff, charcode) {
        return charcode < 0 || charcode > 255 ? -1 : Typr.CFF.glyphByUnicode(cff, Typr.CFF.tableSE[charcode]);
    }, Typr.CFF.readEncoding = function (data, offset, num) {
        Typr._bin;
        var array = [".notdef"],
            format = data[offset];
        if (offset++, 0 != format)
            throw "error: unknown encoding format: " + format;
        var nCodes = data[offset];
        offset++;
        for (var i = 0; i < nCodes; i++)
            array.push(data[offset + i]);
        return array;
    }, Typr.CFF.readCharset = function (data, offset, num) {
        var bin = Typr._bin,
            charset = [".notdef"],
            format = data[offset];
        if (offset++, 0 == format)
            for (var i = 0; i < num; i++) {
                var first = bin.readUshort(data, offset);
                offset += 2, charset.push(first);
            }
        else {
            if (1 != format && 2 != format)
                throw "error: format: " + format;
            for (; charset.length < num;) {
                first = bin.readUshort(data, offset);
                offset += 2;
                var nLeft = 0;
                1 == format ? (nLeft = data[offset], offset++) : (nLeft = bin.readUshort(data, offset), offset += 2);
                for (i = 0; i <= nLeft; i++)
                    charset.push(first), first++;
            }
        }
        return charset;
    }, Typr.CFF.readIndex = function (data, offset, inds) {
        var bin = Typr._bin,
            count = bin.readUshort(data, offset),
            offsize = data[offset += 2];
        if (offset++, 1 == offsize)
            for (var i = 0; i < count + 1; i++)
                inds.push(data[offset + i]);
        else if (2 == offsize)
            for (i = 0; i < count + 1; i++)
                inds.push(bin.readUshort(data, offset + 2 * i));
        else if (3 == offsize)
            for (i = 0; i < count + 1; i++)
                inds.push(16777215 & bin.readUint(data, offset + 3 * i - 1));
        else if (0 != count)
            throw "unsupported offset size: " + offsize + ", count: " + count;
        return (offset += (count + 1) * offsize) - 1;
    }, Typr.CFF.getCharString = function (data, offset, o) {
        var bin = Typr._bin,
            b0 = data[offset],
            b1 = data[offset + 1];
        data[offset + 2], data[offset + 3], data[offset + 4];
        var vs = 1,
            op = null,
            val = null;
        b0 <= 20 && (op = b0, vs = 1), 12 == b0 && (op = 100 * b0 + b1, vs = 2), 21 <= b0 && b0 <= 27 && (op = b0, vs = 1), 28 == b0 && (val = bin.readShort(data, offset + 1), vs = 3), 29 <= b0 && b0 <= 31 && (op = b0, vs = 1), 32 <= b0 && b0 <= 246 && (val = b0 - 139, vs = 1), 247 <= b0 && b0 <= 250 && (val = 256 * (b0 - 247) + b1 + 108, vs = 2), 251 <= b0 && b0 <= 254 && (val = 256 * -(b0 - 251) - b1 - 108, vs = 2), 255 == b0 && (val = bin.readInt(data, offset + 1) / 65535, vs = 5), o.val = null != val ? val : "o" + op, o.size = vs;
    }, Typr.CFF.readCharString = function (data, offset, length) {
        for (var end = offset + length, bin = Typr._bin, arr = []; offset < end;) {
            var b0 = data[offset],
                b1 = data[offset + 1];
            data[offset + 2], data[offset + 3], data[offset + 4];
            var vs = 1,
                op = null,
                val = null;
            b0 <= 20 && (op = b0, vs = 1), 12 == b0 && (op = 100 * b0 + b1, vs = 2), 19 != b0 && 20 != b0 || (op = b0, vs = 2), 21 <= b0 && b0 <= 27 && (op = b0, vs = 1), 28 == b0 && (val = bin.readShort(data, offset + 1), vs = 3), 29 <= b0 && b0 <= 31 && (op = b0, vs = 1), 32 <= b0 && b0 <= 246 && (val = b0 - 139, vs = 1), 247 <= b0 && b0 <= 250 && (val = 256 * (b0 - 247) + b1 + 108, vs = 2), 251 <= b0 && b0 <= 254 && (val = 256 * -(b0 - 251) - b1 - 108, vs = 2), 255 == b0 && (val = bin.readInt(data, offset + 1) / 65535, vs = 5), arr.push(null != val ? val : "o" + op), offset += vs;
        }
        return arr;
    }, Typr.CFF.readDict = function (data, offset, end) {
        for (var bin = Typr._bin, dict = {}, carr = []; offset < end;) {
            var b0 = data[offset],
                b1 = data[offset + 1];
            data[offset + 2], data[offset + 3], data[offset + 4];
            var vs = 1,
                key = null,
                val = null;
            if (28 == b0 && (val = bin.readShort(data, offset + 1), vs = 3), 29 == b0 && (val = bin.readInt(data, offset + 1), vs = 5), 32 <= b0 && b0 <= 246 && (val = b0 - 139, vs = 1), 247 <= b0 && b0 <= 250 && (val = 256 * (b0 - 247) + b1 + 108, vs = 2), 251 <= b0 && b0 <= 254 && (val = 256 * -(b0 - 251) - b1 - 108, vs = 2), 255 == b0)
                throw val = bin.readInt(data, offset + 1) / 65535, vs = 5, "unknown number";
            if (30 == b0) {
                var nibs = [];
                for (vs = 1;;) {
                    var b = data[offset + vs];
                    vs++;
                    var nib0 = b >> 4,
                        nib1 = 15 & b;
                    if (15 != nib0 && nibs.push(nib0), 15 != nib1 && nibs.push(nib1), 15 == nib1)
                        break;
                }
                for (var s = "", chars = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, ".", "e", "e-", "reserved", "-", "endOfNumber"], i = 0; i < nibs.length; i++)
                    s += chars[nibs[i]];
                val = parseFloat(s);
            }
            if (b0 <= 21) {
                if (key = ["version", "Notice", "FullName", "FamilyName", "Weight", "FontBBox", "BlueValues", "OtherBlues", "FamilyBlues", "FamilyOtherBlues", "StdHW", "StdVW", "escape", "UniqueID", "XUID", "charset", "Encoding", "CharStrings", "Private", "Subrs", "defaultWidthX", "nominalWidthX"][b0], vs = 1, 12 == b0)
                    key = ["Copyright", "isFixedPitch", "ItalicAngle", "UnderlinePosition", "UnderlineThickness", "PaintType", "CharstringType", "FontMatrix", "StrokeWidth", "BlueScale", "BlueShift", "BlueFuzz", "StemSnapH", "StemSnapV", "ForceBold", 0, 0, "LanguageGroup", "ExpansionFactor", "initialRandomSeed", "SyntheticBase", "PostScript", "BaseFontName", "BaseFontBlend", 0, 0, 0, 0, 0, 0, "ROS", "CIDFontVersion", "CIDFontRevision", "CIDFontType", "CIDCount", "UIDBase", "FDArray", "FDSelect", "FontName"][b1], vs = 2;
            }
            null != key ? (dict[key] = 1 == carr.length ? carr[0] : carr, carr = []) : carr.push(val), offset += vs;
        }
        return dict;
    }, Typr.cmap = {}, Typr.cmap.parse = function (data, offset, length) {
        data = new Uint8Array(data.buffer, offset, length), offset = 0;
        var bin = Typr._bin,
            obj = {};
        bin.readUshort(data, offset), offset += 2;
        var numTables = bin.readUshort(data, offset);
        offset += 2;
        var offs = [];
        obj.tables = [];
        for (var i = 0; i < numTables; i++) {
            var platformID = bin.readUshort(data, offset);
            offset += 2;
            var encodingID = bin.readUshort(data, offset);
            offset += 2;
            var noffset = bin.readUint(data, offset);
            offset += 4;
            var id = "p" + platformID + "e" + encodingID,
                tind = offs.indexOf(noffset);
            if (-1 == tind) {
                var subt;
                tind = obj.tables.length, offs.push(noffset);
                var format = bin.readUshort(data, noffset);
                0 == format ? subt = Typr.cmap.parse0(data, noffset) : 4 == format ? subt = Typr.cmap.parse4(data, noffset) : 6 == format ? subt = Typr.cmap.parse6(data, noffset) : 12 == format ? subt = Typr.cmap.parse12(data, noffset) : console.log("unknown format: " + format, platformID, encodingID, noffset), obj.tables.push(subt);
            }
            if (null != obj[id])
                throw "multiple tables for one platform+encoding";
            obj[id] = tind;
        }
        return obj;
    }, Typr.cmap.parse0 = function (data, offset) {
        var bin = Typr._bin,
            obj = {};
        obj.format = bin.readUshort(data, offset), offset += 2;
        var len = bin.readUshort(data, offset);
        offset += 2, bin.readUshort(data, offset), offset += 2, obj.map = [];
        for (var i = 0; i < len - 6; i++)
            obj.map.push(data[offset + i]);
        return obj;
    }, Typr.cmap.parse4 = function (data, offset) {
        var bin = Typr._bin,
            offset0 = offset,
            obj = {};
        obj.format = bin.readUshort(data, offset), offset += 2;
        var length = bin.readUshort(data, offset);
        offset += 2, bin.readUshort(data, offset), offset += 2;
        var segCountX2 = bin.readUshort(data, offset);
        offset += 2;
        var segCount = segCountX2 / 2;
        obj.searchRange = bin.readUshort(data, offset), offset += 2, obj.entrySelector = bin.readUshort(data, offset), offset += 2, obj.rangeShift = bin.readUshort(data, offset), offset += 2, obj.endCount = bin.readUshorts(data, offset, segCount), offset += 2 * segCount, offset += 2, obj.startCount = bin.readUshorts(data, offset, segCount), offset += 2 * segCount, obj.idDelta = [];
        for (var i = 0; i < segCount; i++)
            obj.idDelta.push(bin.readShort(data, offset)), offset += 2;
        for (obj.idRangeOffset = bin.readUshorts(data, offset, segCount), offset += 2 * segCount, obj.glyphIdArray = []; offset < offset0 + length;)
            obj.glyphIdArray.push(bin.readUshort(data, offset)), offset += 2;
        return obj;
    }, Typr.cmap.parse6 = function (data, offset) {
        var bin = Typr._bin,
            obj = {};
        obj.format = bin.readUshort(data, offset), offset += 2, bin.readUshort(data, offset), offset += 2, bin.readUshort(data, offset), offset += 2, obj.firstCode = bin.readUshort(data, offset), offset += 2;
        var entryCount = bin.readUshort(data, offset);
        offset += 2, obj.glyphIdArray = [];
        for (var i = 0; i < entryCount; i++)
            obj.glyphIdArray.push(bin.readUshort(data, offset)), offset += 2;
        return obj;
    }, Typr.cmap.parse12 = function (data, offset) {
        var bin = Typr._bin,
            obj = {};
        obj.format = bin.readUshort(data, offset), offset += 2, offset += 2, bin.readUint(data, offset), offset += 4, bin.readUint(data, offset), offset += 4;
        var nGroups = bin.readUint(data, offset);
        offset += 4, obj.groups = [];
        for (var i = 0; i < nGroups; i++) {
            var off = offset + 12 * i,
                startCharCode = bin.readUint(data, off + 0),
                endCharCode = bin.readUint(data, off + 4),
                startGlyphID = bin.readUint(data, off + 8);
            obj.groups.push([startCharCode, endCharCode, startGlyphID]);
        }
        return obj;
    }, Typr.glyf = {}, Typr.glyf.parse = function (data, offset, length, font) {
        for (var obj = [], g = 0; g < font.maxp.numGlyphs; g++)
            obj.push(null);
        return obj;
    }, Typr.glyf._parseGlyf = function (font, g) {
        var bin = Typr._bin,
            data = font._data,
            offset = Typr._tabOffset(data, "glyf") + font.loca[g];
        if (font.loca[g] == font.loca[g + 1])
            return null;
        var gl = {};
        if (gl.noc = bin.readShort(data, offset), offset += 2, gl.xMin = bin.readShort(data, offset), offset += 2, gl.yMin = bin.readShort(data, offset), offset += 2, gl.xMax = bin.readShort(data, offset), offset += 2, gl.yMax = bin.readShort(data, offset), offset += 2, gl.xMin >= gl.xMax || gl.yMin >= gl.yMax)
            return null;
        if (gl.noc > 0) {
            gl.endPts = [];
            for (var i = 0; i < gl.noc; i++)
                gl.endPts.push(bin.readUshort(data, offset)), offset += 2;
            var instructionLength = bin.readUshort(data, offset);
            if (offset += 2, data.length - offset < instructionLength)
                return null;
            gl.instructions = bin.readBytes(data, offset, instructionLength), offset += instructionLength;
            var crdnum = gl.endPts[gl.noc - 1] + 1;
            gl.flags = [];
            for (i = 0; i < crdnum; i++) {
                var flag = data[offset];
                if (offset++, gl.flags.push(flag), 0 != (8 & flag)) {
                    var rep = data[offset];
                    offset++;
                    for (var j = 0; j < rep; j++)
                        gl.flags.push(flag), i++;
                }
            }
            gl.xs = [];
            for (i = 0; i < crdnum; i++) {
                var i8 = 0 != (2 & gl.flags[i]),
                    same = 0 != (16 & gl.flags[i]);
                i8 ? (gl.xs.push(same ? data[offset] : -data[offset]), offset++) : same ? gl.xs.push(0) : (gl.xs.push(bin.readShort(data, offset)), offset += 2);
            }
            gl.ys = [];
            for (i = 0; i < crdnum; i++) {
                i8 = 0 != (4 & gl.flags[i]), same = 0 != (32 & gl.flags[i]);
                i8 ? (gl.ys.push(same ? data[offset] : -data[offset]), offset++) : same ? gl.ys.push(0) : (gl.ys.push(bin.readShort(data, offset)), offset += 2);
            }
            var x = 0,
                y = 0;
            for (i = 0; i < crdnum; i++)
                x += gl.xs[i], y += gl.ys[i], gl.xs[i] = x, gl.ys[i] = y;
        } else {
            var flags;
            gl.parts = [];
            do {
                flags = bin.readUshort(data, offset), offset += 2;
                var part = {
                    m: {
                        a: 1,
                        b: 0,
                        c: 0,
                        d: 1,
                        tx: 0,
                        ty: 0
                    },
                    p1: -1,
                    p2: -1
                };
                if (gl.parts.push(part), part.glyphIndex = bin.readUshort(data, offset), offset += 2, 1 & flags) {
                    var arg1 = bin.readShort(data, offset);
                    offset += 2;
                    var arg2 = bin.readShort(data, offset);
                    offset += 2;
                } else {
                    arg1 = bin.readInt8(data, offset);
                    offset++;
                    arg2 = bin.readInt8(data, offset);
                    offset++;
                }
                2 & flags ? (part.m.tx = arg1, part.m.ty = arg2) : (part.p1 = arg1, part.p2 = arg2), 8 & flags ? (part.m.a = part.m.d = bin.readF2dot14(data, offset), offset += 2) : 64 & flags ? (part.m.a = bin.readF2dot14(data, offset), offset += 2, part.m.d = bin.readF2dot14(data, offset), offset += 2) : 128 & flags && (part.m.a = bin.readF2dot14(data, offset), offset += 2, part.m.b = bin.readF2dot14(data, offset), offset += 2, part.m.c = bin.readF2dot14(data, offset), offset += 2, part.m.d = bin.readF2dot14(data, offset), offset += 2);
            } while (32 & flags);
            if (256 & flags) {
                var numInstr = bin.readUshort(data, offset);
                offset += 2, gl.instr = [];
                for (i = 0; i < numInstr; i++)
                    gl.instr.push(data[offset]), offset++;
            }
        }
        return gl;
    }, Typr.GPOS = {}, Typr.GPOS.parse = function (data, offset, length, font) {
        return Typr._lctf.parse(data, offset, length, font, Typr.GPOS.subt);
    }, Typr.GPOS.subt = function (data, ltype, offset) {
        if (2 != ltype)
            return null;
        var bin = Typr._bin,
            offset0 = offset,
            tab = {};
        tab.format = bin.readUshort(data, offset), offset += 2;
        var covOff = bin.readUshort(data, offset);
        offset += 2, tab.coverage = Typr._lctf.readCoverage(data, covOff + offset0), tab.valFmt1 = bin.readUshort(data, offset), offset += 2, tab.valFmt2 = bin.readUshort(data, offset), offset += 2;
        var ones1 = Typr._lctf.numOfOnes(tab.valFmt1),
            ones2 = Typr._lctf.numOfOnes(tab.valFmt2);
        if (1 == tab.format) {
            tab.pairsets = [];
            var count = bin.readUshort(data, offset);
            offset += 2;
            for (var i = 0; i < count; i++) {
                var psoff = bin.readUshort(data, offset);
                offset += 2, psoff += offset0;
                var pvcount = bin.readUshort(data, psoff);
                psoff += 2;
                for (var arr = [], j = 0; j < pvcount; j++) {
                    var gid2 = bin.readUshort(data, psoff);
                    psoff += 2, 0 != tab.valFmt1 && (value1 = Typr._lctf.readValueRecord(data, psoff, tab.valFmt1), psoff += 2 * ones1), 0 != tab.valFmt2 && (value2 = Typr._lctf.readValueRecord(data, psoff, tab.valFmt2), psoff += 2 * ones2), arr.push({
                        gid2,
                        val1: value1,
                        val2: value2
                    });
                }
                tab.pairsets.push(arr);
            }
        }
        if (2 == tab.format) {
            var classDef1 = bin.readUshort(data, offset);
            offset += 2;
            var classDef2 = bin.readUshort(data, offset);
            offset += 2;
            var class1Count = bin.readUshort(data, offset);
            offset += 2;
            var class2Count = bin.readUshort(data, offset);
            offset += 2, tab.classDef1 = Typr._lctf.readClassDef(data, offset0 + classDef1), tab.classDef2 = Typr._lctf.readClassDef(data, offset0 + classDef2), tab.matrix = [];
            for (i = 0; i < class1Count; i++) {
                var row = [];
                for (j = 0; j < class2Count; j++) {
                    var value1 = null,
                        value2 = null;
                    0 != tab.valFmt1 && (value1 = Typr._lctf.readValueRecord(data, offset, tab.valFmt1), offset += 2 * ones1), 0 != tab.valFmt2 && (value2 = Typr._lctf.readValueRecord(data, offset, tab.valFmt2), offset += 2 * ones2), row.push({
                        val1: value1,
                        val2: value2
                    });
                }
                tab.matrix.push(row);
            }
        }
        return tab;
    }, Typr.GSUB = {}, Typr.GSUB.parse = function (data, offset, length, font) {
        return Typr._lctf.parse(data, offset, length, font, Typr.GSUB.subt);
    }, Typr.GSUB.subt = function (data, ltype, offset) {
        var bin = Typr._bin,
            offset0 = offset,
            tab = {};
        if (1 != ltype && 4 != ltype && 5 != ltype)
            return null;
        tab.fmt = bin.readUshort(data, offset), offset += 2;
        var covOff = bin.readUshort(data, offset);
        if (offset += 2, tab.coverage = Typr._lctf.readCoverage(data, covOff + offset0), 1 == ltype) {
            if (1 == tab.fmt)
                tab.delta = bin.readShort(data, offset), offset += 2;
            else if (2 == tab.fmt) {
                var cnt = bin.readUshort(data, offset);
                offset += 2, tab.newg = bin.readUshorts(data, offset, cnt), offset += 2 * tab.newg.length;
            }
        } else if (4 == ltype) {
            tab.vals = [];
            cnt = bin.readUshort(data, offset);
            offset += 2;
            for (var i = 0; i < cnt; i++) {
                var loff = bin.readUshort(data, offset);
                offset += 2, tab.vals.push(Typr.GSUB.readLigatureSet(data, offset0 + loff));
            }
        } else if (5 == ltype)
            if (2 == tab.fmt) {
                var cDefOffset = bin.readUshort(data, offset);
                offset += 2, tab.cDef = Typr._lctf.readClassDef(data, offset0 + cDefOffset), tab.scset = [];
                var subClassSetCount = bin.readUshort(data, offset);
                offset += 2;
                for (i = 0; i < subClassSetCount; i++) {
                    var scsOff = bin.readUshort(data, offset);
                    offset += 2, tab.scset.push(0 == scsOff ? null : Typr.GSUB.readSubClassSet(data, offset0 + scsOff));
                }
            } else
                console.log("unknown table format", tab.fmt);
        return tab;
    }, Typr.GSUB.readSubClassSet = function (data, offset) {
        var rUs = Typr._bin.readUshort,
            offset0 = offset,
            lset = [],
            cnt = rUs(data, offset);
        offset += 2;
        for (var i = 0; i < cnt; i++) {
            var loff = rUs(data, offset);
            offset += 2, lset.push(Typr.GSUB.readSubClassRule(data, offset0 + loff));
        }
        return lset;
    }, Typr.GSUB.readSubClassRule = function (data, offset) {
        var rUs = Typr._bin.readUshort,
            rule = {},
            gcount = rUs(data, offset),
            scount = rUs(data, offset += 2);
        offset += 2, rule.input = [];
        for (var i = 0; i < gcount - 1; i++)
            rule.input.push(rUs(data, offset)), offset += 2;
        return rule.substLookupRecords = Typr.GSUB.readSubstLookupRecords(data, offset, scount), rule;
    }, Typr.GSUB.readSubstLookupRecords = function (data, offset, cnt) {
        for (var rUs = Typr._bin.readUshort, out = [], i = 0; i < cnt; i++)
            out.push(rUs(data, offset), rUs(data, offset + 2)), offset += 4;
        return out;
    }, Typr.GSUB.readChainSubClassSet = function (data, offset) {
        var bin = Typr._bin,
            offset0 = offset,
            lset = [],
            cnt = bin.readUshort(data, offset);
        offset += 2;
        for (var i = 0; i < cnt; i++) {
            var loff = bin.readUshort(data, offset);
            offset += 2, lset.push(Typr.GSUB.readChainSubClassRule(data, offset0 + loff));
        }
        return lset;
    }, Typr.GSUB.readChainSubClassRule = function (data, offset) {
        for (var bin = Typr._bin, rule = {}, pps = ["backtrack", "input", "lookahead"], pi = 0; pi < pps.length; pi++) {
            var cnt = bin.readUshort(data, offset);
            offset += 2, 1 == pi && cnt--, rule[pps[pi]] = bin.readUshorts(data, offset, cnt), offset += 2 * rule[pps[pi]].length;
        }
        cnt = bin.readUshort(data, offset);
        return offset += 2, rule.subst = bin.readUshorts(data, offset, 2 * cnt), offset += 2 * rule.subst.length, rule;
    }, Typr.GSUB.readLigatureSet = function (data, offset) {
        var bin = Typr._bin,
            offset0 = offset,
            lset = [],
            lcnt = bin.readUshort(data, offset);
        offset += 2;
        for (var j = 0; j < lcnt; j++) {
            var loff = bin.readUshort(data, offset);
            offset += 2, lset.push(Typr.GSUB.readLigature(data, offset0 + loff));
        }
        return lset;
    }, Typr.GSUB.readLigature = function (data, offset) {
        var bin = Typr._bin,
            lig = {
                chain: []
            };
        lig.nglyph = bin.readUshort(data, offset), offset += 2;
        var ccnt = bin.readUshort(data, offset);
        offset += 2;
        for (var k = 0; k < ccnt - 1; k++)
            lig.chain.push(bin.readUshort(data, offset)), offset += 2;
        return lig;
    }, Typr.head = {}, Typr.head.parse = function (data, offset, length) {
        var bin = Typr._bin,
            obj = {};
        return bin.readFixed(data, offset), offset += 4, obj.fontRevision = bin.readFixed(data, offset), offset += 4, bin.readUint(data, offset), offset += 4, bin.readUint(data, offset), offset += 4, obj.flags = bin.readUshort(data, offset), offset += 2, obj.unitsPerEm = bin.readUshort(data, offset), offset += 2, obj.created = bin.readUint64(data, offset), offset += 8, obj.modified = bin.readUint64(data, offset), offset += 8, obj.xMin = bin.readShort(data, offset), offset += 2, obj.yMin = bin.readShort(data, offset), offset += 2, obj.xMax = bin.readShort(data, offset), offset += 2, obj.yMax = bin.readShort(data, offset), offset += 2, obj.macStyle = bin.readUshort(data, offset), offset += 2, obj.lowestRecPPEM = bin.readUshort(data, offset), offset += 2, obj.fontDirectionHint = bin.readShort(data, offset), offset += 2, obj.indexToLocFormat = bin.readShort(data, offset), offset += 2, obj.glyphDataFormat = bin.readShort(data, offset), offset += 2, obj;
    }, Typr.hhea = {}, Typr.hhea.parse = function (data, offset, length) {
        var bin = Typr._bin,
            obj = {};
        return bin.readFixed(data, offset), offset += 4, obj.ascender = bin.readShort(data, offset), offset += 2, obj.descender = bin.readShort(data, offset), offset += 2, obj.lineGap = bin.readShort(data, offset), offset += 2, obj.advanceWidthMax = bin.readUshort(data, offset), offset += 2, obj.minLeftSideBearing = bin.readShort(data, offset), offset += 2, obj.minRightSideBearing = bin.readShort(data, offset), offset += 2, obj.xMaxExtent = bin.readShort(data, offset), offset += 2, obj.caretSlopeRise = bin.readShort(data, offset), offset += 2, obj.caretSlopeRun = bin.readShort(data, offset), offset += 2, obj.caretOffset = bin.readShort(data, offset), offset += 2, offset += 8, obj.metricDataFormat = bin.readShort(data, offset), offset += 2, obj.numberOfHMetrics = bin.readUshort(data, offset), offset += 2, obj;
    }, Typr.hmtx = {}, Typr.hmtx.parse = function (data, offset, length, font) {
        for (var bin = Typr._bin, obj = {
                aWidth: [],
                lsBearing: []
            }, aw = 0, lsb = 0, i = 0; i < font.maxp.numGlyphs; i++)
            i < font.hhea.numberOfHMetrics && (aw = bin.readUshort(data, offset), offset += 2, lsb = bin.readShort(data, offset), offset += 2), obj.aWidth.push(aw), obj.lsBearing.push(lsb);
        return obj;
    }, Typr.kern = {}, Typr.kern.parse = function (data, offset, length, font) {
        var bin = Typr._bin,
            version = bin.readUshort(data, offset);
        if (offset += 2, 1 == version)
            return Typr.kern.parseV1(data, offset - 2, length, font);
        var nTables = bin.readUshort(data, offset);
        offset += 2;
        for (var map = {
                glyph1: [],
                rval: []
            }, i = 0; i < nTables; i++) {
            offset += 2;
            length = bin.readUshort(data, offset);
            offset += 2;
            var coverage = bin.readUshort(data, offset);
            offset += 2;
            var format = coverage >>> 8;
            if (0 != (format &= 15))
                throw "unknown kern table format: " + format;
            offset = Typr.kern.readFormat0(data, offset, map);
        }
        return map;
    }, Typr.kern.parseV1 = function (data, offset, length, font) {
        var bin = Typr._bin;
        bin.readFixed(data, offset), offset += 4;
        var nTables = bin.readUint(data, offset);
        offset += 4;
        for (var map = {
                glyph1: [],
                rval: []
            }, i = 0; i < nTables; i++) {
            bin.readUint(data, offset), offset += 4;
            var coverage = bin.readUshort(data, offset);
            offset += 2, bin.readUshort(data, offset), offset += 2;
            var format = coverage >>> 8;
            if (0 != (format &= 15))
                throw "unknown kern table format: " + format;
            offset = Typr.kern.readFormat0(data, offset, map);
        }
        return map;
    }, Typr.kern.readFormat0 = function (data, offset, map) {
        var bin = Typr._bin,
            pleft = -1,
            nPairs = bin.readUshort(data, offset);
        offset += 2, bin.readUshort(data, offset), offset += 2, bin.readUshort(data, offset), offset += 2, bin.readUshort(data, offset), offset += 2;
        for (var j = 0; j < nPairs; j++) {
            var left = bin.readUshort(data, offset);
            offset += 2;
            var right = bin.readUshort(data, offset);
            offset += 2;
            var value = bin.readShort(data, offset);
            offset += 2, left != pleft && (map.glyph1.push(left), map.rval.push({
                glyph2: [],
                vals: []
            }));
            var rval = map.rval[map.rval.length - 1];
            rval.glyph2.push(right), rval.vals.push(value), pleft = left;
        }
        return offset;
    }, Typr.loca = {}, Typr.loca.parse = function (data, offset, length, font) {
        var bin = Typr._bin,
            obj = [],
            ver = font.head.indexToLocFormat,
            len = font.maxp.numGlyphs + 1;
        if (0 == ver)
            for (var i = 0; i < len; i++)
                obj.push(bin.readUshort(data, offset + (i << 1)) << 1);
        if (1 == ver)
            for (i = 0; i < len; i++)
                obj.push(bin.readUint(data, offset + (i << 2)));
        return obj;
    }, Typr.maxp = {}, Typr.maxp.parse = function (data, offset, length) {
        var bin = Typr._bin,
            obj = {},
            ver = bin.readUint(data, offset);
        return offset += 4, obj.numGlyphs = bin.readUshort(data, offset), offset += 2, 65536 == ver && (obj.maxPoints = bin.readUshort(data, offset), offset += 2, obj.maxContours = bin.readUshort(data, offset), offset += 2, obj.maxCompositePoints = bin.readUshort(data, offset), offset += 2, obj.maxCompositeContours = bin.readUshort(data, offset), offset += 2, obj.maxZones = bin.readUshort(data, offset), offset += 2, obj.maxTwilightPoints = bin.readUshort(data, offset), offset += 2, obj.maxStorage = bin.readUshort(data, offset), offset += 2, obj.maxFunctionDefs = bin.readUshort(data, offset), offset += 2, obj.maxInstructionDefs = bin.readUshort(data, offset), offset += 2, obj.maxStackElements = bin.readUshort(data, offset), offset += 2, obj.maxSizeOfInstructions = bin.readUshort(data, offset), offset += 2, obj.maxComponentElements = bin.readUshort(data, offset), offset += 2, obj.maxComponentDepth = bin.readUshort(data, offset), offset += 2), obj;
    }, Typr.name = {}, Typr.name.parse = function (data, offset, length) {
        var bin = Typr._bin,
            obj = {};
        bin.readUshort(data, offset), offset += 2;
        var count = bin.readUshort(data, offset);
        offset += 2, bin.readUshort(data, offset);
        for (var tname, offset0 = offset += 2, i = 0; i < count; i++) {
            var platformID = bin.readUshort(data, offset);
            offset += 2;
            var encodingID = bin.readUshort(data, offset);
            offset += 2;
            var languageID = bin.readUshort(data, offset);
            offset += 2;
            var nameID = bin.readUshort(data, offset);
            offset += 2;
            length = bin.readUshort(data, offset);
            offset += 2;
            var noffset = bin.readUshort(data, offset);
            offset += 2;
            var plat = "p" + platformID;
            null == obj[plat] && (obj[plat] = {});
            var str, cname = ["copyright", "fontFamily", "fontSubfamily", "ID", "fullName", "version", "postScriptName", "trademark", "manufacturer", "designer", "description", "urlVendor", "urlDesigner", "licence", "licenceURL", "---", "typoFamilyName", "typoSubfamilyName", "compatibleFull", "sampleText", "postScriptCID", "wwsFamilyName", "wwsSubfamilyName", "lightPalette", "darkPalette"][nameID],
                soff = offset0 + 12 * count + noffset;
            if (0 == platformID)
                str = bin.readUnicode(data, soff, length / 2);
            else if (3 == platformID && 0 == encodingID)
                str = bin.readUnicode(data, soff, length / 2);
            else if (0 == encodingID)
                str = bin.readASCII(data, soff, length);
            else if (1 == encodingID)
                str = bin.readUnicode(data, soff, length / 2);
            else if (3 == encodingID)
                str = bin.readUnicode(data, soff, length / 2);
            else {
                if (1 != platformID)
                    throw "unknown encoding " + encodingID + ", platformID: " + platformID;
                str = bin.readASCII(data, soff, length), console.log("reading unknown MAC encoding " + encodingID + " as ASCII");
            }
            obj[plat][cname] = str, obj[plat]._lang = languageID;
        }
        for (var p in obj)
            if (null != obj[p].postScriptName && 1033 == obj[p]._lang)
                return obj[p];
        for (var p in obj)
            if (null != obj[p].postScriptName && 3084 == obj[p]._lang)
                return obj[p];
        for (var p in obj)
            if (null != obj[p].postScriptName)
                return obj[p];
        for (var p in obj) {
            tname = p;
            break;
        }
        return console.log("returning name table with languageID " + obj[tname]._lang), obj[tname];
    }, Typr["OS/2"] = {}, Typr["OS/2"].parse = function (data, offset, length) {
        var ver = Typr._bin.readUshort(data, offset);
        offset += 2;
        var obj = {};
        if (0 == ver)
            Typr["OS/2"].version0(data, offset, obj);
        else if (1 == ver)
            Typr["OS/2"].version1(data, offset, obj);
        else if (2 == ver || 3 == ver || 4 == ver)
            Typr["OS/2"].version2(data, offset, obj);
        else {
            if (5 != ver)
                throw "unknown OS/2 table version: " + ver;
            Typr["OS/2"].version5(data, offset, obj);
        }
        return obj;
    }, Typr["OS/2"].version0 = function (data, offset, obj) {
        var bin = Typr._bin;
        return obj.xAvgCharWidth = bin.readShort(data, offset), offset += 2, obj.usWeightClass = bin.readUshort(data, offset), offset += 2, obj.usWidthClass = bin.readUshort(data, offset), offset += 2, obj.fsType = bin.readUshort(data, offset), offset += 2, obj.ySubscriptXSize = bin.readShort(data, offset), offset += 2, obj.ySubscriptYSize = bin.readShort(data, offset), offset += 2, obj.ySubscriptXOffset = bin.readShort(data, offset), offset += 2, obj.ySubscriptYOffset = bin.readShort(data, offset), offset += 2, obj.ySuperscriptXSize = bin.readShort(data, offset), offset += 2, obj.ySuperscriptYSize = bin.readShort(data, offset), offset += 2, obj.ySuperscriptXOffset = bin.readShort(data, offset), offset += 2, obj.ySuperscriptYOffset = bin.readShort(data, offset), offset += 2, obj.yStrikeoutSize = bin.readShort(data, offset), offset += 2, obj.yStrikeoutPosition = bin.readShort(data, offset), offset += 2, obj.sFamilyClass = bin.readShort(data, offset), offset += 2, obj.panose = bin.readBytes(data, offset, 10), offset += 10, obj.ulUnicodeRange1 = bin.readUint(data, offset), offset += 4, obj.ulUnicodeRange2 = bin.readUint(data, offset), offset += 4, obj.ulUnicodeRange3 = bin.readUint(data, offset), offset += 4, obj.ulUnicodeRange4 = bin.readUint(data, offset), offset += 4, obj.achVendID = [bin.readInt8(data, offset), bin.readInt8(data, offset + 1), bin.readInt8(data, offset + 2), bin.readInt8(data, offset + 3)], offset += 4, obj.fsSelection = bin.readUshort(data, offset), offset += 2, obj.usFirstCharIndex = bin.readUshort(data, offset), offset += 2, obj.usLastCharIndex = bin.readUshort(data, offset), offset += 2, obj.sTypoAscender = bin.readShort(data, offset), offset += 2, obj.sTypoDescender = bin.readShort(data, offset), offset += 2, obj.sTypoLineGap = bin.readShort(data, offset), offset += 2, obj.usWinAscent = bin.readUshort(data, offset), offset += 2, obj.usWinDescent = bin.readUshort(data, offset), offset += 2;
    }, Typr["OS/2"].version1 = function (data, offset, obj) {
        var bin = Typr._bin;
        return offset = Typr["OS/2"].version0(data, offset, obj), obj.ulCodePageRange1 = bin.readUint(data, offset), offset += 4, obj.ulCodePageRange2 = bin.readUint(data, offset), offset += 4;
    }, Typr["OS/2"].version2 = function (data, offset, obj) {
        var bin = Typr._bin;
        return offset = Typr["OS/2"].version1(data, offset, obj), obj.sxHeight = bin.readShort(data, offset), offset += 2, obj.sCapHeight = bin.readShort(data, offset), offset += 2, obj.usDefault = bin.readUshort(data, offset), offset += 2, obj.usBreak = bin.readUshort(data, offset), offset += 2, obj.usMaxContext = bin.readUshort(data, offset), offset += 2;
    }, Typr["OS/2"].version5 = function (data, offset, obj) {
        var bin = Typr._bin;
        return offset = Typr["OS/2"].version2(data, offset, obj), obj.usLowerOpticalPointSize = bin.readUshort(data, offset), offset += 2, obj.usUpperOpticalPointSize = bin.readUshort(data, offset), offset += 2;
    }, Typr.post = {}, Typr.post.parse = function (data, offset, length) {
        var bin = Typr._bin,
            obj = {};
        return obj.version = bin.readFixed(data, offset), offset += 4, obj.italicAngle = bin.readFixed(data, offset), offset += 4, obj.underlinePosition = bin.readShort(data, offset), offset += 2, obj.underlineThickness = bin.readShort(data, offset), offset += 2, obj;
    }, Typr.SVG = {}, Typr.SVG.parse = function (data, offset, length) {
        var bin = Typr._bin,
            obj = {
                entries: []
            },
            offset0 = offset;
        bin.readUshort(data, offset), offset += 2;
        var svgDocIndexOffset = bin.readUint(data, offset);
        offset += 4, bin.readUint(data, offset), offset += 4, offset = svgDocIndexOffset + offset0;
        var numEntries = bin.readUshort(data, offset);
        offset += 2;
        for (var i = 0; i < numEntries; i++) {
            var startGlyphID = bin.readUshort(data, offset);
            offset += 2;
            var endGlyphID = bin.readUshort(data, offset);
            offset += 2;
            var svgDocOffset = bin.readUint(data, offset);
            offset += 4;
            var svgDocLength = bin.readUint(data, offset);
            offset += 4;
            for (var sbuf = new Uint8Array(data.buffer, offset0 + svgDocOffset + svgDocIndexOffset, svgDocLength), svg = bin.readUTF8(sbuf, 0, sbuf.length), f = startGlyphID; f <= endGlyphID; f++)
                obj.entries[f] = svg;
        }
        return obj;
    }, Typr.SVG.toPath = function (str) {
        var pth = {
            cmds: [],
            crds: []
        };
        if (null == str)
            return pth;
        for (var svg = new DOMParser().parseFromString(str, "image/svg+xml").firstChild;
            "svg" != svg.tagName;)
            svg = svg.nextSibling;
        var vb = svg.getAttribute("viewBox");
        vb = vb ? vb.trim().split(" ").map(parseFloat) : [0, 0, 1e3, 1e3], Typr.SVG._toPath(svg.children, pth);
        for (var i = 0; i < pth.crds.length; i += 2) {
            var x = pth.crds[i],
                y = pth.crds[i + 1];
            x -= vb[0], y = -(y -= vb[1]), pth.crds[i] = x, pth.crds[i + 1] = y;
        }
        return pth;
    }, Typr.SVG._toPath = function (nds, pth, fill) {
        for (var ni = 0; ni < nds.length; ni++) {
            var nd = nds[ni],
                tn = nd.tagName,
                cfl = nd.getAttribute("fill");
            if (null == cfl && (cfl = fill), "g" == tn)
                Typr.SVG._toPath(nd.children, pth, cfl);
            else if ("path" == tn) {
                pth.cmds.push(cfl || "#000000");
                var d = nd.getAttribute("d"),
                    toks = Typr.SVG._tokens(d);
                Typr.SVG._toksToPath(toks, pth), pth.cmds.push("X");
            } else
                "defs" == tn || console.log(tn, nd);
        }
    }, Typr.SVG._tokens = function (d) {
        for (var ts = [], off = 0, rn = false, cn = ""; off < d.length;) {
            var cc = d.charCodeAt(off),
                ch = d.charAt(off);
            off++;
            var isNum = 48 <= cc && cc <= 57 || "." == ch || "-" == ch;
            rn ? "-" == ch ? (ts.push(parseFloat(cn)), cn = ch) : isNum ? cn += ch : (ts.push(parseFloat(cn)), "," != ch && " " != ch && ts.push(ch), rn = false) : isNum ? (cn = ch, rn = true) : "," != ch && " " != ch && ts.push(ch);
        }
        return rn && ts.push(parseFloat(cn)), ts;
    }, Typr.SVG._toksToPath = function (ts, pth) {
        for (var i = 0, x = 0, y = 0, ox = 0, oy = 0, pc = {
                M: 2,
                L: 2,
                H: 1,
                V: 1,
                S: 4,
                C: 6
            }, cmds = pth.cmds, crds = pth.crds; i < ts.length;) {
            var cmd = ts[i];
            if (i++, "z" == cmd)
                cmds.push("Z"), x = ox, y = oy;
            else
                for (var cmu = cmd.toUpperCase(), ps = pc[cmu], reps = Typr.SVG._reps(ts, i, ps), j = 0; j < reps; j++) {
                    var xi = 0,
                        yi = 0;
                    if (cmd != cmu && (xi = x, yi = y), "M" == cmu)
                        x = xi + ts[i++], y = yi + ts[i++], cmds.push("M"), crds.push(x, y), ox = x, oy = y;
                    else if ("L" == cmu)
                        x = xi + ts[i++], y = yi + ts[i++], cmds.push("L"), crds.push(x, y);
                    else if ("H" == cmu)
                        x = xi + ts[i++], cmds.push("L"), crds.push(x, y);
                    else if ("V" == cmu)
                        y = yi + ts[i++], cmds.push("L"), crds.push(x, y);
                    else if ("C" == cmu) {
                        var x1 = xi + ts[i++],
                            y1 = yi + ts[i++],
                            x2 = xi + ts[i++],
                            y2 = yi + ts[i++],
                            x3 = xi + ts[i++],
                            y3 = yi + ts[i++];
                        cmds.push("C"), crds.push(x1, y1, x2, y2, x3, y3), x = x3, y = y3;
                    } else if ("S" == cmu) {
                        var co = Math.max(crds.length - 4, 0);
                        x1 = x + x - crds[co], y1 = y + y - crds[co + 1], x2 = xi + ts[i++], y2 = yi + ts[i++], x3 = xi + ts[i++], y3 = yi + ts[i++];
                        cmds.push("C"), crds.push(x1, y1, x2, y2, x3, y3), x = x3, y = y3;
                    } else
                        console.log("Unknown SVG command " + cmd);
                }
        }
    }, Typr.SVG._reps = function (ts, off, ps) {
        for (var i = off; i < ts.length && "string" != typeof ts[i];)
            i += ps;
        return (i - off) / ps;
    }, null == Typr && (Typr = {}), null == Typr.U && (Typr.U = {}), Typr.U.codeToGlyph = function (font, code) {
        var cmap = font.cmap,
            tind = -1;
        if (null != cmap.p0e4 ? tind = cmap.p0e4 : null != cmap.p3e1 ? tind = cmap.p3e1 : null != cmap.p1e0 && (tind = cmap.p1e0), -1 == tind)
            throw "no familiar platform and encoding!";
        var tab = cmap.tables[tind];
        if (0 == tab.format)
            return code >= tab.map.length ? 0 : tab.map[code];
        if (4 == tab.format) {
            for (var sind = -1, i = 0; i < tab.endCount.length; i++)
                if (code <= tab.endCount[i]) {
                    sind = i;
                    break;
                }
            if (-1 == sind)
                return 0;
            if (tab.startCount[sind] > code)
                return 0;
            return 65535 & (0 != tab.idRangeOffset[sind] ? tab.glyphIdArray[code - tab.startCount[sind] + (tab.idRangeOffset[sind] >> 1) - (tab.idRangeOffset.length - sind)] : code + tab.idDelta[sind]);
        }
        if (12 == tab.format) {
            if (code > tab.groups[tab.groups.length - 1][1])
                return 0;
            for (i = 0; i < tab.groups.length; i++) {
                var grp = tab.groups[i];
                if (grp[0] <= code && code <= grp[1])
                    return grp[2] + (code - grp[0]);
            }
            return 0;
        }
        throw "unknown cmap table format " + tab.format;
    }, Typr.U.glyphToPath = function (font, gid) {
        var path = {
            cmds: [],
            crds: []
        };
        if (font.SVG && font.SVG.entries[gid]) {
            var p = font.SVG.entries[gid];
            return null == p ? path : ("string" == typeof p && (p = Typr.SVG.toPath(p), font.SVG.entries[gid] = p), p);
        }
        if (font.CFF) {
            var state = {
                x: 0,
                y: 0,
                stack: [],
                nStems: 0,
                haveWidth: false,
                width: font.CFF.Private ? font.CFF.Private.defaultWidthX : 0,
                open: false
            };
            Typr.U._drawCFF(font.CFF.CharStrings[gid], state, font.CFF, path);
        } else
            font.glyf && Typr.U._drawGlyf(gid, font, path);
        return path;
    }, Typr.U._drawGlyf = function (gid, font, path) {
        var gl = font.glyf[gid];
        null == gl && (gl = font.glyf[gid] = Typr.glyf._parseGlyf(font, gid)), null != gl && (gl.noc > -1 ? Typr.U._simpleGlyph(gl, path) : Typr.U._compoGlyph(gl, font, path));
    }, Typr.U._simpleGlyph = function (gl, p) {
        for (var c = 0; c < gl.noc; c++) {
            for (var i0 = 0 == c ? 0 : gl.endPts[c - 1] + 1, il = gl.endPts[c], i = i0; i <= il; i++) {
                var pr = i == i0 ? il : i - 1,
                    nx = i == il ? i0 : i + 1,
                    onCurve = 1 & gl.flags[i],
                    prOnCurve = 1 & gl.flags[pr],
                    nxOnCurve = 1 & gl.flags[nx],
                    x = gl.xs[i],
                    y = gl.ys[i];
                if (i == i0)
                    if (onCurve) {
                        if (!prOnCurve) {
                            Typr.U.P.moveTo(p, x, y);
                            continue;
                        }
                        Typr.U.P.moveTo(p, gl.xs[pr], gl.ys[pr]);
                    } else
                        prOnCurve ? Typr.U.P.moveTo(p, gl.xs[pr], gl.ys[pr]) : Typr.U.P.moveTo(p, (gl.xs[pr] + x) / 2, (gl.ys[pr] + y) / 2);
                onCurve ? prOnCurve && Typr.U.P.lineTo(p, x, y) : nxOnCurve ? Typr.U.P.qcurveTo(p, x, y, gl.xs[nx], gl.ys[nx]) : Typr.U.P.qcurveTo(p, x, y, (x + gl.xs[nx]) / 2, (y + gl.ys[nx]) / 2);
            }
            Typr.U.P.closePath(p);
        }
    }, Typr.U._compoGlyph = function (gl, font, p) {
        for (var j = 0; j < gl.parts.length; j++) {
            var path = {
                    cmds: [],
                    crds: []
                },
                prt = gl.parts[j];
            Typr.U._drawGlyf(prt.glyphIndex, font, path);
            for (var m = prt.m, i = 0; i < path.crds.length; i += 2) {
                var x = path.crds[i],
                    y = path.crds[i + 1];
                p.crds.push(x * m.a + y * m.b + m.tx), p.crds.push(x * m.c + y * m.d + m.ty);
            }
            for (i = 0; i < path.cmds.length; i++)
                p.cmds.push(path.cmds[i]);
        }
    }, Typr.U._getGlyphClass = function (g, cd) {
        var intr = Typr._lctf.getInterval(cd, g);
        return -1 == intr ? 0 : cd[intr + 2];
    }, Typr.U.getPairAdjustment = function (font, g1, g2) {
        if (font.GPOS) {
            for (var ltab = null, i = 0; i < font.GPOS.featureList.length; i++) {
                var fl = font.GPOS.featureList[i];
                if ("kern" == fl.tag)
                    for (var j = 0; j < fl.tab.length; j++)
                        2 == font.GPOS.lookupList[fl.tab[j]].ltype && (ltab = font.GPOS.lookupList[fl.tab[j]]);
            }
            if (ltab)
                for (i = 0; i < ltab.tabs.length; i++) {
                    var tab = ltab.tabs[i],
                        ind = Typr._lctf.coverageIndex(tab.coverage, g1);
                    if (-1 != ind) {
                        if (1 == tab.format) {
                            var right = tab.pairsets[ind];
                            for (j = 0; j < right.length; j++)
                                right[j].gid2 == g2 && (adj = right[j]);
                            if (null == adj)
                                continue;
                        } else if (2 == tab.format)
                            var c1 = Typr.U._getGlyphClass(g1, tab.classDef1),
                                c2 = Typr.U._getGlyphClass(g2, tab.classDef2),
                                adj = tab.matrix[c1][c2];
                        return adj.val1[2];
                    }
                }
        }
        if (font.kern) {
            var ind1 = font.kern.glyph1.indexOf(g1);
            if (-1 != ind1) {
                var ind2 = font.kern.rval[ind1].glyph2.indexOf(g2);
                if (-1 != ind2)
                    return font.kern.rval[ind1].vals[ind2];
            }
        }
        return 0;
    }, Typr.U.stringToGlyphs = function (font, str) {
        for (var gls = [], i = 0; i < str.length; i++) {
            var cc = str.codePointAt(i);
            cc > 65535 && i++, gls.push(Typr.U.codeToGlyph(font, cc));
        }
        var gsub = font.GSUB;
        if (null == gsub)
            return gls;
        for (var llist = gsub.lookupList, flist = gsub.featureList, wsep = '\n	" ,.:;!?()  ،', R = "آأؤإاةدذرزوٱٲٳٵٶٷڈډڊڋڌڍڎڏڐڑڒړڔڕږڗژڙۀۃۄۅۆۇۈۉۊۋۍۏےۓەۮۯܐܕܖܗܘܙܞܨܪܬܯݍݙݚݛݫݬݱݳݴݸݹࡀࡆࡇࡉࡔࡧࡩࡪࢪࢫࢬࢮࢱࢲࢹૅેૉ૊૎૏ૐ૑૒૝ૡ૤૯஁ஃ஄அஉ஌எஏ஑னப஫஬", ci = 0; ci < gls.length; ci++) {
            var gl = gls[ci],
                slft = 0 == ci || -1 != wsep.indexOf(str[ci - 1]),
                srgt = ci == gls.length - 1 || -1 != wsep.indexOf(str[ci + 1]);
            slft || -1 == R.indexOf(str[ci - 1]) || (slft = true), srgt || -1 == R.indexOf(str[ci]) || (srgt = true), srgt || -1 == "ꡲ્૗".indexOf(str[ci + 1]) || (srgt = true), slft || -1 == "ꡲ્૗".indexOf(str[ci]) || (slft = true);
            var feat = null;
            feat = slft ? srgt ? "isol" : "init" : srgt ? "fina" : "medi";
            for (var fi = 0; fi < flist.length; fi++)
                if (flist[fi].tag == feat)
                    for (var ti = 0; ti < flist[fi].tab.length; ti++) {
                        1 == (tab = llist[flist[fi].tab[ti]]).ltype && Typr.U._applyType1(gls, ci, tab);
                    }
        }
        var cligs = ["rlig", "liga", "mset"];
        for (ci = 0; ci < gls.length; ci++) {
            gl = gls[ci];
            var rlim = Math.min(3, gls.length - ci - 1);
            for (fi = 0; fi < flist.length; fi++) {
                var fl = flist[fi];
                if (-1 != cligs.indexOf(fl.tag)) {
                    for (ti = 0; ti < fl.tab.length; ti++)
                        for (var tab = llist[fl.tab[ti]], j = 0; j < tab.tabs.length; j++)
                            if (null != tab.tabs[j]) {
                                var ind = Typr._lctf.coverageIndex(tab.tabs[j].coverage, gl);
                                if (-1 != ind) {
                                    if (4 == tab.ltype)
                                        for (var vals = tab.tabs[j].vals[ind], k = 0; k < vals.length; k++) {
                                            var lig = vals[k],
                                                rl = lig.chain.length;
                                            if (!(rl > rlim)) {
                                                for (var good = true, l = 0; l < rl; l++)
                                                    lig.chain[l] != gls[ci + (1 + l)] && (good = false);
                                                if (good) {
                                                    gls[ci] = lig.nglyph;
                                                    for (l = 0; l < rl; l++)
                                                        gls[ci + l + 1] = -1;
                                                }
                                            }
                                        }
                                    else if (5 == tab.ltype) {
                                        var ltab = tab.tabs[j];
                                        if (2 != ltab.fmt)
                                            continue;
                                        var cind = Typr._lctf.getInterval(ltab.cDef, gl),
                                            cls = ltab.cDef[cind + 2],
                                            scs = ltab.scset[cls];
                                        for (i = 0; i < scs.length; i++) {
                                            var sc = scs[i],
                                                inp = sc.input;
                                            if (!(inp.length > rlim)) {
                                                for (good = true, l = 0; l < inp.length; l++) {
                                                    var cind2 = Typr._lctf.getInterval(ltab.cDef, gls[ci + 1 + l]);
                                                    if (-1 == cind && ltab.cDef[cind2 + 2] != inp[l]) {
                                                        good = false;
                                                        break;
                                                    }
                                                }
                                                if (good) {
                                                    var lrs = sc.substLookupRecords;
                                                    for (k = 0; k < lrs.length; k += 2)
                                                        lrs[k], lrs[k + 1];
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                }
            }
        }
        return gls;
    }, Typr.U._applyType1 = function (gls, ci, tab) {
        for (var gl = gls[ci], j = 0; j < tab.tabs.length; j++) {
            var ttab = tab.tabs[j],
                ind = Typr._lctf.coverageIndex(ttab.coverage, gl); -
            1 != ind && (1 == ttab.fmt ? gls[ci] = gls[ci] + ttab.delta : gls[ci] = ttab.newg[ind]);
        }
    }, Typr.U.glyphsToPath = function (font, gls, clr) {
        for (var tpath = {
                cmds: [],
                crds: []
            }, x = 0, i = 0; i < gls.length; i++) {
            var gid = gls[i];
            if (-1 != gid) {
                for (var gid2 = i < gls.length - 1 && -1 != gls[i + 1] ? gls[i + 1] : 0, path = Typr.U.glyphToPath(font, gid), j = 0; j < path.crds.length; j += 2)
                    tpath.crds.push(path.crds[j] + x), tpath.crds.push(path.crds[j + 1]);
                clr && tpath.cmds.push(clr);
                for (j = 0; j < path.cmds.length; j++)
                    tpath.cmds.push(path.cmds[j]);
                clr && tpath.cmds.push("X"), x += font.hmtx.aWidth[gid], i < gls.length - 1 && (x += Typr.U.getPairAdjustment(font, gid, gid2));
            }
        }
        return tpath;
    }, Typr.U.pathToSVG = function (path, prec) {
        null == prec && (prec = 5);
        for (var out = [], co = 0, lmap = {
                M: 2,
                L: 2,
                Q: 4,
                C: 6
            }, i = 0; i < path.cmds.length; i++) {
            var cmd = path.cmds[i],
                cn = co + (lmap[cmd] ? lmap[cmd] : 0);
            for (out.push(cmd); co < cn;) {
                var c = path.crds[co++];
                out.push(parseFloat(c.toFixed(prec)) + (co == cn ? "" : " "));
            }
        }
        return out.join("");
    }, Typr.U.pathToContext = function (path, ctx) {
        for (var c = 0, crds = path.crds, j = 0; j < path.cmds.length; j++) {
            var cmd = path.cmds[j];
            "M" == cmd ? (ctx.moveTo(crds[c], crds[c + 1]), c += 2) : "L" == cmd ? (ctx.lineTo(crds[c], crds[c + 1]), c += 2) : "C" == cmd ? (ctx.bezierCurveTo(crds[c], crds[c + 1], crds[c + 2], crds[c + 3], crds[c + 4], crds[c + 5]), c += 6) : "Q" == cmd ? (ctx.quadraticCurveTo(crds[c], crds[c + 1], crds[c + 2], crds[c + 3]), c += 4) : "#" == cmd.charAt(0) ? (ctx.beginPath(), ctx.fillStyle = cmd) : "Z" == cmd ? ctx.closePath() : "X" == cmd && ctx.fill();
        }
    }, Typr.U.P = {}, Typr.U.P.moveTo = function (p, x, y) {
        p.cmds.push("M"), p.crds.push(x, y);
    }, Typr.U.P.lineTo = function (p, x, y) {
        p.cmds.push("L"), p.crds.push(x, y);
    }, Typr.U.P.curveTo = function (p, a, b, c, d, e, f) {
        p.cmds.push("C"), p.crds.push(a, b, c, d, e, f);
    }, Typr.U.P.qcurveTo = function (p, a, b, c, d) {
        p.cmds.push("Q"), p.crds.push(a, b, c, d);
    }, Typr.U.P.closePath = function (p) {
        p.cmds.push("Z");
    }, Typr.U._drawCFF = function (cmds, state, font, p) {
        for (var stack = state.stack, nStems = state.nStems, haveWidth = state.haveWidth, width = state.width, open = state.open, i = 0, x = state.x, y = state.y, c1x = 0, c1y = 0, c2x = 0, c2y = 0, c3x = 0, c3y = 0, c4x = 0, c4y = 0, jpx = 0, jpy = 0, o = {
                val: 0,
                size: 0
            }; i < cmds.length;) {
            Typr.CFF.getCharString(cmds, i, o);
            var v = o.val;
            if (i += o.size, "o1" == v || "o18" == v)
                stack.length % 2 != 0 && !haveWidth && (width = stack.shift() + font.Private.nominalWidthX), nStems += stack.length >> 1, stack.length = 0, haveWidth = true;
            else if ("o3" == v || "o23" == v) {
                stack.length % 2 != 0 && !haveWidth && (width = stack.shift() + font.Private.nominalWidthX), nStems += stack.length >> 1, stack.length = 0, haveWidth = true;
            } else if ("o4" == v)
                stack.length > 1 && !haveWidth && (width = stack.shift() + font.Private.nominalWidthX, haveWidth = true), open && Typr.U.P.closePath(p), y += stack.pop(), Typr.U.P.moveTo(p, x, y), open = true;
            else if ("o5" == v)
                for (; stack.length > 0;)
                    x += stack.shift(), y += stack.shift(), Typr.U.P.lineTo(p, x, y);
            else if ("o6" == v || "o7" == v)
                for (var count = stack.length, isX = "o6" == v, j = 0; j < count; j++) {
                    var sval = stack.shift();
                    isX ? x += sval : y += sval, isX = !isX, Typr.U.P.lineTo(p, x, y);
                }
            else if ("o8" == v || "o24" == v) {
                count = stack.length;
                for (var index = 0; index + 6 <= count;)
                    c1x = x + stack.shift(), c1y = y + stack.shift(), c2x = c1x + stack.shift(), c2y = c1y + stack.shift(), x = c2x + stack.shift(), y = c2y + stack.shift(), Typr.U.P.curveTo(p, c1x, c1y, c2x, c2y, x, y), index += 6;
                "o24" == v && (x += stack.shift(), y += stack.shift(), Typr.U.P.lineTo(p, x, y));
            } else {
                if ("o11" == v)
                    break;
                if ("o1234" == v || "o1235" == v || "o1236" == v || "o1237" == v)
                    "o1234" == v && (c1y = y, c2x = (c1x = x + stack.shift()) + stack.shift(), jpy = c2y = c1y + stack.shift(), c3y = c2y, c4y = y, x = (c4x = (c3x = (jpx = c2x + stack.shift()) + stack.shift()) + stack.shift()) + stack.shift(), Typr.U.P.curveTo(p, c1x, c1y, c2x, c2y, jpx, jpy), Typr.U.P.curveTo(p, c3x, c3y, c4x, c4y, x, y)), "o1235" == v && (c1x = x + stack.shift(), c1y = y + stack.shift(), c2x = c1x + stack.shift(), c2y = c1y + stack.shift(), jpx = c2x + stack.shift(), jpy = c2y + stack.shift(), c3x = jpx + stack.shift(), c3y = jpy + stack.shift(), c4x = c3x + stack.shift(), c4y = c3y + stack.shift(), x = c4x + stack.shift(), y = c4y + stack.shift(), stack.shift(), Typr.U.P.curveTo(p, c1x, c1y, c2x, c2y, jpx, jpy), Typr.U.P.curveTo(p, c3x, c3y, c4x, c4y, x, y)), "o1236" == v && (c1x = x + stack.shift(), c1y = y + stack.shift(), c2x = c1x + stack.shift(), jpy = c2y = c1y + stack.shift(), c3y = c2y, c4x = (c3x = (jpx = c2x + stack.shift()) + stack.shift()) + stack.shift(), c4y = c3y + stack.shift(), x = c4x + stack.shift(), Typr.U.P.curveTo(p, c1x, c1y, c2x, c2y, jpx, jpy), Typr.U.P.curveTo(p, c3x, c3y, c4x, c4y, x, y)), "o1237" == v && (c1x = x + stack.shift(), c1y = y + stack.shift(), c2x = c1x + stack.shift(), c2y = c1y + stack.shift(), jpx = c2x + stack.shift(), jpy = c2y + stack.shift(), c3x = jpx + stack.shift(), c3y = jpy + stack.shift(), c4x = c3x + stack.shift(), c4y = c3y + stack.shift(), Math.abs(c4x - x) > Math.abs(c4y - y) ? x = c4x + stack.shift() : y = c4y + stack.shift(), Typr.U.P.curveTo(p, c1x, c1y, c2x, c2y, jpx, jpy), Typr.U.P.curveTo(p, c3x, c3y, c4x, c4y, x, y));
                else if ("o14" == v) {
                    if (stack.length > 0 && !haveWidth && (width = stack.shift() + font.nominalWidthX, haveWidth = true), 4 == stack.length) {
                        var adx = stack.shift(),
                            ady = stack.shift(),
                            bchar = stack.shift(),
                            achar = stack.shift(),
                            bind = Typr.CFF.glyphBySE(font, bchar),
                            aind = Typr.CFF.glyphBySE(font, achar);
                        Typr.U._drawCFF(font.CharStrings[bind], state, font, p), state.x = adx, state.y = ady, Typr.U._drawCFF(font.CharStrings[aind], state, font, p);
                    }
                    open && (Typr.U.P.closePath(p), open = false);
                } else if ("o19" == v || "o20" == v) {
                    stack.length % 2 != 0 && !haveWidth && (width = stack.shift() + font.Private.nominalWidthX), nStems += stack.length >> 1, stack.length = 0, haveWidth = true, i += nStems + 7 >> 3;
                } else if ("o21" == v)
                    stack.length > 2 && !haveWidth && (width = stack.shift() + font.Private.nominalWidthX, haveWidth = true), y += stack.pop(), x += stack.pop(), open && Typr.U.P.closePath(p), Typr.U.P.moveTo(p, x, y), open = true;
                else if ("o22" == v)
                    stack.length > 1 && !haveWidth && (width = stack.shift() + font.Private.nominalWidthX, haveWidth = true), x += stack.pop(), open && Typr.U.P.closePath(p), Typr.U.P.moveTo(p, x, y), open = true;
                else if ("o25" == v) {
                    for (; stack.length > 6;)
                        x += stack.shift(), y += stack.shift(), Typr.U.P.lineTo(p, x, y);
                    c1x = x + stack.shift(), c1y = y + stack.shift(), c2x = c1x + stack.shift(), c2y = c1y + stack.shift(), x = c2x + stack.shift(), y = c2y + stack.shift(), Typr.U.P.curveTo(p, c1x, c1y, c2x, c2y, x, y);
                } else if ("o26" == v)
                    for (stack.length % 2 && (x += stack.shift()); stack.length > 0;)
                        c1x = x, c1y = y + stack.shift(), x = c2x = c1x + stack.shift(), y = (c2y = c1y + stack.shift()) + stack.shift(), Typr.U.P.curveTo(p, c1x, c1y, c2x, c2y, x, y);
                else if ("o27" == v)
                    for (stack.length % 2 && (y += stack.shift()); stack.length > 0;)
                        c1y = y, c2x = (c1x = x + stack.shift()) + stack.shift(), c2y = c1y + stack.shift(), x = c2x + stack.shift(), y = c2y, Typr.U.P.curveTo(p, c1x, c1y, c2x, c2y, x, y);
                else if ("o10" == v || "o29" == v) {
                    var obj = "o10" == v ? font.Private : font;
                    if (0 == stack.length)
                        console.log("error: empty stack");
                    else {
                        var ind = stack.pop(),
                            subr = obj.Subrs[ind + obj.Bias];
                        state.x = x, state.y = y, state.nStems = nStems, state.haveWidth = haveWidth, state.width = width, state.open = open, Typr.U._drawCFF(subr, state, font, p), x = state.x, y = state.y, nStems = state.nStems, haveWidth = state.haveWidth, width = state.width, open = state.open;
                    }
                } else if ("o30" == v || "o31" == v) {
                    var count1 = stack.length,
                        alternate = (index = 0, "o31" == v);
                    for (index += count1 - (count = -3 & count1); index < count;)
                        alternate ? (c1y = y, c2x = (c1x = x + stack.shift()) + stack.shift(), y = (c2y = c1y + stack.shift()) + stack.shift(), count - index == 5 ? (x = c2x + stack.shift(), index++) : x = c2x, alternate = false) : (c1x = x, c1y = y + stack.shift(), c2x = c1x + stack.shift(), c2y = c1y + stack.shift(), x = c2x + stack.shift(), count - index == 5 ? (y = c2y + stack.shift(), index++) : y = c2y, alternate = true), Typr.U.P.curveTo(p, c1x, c1y, c2x, c2y, x, y), index += 4;
                } else {
                    if ("o" == (v + "").charAt(0))
                        throw console.log("Unknown operation: " + v, cmds), v;
                    stack.push(v);
                }
            }
        }
        state.x = x, state.y = y, state.nStems = nStems, state.haveWidth = haveWidth, state.width = width, state.open = open;
    };

    // ---------- 解密核心（基于上方脚本方案）----------
    async function initDecryption() {
        try {

            // 2. 获取映射表（通过油猴 API）
            const mappingTable = JSON.parse(GM_getResourceText("ttf"));
            console.log('[解密] 映射表加载完成，条目数:', Object.keys(mappingTable).length);

            // 3. 定义解密函数
            function decode(iframeWindow) {
                try {
                    const styleElements = iframeWindow.document.querySelectorAll("style");
                    let tipElement = null;
                    for (const style of styleElements) {
                        if (style.textContent && style.textContent.includes("font-cxsecret")) {
                            tipElement = style;
                            break;
                        }
                    }
                    if (!tipElement) return;

                    const fontMatch = tipElement.textContent.match(/base64,([\w\W]+?)'/);
                    if (!fontMatch) return;

                    const base64 = fontMatch[1];
                    const decodedData = atob(base64);
                    const fontData = new Uint8Array(decodedData.length);
                    for (let i = 0; i < decodedData.length; i++) {
                        fontData[i] = decodedData.charCodeAt(i);
                    }

                    const font = Typr.parse(fontData);
                    const textMap = {};
                    for (let code = 19968; code < 40870; code++) {
                        let glyph = Typr.U.codeToGlyph(font, code);
                        if (glyph) {
                            let path = Typr.U.glyphToPath(font, glyph);
                            let fingerprint = md5(JSON.stringify(path)).slice(24);
                            textMap[code] = mappingTable[fingerprint];
                        }
                    }

                    const encryptedElements = iframeWindow.document.querySelectorAll(".font-cxsecret");
                    if (encryptedElements.length === 0) return;

                    encryptedElements.forEach(el => {
                        let html = el.innerHTML;
                        for (const [codeStr, realChar] of Object.entries(textMap)) {
                            const code = parseInt(codeStr);
                            const regex = new RegExp(String.fromCharCode(code), 'g');
                            html = html.replace(regex, String.fromCharCode(realChar));
                        }
                        el.innerHTML = html;
                        el.classList.remove("font-cxsecret");
                    });
                    console.log(`[解密] 完成，iframe: ${iframeWindow.location.href}`);
                } catch (err) {
                    console.error('[解密] 处理 iframe 时出错:', err);
                }
            }

            // 4. 监听并解密所有 iframe
            function observeAndDecode() {
                // 解密主窗口（通常无加密内容，但无害）
                decode(window);

                // 监听新增 iframe
                const observer = new MutationObserver((mutations) => {
                    for (const mutation of mutations) {
                        for (const node of mutation.addedNodes) {
                            if (node.tagName === 'IFRAME') {
                                node.addEventListener('load', () => {
                                    try {
                                        if (node.contentWindow) decode(node.contentWindow);
                                    } catch (e) {
                                        console.warn('[解密] 无法访问 iframe 内容（可能跨域）', e);
                                    }
                                });
                            }
                        }
                    }
                });
                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });

                // 解密已存在的 iframe
                document.querySelectorAll('iframe').forEach(iframe => {
                    if (iframe.contentWindow) {
                        try {
                            decode(iframe.contentWindow);
                        } catch (e) {}
                    }
                });
            }

            observeAndDecode();
            console.log('[解密] 初始化完成，已开始监听 iframe');
        } catch (err) {
            console.error('[解密] 初始化失败:', err);
        }
    }

    // 启动解密（不阻塞 UI 加载）
    initDecryption();

    // 加载 UI 和主应用（延迟1秒确保 DOM 稳定）
    setTimeout(() => {
        loadCss(UI_CSS);
        loadScript(INDEX_JS)
            .then(() => {
                if (unsafeWindow.ChaoxingGPT) {
                    let mountPoint = document.getElementById('chaoxing-gpt-app');
                    if (!mountPoint) {
                        mountPoint = document.createElement('div');
                        mountPoint.id = 'chaoxing-gpt-app';
                        document.body.appendChild(mountPoint);
                    }
                    // 避免重复挂载（检查是否已挂载）
                    if (!mountPoint.__mounted) {
                        unsafeWindow.ChaoxingGPT.mount(mountPoint);
                        mountPoint.__mounted = true;
                        console.log('ChaoxingGPT 应用挂载成功');
                    } else {
                        console.log('ChaoxingGPT 应用已挂载，跳过');
                    }
                } else {
                    console.error('ChaoxingGPT 对象未找到，挂载失败');
                }
            })
            .catch(err => console.error('加载主应用失败:', err));
    }, 1000);
})();
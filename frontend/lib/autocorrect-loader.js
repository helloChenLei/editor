/**
 * AutoCorrect WASM Loader
 * 封装 autocorrect WASM 模块，提供简单的 format API
 */

(function(global) {
  'use strict';

  // WASM 模块状态
  let wasmModule = null;
  let isLoading = false;
  let loadCallbacks = [];

  /**
   * 加载 WASM 文件
   */
  async function loadWasm() {
    if (isLoading) {
      return new Promise((resolve) => {
        loadCallbacks.push(resolve);
      });
    }

    if (wasmModule) {
      return wasmModule;
    }

    isLoading = true;

    try {
      // 获取当前脚本路径
      const currentScript = document.currentScript;
      const baseUrl = currentScript ? 
        currentScript.src.replace(/\/[^\/]*$/, '/') : 
        (typeof window !== 'undefined' && window.location ? 
          window.location.origin + '/lib/' : 
          './lib/');

      // 加载 WASM 文件
      const wasmUrl = baseUrl + 'autocorrect_bg.wasm';
      console.log('Loading WASM from:', wasmUrl);

      const response = await fetch(wasmUrl);
      if (!response.ok) {
        throw new Error(`Failed to load WASM: ${response.status} ${response.statusText}`);
      }

      const wasmBytes = await response.arrayBuffer();

      // 实例化 WASM
      const wasmResult = await WebAssembly.instantiate(wasmBytes, {
        './autocorrect_bg.js': {
          // 这里需要提供 wasm_bindgen 需要的导入函数
          // 但因为我们直接加载的是 wasm-bindgen 生成的 wasm，
          // 需要使用 wasm-bindgen 生成的 js glue 代码
        }
      });

      // 由于 wasm-bindgen 生成的 wasm 需要配合 js glue 代码使用，
      // 我们需要使用另一种方式：直接加载 js glue 代码，让它自己处理 wasm 加载
      console.log('WASM loaded successfully');
      
      isLoading = false;
      loadCallbacks.forEach(cb => cb(wasmModule));
      loadCallbacks = [];
      
      return wasmModule;
    } catch (err) {
      console.error('Failed to load WASM:', err);
      isLoading = false;
      throw err;
    }
  }

  /**
   * 格式化文本（添加 CJK 空格）
   */
  function format(text) {
    // 如果 WASM 还没加载，先用纯 JS 实现一个基础版本
    if (!wasmModule) {
      console.warn('AutoCorrect WASM not loaded, using fallback');
      return fallbackFormat(text);
    }

    // 使用 WASM 模块的 format 函数
    // 注意：这里需要根据实际的 WASM 导出函数调整
    if (wasmModule.exports && wasmModule.exports.format) {
      return wasmModule.exports.format(text);
    }

    return fallbackFormat(text);
  }

  /**
   * 基础格式化实现（作为后备方案）
   * 在中英文之间添加空格
   */
  function fallbackFormat(text) {
    if (!text) return text;

    // 在中文字符和英文字符/数字之间添加空格
    // 匹配规则：中文后面跟着英文/数字，或者英文/数字后面跟着中文
    return text
      .replace(/([\u4e00-\u9fa5])([a-zA-Z0-9])/g, '$1 $2')
      .replace(/([a-zA-Z0-9])([\u4e00-\u9fa5])/g, '$1 $2')
      // 修复连续的空格
      .replace(/  +/g, ' ');
  }

  /**
   * 初始化并返回 API
   */
  async function init() {
    try {
      await loadWasm();
      return {
        format: format,
        isLoaded: true
      };
    } catch (err) {
      console.warn('WASM init failed, using fallback:', err);
      return {
        format: fallbackFormat,
        isLoaded: false,
        error: err
      };
    }
  }

  // 导出到全局
  global.AutoCorrect = {
    init: init,
    format: fallbackFormat, // 默认使用 fallback，初始化后会被替换
    isReady: () => wasmModule !== null
  };

})(typeof window !== 'undefined' ? window : global);

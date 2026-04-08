/**
 * API 客户端
 * 用于与后端分享服务通信
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

/**
 * 默认 API 配置
 */
const DEFAULT_CONFIG = {
  baseURL: process.env.WXMD_API_URL || 'http://localhost:8080',
  timeout: parseInt(process.env.WXMD_API_TIMEOUT) || 30000,
};

/**
 * 全局请求配置（可由 CLI 选项覆盖）
 */
let globalRequestConfig = {
  traceId: null,
  timeout: null,
};

/**
 * 设置全局请求配置
 * @param {Object} config
 * @param {string} config.traceId - Trace ID 用于请求追踪
 * @param {number} config.timeout - 请求超时（毫秒）
 */
function setGlobalConfig(config) {
  if (config.traceId !== undefined) {
    globalRequestConfig.traceId = config.traceId;
  }
  if (config.timeout !== undefined && config.timeout !== null) {
    globalRequestConfig.timeout = parseInt(config.timeout);
  }
}

/**
 * 获取请求配置（合并默认值、环境变量和全局配置）
 */
function getRequestConfig() {
  return {
    baseURL: globalRequestConfig.baseURL || DEFAULT_CONFIG.baseURL,
    timeout: globalRequestConfig.timeout || DEFAULT_CONFIG.timeout,
    traceId: globalRequestConfig.traceId,
  };
}

/**
 * 发送 HTTP 请求
 * @param {string} method - HTTP 方法
 * @param {string} path - API 路径
 * @param {Object} data - 请求体数据
 * @param {Object} headers - 额外请求头
 * @returns {Promise<Object>}
 */
function request(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const config = getRequestConfig();
    const url = new URL(path, config.baseURL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    // 构建请求头
    const requestHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'wxmd-cli/1.0.0',
      ...headers,
    };

    // 添加 Trace ID 如果有
    if (config.traceId) {
      requestHeaders['X-Trace-Id'] = config.traceId;
    }

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method.toUpperCase(),
      headers: requestHeaders,
      timeout: config.timeout,
    };

    const req = client.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const responseData = body ? JSON.parse(body) : null;

          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({
              success: true,
              status: res.statusCode,
              data: responseData,
            });
          } else {
            // 非 2xx 也 resolve，让业务层处理错误分类
            resolve({
              success: false,
              status: res.statusCode,
              error: responseData?.error || `HTTP ${res.statusCode}`,
              data: responseData,
            });
          }
        } catch (e) {
          // JSON 解析失败但有响应，说明是非 JSON 响应（如 HTML）
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({
              success: true,
              status: res.statusCode,
              data: body, // 返回原始 body
              isRaw: true,
            });
          } else {
            resolve({
              success: false,
              status: res.statusCode,
              error: `HTTP ${res.statusCode}`,
              rawBody: body,
            });
          }
        }
      });
    });

    req.on('error', (err) => {
      reject({
        success: false,
        error: err.message,
        code: err.code,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject({
        success: false,
        error: 'Request timeout',
        code: 'TIMEOUT',
      });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * 创建分享
 * @param {Object} params
 * @param {string} params.content - 内容
 * @param {string} params.style - 样式名称
 * @returns {Promise<Object>}
 */
async function createShare({ content, style }) {
  return request('POST', '/api/share', { content, style });
}

/**
 * 获取分享
 * @param {string} id - 分享 ID
 * @returns {Promise<Object>}
 */
async function getShare(id) {
  return request('GET', `/api/share/${encodeURIComponent(id)}`);
}

/**
 * 删除分享（需要密码）
 * @param {string} id - 分享 ID
 * @param {string} password - 访问密码
 * @returns {Promise<Object>}
 */
async function deleteShare(id, password) {
  return request('DELETE', `/api/share/${encodeURIComponent(id)}`, null, {
    'X-List-Password': password,
  });
}

/**
 * 获取分享列表（需要密码）
 * @param {string} password - 访问密码
 * @returns {Promise<Object>}
 */
async function listShares(password) {
  return request('GET', '/api/shares', null, {
    'X-List-Password': password,
  });
}

/**
 * 健康检查
 * 使用 /api/share 路径（OPTIONS 方法）来检测 API 可用性
 * @returns {Promise<Object>}
 */
async function healthCheck() {
  try {
    // 使用 /api/share 端点检测，避免根路径返回 HTML 导致误判
    const result = await request('OPTIONS', '/api/share');
    return {
      healthy: true,
      status: result.status,
      apiEndpoint: '/api/share',
    };
  } catch (err) {
    // 如果是 ECONNREFUSED 等网络错误，判定为不健康
    const isNetworkError = err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND';
    return {
      healthy: false,
      error: err.error || err.message,
      code: err.code,
      isNetworkError,
    };
  }
}

module.exports = {
  createShare,
  getShare,
  deleteShare,
  listShares,
  healthCheck,
  request,
  setGlobalConfig,
};

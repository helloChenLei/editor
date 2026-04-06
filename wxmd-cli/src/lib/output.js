/**
 * 结构化输出契约
 * 统一 CLI 输出格式，面向 Agent 设计
 */

const cliVersion = require('../../package.json').version;

/**
 * 退出码映射
 */
const EXIT_CODES = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  INVALID_ARGUMENTS: 2,
  NETWORK_ERROR: 3,
  SERVER_ERROR: 4,
  NOT_FOUND: 5,
  PERMISSION_DENIED: 6,
  TIMEOUT: 7,
};

/**
 * 生成成功响应
 * @param {any} data - 数据内容
 * @param {Object} meta - 元数据
 * @returns {Object}
 */
function success(data, meta = {}) {
  return {
    ok: true,
    data,
    meta: {
      cliVersion,
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

/**
 * 生成错误响应
 * @param {string} code - 错误码
 * @param {string} type - 错误类型
 * @param {string} message - 错误消息
 * @param {Object} options - 其他选项
 * @returns {Object}
 */
function error(code, type, message, options = {}) {
  const {
    retryable = false,
    where = null,
    actionHint = null,
    details = null,
  } = options;

  return {
    ok: false,
    error: {
      code,
      type,
      message,
      retryable,
      ...(where && { where }),
      ...(actionHint && { actionHint }),
      ...(details && { details }),
    },
    meta: {
      cliVersion,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * 格式化输出
 * @param {Object} output - 输出对象
 * @param {string} format - 格式: json, text, html
 * @returns {string}
 */
function formatOutput(output, format = 'json') {
  switch (format.toLowerCase()) {
    case 'json':
      return JSON.stringify(output, null, 2);
    case 'text':
      return formatAsText(output);
    case 'html':
      return formatAsHtml(output);
    default:
      return JSON.stringify(output, null, 2);
  }
}

/**
 * 格式化为纯文本
 * @param {Object} output
 * @returns {string}
 */
function formatAsText(output) {
  if (output.ok) {
    // 成功响应
    if (typeof output.data === 'string') {
      return output.data;
    }
    return JSON.stringify(output.data, null, 2);
  } else {
    // 错误响应
    const err = output.error;
    let text = `Error: ${err.message}\n`;
    text += `Code: ${err.code}\n`;
    text += `Type: ${err.type}\n`;
    if (err.retryable) {
      text += `Retryable: Yes\n`;
    }
    if (err.actionHint) {
      text += `Hint: ${err.actionHint}\n`;
    }
    return text;
  }
}

/**
 * 格式化为 HTML（用于错误页面）
 * @param {Object} output
 * @returns {string}
 */
function formatAsHtml(output) {
  if (output.ok) {
    if (typeof output.data === 'string' && output.data.startsWith('<')) {
      return output.data;
    }
    return `<pre>${JSON.stringify(output.data, null, 2)}</pre>`;
  } else {
    const err = output.error;
    return `
<!DOCTYPE html>
<html>
<head><title>Error</title></head>
<body>
  <h1>Error: ${escapeHtml(err.message)}</h1>
  <p>Code: ${escapeHtml(err.code)}</p>
  <p>Type: ${escapeHtml(err.type)}</p>
  ${err.actionHint ? `<p>Hint: ${escapeHtml(err.actionHint)}</p>` : ''}
</body>
</html>`;
  }
}

/**
 * HTML 转义
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 获取对应退出码
 * @param {Object} output
 * @returns {number}
 */
function getExitCode(output) {
  if (output.ok) {
    return EXIT_CODES.SUCCESS;
  }

  const errorType = output.error?.type;
  switch (errorType) {
    case 'INVALID_ARGUMENTS':
      return EXIT_CODES.INVALID_ARGUMENTS;
    case 'NETWORK_ERROR':
      return EXIT_CODES.NETWORK_ERROR;
    case 'SERVER_ERROR':
      return EXIT_CODES.SERVER_ERROR;
    case 'NOT_FOUND':
      return EXIT_CODES.NOT_FOUND;
    case 'PERMISSION_DENIED':
      return EXIT_CODES.PERMISSION_DENIED;
    case 'TIMEOUT':
      return EXIT_CODES.TIMEOUT;
    default:
      return EXIT_CODES.GENERAL_ERROR;
  }
}

module.exports = {
  EXIT_CODES,
  success,
  error,
  formatOutput,
  getExitCode,
};

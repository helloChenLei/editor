/**
 * typeset 命令
 * Markdown 排版，输出可发布的 HTML
 */

const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const { renderMarkdown } = require('../lib/renderer');
const { success, error, formatOutput, getExitCode } = require('../lib/output');
const { hasStyle, getDefaultStyle } = require('../lib/styles');

/**
 * 从文件或 stdin 读取内容
 * @param {string|null} filePath
 * @returns {Promise<string>}
 */
async function readInput(filePath) {
  if (filePath) {
    // 从文件读取
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    return fs.readFileSync(filePath, 'utf-8');
  } else {
    // 从 stdin 读取
    return new Promise((resolve, reject) => {
      let data = '';
      process.stdin.setEncoding('utf8');

      process.stdin.on('data', (chunk) => {
        data += chunk;
      });

      process.stdin.on('end', () => {
        resolve(data);
      });

      process.stdin.on('error', (err) => {
        reject(err);
      });

      // 如果没有数据，检查是否是 TTY
      if (process.stdin.isTTY) {
        resolve('');
      }
    });
  }
}

/**
 * 执行 typeset 命令
 */
async function typesetAction(options) {
  try {
    const { input, style, output, out: outputFile } = options;

    // 验证样式
    if (!hasStyle(style)) {
      const errorOutput = error(
        'INVALID_STYLE',
        'INVALID_ARGUMENTS',
        `Style '${style}' not found`,
        {
          actionHint: `Run 'wxmd-cli styles list' to see available styles`,
        }
      );
      console.log(formatOutput(errorOutput, output));
      process.exit(getExitCode(errorOutput));
      return;
    }

    // 读取输入
    let content;
    try {
      content = await readInput(input);
    } catch (err) {
      const output = error(
        'READ_ERROR',
        'INVALID_ARGUMENTS',
        err.message,
        {
          actionHint: 'Check if the file exists and is readable',
        }
      );
      console.log(formatOutput(output, options.output));
      process.exit(getExitCode(output));
      return;
    }

    // 检查内容是否为空
    if (!content || !content.trim()) {
      const output = error(
        'EMPTY_CONTENT',
        'INVALID_ARGUMENTS',
        'No markdown content provided',
        {
          actionHint: 'Provide content via --input file.md or stdin',
        }
      );
      console.log(formatOutput(output, options.output));
      process.exit(getExitCode(output));
      return;
    }

    // 渲染 Markdown
    const html = renderMarkdown(content, style);

    // 构建输出
    let result;
    if (outputFile) {
      // 写入文件
      fs.writeFileSync(outputFile, html, 'utf-8');
      result = success(
        { html, file: outputFile },
        { inputSize: content.length, outputSize: html.length }
      );
    } else {
      // 输出到 stdout
      result = success(
        html,
        { inputSize: content.length, outputSize: html.length }
      );
    }

    // 格式化并输出
    const formatted = formatOutput(result, output);
    console.log(formatted);
    process.exit(getExitCode(result));

  } catch (err) {
    const output = error(
      'RENDER_ERROR',
      'GENERAL_ERROR',
      err.message,
      {
        details: err.stack,
      }
    );
    console.log(formatOutput(output, options.output));
    process.exit(getExitCode(output));
  }
}

/**
 * 注册 typeset 命令
 */
function registerTypesetCommand(parentProgram) {
  parentProgram
    .command('typeset')
    .description('Render markdown to styled HTML')
    .option('-i, --input <file>', 'Input markdown file (default: stdin)')
    .option('-s, --style <name>', 'Style theme', getDefaultStyle())
    .option('--out <file>', 'Output file (default: stdout)')
    .action((options, command) => {
      // 合并全局选项
      const globalOpts = command.optsWithGlobals();
      options.output = globalOpts.output || options.output;
      options.traceId = globalOpts.traceId;
      options.timeout = globalOpts.timeout;
      return typesetAction(options);
    });
}

module.exports = {
  registerTypesetCommand,
  typesetAction,
};

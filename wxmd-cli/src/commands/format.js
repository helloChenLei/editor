/**
 * format 命令
 * 使用 AutoCorrect 自动修复 Markdown 中的 CJK 空格和标点问题
 */

const fs = require('fs');
const { program } = require('commander');
const { success, error, formatOutput, getExitCode } = require('../lib/output');

// 动态导入 autocorrect (ESM 包)
let autocorrect;
async function loadAutocorrect() {
  if (!autocorrect) {
    const mod = await import('@huacnlee/autocorrect');
    autocorrect = mod.default || mod;
  }
  return autocorrect;
}

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
 * 执行 format 命令
 */
async function formatAction(options) {
  try {
    const { input, output, out: outputFile } = options;

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
        'No content provided',
        {
          actionHint: 'Provide content via --input file.md or stdin',
        }
      );
      console.log(formatOutput(output, options.output));
      process.exit(getExitCode(output));
      return;
    }

    // 加载 autocorrect
    const ac = await loadAutocorrect();

    // 执行修复
    const originalLength = content.length;
    const fixed = ac.format(content, { filetype: 'markdown' });
    const changeCount = fixed.length - originalLength;

    // 构建输出
    let result;
    if (outputFile) {
      // 写入文件
      fs.writeFileSync(outputFile, fixed, 'utf-8');
      result = success(
        { content: fixed, file: outputFile },
        { 
          inputSize: originalLength, 
          outputSize: fixed.length,
          changes: Math.abs(changeCount),
          filetype: 'markdown'
        }
      );
    } else {
      // 输出到 stdout
      result = success(
        fixed,
        { 
          inputSize: originalLength, 
          outputSize: fixed.length,
          changes: Math.abs(changeCount),
          filetype: 'markdown'
        }
      );
    }

    // 格式化并输出
    const formatted = formatOutput(result, output);
    console.log(formatted);
    process.exit(getExitCode(result));

  } catch (err) {
    const output = error(
      'FORMAT_ERROR',
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
 * 注册 format 命令
 */
function registerFormatCommand(parentProgram) {
  parentProgram
    .command('format')
    .description('Auto-fix CJK spacing and punctuation in markdown')
    .option('-i, --input <file>', 'Input file (default: stdin)')
    .option('--out <file>', 'Output file (default: stdout)')
    .action((options, command) => {
      // 合并全局选项
      const globalOpts = command.optsWithGlobals();
      options.output = globalOpts.output || options.output;
      options.traceId = globalOpts.traceId;
      options.timeout = globalOpts.timeout;
      return formatAction(options);
    });
}

module.exports = {
  registerFormatCommand,
  formatAction,
};

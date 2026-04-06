/**
 * styles 命令
 * 列出可用样式
 */

const { listStyles } = require('../lib/styles');
const { success, formatOutput, getExitCode } = require('../lib/output');

/**
 * 执行 styles list 命令
 */
async function stylesListAction(options) {
  try {
    const { output, fields } = options;

    const styles = listStyles();

    // 过滤字段
    let data = styles;
    if (fields) {
      const fieldList = fields.split(',').map(f => f.trim());
      data = styles.map(style => {
        const filtered = {};
        fieldList.forEach(field => {
          if (field in style) {
            filtered[field] = style[field];
          }
        });
        return filtered;
      });
    }

    const result = success(data, { count: styles.length });
    console.log(formatOutput(result, output));
    process.exit(getExitCode(result));

  } catch (err) {
    const { error, formatOutput, getExitCode } = require('../lib/output');
    const result = error(
      'LIST_ERROR',
      'GENERAL_ERROR',
      err.message,
      {
        details: err.stack,
      }
    );
    console.log(formatOutput(result, options.output));
    process.exit(getExitCode(result));
  }
}

/**
 * 注册 styles 命令
 */
function registerStylesCommand(parentProgram) {
  const stylesCmd = parentProgram
    .command('styles')
    .description('Style management - list available themes');

  stylesCmd
    .command('list')
    .description('List available styles')
    .option('-f, --fields <list>', 'Comma-separated fields to show (e.g., key,name)')
    .action((options, command) => {
      const globalOpts = command.optsWithGlobals();
      options.output = globalOpts.output || options.output;
      options.traceId = globalOpts.traceId;
      options.timeout = globalOpts.timeout;
      return stylesListAction(options);
    });
}

module.exports = {
  registerStylesCommand,
};

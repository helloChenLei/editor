/**
 * doctor 命令
 * 检查本地依赖与服务连通性
 */

const fs = require('fs');
const path = require('path');
const { healthCheck, setGlobalConfig } = require('../lib/api');
const { success, error, formatOutput, getExitCode } = require('../lib/output');

/**
 * 检查 Node.js 版本
 */
function checkNodeVersion() {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0]);
  return {
    name: 'Node.js',
    status: major >= 18 ? 'ok' : 'error',
    version,
    message: major >= 18 ? null : 'Node.js 18+ required',
  };
}

/**
 * 检查依赖安装
 */
function checkDependencies() {
  const pkgPath = path.join(__dirname, '../../package.json');
  const nodeModulesPath = path.join(__dirname, '../../node_modules');

  if (!fs.existsSync(pkgPath)) {
    return {
      name: 'Dependencies',
      status: 'error',
      message: 'package.json not found',
    };
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const deps = Object.keys(pkg.dependencies || {});

  if (deps.length === 0) {
    return {
      name: 'Dependencies',
      status: 'ok',
      message: 'No dependencies required',
    };
  }

  const missing = deps.filter(dep => {
    return !fs.existsSync(path.join(nodeModulesPath, dep));
  });

  if (missing.length > 0) {
    return {
      name: 'Dependencies',
      status: 'error',
      message: `Missing dependencies: ${missing.join(', ')}`,
      hint: 'Run: pnpm install',
    };
  }

  return {
    name: 'Dependencies',
    status: 'ok',
    message: `${deps.length} packages installed`,
  };
}

/**
 * 检查 API 连接
 */
async function checkApiConnection() {
  const result = await healthCheck();

  if (result.healthy) {
    return {
      name: 'API Server',
      status: 'ok',
      url: process.env.WXMD_API_URL || 'http://localhost:8080',
      message: 'Connected',
    };
  } else {
    return {
      name: 'API Server',
      status: 'warning',
      url: process.env.WXMD_API_URL || 'http://localhost:8080',
      message: result.error || 'Not reachable',
      hint: 'Check if server is running or set WXMD_API_URL',
    };
  }
}

/**
 * 检查环境变量
 */
function checkEnv() {
  const apiUrl = process.env.WXMD_API_URL;

  return {
    name: 'Environment',
    status: 'ok',
    message: apiUrl
      ? `WXMD_API_URL=${apiUrl}`
      : 'Using default API URL (http://localhost:8080)',
  };
}

/**
 * 执行 doctor 命令
 */
async function doctorAction(options) {
  try {
    const { output, traceId, timeout } = options;

    // 设置 API 全局配置
    setGlobalConfig({ traceId, timeout });

    const checks = [];

    // 运行各项检查
    checks.push(checkNodeVersion());
    checks.push(checkDependencies());
    checks.push(checkEnv());
    checks.push(await checkApiConnection());

    // 汇总结果
    const errors = checks.filter(c => c.status === 'error');
    const warnings = checks.filter(c => c.status === 'warning');

    const allOk = errors.length === 0;

    const result = success(
      {
        healthy: allOk,
        summary: {
          total: checks.length,
          ok: checks.filter(c => c.status === 'ok').length,
          warning: warnings.length,
          error: errors.length,
        },
        checks,
      },
      {
        healthy: allOk,
      }
    );

    console.log(formatOutput(result, output));

    // 如果有错误，提供修复建议
    if (!allOk) {
      console.error('\n--- Fix Suggestions ---');
      errors.forEach(check => {
        if (check.hint) {
          console.error(`${check.name}: ${check.hint}`);
        }
      });
    }

    process.exit(allOk ? 0 : 1);

  } catch (err) {
    const result = error(
      'DOCTOR_ERROR',
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
 * 注册 doctor 命令
 */
function registerDoctorCommand(parentProgram) {
  parentProgram
    .command('doctor')
    .description('Check local dependencies and service connectivity')
    .action((options, command) => {
      const globalOpts = command.optsWithGlobals();
      options.output = globalOpts.output || options.output;
      options.traceId = globalOpts.traceId;
      options.timeout = globalOpts.timeout;
      return doctorAction(options);
    });
}

module.exports = {
  registerDoctorCommand,
};

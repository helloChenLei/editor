# AutoCorrect 空格修复功能集成计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 集成 autocorrect 自动修复功能到前端编辑器和 CLI 工具，添加「一键修复空格」按钮和 `format` 命令

**Architecture:** 
- **前端**: 使用 `@huacnlee/autocorrect` WASM 包直接在浏览器执行修复
- **CLI**: 使用 `@huacnlee/autocorrect` npm 包，支持文件输入和 stdin

**Tech Stack:** 
- `@huacnlee/autocorrect` - Rust 编译的 WebAssembly/Node.js 包
- Vue 3 - 前端框架
- Commander.js - CLI 框架

---

## 前置知识

### AutoCorrect API

```javascript
// 前端 WASM 全局对象
window.autocorrect = {
  format(text: string, filetype?: string): string,
  lint(text: string, filetype?: string): LintResult
}

// Node.js 包
const autocorrect = require('@huacnlee/autocorrect');
autocorrect.format(text, { filetype: 'markdown' })
```

---

## Task 1: 前端 - 添加 CDN 引入

**Files:**
- Modify: `frontend/index.html:19-30` (在 mermaid 和 turndown 之间添加)

**Step 1: 添加 autocorrect WASM CDN**

```html
<!-- AutoCorrect - 自动修复 CJK 空格和标点 -->
<script src="https://cdn.jsdelivr.net/npm/@huacnlee/autocorrect@latest/dist/autocorrect.js"></script>
```

插入位置：在 mermaid 之后，turndown 之前（第 23 行之前）

**Step 2: Commit**

```bash
git add frontend/index.html
git commit -m "feat: add autocorrect WASM CDN for text fixing"
```

---

## Task 2: 前端 - 添加修复按钮

**Files:**
- Modify: `frontend/index.html:1524-1543` (编辑器底部工具栏)

**Step 1: 在编辑器底部工具栏添加按钮**

在 `editor-footer` 的 `upload-section` 和 `char-count` 之间添加按钮：

```html
<!-- 在 .upload-section 和 .char-count 之间添加 -->
<button
  class="fix-btn"
  @click="fixTextSpaces"
  :disabled="!markdownInput"
  title="自动修复 CJK 空格和标点"
>
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
  <span>修复空格</span>
</button>
```

**Step 2: 添加按钮样式**

在 `<style>` 标签内添加：

```css
/* 修复空格按钮 */
.fix-btn {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 6px 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  transition: all 120ms;
  color: var(--color-secondary);
  font-size: 13px;
}

.fix-btn:hover {
  background: var(--color-bg);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.fix-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.fix-btn svg {
  width: 14px;
  height: 14px;
}
```

**Step 3: Commit**

```bash
git add frontend/index.html
git commit -m "feat: add autocorrect fix button to editor toolbar"
```

---

## Task 3: 前端 - 添加修复方法

**Files:**
- Modify: `frontend/app.js:188-201` (methods 对象)

**Step 1: 在 methods 中添加 fixTextSpaces 方法**

在 `...SafeEditorMethods` 之前添加：

```javascript
/**
 * 自动修复文本中的 CJK 空格和标点问题
 */
fixTextSpaces() {
  if (!this.markdownInput) {
    this.showToast('没有可修复的内容', 'error');
    return;
  }

  // 检查 autocorrect 是否可用
  if (typeof autocorrect === 'undefined' || !autocorrect.format) {
    this.showToast('AutoCorrect 未加载', 'error');
    console.error('autocorrect global object not found');
    return;
  }

  try {
    // 记录原始长度
    const originalLength = this.markdownInput.length;
    
    // 调用 autocorrect 修复
    const fixed = autocorrect.format(this.markdownInput, 'markdown');
    
    // 更新内容
    this.markdownInput = fixed;
    
    // 显示结果
    const changeCount = Math.abs(fixed.length - originalLength);
    if (changeCount > 0) {
      this.showToast(`已修复 ${changeCount} 处格式问题`, 'success');
    } else {
      this.showToast('没有发现需要修复的问题', 'success');
    }
    
    console.log(`AutoCorrect: ${originalLength} -> ${fixed.length} chars (${changeCount} changes)`);
  } catch (err) {
    console.error('AutoCorrect error:', err);
    this.showToast('修复失败: ' + err.message, 'error');
  }
}
```

**Step 2: Commit**

```bash
git add frontend/app.js
git commit -m "feat: add fixTextSpaces method for autocorrect integration"
```

---

## Task 4: CLI - 添加依赖

**Files:**
- Modify: `wxmd-cli/package.json:50-56` (dependencies 部分)

**Step 1: 添加 autocorrect 依赖**

在 dependencies 中添加：

```json
"@huacnlee/autocorrect": "^2.16.3"
```

**Step 2: Install 依赖**

```bash
cd wxmd-cli
pnpm install
```

**Step 3: Commit**

```bash
git add wxmd-cli/package.json wxmd-cli/pnpm-lock.yaml
git commit -m "feat(cli): add @huacnlee/autocorrect dependency"
```

---

## Task 5: CLI - 创建 format 命令

**Files:**
- Create: `wxmd-cli/src/commands/format.js`

**Step 1: 创建 format.js 命令文件**

```javascript
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
```

**Step 2: Commit**

```bash
git add wxmd-cli/src/commands/format.js
git commit -m "feat(cli): create format command for autocorrect integration"
```

---

## Task 6: CLI - 注册 format 命令

**Files:**
- Modify: `wxmd-cli/src/index.js:11-15` (导入部分)
- Modify: `wxmd-cli/src/index.js:35-38` (注册命令部分)
- Modify: `wxmd-cli/src/index.js:44` (帮助信息)

**Step 1: 导入 format 命令**

在第 14-15 行（styles command 之后）添加：

```javascript
const { registerFormatCommand } = require('./commands/format');
```

**Step 2: 注册命令**

在第 38 行（styles command 之后）添加：

```javascript
registerFormatCommand(program);
```

**Step 3: 更新帮助信息示例**

在第 44-48 行添加示例：

```javascript
console.log('  $ wxmd-cli format --input article.md --out fixed.md');
console.log('  $ echo "hello世界" | wxmd-cli format');
```

**Step 4: Commit**

```bash
git add wxmd-cli/src/index.js
git commit -m "feat(cli): register format command in main program"
```

---

## Task 7: 测试前端功能

**Files:**
- Test manually: Open `http://localhost:8080` in browser

**Step 1: 启动服务**

```bash
cd /Users/wangzhi/project/2026-02-17-alchaincyf-huasheng_editor
./start.sh
```

**Step 2: 测试场景**

在编辑器输入以下内容测试修复功能：

```markdown
# 你好World

这是一个test文章，检查CJK和English混排时的space问题。

- 没有space的情况: hello世界
- 标点符号问题: hello。world
```

**Step 3: 点击「修复空格」按钮**

期望结果：
- 标题变成 `# 你好 World`
- `test文章` 变成 `test 文章`
- `CJK和English` 变成 `CJK 和 English`
- `hello世界` 变成 `hello 世界`
- 显示 Toast 提示修复了 X 处问题

**Step 4: 验证失败处理**

清空编辑器，点击按钮，应显示「没有可修复的内容」

---

## Task 8: 测试 CLI 功能

**Files:**
- Test via terminal commands

**Step 1: 测试 stdin 输入**

```bash
cd wxmd-cli
echo "hello世界，你好World" | node src/index.js format
```

**Expected Output:**
```json
{
  "ok": true,
  "data": "hello 世界，你好 World",
  "meta": {
    "inputSize": 17,
    "outputSize": 19,
    "changes": 2,
    "filetype": "markdown",
    "cliVersion": "1.0.0",
    "timestamp": "..."
  }
}
```

**Step 2: 测试文件输入输出**

```bash
# 创建测试文件
echo "这是一个test" > /tmp/test.md

# 执行修复
node src/index.js format --input /tmp/test.md --out /tmp/fixed.md

# 验证结果
cat /tmp/fixed.md
# 期望输出: 这是一个 test
```

**Step 3: 测试错误处理**

```bash
# 测试文件不存在
node src/index.js format --input /nonexistent.md
# Expected: 错误输出 "File not found"

# 测试空内容
echo "" | node src/index.js format
# Expected: 错误输出 "No content provided"
```

**Step 4: Commit 测试文档（可选）**

```bash
# 如果创建了测试用例文件
git add tests/
git commit -m "test: add format command tests"
```

---

## Task 9: 更新文档

**Files:**
- Modify: `README.md:113-130` (CLI 使用部分)
- Modify: `wxmd-cli/README.md` (CLI 详细文档)

**Step 1: 更新主 README.md 的 CLI 部分**

在 CLI 快速使用部分（第 115-130 行）添加 format 命令：

```markdown
```bash
# Markdown 排版（本地执行）
wxmd-cli typeset --input article.md --style wechat-tech

# 自动修复空格和标点
wxmd-cli format --input article.md --out fixed.md

# 从 stdin 读取并修复
echo "hello世界" | wxmd-cli format
```
```

**Step 2: 更新 wxmd-cli/README.md**

在文件末尾添加 format 命令文档：

```markdown
### format 命令

使用 AutoCorrect 自动修复 Markdown 中的 CJK 空格和标点问题。

```bash
# 修复文件并输出到新文件
wxmd-cli format --input article.md --out fixed.md

# 从 stdin 读取并输出到 stdout
echo "hello世界，你好World" | wxmd-cli format

# JSON 格式输出
wxmd-cli format --input article.md --output json
```

**功能说明：**
- 自动在中英文之间添加空格（CJK 和 English 之间）
- 纠正标点符号（中文内容使用全角标点，英文内容使用半角标点）
- 修复全角字符和半宽字符问题

**使用场景：**
- 批量修复现有 Markdown 文件
- 集成到 CI/CD 流水线进行文案检查
- 配合 `typeset` 命令使用：先修复，再排版
```

**Step 3: Commit**

```bash
git add README.md wxmd-cli/README.md
git commit -m "docs: add format command documentation"
```

---

## Summary of Changes

### 前端修改
1. `frontend/index.html` - 添加 CDN 引入和按钮 UI
2. `frontend/app.js` - 添加 fixTextSpaces 方法

### CLI 修改
1. `wxmd-cli/package.json` - 添加依赖
2. `wxmd-cli/src/commands/format.js` - 创建命令文件（新文件）
3. `wxmd-cli/src/index.js` - 注册命令
4. `wxmd-cli/README.md` - 更新文档

### 文档更新
1. `README.md` - 添加 format 命令到快速使用指南

---

## 测试检查清单

- [ ] 前端：CDN 加载成功，autocorrect 全局对象可用
- [ ] 前端：按钮在无内容时禁用，有内容时启用
- [ ] 前端：点击按钮正确修复 CJK 空格问题
- [ ] 前端：Toast 提示显示正确的修复数量
- [ ] CLI：`wxmd-cli format --help` 显示正确帮助
- [ ] CLI：`echo "test" | wxmd-cli format` 正常工作
- [ ] CLI：`wxmd-cli format --input file.md --out out.md` 正常工作
- [ ] CLI：错误处理（文件不存在、空内容）正常工作
- [ ] CLI：JSON 输出格式正确

---

## 命令速查

```bash
# 前端开发
cd /Users/wangzhi/project/2026-02-17-alchaincyf-huasheng_editor
./start.sh

# CLI 开发
cd wxmd-cli
pnpm install
node src/index.js format --help
echo "hello世界" | node src/index.js format

# 提交
git add -A
git commit -m "feat: integrate autocorrect format feature"
```

# @foolgry/wxmd-cli

微信公众号 Markdown 编辑器 CLI - Agent-First 命令行工具。

将 Markdown 转换为微信公众号可用的 HTML，支持 18 种精美样式主题。

[![npm version](https://badge.fury.io/js/@foolgry%2Fwxmd-cli.svg)](https://badge.fury.io/js/@foolgry%2Fwxmd-cli)

## 安装

```bash
# 全局安装（推荐）
npm install -g @foolgry/wxmd-cli

# 使用 pnpm
pnpm add -g @foolgry/wxmd-cli

# 使用 yarn
yarn global add @foolgry/wxmd-cli
```

## 快速开始

```bash
# 排版 Markdown 文件
wxmd-cli typeset --input article.md --style wechat-tech

# 输出 HTML 到文件
wxmd-cli typeset --input article.md --style wechat-default --out article.html

# 从 stdin 读取
echo "# Hello World" | wxmd-cli typeset --style wechat-elegant

# 查看所有可用样式
wxmd-cli styles list

# 检查环境
doctor
```

## 命令

### `typeset` - Markdown 排版

将 Markdown 转换为样式化的 HTML。

```bash
wxmd-cli typeset --input <file> --style <style> [options]

选项：
  -i, --input <file>    输入文件（默认从 stdin 读取）
  -s, --style <name>    样式主题（默认: wechat-default）
  -o, --output <format> 输出格式: json, html, text（默认: json）
      --out <file>      输出到文件（默认输出到 stdout）
```

**示例：**

```bash
# 基础用法
wxmd-cli typeset --input article.md

# 指定样式
wxmd-cli typeset --input article.md --style wechat-tech

# 输出 HTML 到文件
wxmd-cli typeset --input article.md --style wechat-elegant --out article.html

# 管道输入
  cat article.md | wxmd-cli typeset --style wechat-nyt --output html
```

### `share create` - 创建分享

创建在线分享链接（需要后端服务器）。

```bash
wxmd-cli share create --input <file> --style <style>
```

**示例：**

```bash
wxmd-cli share create --input article.md --style wechat-default
# 输出: { "id": "abc123", "url": "http://...", "createdAt": "..." }
```

### `share get` - 获取分享

根据 ID 获取分享内容。

```bash
wxmd-cli share get <id>
```

### `styles list` - 列出样式

查看所有可用的 18 种排版样式。

```bash
wxmd-cli styles list
# 输出样式列表: wechat-default, wechat-tech, wechat-elegant, wechat-nyt, ...
```

### `doctor` - 环境检查

检查本地环境和 API 连接状态。

```bash
wxmd-cli doctor
```

## 支持的样式主题

| 样式键名 | 名称 | 特点 |
|---------|------|------|
| `wechat-default` | 默认公众号风格 | 经典微信风格，清晰易读 |
| `wechat-tech` | 技术风格 | 代码友好，蓝色主题 |
| `wechat-elegant` | 优雅简约 | 宋体，文艺气息 |
| `wechat-nyt` | 纽约时报 | 报纸排版风格 |
| `wechat-apple` | Apple 极简 | 苹果设计美学 |
| `latepost-depth` | 晚点风格 | 深红色调，深度报道 |
| `wechat-ft` | 金融时报 | 米黄色背景，财经风格 |
| `wechat-anthropic` | Claude | 渐变色标题，现代感 |
| `wechat-jonyive` | Jony Ive | 苹果前设计师风格 |
| `wechat-deepread` | 深度阅读 | GitHub 风格，技术文档 |
| `wechat-medium` | Medium 长文 | 博客平台风格 |
| `kenya-emptiness` | 原研哉·空 | 留白设计，日式极简 |
| `hische-editorial` | Hische·编辑部 | 衬线字体，编辑风格 |
| `ando-concrete` | 安藤·清水 | 混凝土质感，建筑美学 |
| `gaudi-organic` | 高迪·有机 | 彩色曲线，有机设计 |
| `guardian` | Guardian 卫报 | 媒体网站风格 |
| `nikkei` | Nikkei 日经 | 日本经济新闻风格 |
| `lemonde` | Le Monde 世界报 | 法国报纸风格 |

## 输出格式

### JSON 格式（默认）

```json
{
  "ok": true,
  "data": "<html>...</html>",
  "meta": {
    "cliVersion": "1.0.0",
    "timestamp": "2026-04-06T10:30:00Z"
  }
}
```

### HTML 格式

直接使用 `--output html` 获取纯 HTML：

```bash
wxmd-cli typeset --input article.md --output html
```

### 错误格式

```json
{
  "ok": false,
  "error": {
    "code": "INVALID_STYLE",
    "type": "INVALID_ARGUMENTS",
    "message": "Style 'xxx' not found",
    "retryable": false,
    "actionHint": "Run 'wxmd-cli styles list' to see available styles"
  },
  "meta": { ... }
}
```

## 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `WXMD_API_URL` | `http://localhost:8080` | API 服务器地址（仅 share 命令需要） |
| `WXMD_API_TIMEOUT` | `30000` | 请求超时时间（毫秒） |

## 退出码

| 码 | 含义 |
|----|------|
| 0 | 成功 |
| 1 | 通用错误 |
| 2 | 参数错误 |
| 3 | 网络错误 |
| 4 | 服务器错误 |
| 5 | 未找到 |
| 6 | 权限拒绝 |
| 7 | 超时 |

## 面向 Agent 设计

本 CLI 专为 AI Agent 设计：

- **结构化 JSON 输出** - 便于程序解析
- **明确的错误类型** - `INVALID_ARGUMENTS`, `NETWORK_ERROR`, `NOT_FOUND` 等
- **可恢复错误提示** - 每个错误都包含 `actionHint` 建议
- **固定退出码** - 便于自动化脚本处理
- **支持 stdin/stdout** - 适合管道操作

## 相关链接

- **完整项目**: https://github.com/foolgry/editor
- **在线使用**: https://md.foolgry.top
- **NPM 包**: https://www.npmjs.com/package/@foolgry/wxmd-cli
- **Issue 反馈**: https://github.com/foolgry/editor/issues

## 许可证

MIT License - 详见 [LICENSE](../LICENSE)

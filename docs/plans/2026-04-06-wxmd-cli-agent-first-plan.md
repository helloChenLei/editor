# wxmd-cli Agent-First CLI 实施计划

## Summary
- 目标：新增 `wxmd-cli`，首版交付 `typeset`（本地排版）+ `share create/get`（调用现有 API），默认面向 Agent 输出结构化 JSON。
- 技术栈：Node.js + pnpm，以最大化复用现有前端排版逻辑并实现高一致。
- 原则对齐：落实“原子命令、结构化 I/O、可恢复错误、最小权限、可执行文档”。
- 现有能力来源：
  - 排版逻辑：`frontend/modules/editor-methods.js`
  - 样式源：`frontend/styles.js`
  - 分享 API：`server/main.go`

## Key Changes
- 命令面（原子化）：
  - `wxmd-cli typeset`：输入 Markdown（`--input` 或 stdin），输出可发布 HTML；默认 stdout。
  - `wxmd-cli share create`：调用 `POST /api/share`，返回 `id/url/createdAt/...`。
  - `wxmd-cli share get --id`：调用 `GET /api/share/:id`。
  - `wxmd-cli styles list`：列出可用样式（支持 `--fields`）。
  - `wxmd-cli doctor`：检查本地依赖与服务连通性，满足 bootstrap 闭环。
- 公共输出契约（默认 JSON）：
  - 成功：`{ ok: true, data: {...}, meta: { cliVersion, timestamp } }`
  - 失败：`{ ok: false, error: { code, type, retryable, where, actionHint, details } }`
  - 全局参数：`--output json|html|text`、`--fields`、`--trace-id`、`--timeout`
  - 退出码固定映射（参数错误/网络错误/服务端错误/未找到等）。
- 排版引擎：
  - 本地执行，抽取复用现有排版核心（预处理、渲染、样式内联、图片网格）。
  - 图片策略：`auto`（本地图片转 Base64，远程图片保留 URL）。
  - 默认低副作用：不写文件，仅 `--out` 时落盘。
- Skill 与文档：
  - 新增仓库内标准 skill 包（`SKILL.md`）：命令选择、参数模板、恢复路径、最小示例。
  - README 新增 Agent CLI 章节，覆盖 `typeset/share create/share get` 最小可运行示例。
  - 明确边界：v1 仅 `share create/get`，不含 list/delete。

## Test Plan
- 单元测试：
  - `typeset` 标题/段落/列表/引用/代码块/表格输出稳定性。
  - 图片 `auto` 策略（本地转 Base64，远程保留 URL）。
  - 错误模型与退出码（参数缺失、样式不存在、网络失败、404）。
- 一致性测试：
  - 固定样例快照，对比 CLI 与网页渲染关键结构（高一致目标）。
- 集成测试：
  - 启动本地服务后执行 `share create/get` 端到端，校验 JSON 契约与重试语义。
- 文档验收：
  - 按 skill 示例让 Agent 从零跑通“安装-首调-恢复”闭环。

## Assumptions
- 已确认：命令名 `wxmd-cli`；`typeset` 本地执行；分享走 HTTP API；v1 为 `create + get`；skill 与 README 双交付。
- 默认值：`typeset` 输出 stdout；`--output` 默认 `json`；默认样式 `wechat-default`。
- 分页/增量读取：v1 无 list 命令暂不展开，后续加 `share list` 时补齐 `--limit/--cursor/--fields`。

# wxmd-cli 集成测试指南

## 快速验证

```bash
# 1. 进入 CLI 目录
cd wxmd-cli

# 2. 安装依赖
pnpm install

# 3. 运行测试
pnpm test

# 4. 环境检查
node src/index.js doctor

# 5. 查看可用样式
node src/index.js styles list

# 6. 测试排版
echo "# Hello World" | node src/index.js typeset --output html

# 7. 从文件排版
node src/index.js typeset --input tests/test-article.md --style wechat-tech --out tests/output.html
```

## 完整端到端测试（需启动服务器）

```bash
# 终端 1：启动服务器
cd server
go run main.go

# 终端 2：创建分享
node src/index.js share create --input tests/test-article.md --style wechat-default
# 返回: { id, url, createdAt }

# 终端 3：获取分享
node src/index.js share get <id>
# 返回: { id, content, style, createdAt }
```

## 测试覆盖

### 已测试功能
- ✅ styles list - 列出可用样式
- ✅ typeset stdin - 从 stdin 读取 Markdown
- ✅ typeset file - 从文件读取 Markdown
- ✅ typeset output file - 输出到文件
- ✅ typeset output html - 输出 HTML 格式
- ✅ doctor - 环境检查
- ✅ 错误处理 - 文件不存在、样式不存在等

### 需服务器测试
- ⏳ share create - 创建分享
- ⏳ share get - 获取分享

## 退出码验证

```bash
# 成功（退出码 0）
node src/index.js styles list
echo $?  # 应输出 0

# 参数错误（退出码 2）
node src/index.js typeset --style nonexistent
echo $?  # 应输出 2

# 网络错误（退出码 3）- 需服务器未启动时
node src/index.js share create --input tests/test-article.md
echo $?  # 应输出 3
```

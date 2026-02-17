# 更新日志

## v2.1 - 分享功能上线 (2025-02-17)

### ✨ 新功能

#### 🔗 文章分享
- **分享链接**：一键生成短链接，方便分享给他人
- **保留样式**：分享页面保留原主题样式
- **独立页面**：每篇文章都有独立的分享页面
- **复制功能**：分享页面支持一键复制内容

#### 后端服务
- **Go + SQLite**：轻量级后端，易于部署
- **REST API**：简洁的 API 设计
- **跨域支持**：支持多种部署方式
- **数据持久化**：SQLite 数据库存储分享内容

### 📁 新增文件

```
server/
├── main.go          # Go 后端主程序
├── go.mod           # Go 模块配置
├── Dockerfile       # Docker 部署配置
├── start.sh         # 启动脚本
└── README.md        # 后端说明文档

SHARE_FEATURE.md     # 分享功能使用指南
CHANGELOG.md         # 更新日志
```

### 🔧 修改文件

- `index.html` - 添加分享按钮和弹窗
- `app.js` - 添加分享功能逻辑

### 🚀 部署方式

#### 方式一：直接运行
```bash
cd server
go mod tidy
go run main.go
```

#### 方式二：使用启动脚本
```bash
cd server
./start.sh
```

#### 方式三：Docker 部署
```bash
cd server
docker build -t huasheng-server .
docker run -d -p 8080:8080 -v $(pwd)/data:/app/data huasheng-server
```

### 📖 使用说明

1. 确保后端服务已启动
2. 编辑 Markdown 内容并选择样式
3. 点击预览面板右上角的「分享」按钮
4. 等待链接生成
5. 复制链接发送给朋友

### 🔧 配置说明

前端配置（`app.js`）：
```javascript
shareServerUrl: 'http://localhost:8080'  // 修改为实际地址
```

环境变量（后端）：
```bash
PORT=8080  # 服务端口
```

### 🐛 已知限制

- 分享页面不显示本地图片（img:// 协议）
- 需要后端服务支持才能使用分享功能
- 分享链接长期有效，暂无过期机制

---

## v2.0 - 图片处理系统重构 (2025-01-15)

### ✨ 新功能

#### 📸 智能图片处理
- **自定义图片协议**：使用 `img://img-xxx` 短链接
- **自动压缩**：Canvas API 压缩，最大 1920px，质量 85%
- **本地存储**：IndexedDB 持久化，刷新不丢失
- **多图网格**：2-3 列自动排版

### 🔧 核心改进

- 编辑器性能：从几千字符卡顿 → 20字符丝滑
- 成功率：从 80%（依赖图床）→ 100%
- 文件大小：平均压缩 50%-80%
- 存储方式：从网络 → 本地 IndexedDB

---

## v1.x - 基础功能

### 功能列表
- Markdown 实时预览
- 13 种主题样式
- 一键复制到公众号
- 代码高亮
- 样式收藏
- 历史记录

### 技术栈
- Vue 3
- Markdown-it
- Highlight.js
- IndexedDB
- Turndown

# 公众号 Markdown 编辑器 - 部署文档

## 📋 目录

- [架构概览](#架构概览)
- [快速开始](#快速开始)
- [部署脚本使用](#部署脚本使用)
- [服务器管理](#服务器管理)
- [手动部署](#手动部署)
- [常见问题](#常见问题)
- [备份与恢复](#备份与恢复)

---

## 架构概览

### 部署架构

```
用户请求
    ↓
Nginx (80/443) + SSL
    ├── md.foolgry.top/          → 导航页（公开）
    ├── /s/* /api/* /list        → Go 后端（公开）
    └── admin.md.foolgry.top/*   → 编辑器（需认证）
            ↓
    Docker: huasheng-editor-backend (127.0.0.1:3000)
            ↓
    SQLite: /opt/huasheng-editor/server/data/shares.db
```

### 服务器目录结构

```
/opt/huasheng-editor/
├── docker-compose.yml       # Docker 编排配置
├── server/                  # Go 后端
│   ├── Dockerfile          # 镜像构建文件
│   ├── main.go             # 后端源码
│   ├── go.mod              # Go 依赖
│   └── data/
│       └── shares.db       # SQLite 数据库
├── frontend/               # 前端静态文件
│   ├── index.html          # 导航页
│   ├── editor.html         # 编辑器页面
│   ├── app.js              # Vue 应用
│   ├── styles.js           # 主题样式
│   └── ...
├── nginx/                  # Nginx 配置（新增）
│   └── md-editor.conf      # 站点配置文件
│   └── .htpasswd           # 密码文件
└── backup/                 # 备份目录
    └── 20250217_232042/    # 按时间戳备份
```

### 访问地址

| 地址 | 说明 | 访问权限 |
|------|------|----------|
| https://md.foolgry.top | 导航页 | 公开 |
| https://admin.md.foolgry.top | 编辑器 | 需密码认证 |
| https://md.foolgry.top/s/{id} | 分享页面 | 公开 |
| https://md.foolgry.top/list | 分享管理列表页 | 需页面密码 |

**登录信息：**
- 用户名：`foolgry`
- 密码：`z46QTefWWy7fb`

---

## 快速开始

### 1. 环境要求

- 服务器已配置 SSH 密钥登录（别名 `hsy`）
- 服务器已安装 Docker 和 Docker Compose
- 服务器已安装 Nginx
- 域名已指向服务器 IP

### 2. 本地准备

确保项目目录结构：

```
huasheng_editor/
├── index.html          # 编辑器页面（会被重命名为 editor.html）
├── app.js              # Vue 应用逻辑
├── styles.js           # 样式配置
├── server/             # Go 后端代码
│   ├── main.go
│   ├── go.mod
│   └── Dockerfile
├── nginx/              # Nginx 配置
│   └── md-editor.conf  # 站点配置文件
└── deploy.sh           # 部署脚本
```

### 3. 一键部署

```bash
# 进入项目目录
cd /Users/wangzhi/project/2026-02-17-alchaincyf-huasheng_editor

# 执行部署
./deploy.sh
```

部署完成后访问：
- 主页：https://md.foolgry.top
- 编辑器：https://admin.md.foolgry.top

---

## 部署脚本使用

### 本地部署脚本 (`deploy.sh`)

位于项目根目录，用于从本地快速部署到服务器。

#### 使用方法

```bash
./deploy.sh [选项]
```

#### 选项说明

| 选项 | 说明 |
|------|------|
| `all` (默认) | 完整部署（前端+后端+Nginx） |
| `frontend` | 仅部署前端 |
| `backend` | 仅部署后端 |
| `nginx` | 仅部署 Nginx 配置 |
| `verify` | 仅验证部署状态 |
| `backup` | 仅备份远程代码 |
| `help` | 显示帮助 |

#### 使用示例

**完整部署（更新前后端）：**
```bash
./deploy.sh
```

**只更新前端（修改了 HTML/JS/CSS）：**
```bash
./deploy.sh frontend
```

**只更新后端（修改了 Go 代码）：**
```bash
./deploy.sh backend
```

**只更新 Nginx 配置：**
```bash
./deploy.sh nginx
```

**查看部署状态：**
```bash
./deploy.sh verify
```

#### 部署流程

1. **检查 SSH 连接** - 确保能连接到服务器
2. **备份远程代码** - 自动备份到 `backup/时间戳/` 目录
3. **同步文件** - 使用 rsync 只传输变更文件
4. **构建容器** - 重新构建 Docker 容器（后端）
5. **验证部署** - 检查服务是否正常

#### 输出示例

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  公众号 Markdown 编辑器 - 部署脚本
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[INFO] 检查 SSH 连接...
[SUCCESS] SSH 连接正常

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  1. 备份远程代码
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
前端代码已备份
后端代码已备份
[SUCCESS] 备份完成: /opt/huasheng-editor/backup/20250217_232042

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  2. 部署前端代码
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[INFO] 同步前端文件到服务器...
... 传输文件列表 ...
[SUCCESS] 前端部署完成

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  3. 部署后端代码
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[INFO] 重新构建 Docker 容器...
... 构建日志 ...
[SUCCESS] 后端部署完成

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  4. 验证部署
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[SUCCESS] 后端服务运行正常
[SUCCESS] 前端访问正常
[SUCCESS] 编辑器认证正常

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  部署完成！
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 服务器管理

### 服务器管理脚本 (`md-manage`)

位于服务器的 `/usr/local/bin/md-manage`，用于服务器端日常维护。

#### 使用方法

```bash
ssh hsy                    # 登录服务器
md-manage [命令]
```

#### 命令列表

| 命令 | 说明 |
|------|------|
| `start` | 启动服务 |
| `stop` | 停止服务 |
| `restart` | 重启服务 |
| `rebuild` | 重新构建并启动 |
| `logs` | 查看实时日志 |
| `status` | 查看服务状态 |
| `reload-nginx` | 重载 Nginx 配置 |
| `update-password` | 修改登录密码 |

#### 使用示例

**查看服务状态：**
```bash
ssh hsy md-manage status
```

**查看实时日志：**
```bash
ssh hsy md-manage logs
```

**重启服务：**
```bash
ssh hsy md-manage restart
```

**修改密码：**
```bash
ssh hsy md-manage update-password
# 输入新密码（不显示）
# ✅ 密码已更新
```

**重载 Nginx（修改配置后）：**
```bash
ssh hsy md-manage reload-nginx
```

---

## 手动部署

如果脚本部署失败，可以手动部署。

### 1. 部署前端

```bash
# 本地执行
rsync -avz --exclude='.git' --exclude='server' \
  ./ hsy:/opt/huasheng-editor/frontend/

# 服务器执行（确保导航页正确）
ssh hsy "
  cd /opt/huasheng-editor/frontend
  # 如果 index.html 是编辑器（文件很大），重命名为 editor.html
  if [ $(stat -f%z index.html) -gt 50000 ]; then
    mv index.html editor.html
  fi
  # 设置权限
  chown -R www-data:www-data /opt/huasheng-editor/frontend/
"
```

### 2. 部署后端

```bash
# 同步后端代码
rsync -avz ./server/ hsy:/opt/huasheng-editor/server/

# 服务器执行
ssh hsy "
  cd /opt/huasheng-editor
  docker compose down
  docker compose up -d --build
"
```

### 3. 更新 Nginx 配置

配置文件位置：`/etc/nginx/sites-available/md-editor`

#### 方法 A：本地修改后同步（推荐）

```bash
# 1. 首次拉取服务器配置到本地
mkdir -p nginx
scp hsy:/etc/nginx/sites-available/md-editor nginx/md-editor.conf

# 2. 本地修改 nginx/md-editor.conf
# ... 编辑文件 ...

# 3. 同步到服务器
scp nginx/md-editor.conf hsy:/etc/nginx/sites-available/md-editor

# 4. 测试并重载
ssh hsy "nginx -t && nginx -s reload"
```

#### 方法 B：直接在服务器修改

```bash
ssh hsy "nano /etc/nginx/sites-available/md-editor"
ssh hsy "nginx -t && nginx -s reload"
```

#### 配置备份

每次部署脚本会自动备份 Nginx 配置：
```
backup/
└── 20250218_003405/
    ├── frontend/          # 前端代码备份
    ├── server/            # 后端代码备份
    └── nginx.conf         # Nginx 配置备份
```

---

## 常见问题

### Q1: 部署后访问 500 错误

**原因：** Nginx 配置错误或密码文件权限问题

**解决：**
```bash
# 检查 Nginx 配置
ssh hsy "nginx -t"

# 检查密码文件权限
ssh hsy "ls -la /etc/nginx/.htpasswd"

# 修复权限
ssh hsy "chmod 644 /etc/nginx/.htpasswd"
```

### Q2: 浏览器不弹出密码框

**原因：** 浏览器缓存了之前的认证状态

**解决：**
1. 使用无痕模式测试（Ctrl+Shift+N）
2. 或修改密码强制失效：`md-manage update-password`
3. 或清除站点数据：Chrome 设置 → 隐私 → 清除浏览数据 → 选择「Cookie」

### Q3: 后端服务无法启动

**原因：** Docker 构建失败或端口占用

**解决：**
```bash
# 查看日志
ssh hsy md-manage logs

# 手动重启
ssh hsy md-manage rebuild

# 检查端口
ssh hsy "ss -tlnp | grep 3000"
```

### Q4: 分享链接无法访问

**原因：** 后端服务异常或数据库错误

**解决：**
```bash
# 检查后端状态
ssh hsy "docker compose -f /opt/huasheng-editor/docker-compose.yml ps"

# 检查数据库
ssh hsy "sqlite3 /opt/huasheng-editor/server/data/shares.db '.tables'"

# 重启后端
ssh hsy md-manage restart
```

### Q5: 如何修改域名

1. 修改 Nginx 配置中的 `server_name`
2. 申请新域名的 SSL 证书
3. 重载 Nginx

```bash
ssh hsy "
  certbot certonly --nginx -d 新域名
  nginx -s reload
"
```

---

## 备份与恢复

### 自动备份

每次部署脚本会自动备份远程代码到：`/opt/huasheng-editor/backup/时间戳/`

### 手动备份

```bash
# 备份整个项目
ssh hsy "
  cd /opt
  tar czf ~/huasheng-editor-backup-$(date +%Y%m%d).tar.gz huasheng-editor/
"

# 下载到本地
scp hsy:~/huasheng-editor-backup-*.tar.gz ./
```

### 恢复备份

```bash
# 从备份恢复
ssh hsy "
  cd /opt/huasheng-editor
  cp backup/20250217_232042/frontend/app.js frontend/
  # 重启服务
  md-manage restart
"
```

### 数据库备份

```bash
# 备份 SQLite 数据库
ssh hsy "cp /opt/huasheng-editor/server/data/shares.db ~/shares-backup.db"

# 下载到本地
scp hsy:~/shares-backup.db ./
```

---

## 更新流程示例

### 场景 1：修改了编辑器功能（前端）

```bash
# 1. 本地修改代码（app.js / index.html 等）

# 2. 测试无误后，执行部署
cd /Users/wangzhi/project/2026-02-17-alchaincyf-huasheng_editor
./deploy.sh frontend

# 3. 部署完成后，访问 https://admin.md.foolgry.top 验证
```

### 场景 2：修改了分享功能（后端）

```bash
# 1. 本地修改 Go 代码（server/main.go）

# 2. 本地测试构建
cd server
go build -o test-server main.go

# 3. 部署到服务器
cd ..
./deploy.sh backend

# 4. 验证分享功能是否正常
```

### 场景 3：完整更新

```bash
# 1. 更新前后端代码
# 2. 完整部署
./deploy.sh

# 3. 验证所有功能
# - 主页访问
# - 编辑器登录
# - 分享功能
# - 分享页面查看
```

---

## 安全建议

1. **定期修改密码**
   ```bash
   ssh hsy md-manage update-password
   ```

2. **定期备份数据**
   ```bash
   # 数据库备份
   ssh hsy "cp /opt/huasheng-editor/server/data/shares.db ~/backup-$(date +%Y%m%d).db"
   ```

3. **保持系统更新**
   ```bash
   ssh hsy "apt update && apt upgrade -y"
   ```

4. **监控日志**
   ```bash
   ssh hsy md-manage logs
   ```

---

## 联系支持

如有问题，请检查：
1. 服务器状态：`ssh hsy md-manage status`
2. Nginx 日志：`ssh hsy "tail -20 /var/log/nginx/error.log"`
3. 后端日志：`ssh hsy md-manage logs`

---

**文档版本：** v1.0  
**最后更新：** 2025-02-17

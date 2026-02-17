#!/bin/bash

# ============================================
# 公众号 Markdown 编辑器 - 一键部署脚本
# ============================================

set -e  # 遇到错误立即退出

# 配置
REMOTE_HOST="hsy"
REMOTE_DIR="/opt/huasheng-editor"
LOCAL_DIR="$(cd "$(dirname "$0")" && pwd)"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印函数
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_title() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

# 检查 SSH 连接
check_connection() {
    print_info "检查 SSH 连接..."
    if ! ssh -q -o BatchMode=yes -o ConnectTimeout=5 "$REMOTE_HOST" exit 2>/dev/null; then
        print_error "无法连接到服务器 $REMOTE_HOST"
        print_info "请确保:"
        print_info "  1. SSH 服务正在运行"
        print_info "  2. 已配置 SSH 密钥"
        print_info "  3. ~/.ssh/config 中配置了 hsy 别名"
        exit 1
    fi
    print_success "SSH 连接正常"
}

# 备份远程代码
backup_remote() {
    print_title "1. 备份远程代码"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_DIR="$REMOTE_DIR/backup/$TIMESTAMP"
    
    ssh "$REMOTE_HOST" "
        mkdir -p $BACKUP_DIR
        if [ -d $REMOTE_DIR/frontend ]; then
            cp -r $REMOTE_DIR/frontend $BACKUP_DIR/
            echo '前端代码已备份'
        fi
        if [ -d $REMOTE_DIR/server ]; then
            cp -r $REMOTE_DIR/server $BACKUP_DIR/
            echo '后端代码已备份'
        fi
        echo '$BACKUP_DIR'
    "
    
    print_success "备份完成: $BACKUP_DIR"
}

# 部署前端代码
deploy_frontend() {
    print_title "2. 部署前端代码"
    
    print_info "同步前端文件到服务器..."
    
    # 使用 rsync 同步（排除不需要的文件）
    rsync -avz --progress \
        --exclude='.git' \
        --exclude='node_modules' \
        --exclude='.DS_Store' \
        --exclude='server' \
        --exclude='*.md' \
        --exclude='deploy.sh' \
        "$LOCAL_DIR/" "$REMOTE_HOST:$REMOTE_DIR/frontend/"
    
    # 确保导航页是 index.html，编辑器是 editor.html
    ssh "$REMOTE_HOST" "
        cd $REMOTE_DIR/frontend
        
        # 从 index.html 复制 editor.html（admin.md.foolgry.top 需要）
        if [ -f index.html ]; then
            cp index.html editor.html
            echo '编辑器页面已复制为 editor.html'
        fi
        
        # 如果 index.html 不存在或太小（被覆盖/损坏），重新创建导航页
        if [ ! -f index.html ] || [ \$(stat -f%z index.html 2>/dev/null || stat -c%s index.html) -lt 10000 ]; then
            cat > index.html << 'NAVEOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>公众号 Markdown 编辑器 - 分享服务</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
        }
        .container {
            text-align: center;
            padding: 40px;
            max-width: 600px;
        }
        .logo {
            width: 80px;
            height: 80px;
            background: #fff;
            border-radius: 20px;
            margin: 0 auto 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        h1 {
            font-size: 32px;
            margin-bottom: 16px;
            font-weight: 600;
        }
        p {
            font-size: 18px;
            opacity: 0.9;
            margin-bottom: 40px;
            line-height: 1.6;
        }
        .btn {
            display: inline-block;
            padding: 16px 32px;
            background: #fff;
            color: #667eea;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 600;
            font-size: 16px;
            margin: 10px;
            transition: transform 0.3s, box-shadow 0.3s;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        .btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        }
        .btn-secondary {
            background: transparent;
            color: #fff;
            border: 2px solid #fff;
        }
        .footer {
            margin-top: 60px;
            font-size: 14px;
            opacity: 0.7;
        }
        @media (max-width: 600px) {
            h1 { font-size: 24px; }
            p { font-size: 16px; }
            .btn { display: block; margin: 10px 0; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">📝</div>
        <h1>公众号 Markdown 编辑器</h1>
        <p>专业的公众号排版工具，支持多种精美主题样式</p>
        <a href="https://admin.md.foolgry.top" class="btn">✏️ 开始创作</a>
        <a href="https://github.com/alchaincyf/huasheng_editor" class="btn btn-secondary" target="_blank">📖 查看文档</a>
        <div class="footer">
            Created by 花生 · 分享美好内容
        </div>
    </div>
</body>
</html>
NAVEOF
            echo '导航页已创建'
        fi
        
        # 设置权限
        chown -R www-data:www-data $REMOTE_DIR/frontend/ 2>/dev/null || chown -R root:root $REMOTE_DIR/frontend/
        chmod -R 644 $REMOTE_DIR/frontend/*.html $REMOTE_DIR/frontend/*.js $REMOTE_DIR/frontend/*.css 2>/dev/null || true
    "
    
    print_success "前端部署完成"
}

# 部署后端代码
deploy_backend() {
    print_title "3. 部署后端代码"
    
    # 检查本地是否有 server 目录
    if [ ! -d "$LOCAL_DIR/server" ]; then
        print_warning "本地 server 目录不存在，跳过后端部署"
        return
    fi
    
    print_info "同步后端文件到服务器..."
    
    # 同步 server 目录（保留 data 目录）
    rsync -avz --progress \
        --exclude='data' \
        --exclude='.git' \
        "$LOCAL_DIR/server/" "$REMOTE_HOST:$REMOTE_DIR/server/"
    
    print_success "后端文件同步完成"
    
    # 重新构建并启动容器
    print_info "重新构建 Docker 容器..."
    ssh "$REMOTE_HOST" "
        cd $REMOTE_DIR
        
        # 停止旧容器
        docker compose down 2>/dev/null || docker-compose down 2>/dev/null || true
        
        # 重新构建并启动
        docker compose up -d --build 2>&1 | tail -20
        
        # 等待服务启动
        sleep 3
        
        # 检查状态
        docker compose ps
    "
    
    print_success "后端部署完成"
}

# 验证部署
verify_deployment() {
    print_title "4. 验证部署"
    
    print_info "检查服务状态..."
    
    # 检查后端服务
    if ssh "$REMOTE_HOST" "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/api/share/test" | grep -q "404"; then
        print_success "后端服务运行正常"
    else
        print_error "后端服务可能异常"
        ssh "$REMOTE_HOST" "docker compose -f $REMOTE_DIR/docker-compose.yml logs --tail=10"
    fi
    
    # 检查前端访问
    if curl -s -o /dev/null -w "%{http_code}" https://md.foolgry.top | grep -q "200"; then
        print_success "前端访问正常 (https://md.foolgry.top)"
    else
        print_error "前端访问异常"
    fi
    
    # 检查编辑器认证
    if curl -s -o /dev/null -w "%{http_code}" https://admin.md.foolgry.top | grep -q "401"; then
        print_success "编辑器认证正常 (https://admin.md.foolgry.top)"
    else
        print_warning "编辑器认证可能异常"
    fi
    
    print_success "部署验证完成"
}

# 显示使用信息
show_usage() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  all       部署前端+后端（默认）"
    echo "  frontend  仅部署前端"
    echo "  backend   仅部署后端"
    echo "  verify    仅验证部署状态"
    echo "  backup    仅备份远程代码"
    echo "  help      显示此帮助"
    echo ""
    echo "示例:"
    echo "  $0              # 完整部署"
    echo "  $0 frontend     # 仅更新前端"
    echo "  $0 backend      # 仅更新后端"
}

# 主函数
main() {
    print_title "公众号 Markdown 编辑器 - 部署脚本"
    
    # 检查参数
    case "${1:-all}" in
        all)
            check_connection
            backup_remote
            deploy_frontend
            deploy_backend
            verify_deployment
            ;;
        frontend)
            check_connection
            backup_remote
            deploy_frontend
            verify_deployment
            ;;
        backend)
            check_connection
            backup_remote
            deploy_backend
            verify_deployment
            ;;
        verify)
            check_connection
            verify_deployment
            ;;
        backup)
            check_connection
            backup_remote
            ;;
        help|--help|-h)
            show_usage
            exit 0
            ;;
        *)
            print_error "未知参数: $1"
            show_usage
            exit 1
            ;;
    esac
    
    print_title "部署完成！"
    echo "访问地址："
    echo "  - 主页: https://md.foolgry.top"
    echo "  - 编辑器: https://admin.md.foolgry.top"
    echo ""
    echo "管理命令："
    echo "  ssh $REMOTE_HOST 'cd $REMOTE_DIR && docker compose logs -f'"
}

# 执行主函数
main "$@"

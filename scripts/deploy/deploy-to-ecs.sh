#!/bin/bash
# ============================================================
# poem-admin ECS 部署脚本
# 用法: ./scripts/deploy/deploy-to-ecs.sh
#
# 流程: pnpm build → docker build (linux/amd64) → save tar → workbench upload → docker load → 重启容器
#
# 前置条件:
#   - workbench CLI 已安装并配置凭证
#   - docker 已安装
#   - 服务器为 linux/amd64 平台
# ============================================================

set -euo pipefail

# ======================== 配置区 ========================
# 应用目录 (相对项目根目录)
APP_DIR="apps/web-antd"

# Docker 镜像名
IMAGE_NAME="poem-admin"

# 容器名
CONTAINER_NAME="poem-admin"

# 端口映射 (宿主机:容器)
PORT_MAPPING="8085:80"

# ECS 实例 ID
INSTANCE_ID="i-uf631pwykrvx0l2m1pqm"

# ECS 区域
REGION="cn-shanghai"

# 远程 tar 包存放目录 (服务器)
REMOTE_DIR="/root"

# Docker 目标平台
TARGET_PLATFORM="linux/amd64"

# 构建产物临时目录
TMP_DIR="/tmp"
# ========================================================

# 项目根目录 (脚本所在位置的上上级)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# 时间戳版本号
TIMESTAMP=$(date +%Y%m%d-%H%M)
TAG="${IMAGE_NAME}:${TIMESTAMP}"
TAR_FILE="${TMP_DIR}/${IMAGE_NAME}-${TIMESTAMP}.tar"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

# 清理函数
cleanup() {
    if [[ -f "$TAR_FILE" ]]; then
        log_info "清理临时 tar 包: $TAR_FILE"
        rm -f "$TAR_FILE"
    fi
}
trap cleanup EXIT

echo ""
echo "=========================================="
echo "  poem-admin ECS 部署"
echo "  版本: $TIMESTAMP"
echo "  目标: $INSTANCE_ID ($REGION)"
echo "=========================================="
echo ""

# 检查依赖
for cmd in docker workbench pnpm; do
    if ! command -v "$cmd" &>/dev/null; then
        log_error "未找到命令: $cmd"
        exit 1
    fi
done

# 进入项目根目录
cd "$PROJECT_ROOT"

# Step 1: 构建前端产物
echo ">>> Step 1/6: 构建前端产物 (pnpm build)"
pnpm build
log_ok "前端构建完成"

# Step 2: 构建 Docker 镜像
echo ""
echo ">>> Step 2/6: 构建 Docker 镜像 ($TARGET_PLATFORM)"
docker build --platform "$TARGET_PLATFORM" \
    -t "$TAG" \
    -t "${IMAGE_NAME}:latest" \
    "$APP_DIR"
log_ok "镜像构建完成: $TAG"

# Step 3: 保存为 tar
echo ""
echo ">>> Step 3/6: 保存镜像为 tar 包"
docker save -o "$TAR_FILE" "$TAG"
TAR_SIZE=$(du -h "$TAR_FILE" | cut -f1)
log_ok "tar 包已生成: $TAR_FILE ($TAR_SIZE)"

# Step 4: 上传到 ECS
echo ""
echo ">>> Step 4/6: 上传到 ECS 实例"
REMOTE_PATH="${REMOTE_DIR}/${IMAGE_NAME}-${TIMESTAMP}.tar"
workbench upload "$TAR_FILE" "$REMOTE_PATH" \
    --instance-id "$INSTANCE_ID" \
    --region "$REGION"
log_ok "上传完成: $REMOTE_PATH"

# Step 5: 服务器加载镜像
echo ""
echo ">>> Step 5/6: 服务器加载镜像"
workbench exec \
    --instance-id "$INSTANCE_ID" \
    --region "$REGION" \
    --command "docker load -i $REMOTE_PATH" \
    --timeout 60
log_ok "镜像加载完成"

# Step 6: 重启容器
echo ""
echo ">>> Step 6/6: 重启容器"
workbench exec \
    --instance-id "$INSTANCE_ID" \
    --region "$REGION" \
    --command "docker stop $CONTAINER_NAME 2>/dev/null; docker rm $CONTAINER_NAME 2>/dev/null; docker run -d --name $CONTAINER_NAME -p $PORT_MAPPING $TAG" \
    --timeout 60
log_ok "容器已启动"

# 验证
echo ""
echo ">>> 验证部署状态"
sleep 3
RESULT=$(workbench exec \
    --instance-id "$INSTANCE_ID" \
    --region "$REGION" \
    --command "docker ps --filter name=$CONTAINER_NAME --format '{{.Status}}' && echo '' && curl -s -o /dev/null -w '%{http_code}' http://localhost:${PORT_MAPPING%%:*}/" \
    --timeout 30 2>&1) || true

echo ""
echo "=========================================="
if echo "$RESULT" | grep -q "200$"; then
    log_ok "部署成功! 服务运行正常 (HTTP 200)"
    echo "  镜像: $TAG"
    echo "  容器: $CONTAINER_NAME"
    echo "  端口: $PORT_MAPPING"
else
    log_error "部署可能有问题，请手动检查"
    echo "  输出: $RESULT"
fi
echo "=========================================="
echo ""

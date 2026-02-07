#!/bin/bash

# 环境变量版本控制和回滚脚本
# 用于管理环境变量文件的版本历史和回滚功能

# 配置
PROJECT_ROOT="$(dirname "$(dirname "$0")")"
ENV_DIRS=(
  "$PROJECT_ROOT/frontend"
  "$PROJECT_ROOT/backend"
)
LOG_DIR="$PROJECT_ROOT/logs"
VERSION_DIR="$LOG_DIR/env_versions"
VERSION_LOG="$LOG_DIR/env_version.log"

# 确保目录存在
mkdir -p "$LOG_DIR"
mkdir -p "$VERSION_DIR"

# 创建版本日志文件（如果不存在）
if [ ! -f "$VERSION_LOG" ]; then
  touch "$VERSION_LOG"
  echo "# 环境变量版本控制日志" > "$VERSION_LOG"
  echo "# 格式: 时间戳 | 操作 | 文件路径 | 版本号 | 描述" >> "$VERSION_LOG"
  echo "" >> "$VERSION_LOG"
fi

# 函数: 记录版本操作
log_version() {
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  local operation="$1"
  local file_path="$2"
  local version="$3"
  local description="$4"
  
  echo "$timestamp | $operation | $file_path | $version | $description" >> "$VERSION_LOG"
  echo "[$timestamp] $operation: $file_path v$version - $description"
}

# 函数: 获取文件的版本号
get_version() {
  local file_path="$1"
  local version_file="$VERSION_DIR/$(basename "$file_path").version"
  
  if [ ! -f "$version_file" ]; then
    echo "0"
    return
  fi
  
  cat "$version_file"
}

# 函数: 递增版本号
increment_version() {
  local file_path="$1"
  local current_version=$(get_version "$file_path")
  local new_version=$((current_version + 1))
  local version_file="$VERSION_DIR/$(basename "$file_path").version"
  
  echo "$new_version" > "$version_file"
  echo "$new_version"
}

# 函数: 保存版本
save_version() {
  local file_path="$1"
  local description="$2"
  
  if [ ! -f "$file_path" ]; then
    echo "错误: 文件不存在: $file_path"
    return 1
  fi
  
  local version=$(increment_version "$file_path")
  local timestamp=$(date '+%Y%m%d_%H%M%S')
  local version_file="$VERSION_DIR/$(basename "$file_path").v$version.$timestamp"
  
  # 复制文件到版本目录
  cp "$file_path" "$version_file"
  
  # 记录版本操作
  log_version "SAVE" "$file_path" "$version" "$description"
  
  echo "✅ 版本保存成功: v$version"
  echo "📌 版本文件: $version_file"
  
  return 0
}

# 函数: 列出版本
list_versions() {
  local file_path="$1"
  local base_name=$(basename "$file_path")
  
  echo "📋 $file_path 的版本历史:"
  echo "-" .repeat(60)
  
  # 查找版本文件
  local versions=($(find "$VERSION_DIR" -name "$base_name.v*" -type f | sort -r))
  
  if [ ${#versions[@]} -eq 0 ]; then
    echo "   暂无版本历史"
    return
  fi
  
  # 显示版本列表
  for version_file in "${versions[@]}"; do
    local version_info=$(basename "$version_file" | sed -E "s/$base_name\.v([0-9]+)\.([0-9]+)_([0-9]+)/v\1 (\2 \3)/")
    local file_size=$(du -h "$version_file" | cut -f 1)
    echo "   - $version_info ($file_size)"
    echo "     文件: $version_file"
  done
  
  echo "-" .repeat(60)
  echo "总计: ${#versions[@]} 个版本"
}

# 函数: 回滚版本
rollback_version() {
  local file_path="$1"
  local version="$2"
  local base_name=$(basename "$file_path")
  
  # 查找指定版本的文件
  local version_file=$(find "$VERSION_DIR" -name "$base_name.v$version.*" -type f | head -1)
  
  if [ ! -f "$version_file" ]; then
    echo "错误: 版本 v$version 不存在"
    return 1
  fi
  
  # 保存当前版本（作为回滚点）
  save_version "$file_path" "回滚前的当前版本"
  
  # 回滚到指定版本
  cp "$version_file" "$file_path"
  
  # 记录回滚操作
  log_version "ROLLBACK" "$file_path" "$version" "回滚到指定版本"
  
  echo "✅ 版本回滚成功: v$version"
  echo "📌 回滚文件: $file_path"
  echo "📌 版本来源: $version_file"
  
  return 0
}

# 函数: 显示当前版本
show_current_version() {
  local file_path="$1"
  local current_version=$(get_version "$file_path")
  
  echo "📌 $file_path"
  echo "   当前版本: v$current_version"
  
  if [ -f "$file_path" ]; then
    local file_size=$(du -h "$file_path" | cut -f 1)
    local mod_time=$(stat -f "%Sm" "$file_path" 2>/dev/null || stat -c "%y" "$file_path" 2>/dev/null || echo "未知")
    echo "   文件大小: $file_size"
    echo "   修改时间: $mod_time"
  else
    echo "   状态: 文件不存在"
  fi
}

# 函数: 清理旧版本
cleanup_versions() {
  local file_path="$1"
  local keep_count="$2"
  local base_name=$(basename "$file_path")
  
  # 查找版本文件并按时间排序（最新的在前）
  local versions=($(find "$VERSION_DIR" -name "$base_name.v*" -type f | sort -r))
  
  if [ ${#versions[@]} -le $keep_count ]; then
    echo "✅ 无需清理，版本数量已在限制内"
    return
  fi
  
  # 计算需要删除的版本数量
  local delete_count=$(( ${#versions[@]} - $keep_count ))
  local versions_to_delete=(${versions[@]:$keep_count})
  
  echo "🔍 清理 $delete_count 个旧版本..."
  
  for version_file in "${versions_to_delete[@]}"; do
    rm "$version_file"
    echo "   ✅ 删除: $(basename "$version_file")"
  done
  
  echo "✅ 清理完成，保留了 $keep_count 个最新版本"
}

# 主函数
main() {
  local command="$1"
  local file_path="$2"
  local arg3="$3"
  local arg4="$4"
  
  case "$command" in
    "save")
      if [ -z "$file_path" ] || [ -z "$arg3" ]; then
        echo "用法: $0 save <文件路径> <描述>"
        return 1
      fi
      save_version "$file_path" "$arg3"
      ;;
    "list")
      if [ -z "$file_path" ]; then
        echo "用法: $0 list <文件路径>"
        return 1
      fi
      list_versions "$file_path"
      ;;
    "rollback")
      if [ -z "$file_path" ] || [ -z "$arg3" ]; then
        echo "用法: $0 rollback <文件路径> <版本号>"
        return 1
      fi
      rollback_version "$file_path" "$arg3"
      ;;
    "current")
      if [ -z "$file_path" ]; then
        echo "用法: $0 current <文件路径>"
        return 1
      fi
      show_current_version "$file_path"
      ;;
    "cleanup")
      if [ -z "$file_path" ] || [ -z "$arg3" ]; then
        echo "用法: $0 cleanup <文件路径> <保留数量>"
        return 1
      fi
      cleanup_versions "$file_path" "$arg3"
      ;;
    "help"|"--help"|"-h")
      echo "环境变量版本控制和回滚脚本"
      echo ""
      echo "用法: $0 <命令> [参数]"
      echo ""
      echo "命令:"
      echo "  save <文件路径> <描述>   - 保存当前版本"
      echo "  list <文件路径>          - 列出版本历史"
      echo "  rollback <文件路径> <版本号> - 回滚到指定版本"
      echo "  current <文件路径>       - 显示当前版本"
      echo "  cleanup <文件路径> <保留数量> - 清理旧版本"
      echo "  help                     - 显示帮助信息"
      echo ""
      echo "示例:"
      echo "  $0 save backend/.env "更新数据库配置"
      echo "  $0 list backend/.env"
      echo "  $0 rollback backend/.env 2"
      echo "  $0 cleanup backend/.env 5"
      ;;
    *)
      echo "错误: 未知命令: $command"
      echo "使用 $0 help 查看帮助信息"
      return 1
      ;;
  esac
}

# 执行主函数
if [ $# -eq 0 ]; then
  echo "错误: 缺少命令"
  echo "使用 $0 help 查看帮助信息"
  exit 1
fi

main "$@"

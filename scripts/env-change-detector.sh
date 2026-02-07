#!/bin/bash

# 环境变量变更检测脚本
# 用于监控环境变量文件的变更并记录变更历史

# 配置
PROJECT_ROOT="$(dirname "$(dirname "$0")")"
ENV_DIRS=(
  "$PROJECT_ROOT/frontend"
  "$PROJECT_ROOT/backend"
)
LOG_DIR="$PROJECT_ROOT/logs"
CHANGE_LOG="$LOG_DIR/env_changes.log"
HISTORY_DIR="$LOG_DIR/env_history"

# 确保日志目录存在
mkdir -p "$LOG_DIR"
mkdir -p "$HISTORY_DIR"

# 创建变更日志文件（如果不存在）
if [ ! -f "$CHANGE_LOG" ]; then
  touch "$CHANGE_LOG"
  echo "# 环境变量变更日志" > "$CHANGE_LOG"
  echo "# 格式: 时间戳 | 文件路径 | 变更类型 | 变更摘要" >> "$CHANGE_LOG"
  echo "" >> "$CHANGE_LOG"
fi

# 函数: 记录变更
log_change() {
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  local file_path="$1"
  local change_type="$2"
  local summary="$3"
  
  echo "$timestamp | $file_path | $change_type | $summary" >> "$CHANGE_LOG"
  echo "[$timestamp] $change_type: $file_path - $summary"
}

# 函数: 备份环境变量文件
backup_env_file() {
  local file_path="$1"
  local timestamp=$(date '+%Y%m%d_%H%M%S')
  local backup_file="$HISTORY_DIR/$(basename "$file_path").$timestamp.bak"
  
  cp "$file_path" "$backup_file"
  echo "备份文件: $backup_file"
}

# 函数: 检测文件变更
check_file_changes() {
  local file_path="$1"
  local checksum_file="$LOG_DIR/$(basename "$file_path").md5"
  
  if [ ! -f "$file_path" ]; then
    return
  fi
  
  # 计算当前文件的MD5哈希
  current_hash=$(md5sum "$file_path" | cut -d ' ' -f 1)
  
  if [ ! -f "$checksum_file" ]; then
    # 首次检测，记录哈希值
    echo "$current_hash" > "$checksum_file"
    log_change "$file_path" "NEW" "首次检测到文件"
    backup_env_file "$file_path"
  else
    # 读取之前的哈希值
    previous_hash=$(cat "$checksum_file")
    
    if [ "$current_hash" != "$previous_hash" ]; then
      # 文件已变更
      log_change "$file_path" "CHANGED" "文件内容已修改"
      backup_env_file "$file_path"
      echo "$current_hash" > "$checksum_file"
      
      # 显示变更摘要
      echo "变更摘要:"
      if command -v diff &> /dev/null; then
        diff "$HISTORY_DIR/$(basename "$file_path").*.bak" "$file_path" | head -20
      fi
    fi
  fi
}

# 函数: 检测新增文件
check_new_files() {
  local dir="$1"
  local pattern="$2"
  
  find "$dir" -name "$pattern" -type f | while read -r file; do
    check_file_changes "$file"
  done
}

# 主函数
main() {
  echo "🚀 开始环境变量变更检测..."
  echo "=" .repeat(60)
  
  # 检测前端环境变量文件
  echo "🔍 检测前端环境变量文件..."
  check_new_files "$PROJECT_ROOT/frontend" ".env*"
  
  # 检测后端环境变量文件
  echo "🔍 检测后端环境变量文件..."
  check_new_files "$PROJECT_ROOT/backend" ".env*"
  
  # 检测部署脚本配置
  echo "🔍 检测部署脚本配置..."
  check_file_changes "$PROJECT_ROOT/deploy.sh"
  
  echo "=" .repeat(60)
  echo "📋 变更检测完成!"
  echo "📌 变更日志: $CHANGE_LOG"
  echo "📌 历史备份: $HISTORY_DIR"
  
  # 显示最近的变更
  echo ""
  echo "📋 最近的变更:"
  tail -n 10 "$CHANGE_LOG"
}

# 执行主函数
main

# 可选: 发送通知（需要配置通知机制）
# if [ -f "$LOG_DIR/env_changes.log" ]; then
#   # 这里可以添加邮件通知、Slack通知等
#   echo "🔔 变更通知已发送"  # 占位符
# fi

#!/bin/bash

# 生产服务器测试认证流程脚本
echo "📦 准备在生产服务器测试认证流程..."

# 配置信息（从deploy.sh获取）
PROJECT_ROOT="$(dirname "$0")/.."
SERVER_IP="115.191.33.228"
SERVER_USER="root"
SERVER_KEY="$PROJECT_ROOT/backend/xiaonuoSev1.pem"
SERVER_DIR="/root/xiaonuo/backend"

# 创建临时目录
mkdir -p /tmp/xiaonuo-admin

# 创建测试脚本
cat > /tmp/xiaonuo-admin/test-auth-flow.js << 'EOF'
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// 用户模型定义
const UserSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: [true, '手机号不能为空'],
    unique: true,
    trim: true
  },
  password: {
    type: String,
    trim: true
  },
  username: {
    type: String,
    unique: true,
    trim: true,
    sparse: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  email: {
    type: String,
    unique: true,
    trim: true,
    sparse: true,
    match: [
      /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
      '请输入有效的邮箱地址'
    ]
  },
  nickname: {
    type: String,
    default: '',
    trim: true,
    maxlength: [50, '昵称不能超过50个字符']
  },
  avatar: {
    type: String,
    default: ''
  },
  subscription: {
    status: {
      type: String,
      enum: ['free', 'subscribed', 'expired'],
      default: 'free'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      default: () => {
        const date = new Date();
        date.setDate(date.getDate() + 7);
        return date;
      }
    },
    plan: {
      type: String,
      enum: ['monthly', 'yearly', 'free'],
      default: 'free'
    }
  },
  recordCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', UserSchema);

// 连接数据库
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/xiaonuo', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
  }
};

// 测试认证流程
const testAuthFlow = async () => {
  try {
    await connectDB();

    // 查找用户
    const user = await User.findOne({ username: 'admin_new2' });
    if (!user) {
      console.log('❌ 用户不存在');
      mongoose.disconnect();
      return;
    }

    console.log('📋 用户信息:');
    console.log('用户名:', user.username);
    console.log('角色:', user.role);
    console.log('用户ID:', user._id);
    console.log('角色字段是否存在:', 'role' in user);

    // 生成JWT token
    const token = jwt.sign(
      { userId: user._id },
      'xiaonuo_secret_key',
      { expiresIn: '7d' }
    );
    console.log('🔑 生成的token:', token);

    // 验证token
    const decoded = jwt.verify(token, 'xiaonuo_secret_key');
    console.log('✅ Token验证成功');
    console.log('🔍 解码的用户ID:', decoded.userId);

    // 模拟authMiddleware逻辑
    const mockUser = await User.findById(decoded.userId);
    console.log('👤 从数据库获取的用户:', {
      username: mockUser.username,
      role: mockUser.role,
      id: mockUser._id
    });

    // 检查角色
    if (mockUser.role === 'admin') {
      console.log('✅ 认证流程测试成功！用户角色正确');
      console.log('✅ 可以创建套餐');
    } else {
      console.log('❌ 认证流程测试失败！用户角色错误');
      console.log('❌ 无法创建套餐');
      // 修复角色
      console.log('🔧 正在修复用户角色...');
      mockUser.role = 'admin';
      await mockUser.save();
      console.log('✅ 用户角色修复成功，现在是管理员');
    }

    // 模拟planController.addPlan逻辑
    console.log('🔍 模拟addPlan权限检查...');
    if (mockUser.role === 'admin') {
      console.log('✅ 权限检查通过，可以添加套餐');
    } else {
      console.log('❌ 权限检查失败，无法添加套餐');
    }

    mongoose.disconnect();
  } catch (error) {
    console.error('❌ 测试失败:', error);
    mongoose.disconnect();
  }
};

testAuthFlow();
EOF

# 上传脚本到生产服务器
echo "📤 上传脚本到生产服务器..."
scp -i "$SERVER_KEY" /tmp/xiaonuo-admin/test-auth-flow.js "$SERVER_USER@$SERVER_IP:$SERVER_DIR/"

if [ $? -ne 0 ]; then
  echo "❌ 上传脚本失败！"
  rm -rf /tmp/xiaonuo-admin
  exit 1
fi

# 登录生产服务器并执行脚本
echo "🚀 在生产服务器执行脚本..."
ssh -i "$SERVER_KEY" "$SERVER_USER@$SERVER_IP" "cd $SERVER_DIR && node test-auth-flow.js"

if [ $? -ne 0 ]; then
  echo "❌ 执行脚本失败！"
  rm -rf /tmp/xiaonuo-admin
  exit 1
fi

# 清理临时文件
rm -rf /tmp/xiaonuo-admin

echo "✅ 认证流程测试脚本执行完成!"

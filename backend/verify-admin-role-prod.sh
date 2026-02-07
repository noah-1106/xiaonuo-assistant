#!/bin/bash

# 生产服务器验证管理员角色脚本
echo "📦 准备在生产服务器验证管理员角色..."

# 配置信息（从deploy.sh获取）
PROJECT_ROOT="$(dirname "$0")/.."
SERVER_IP="115.191.33.228"
SERVER_USER="root"
SERVER_KEY="$PROJECT_ROOT/backend/xiaonuoSev1.pem"
SERVER_DIR="/root/xiaonuo/backend"

# 创建临时目录
mkdir -p /tmp/xiaonuo-admin

# 创建验证脚本
cat > /tmp/xiaonuo-admin/verify-admin-role.js << 'EOF'
const mongoose = require('mongoose');

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

// 验证管理员角色
const verifyAdminRole = async () => {
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
    console.log('角色字段是否存在:', 'role' in user);
    console.log('用户ID:', user._id);
    console.log('创建时间:', user.createdAt);

    // 检查角色是否为admin
    if (user.role === 'admin') {
      console.log('✅ 用户角色正确，是管理员');
    } else {
      console.log('❌ 用户角色错误，不是管理员');
      // 修复角色
      console.log('🔧 正在修复用户角色...');
      user.role = 'admin';
      await user.save();
      console.log('✅ 用户角色修复成功，现在是管理员');
    }

    // 再次验证
    const updatedUser = await User.findOne({ username: 'admin_new2' });
    console.log('🔍 修复后角色:', updatedUser.role);

    // 检查所有用户
    console.log('\n📋 所有用户列表:');
    const allUsers = await User.find({}, { username: 1, role: 1, phone: 1 });
    allUsers.forEach(u => {
      console.log(`用户名: ${u.username || '无'}, 角色: ${u.role}, 手机号: ${u.phone}`);
    });

    mongoose.disconnect();
  } catch (error) {
    console.error('❌ 验证失败:', error);
    mongoose.disconnect();
  }
};

verifyAdminRole();
EOF

# 上传脚本到生产服务器
echo "📤 上传脚本到生产服务器..."
scp -i "$SERVER_KEY" /tmp/xiaonuo-admin/verify-admin-role.js "$SERVER_USER@$SERVER_IP:$SERVER_DIR/"

if [ $? -ne 0 ]; then
  echo "❌ 上传脚本失败！"
  rm -rf /tmp/xiaonuo-admin
  exit 1
fi

# 登录生产服务器并执行脚本
echo "🚀 在生产服务器执行脚本..."
ssh -i "$SERVER_KEY" "$SERVER_USER@$SERVER_IP" "cd $SERVER_DIR && node verify-admin-role.js"

if [ $? -ne 0 ]; then
  echo "❌ 执行脚本失败！"
  rm -rf /tmp/xiaonuo-admin
  exit 1
fi

# 清理临时文件
rm -rf /tmp/xiaonuo-admin

echo "✅ 管理员角色验证脚本执行完成!"

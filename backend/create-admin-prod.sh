#!/bin/bash

# 生产服务器创建管理员账号脚本
echo "📦 准备在生产服务器创建管理员账号..."

# 配置信息（从deploy.sh获取）
PROJECT_ROOT="$(dirname "$0")/.."
SERVER_IP="115.191.33.228"
SERVER_USER="root"
SERVER_KEY="$PROJECT_ROOT/backend/xiaonuoSev1.pem"
SERVER_DIR="/root/xiaonuo/backend"

# 创建临时目录
mkdir -p /tmp/xiaonuo-admin

# 创建管理员账号创建脚本
cat > /tmp/xiaonuo-admin/create-admin.js << 'EOF'
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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

// 密码加密
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    next();
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 密码比较方法
UserSchema.methods.comparePassword = async function(enteredPassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', UserSchema);

// 创建管理员账号
const createAdmin = async () => {
  try {
    await connectDB();

    // 检查用户名是否已存在
    const existingUser = await User.findOne({ username: 'admin_new2' });
    if (existingUser) {
      console.log('🔄 用户名已存在，正在更新...');
      // 更新现有用户
      existingUser.password = 'admin123';
      existingUser.role = 'admin';
      await existingUser.save();
      console.log('✅ 管理员账号更新成功!');
    } else {
      // 创建新用户
      const newAdmin = await User.create({
        phone: '13800138002',
        username: 'admin_new2',
        password: 'admin123',
        nickname: '新管理员',
        role: 'admin',
        email: 'admin_new2@example.com'
      });
      console.log('✅ 管理员账号创建成功!');
      console.log('📋 用户名: admin_new2');
      console.log('🔑 密码: admin123');
    }

    // 验证账号
    const user = await User.findOne({ username: 'admin_new2' });
    if (user) {
      const isPasswordValid = await user.comparePassword('admin123');
      console.log('🔍 密码验证结果:', isPasswordValid ? '✅ 通过' : '❌ 失败');
      console.log('👤 用户角色:', user.role);
    }

    mongoose.disconnect();
  } catch (error) {
    console.error('❌ 创建管理员账号失败:', error);
    mongoose.disconnect();
  }
};

createAdmin();
EOF

# 上传脚本到生产服务器
echo "📤 上传脚本到生产服务器..."
scp -i "$SERVER_KEY" /tmp/xiaonuo-admin/create-admin.js "$SERVER_USER@$SERVER_IP:$SERVER_DIR/"

if [ $? -ne 0 ]; then
  echo "❌ 上传脚本失败！"
  rm -rf /tmp/xiaonuo-admin
  exit 1
fi

# 登录生产服务器并执行脚本
echo "🚀 在生产服务器执行脚本..."
ssh -i "$SERVER_KEY" "$SERVER_USER@$SERVER_IP" "cd $SERVER_DIR && node create-admin.js"

if [ $? -ne 0 ]; then
  echo "❌ 执行脚本失败！"
  rm -rf /tmp/xiaonuo-admin
  exit 1
fi

# 清理临时文件
rm -rf /tmp/xiaonuo-admin

echo "✅ 管理员账号创建脚本执行完成!"

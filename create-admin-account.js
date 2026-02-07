const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 构建连接字符串
const uri = process.env.MONGO_URI || `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?authSource=admin&replicaSet=rs-mongo-replica-b95890613e56&retryWrites=true`;

console.log('尝试连接到:', uri.replace(process.env.DB_PASSWORD, '******'));

// 用户模型
const User = mongoose.model('User', {
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'user',
    enum: ['user', 'admin']
  },
  avatar: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
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

// 连接数据库并创建管理员账号
async function createAdminAccount() {
  try {
    // 连接数据库
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ 数据库连接成功!');

    // 检查用户是否已存在
    const existingUser = await User.findOne({ username: 'admin1' });
    if (existingUser) {
      console.log('⚠️  用户admin1已存在!');
      await mongoose.disconnect();
      return;
    }

    // 哈希密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('a123456', salt);

    // 创建管理员用户
    const adminUser = new User({
      username: 'admin1',
      email: 'admin1@xiaonuo.com',
      password: hashedPassword,
      role: 'admin',
      bio: '系统管理员账号'
    });

    // 保存用户
    await adminUser.save();
    console.log('✅ 管理员账号创建成功!');
    console.log('📋 账号信息:');
    console.log('   - 用户名: admin1');
    console.log('   - 密码: a123456');
    console.log('   - 邮箱: admin1@xiaonuo.com');
    console.log('   - 角色: admin');

    // 断开连接
    await mongoose.disconnect();
    console.log('✅ 操作完成!');

  } catch (error) {
    console.error('❌ 操作失败:', error.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

// 执行创建操作
createAdminAccount();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 连接数据库 - 使用生产环境配置
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/xiaonuo', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('数据库连接成功');
  } catch (error) {
    console.error('数据库连接失败:', error);
    process.exit(1);
  }
};

// 用户模型定义（与生产环境保持一致）
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
      console.log('用户名已存在，正在更新...');
      // 更新现有用户
      existingUser.password = 'admin123';
      existingUser.role = 'admin';
      await existingUser.save();
      console.log('管理员账号更新成功!');
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
      console.log('管理员账号创建成功!');
      console.log('用户名: admin_new2');
      console.log('密码: admin123');
    }

    mongoose.disconnect();
  } catch (error) {
    console.error('创建管理员账号失败:', error);
    mongoose.disconnect();
  }
};

createAdmin();
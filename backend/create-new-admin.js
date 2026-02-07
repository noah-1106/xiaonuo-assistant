const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');

// 连接数据库
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
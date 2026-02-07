const mongoose = require('mongoose');
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

// 测试管理员账号登录
const testAdminLogin = async () => {
  try {
    await connectDB();

    // 查找用户
    const user = await User.findOne({ username: 'admin_new2' });
    if (!user) {
      console.log('用户不存在');
      mongoose.disconnect();
      return;
    }

    console.log('用户信息:');
    console.log('用户名:', user.username);
    console.log('角色:', user.role);
    console.log('密码是否存在:', !!user.password);
    console.log('密码长度:', user.password ? user.password.length : 0);

    // 测试密码验证
    const isPasswordValid = await user.comparePassword('admin123');
    console.log('密码验证结果:', isPasswordValid);

    if (isPasswordValid) {
      console.log('✅ 登录测试成功!');
    } else {
      console.log('❌ 登录测试失败 - 密码验证错误');
    }

    mongoose.disconnect();
  } catch (error) {
    console.error('测试失败:', error);
    mongoose.disconnect();
  }
};

testAdminLogin();
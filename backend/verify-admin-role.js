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

// 验证管理员角色
const verifyAdminRole = async () => {
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
    console.log('角色字段是否存在:', 'role' in user);
    console.log('完整用户对象:', JSON.stringify(user, null, 2));

    // 检查角色是否为admin
    if (user.role === 'admin') {
      console.log('✅ 用户角色正确，是管理员');
    } else {
      console.log('❌ 用户角色错误，不是管理员');
    }

    mongoose.disconnect();
  } catch (error) {
    console.error('验证失败:', error);
    mongoose.disconnect();
  }
};

verifyAdminRole();
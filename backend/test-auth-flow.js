const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./src/models/User');

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
    const mockReq = { userId: decoded.userId };
    const mockUser = await User.findById(mockReq.userId);
    console.log('👤 从数据库获取的用户:', {
      username: mockUser.username,
      role: mockUser.role,
      id: mockUser._id
    });

    // 检查角色
    if (mockUser.role === 'admin') {
      console.log('✅ 认证流程测试成功！用户角色正确');
    } else {
      console.log('❌ 认证流程测试失败！用户角色错误');
    }

    mongoose.disconnect();
  } catch (error) {
    console.error('❌ 测试失败:', error);
    mongoose.disconnect();
  }
};

testAuthFlow();
const mongoose = require('mongoose');
const config = require('./src/config');

async function testDatabaseConnection() {
  console.log('🔍 开始测试数据库连接...');
  
  try {
    // 连接数据库
    console.log('📦 连接数据库...');
    await mongoose.connect(config.db.url, config.db.options);
    console.log('✅ 数据库连接成功');
    
    // 测试查询
    console.log('📋 测试数据库查询...');
    const Order = require('./src/models/Order');
    const orders = await Order.find({}).limit(5);
    console.log('✅ 数据库查询成功，订单数量:', orders.length);
    
    // 测试用户查询
    const User = require('./src/models/User');
    const users = await User.find({}).limit(5);
    console.log('✅ 用户查询成功，用户数量:', users.length);
    
    // 断开连接
    await mongoose.disconnect();
    console.log('✅ 数据库连接已断开');
    
  } catch (error) {
    console.error('❌ 数据库操作失败:', error.message);
    console.error('错误详情:', error);
  }
}

// 执行测试
testDatabaseConnection();
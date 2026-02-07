#!/usr/bin/env node

/**
 * 重置管理员密码脚本
 * 用于重置admin用户的密码
 */

const mongoose = require('mongoose');
const User = require('./src/models/User');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// 加载环境变量
dotenv.config();

// 新密码
const newPassword = 'admin123';

// 连接数据库
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/xiaonuo', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    process.exit(1);
  }
}

// 重置admin用户密码
async function resetAdminPassword() {
  try {
    // 查找admin用户
    const adminUser = await User.findOne({ username: 'admin' });
    
    if (!adminUser) {
      console.error('❌ 未找到admin用户');
      process.exit(1);
    }
    
    // 加密新密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // 更新密码
    adminUser.password = hashedPassword;
    await adminUser.save();
    
    console.log('✅ admin用户密码重置成功');
    console.log('🔑 新密码:', newPassword);
    console.log('👤 用户名:', adminUser.username);
    console.log('📱 手机号:', adminUser.phone);
    console.log('📧 邮箱:', adminUser.email);
  } catch (error) {
    console.error('❌ 重置密码失败:', error.message);
  } finally {
    // 断开数据库连接
    await mongoose.disconnect();
    console.log('🔌 数据库连接已断开');
  }
}

// 执行脚本
async function main() {
  console.log('🚀 开始重置admin用户密码...');
  await connectDB();
  await resetAdminPassword();
  console.log('🎉 密码重置脚本执行完成');
}

main();

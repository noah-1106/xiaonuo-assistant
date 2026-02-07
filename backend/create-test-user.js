#!/usr/bin/env node

/**
 * 创建测试用户脚本
 * 用于创建专门测试套餐购买的测试用户
 */

const mongoose = require('mongoose');
const User = require('./src/models/User');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 连接数据库
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/xiaonuo', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB 数据库连接成功');
  } catch (error) {
    console.error('❌ MongoDB 数据库连接失败:', error.message);
    process.exit(1);
  }
};

// 创建测试用户
const createTestUser = async () => {
  try {
    // 连接数据库
    await connectDB();

    // 测试用户信息
    const testUserInfo = {
      phone: '13800138001',
      password: '123456',
      role: 'user',
      nickname: '测试用户',
      email: 'testuser@example.com',
      subscription: {
        status: 'expired',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30天前
        endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1天前
        plan: 'free'
      },
      recordCount: 0
    };

    // 检查用户是否已存在
    const existingUser = await User.findOne({ phone: testUserInfo.phone });
    if (existingUser) {
      console.log('⚠️  测试用户已存在，更新用户信息...');
      // 更新用户信息
      await User.findByIdAndUpdate(existingUser._id, testUserInfo, { new: true });
      console.log('✅ 测试用户信息已更新');
    } else {
      // 创建新用户
      const newUser = new User(testUserInfo);
      await newUser.save();
      console.log('✅ 测试用户创建成功');
    }

    console.log('\n📋 测试用户信息:');
    console.log('手机号:', testUserInfo.phone);
    console.log('密码:', testUserInfo.password);
    console.log('角色:', testUserInfo.role);
    console.log('订阅状态:', testUserInfo.subscription.status);
    console.log('订阅计划:', testUserInfo.subscription.plan);
    console.log('订阅结束时间:', testUserInfo.subscription.endDate);

    // 断开数据库连接
    await mongoose.connection.close();
    console.log('\n✅ 数据库连接已关闭');

  } catch (error) {
    console.error('❌ 创建测试用户失败:', error.message);
    process.exit(1);
  }
};

// 执行创建测试用户
createTestUser();

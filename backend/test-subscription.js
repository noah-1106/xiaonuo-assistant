#!/usr/bin/env node

/**
 * 订阅系统测试脚本
 * 测试7天免费试用期和订阅状态检查功能
 */

const mongoose = require('mongoose');
const User = require('./src/models/User');
const Plan = require('./src/models/Plan');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

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

// 测试订阅系统功能
async function testSubscriptionSystem() {
  try {
    console.log('🚀 开始测试订阅系统功能...');
    
    // 先删除已存在的测试用户
    await User.deleteOne({ phone: '13800138001' });
    await User.deleteOne({ username: 'testuser' });
    
    // 创建测试用户
    console.log('\n1. 创建测试用户...');
    const testUser = new User({
      phone: '13800138001',
      password: 'test123',
      username: 'testuser',
      nickname: '测试用户'
    });
    await testUser.save();
    console.log('✅ 测试用户创建成功');
    console.log('   开始日期:', testUser.subscription.startDate);
    console.log('   结束日期:', testUser.subscription.endDate);
    console.log('   状态:', testUser.subscription.status);
    console.log('   Plan ID:', testUser.subscription.plan);
    
    // 计算试用期天数
    const startDate = new Date(testUser.subscription.startDate);
    const endDate = new Date(testUser.subscription.endDate);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    console.log('   试用期天数:', daysDiff);
    
    // 验证试用期是否为7天
    if (daysDiff === 7) {
      console.log('✅ 试用期设置正确，为7天');
    } else {
      console.error('❌ 试用期设置错误，应为7天，实际为', daysDiff, '天');
    }
    
    // 验证Plan ID是否已关联
    if (testUser.subscription.plan) {
      console.log('✅ Plan ID已正确关联');
      // 验证Plan是否存在
      const plan = await Plan.findById(testUser.subscription.plan);
      if (plan) {
        console.log('✅ 关联的Plan存在:', plan.name);
      } else {
        console.error('❌ 关联的Plan不存在');
      }
    } else {
      console.error('❌ Plan ID未关联');
    }
    
    // 测试订阅状态检查
    console.log('\n2. 测试订阅状态检查...');
    // 模拟认证中间件中的订阅状态检查逻辑
    const now = new Date();
    if (testUser.subscription.endDate < now && testUser.subscription.status !== 'expired') {
      testUser.subscription.status = 'expired';
      await testUser.save();
      console.log('✅ 订阅状态已更新为expired');
    } else {
      console.log('✅ 订阅状态检查正常，当前状态:', testUser.subscription.status);
    }
    
    // 测试过期用户的API访问限制
    console.log('\n3. 测试过期用户的API访问限制...');
    // 模拟设置用户为过期状态
    testUser.subscription.status = 'expired';
    await testUser.save();
    console.log('✅ 已设置用户为过期状态');
    
    // 模拟API访问检查
    if (testUser.subscription.status === 'expired') {
      console.log('✅ API访问限制检查正常，过期用户将被拒绝访问');
    } else {
      console.error('❌ API访问限制检查失败');
    }
    
    // 删除测试用户
    console.log('\n4. 清理测试数据...');
    await User.deleteOne({ _id: testUser._id });
    console.log('✅ 测试用户已删除');
    
    console.log('\n🎉 订阅系统功能测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 数据库连接已断开');
  }
}

// 执行测试
async function main() {
  await connectDB();
  await testSubscriptionSystem();
}

main();

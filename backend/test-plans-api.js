#!/usr/bin/env node

/**
 * 测试套餐API
 */

const mongoose = require('mongoose');
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

// 测试获取可用套餐
async function testAvailablePlans() {
  try {
    console.log('\n=== 测试获取可用套餐API ===');
    // 模拟getAvailablePlans方法的查询
    const availablePlans = await Plan.find({ isActive: true, isSystem: false }).sort({ price: 1 });
    console.log('可用套餐数量:', availablePlans.length);
    availablePlans.forEach(plan => {
      console.log('套餐:', plan.name, '价格:', plan.price, '时长:', plan.duration, 'isSystem:', plan.isSystem, 'isActive:', plan.isActive);
    });
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    throw error;
  }
}

// 测试获取所有套餐
async function testAllPlans() {
  try {
    console.log('\n=== 测试获取所有套餐API ===');
    // 模拟getAllPlans方法的查询
    const allPlans = await Plan.find().sort({ createdAt: -1 });
    console.log('所有套餐数量:', allPlans.length);
    allPlans.forEach(plan => {
      console.log('套餐:', plan.name, '价格:', plan.price, '时长:', plan.duration, 'isSystem:', plan.isSystem, 'isActive:', plan.isActive);
    });
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    throw error;
  }
}

// 执行测试
async function main() {
  console.log('🚀 开始测试套餐API...');
  
  try {
    await connectDB();
    await testAvailablePlans();
    await testAllPlans();
    console.log('\n🎉 测试完成！');
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 数据库连接已断开');
  }
}

main();

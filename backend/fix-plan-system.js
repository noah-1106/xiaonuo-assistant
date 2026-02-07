#!/usr/bin/env node

/**
 * 修复套餐的isSystem字段
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

// 修复套餐的isSystem字段
async function fixPlanSystemField() {
  try {
    console.log('\n=== 修复套餐的isSystem字段 ===');
    
    // 获取所有套餐
    const allPlans = await Plan.find();
    console.log('找到', allPlans.length, '个套餐');
    
    // 修复每个套餐
    for (const plan of allPlans) {
      console.log('\n处理套餐:', plan.name);
      console.log('当前isSystem:', plan.isSystem);
      
      // 明确设置isSystem字段
      if (plan.name === '免费版') {
        // 免费版设置为系统套餐
        plan.isSystem = true;
      } else {
        // 其他套餐设置为非系统套餐
        plan.isSystem = false;
      }
      
      await plan.save();
      console.log('修复后isSystem:', plan.isSystem);
    }
    
    console.log('\n=== 修复完成后测试 ===');
    // 测试查询
    const nonSystemPlans = await Plan.find({ isSystem: false });
    console.log('非系统套餐数量:', nonSystemPlans.length);
    nonSystemPlans.forEach(plan => {
      console.log('套餐:', plan.name, 'isSystem:', plan.isSystem);
    });
    
  } catch (error) {
    console.error('❌ 修复失败:', error.message);
    throw error;
  }
}

// 执行修复
async function main() {
  console.log('🚀 开始修复套餐的isSystem字段...');
  
  try {
    await connectDB();
    await fixPlanSystemField();
    console.log('\n🎉 修复完成！');
  } catch (error) {
    console.error('❌ 修复失败:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 数据库连接已断开');
  }
}

main();

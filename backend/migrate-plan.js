#!/usr/bin/env node

/**
 * 套餐数据迁移脚本
 * 1. 创建默认的免费套餐
 * 2. 更新现有用户的plan字段为免费套餐的ObjectId
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

// 创建默认免费套餐
async function createFreePlan() {
  try {
    // 检查是否已存在免费套餐
    let freePlan = await Plan.findOne({ name: '免费版' });
    
    if (freePlan) {
      console.log('✅ 免费套餐已存在:', freePlan._id);
      return freePlan._id;
    }
    
    // 创建新的免费套餐
    const newFreePlan = new Plan({
      name: '免费版',
      description: '免费使用基础功能，包含7天试用期',
      duration: 7,
      price: 0,
      features: ['基础聊天', '系统默认模型', '系统预设能力包'],
      isActive: true,
      isSystem: true
    });
    
    await newFreePlan.save();
    console.log('✅ 创建免费套餐成功:', newFreePlan._id);
    return newFreePlan._id;
  } catch (error) {
    console.error('❌ 创建免费套餐失败:', error.message);
    throw error;
  }
}

// 更新用户的plan字段
async function updateUsersPlan(freePlanId) {
  try {
    // 查找所有用户
    const users = await User.find();
    console.log(`✅ 找到 ${users.length} 个用户`);
    
    // 更新每个用户的plan字段
    let updatedCount = 0;
    for (const user of users) {
      if (!user.subscription.plan) {
        user.subscription.plan = freePlanId;
        await user.save();
        updatedCount++;
      }
    }
    
    console.log(`✅ 更新了 ${updatedCount} 个用户的套餐字段`);
  } catch (error) {
    console.error('❌ 更新用户套餐失败:', error.message);
    throw error;
  }
}

// 执行迁移
async function main() {
  console.log('🚀 开始套餐数据迁移...');
  
  try {
    await connectDB();
    const freePlanId = await createFreePlan();
    await updateUsersPlan(freePlanId);
    console.log('🎉 套餐数据迁移完成！');
  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 数据库连接已断开');
  }
}

main();

#!/usr/bin/env node

/**
 * 更新现有免费套餐为系统默认套餐
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

// 更新免费套餐为系统默认套餐
async function updateFreePlan() {
  try {
    // 查找免费套餐
    const freePlan = await Plan.findOne({ name: '免费版' });
    if (freePlan) {
      console.log('✅ 找到免费套餐:', freePlan._id);
      
      // 更新为系统默认套餐
      freePlan.isSystem = true;
      await freePlan.save();
      console.log('✅ 免费套餐已更新为系统默认套餐');
    } else {
      console.error('❌ 未找到免费套餐');
    }
  } catch (error) {
    console.error('❌ 更新免费套餐失败:', error.message);
    throw error;
  }
}

// 执行更新
async function main() {
  console.log('🚀 开始更新免费套餐为系统默认套餐...');
  
  try {
    await connectDB();
    await updateFreePlan();
    console.log('🎉 更新完成！');
  } catch (error) {
    console.error('❌ 更新失败:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 数据库连接已断开');
  }
}

main();

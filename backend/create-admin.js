#!/usr/bin/env node

/**
 * 创建管理员账号脚本
 * 用于在生产服务器上创建管理员账号
 */

const mongoose = require('mongoose');
const User = require('./src/models/User');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 管理员账号信息
const adminInfo = {
  phone: '13800138001',
  username: 'admin',
  password: 'admin123',
  role: 'admin',
  nickname: '系统管理员',
  email: 'admin@xiaonuo.top',
  subscription: {
    status: 'subscribed',
    startDate: new Date(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1年有效期
    plan: 'yearly'
  },
  recordCount: 9999 // 无限记录数
};

/**
 * 连接数据库
 */
async function connectDB() {
  try {
    let mongoUri;
    
    // 检查是否有完整的MONGO_URI
    if (process.env.MONGO_URI) {
      mongoUri = process.env.MONGO_URI;
    } else {
      // 使用单独的数据库配置变量构建连接字符串
      const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = process.env;
      
      // 构建连接字符串
      if (DB_USER && DB_PASSWORD) {
        mongoUri = `mongodb://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
      } else {
        mongoUri = `mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`;
      }
    }
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    process.exit(1);
  }
}

/**
 * 创建管理员账号
 */
async function createAdmin() {
  try {
    // 检查管理员账号是否已存在
    const existingAdmin = await User.findOne({
      $or: [
        { phone: adminInfo.phone },
        { username: adminInfo.username },
        { email: adminInfo.email }
      ]
    });

    if (existingAdmin) {
      console.log('⚠️  管理员账号已存在，跳过创建');
      console.log('已存在的管理员信息:', {
        id: existingAdmin._id,
        phone: existingAdmin.phone,
        username: existingAdmin.username,
        role: existingAdmin.role,
        createdAt: existingAdmin.createdAt
      });
      return;
    }

    // 创建管理员账号
    const admin = await User.create(adminInfo);
    console.log('🎉 管理员账号创建成功');
    console.log('管理员信息:', {
      id: admin._id,
      phone: admin.phone,
      username: admin.username,
      role: admin.role,
      email: admin.email,
      nickname: admin.nickname,
      createdAt: admin.createdAt
    });
    console.log('\n🔑 登录凭证:');
    console.log('   用户名:', adminInfo.username);
    console.log('   密码:', adminInfo.password);
    console.log('   手机号:', adminInfo.phone);
    console.log('\n⚠️  请妥善保管此凭证，首次登录后建议修改密码');
  } catch (error) {
    console.error('❌ 创建管理员账号失败:', error.message);
    if (error.code === 11000) {
      console.error('📌 错误原因: 唯一字段冲突（手机号、用户名或邮箱已被使用）');
    }
    process.exit(1);
  } finally {
    // 断开数据库连接
    await mongoose.disconnect();
    console.log('\n🔌 数据库连接已断开');
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始创建管理员账号...');
  await connectDB();
  await createAdmin();
  console.log('✅ 脚本执行完成');
}

// 执行主函数
main();

const mongoose = require('mongoose');
const { db: dbConfig } = require('./index');

// 连接数据库
const connectDB = async () => {
  try {
    await mongoose.connect(dbConfig.url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB 数据库连接成功');
  } catch (error) {
    console.error('❌ MongoDB 数据库连接失败:', error.message);
    console.warn('⚠️  服务将继续运行，但部分功能可能受限');
  }
};

// 导出连接函数（保持向后兼容）
module.exports = connectDB;

// 导出数据库配置（新增）
module.exports.dbConfig = dbConfig;

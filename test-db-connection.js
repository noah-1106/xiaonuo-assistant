const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// 构建连接字符串
const uri = process.env.MONGO_URI || `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?authSource=admin&replicaSet=rs-mongo-replica-b95890613e56&retryWrites=true`;

console.log('尝试连接到:', uri.replace(process.env.DB_PASSWORD, '******'));

// 测试连接
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ 数据库连接成功!');
  mongoose.disconnect();
})
.catch(err => {
  console.log('❌ 数据库连接失败:', err.message);
  process.exit(1);
});
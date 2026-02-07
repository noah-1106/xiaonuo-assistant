const mongoose = require('mongoose');
const NotificationConfig = require('./src/models/NotificationConfig');

// 连接数据库
mongoose.connect('mongodb://localhost:27017/xiaonuo', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('数据库连接成功');
  // 获取当前配置
  return NotificationConfig.getCurrentConfig();
}).then(config => {
  console.log('当前邮箱配置:');
  console.log(JSON.stringify(config.email, null, 2));
  // 断开数据库连接
  return mongoose.disconnect();
}).then(() => {
  console.log('数据库连接已断开');
  process.exit(0);
}).catch(error => {
  console.error('错误:', error);
  mongoose.disconnect().then(() => {
    process.exit(1);
  });
});
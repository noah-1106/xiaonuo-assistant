const mongoose = require('mongoose');
const ChatMessage = require('./src/models/ChatMessage');
const { db } = require('./src/config');

// 连接数据库
async function connectDB() {
  try {
    await mongoose.connect(db.url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB 数据库连接成功');
    return true;
  } catch (error) {
    console.error('❌ MongoDB 数据库连接失败:', error.message);
    return false;
  }
}

// 查询最近的用户消息
async function findRecentUserMessage() {
  try {
    console.log('🔍 正在查询最近的用户消息...');
    
    // 查询最近的用户消息，按时间戳降序排序
    const recentMessage = await ChatMessage.findOne({
      sender: 'user'
    }).sort({ timestamp: -1 }).limit(1);
    
    if (recentMessage) {
      console.log('✅ 找到最近的用户消息:');
      console.log('----------------------------------------');
      console.log(`消息ID: ${recentMessage._id}`);
      console.log(`用户ID: ${recentMessage.userId}`);
      console.log(`会话ID: ${recentMessage.sessionId}`);
      console.log(`发送时间: ${recentMessage.timestamp}`);
      console.log(`消息类型: ${recentMessage.type}`);
      console.log(`消息内容:`);
      console.log(`${recentMessage.content}`);
      console.log('----------------------------------------');
      
      return recentMessage;
    } else {
      console.log('❌ 未找到用户消息');
      return null;
    }
  } catch (error) {
    console.error('❌ 查询消息失败:', error.message);
    return null;
  }
}

// 运行脚本
async function run() {
  const connected = await connectDB();
  if (connected) {
    await findRecentUserMessage();
    await mongoose.disconnect();
    console.log('✅ 数据库连接已关闭');
  }
}

run();

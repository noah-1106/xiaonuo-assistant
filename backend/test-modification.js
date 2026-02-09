// 测试修改后的功能
const mongoose = require('mongoose');
const { db } = require('./src/config');
const DoubaoAdapter = require('./src/models/doubaoAdapter');

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

// 测试DoubaoAdapter
async function testDoubaoAdapter() {
  try {
    console.log('🔍 开始测试 DoubaoAdapter...');
    
    // 创建DoubaoAdapter实例
    const adapter = new DoubaoAdapter({
      model: 'doubao-seed-1-8-251228',
      apiKey: process.env.ARK_API_KEY,
      temperature: 0.8,
      topP: 0.95
    });
    
    // 测试消息
    const userMessage = '我是谁？';
    
    // 模拟上下文（包含系统提示词）
    const context = [
      {
        role: 'system',
        content: '你是小诺，一个智能助手，帮助用户解决问题，提供友好的回答。'
      }
    ];
    
    console.log('📝 发送测试消息:', userMessage);
    console.log('📋 上下文:', context);
    
    // 处理文本
    const result = await adapter.processText(userMessage, context, [], 'test-user-id');
    
    console.log('✅ 测试成功！');
    console.log('----------------------------------------');
    console.log('响应结果:');
    console.log(JSON.stringify(result, null, 2));
    console.log('----------------------------------------');
    
    return result;
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('错误响应:', error.response.data);
    }
    return null;
  }
}

// 运行测试
async function run() {
  const connected = await connectDB();
  if (connected) {
    await testDoubaoAdapter();
    await mongoose.disconnect();
    console.log('✅ 数据库连接已关闭');
  }
}

run();

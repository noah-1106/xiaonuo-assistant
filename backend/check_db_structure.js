const mongoose = require('mongoose');
const ChatMessage = require('./src/models/ChatMessage');

// 连接数据库
async function checkDatabaseStructure() {
  try {
    // 使用与应用相同的数据库连接
    await mongoose.connect('mongodb://localhost:27017/xiaonuo', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('数据库连接成功');
    
    // 获取ChatMessage集合的信息
    const collection = mongoose.connection.collection('chatmessages');
    
    // 检查索引
    console.log('\n=== 索引信息 ===');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(index.name, ':', index.key);
    });
    
    // 检查文档结构
    console.log('\n=== 文档结构 ===');
    // 先查找有files字段且长度大于0的文档
    const fileDocument = await ChatMessage.findOne({ 'files.0': { $exists: true } });
    if (fileDocument) {
      console.log('包含files字段的文档:');
      console.log(JSON.stringify(fileDocument, null, 2));
      
      // 检查files字段的结构
      if (fileDocument.files) {
        console.log('\n=== files字段结构 ===');
        console.log('files类型:', typeof fileDocument.files);
        console.log('files长度:', Array.isArray(fileDocument.files) ? fileDocument.files.length : 0);
        if (Array.isArray(fileDocument.files) && fileDocument.files.length > 0) {
          console.log('第一个file对象:');
          console.log(JSON.stringify(fileDocument.files[0], null, 2));
        }
      }
    } else {
      console.log('没有找到包含files字段的文档');
      // 查找任意文档作为示例
      const sampleDocument = await ChatMessage.findOne();
      if (sampleDocument) {
        console.log('\n示例文档:');
        console.log(JSON.stringify(sampleDocument, null, 2));
      } else {
        console.log('集合中没有文档');
      }
    }
    
    // 比较模型定义和实际结构
    console.log('\n=== 模型定义 ===');
    console.log('ChatMessage模型字段:');
    const schema = ChatMessage.schema;
    Object.keys(schema.paths).forEach(path => {
      if (!path.includes('__v')) {
        console.log(`${path}: ${schema.paths[path].instance}`);
      }
    });
    
  } catch (error) {
    console.error('检查数据库结构失败:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n数据库连接已关闭');
  }
}

// 运行检查
checkDatabaseStructure();

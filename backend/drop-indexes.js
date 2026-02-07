const mongoose = require('mongoose');
const User = require('./src/models/User');

// 连接数据库
async function dropIndexes() {
  try {
    await mongoose.connect('mongodb://localhost:27017/xiaonuo');
    console.log('✅ 数据库连接成功');

    // 连接到users集合
    const usersCollection = mongoose.connection.collection('users');
    
    // 查看当前索引
    console.log('📋 当前索引:');
    const indexes = await usersCollection.indexes();
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    // 删除有问题的索引
    console.log('🗑️ 删除有问题的索引...');
    
    // 尝试删除可能存在的问题索引
    try {
      await usersCollection.dropIndex('phone_1');
      console.log('✅ 删除 phone_1 索引成功');
    } catch (error) {
      console.log('⚠️ phone_1 索引不存在:', error.message);
    }

    try {
      await usersCollection.dropIndex('username_1');
      console.log('✅ 删除 username_1 索引成功');
    } catch (error) {
      console.log('⚠️ username_1 索引不存在:', error.message);
    }

    try {
      await usersCollection.dropIndex('email_1');
      console.log('✅ 删除 email_1 索引成功');
    } catch (error) {
      console.log('⚠️ email_1 索引不存在:', error.message);
    }

    // 查看更新后的索引
    console.log('📋 更新后的索引:');
    const updatedIndexes = await usersCollection.indexes();
    updatedIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    console.log('✅ 索引清理完成');
  } catch (error) {
    console.error('❌ 操作失败:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 数据库连接已关闭');
  }
}

dropIndexes();

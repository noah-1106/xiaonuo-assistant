#!/usr/bin/env node

/**
 * WebSocket 通知测试脚本
 * 测试小诺创建记录时的 WebSocket 通知功能
 */

const axios = require('axios');
const { io } = require('socket.io-client');

// 测试用户信息
const TEST_USER = {
  username: 'admin_1',
  password: 'admin123'
};

// API 基础 URL
const API_BASE_URL = 'http://localhost:3001';
const WS_URL = 'http://localhost:3001';

// 测试变量
let token = null;
let userId = null;
let socket = null;
let testRecordId = null;

/**
 * 登录获取 token
 */
async function login() {
  console.log('\n=== 步骤 1: 用户登录 ===');
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login-with-password`, {
      username: TEST_USER.username,
      password: TEST_USER.password
    });
    
    if (response.data.status === 'ok') {
      token = response.data.data.token;
      userId = response.data.data.user.userId;
      console.log('✅ 登录成功');
      console.log('   用户ID:', userId);
      console.log('   Token:', token.substring(0, 20) + '...');
      return true;
    } else {
      console.log('❌ 登录失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ 登录请求失败:', error.message);
    return false;
  }
}

/**
 * 建立 WebSocket 连接并认证
 */
function connectWebSocket() {
  return new Promise((resolve) => {
    console.log('\n=== 步骤 2: 建立 WebSocket 连接 ===');
    
    socket = io(WS_URL, {
      transports: ['websocket'],
      reconnection: false
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket 连接已建立');
      console.log('   Socket ID:', socket.id);
      
      // 发送认证请求
      socket.emit('authenticate', {
        userId: userId,
        token: token
      });
    });

    socket.on('authenticated', (data) => {
      console.log('✅ WebSocket 认证成功');
      resolve(true);
    });

    socket.on('authentication_error', (data) => {
      console.log('❌ WebSocket 认证失败:', data.message);
      resolve(false);
    });

    socket.on('disconnect', () => {
      console.log('⚠️  WebSocket 连接已断开');
    });

    socket.on('error', (error) => {
      console.log('❌ WebSocket 错误:', error.message);
    });

    // 监听记录相关事件
    socket.on('record_created', (data) => {
      console.log('\n🎉 接收到记录创建通知:');
      console.log('   记录ID:', data.record.id);
      console.log('   记录标题:', data.record.title);
      console.log('   记录类型:', data.record.type);
      testRecordId = data.record.id;
    });

    socket.on('record_updated', (data) => {
      console.log('\n🎉 接收到记录更新通知:');
      console.log('   记录ID:', data.record.id);
      console.log('   记录标题:', data.record.title);
      console.log('   记录类型:', data.record.type);
    });

    socket.on('record_deleted', (data) => {
      console.log('\n🎉 接收到记录删除通知:');
      console.log('   记录ID:', data.recordId);
    });

    // 连接超时
    setTimeout(() => {
      if (socket.connected) {
        console.log('✅ WebSocket 连接成功');
      } else {
        console.log('❌ WebSocket 连接超时');
        resolve(false);
      }
    }, 5000);
  });
}

/**
 * 通过小诺创建记录
 */
async function createRecordByXiaoNuo() {
  console.log('\n=== 步骤 3: 通过小诺创建记录 ===');
  try {
    const testMessage = '创建一条灵感记录，标题为WebSocket测试，内容为测试WebSocket通知功能';
    
    const response = await axios.post(`${API_BASE_URL}/api/chat/messages`, {
      message: testMessage,
      sessionId: null
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.status === 'ok') {
      console.log('✅ 小诺消息发送成功');
      console.log('   小诺回复:', response.data.data.reply.substring(0, 100) + '...');
      return true;
    } else {
      console.log('❌ 小诺消息发送失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ 小诺消息发送请求失败:', error.message);
    return false;
  }
}

/**
 * 直接 API 创建记录
 */
async function createRecordByApi() {
  console.log('\n=== 步骤 4: 通过 API 直接创建记录 ===');
  try {
    const response = await axios.post(`${API_BASE_URL}/api/records`, {
      type: 'inspiration',
      title: 'API测试记录',
      content: '通过API直接创建的测试记录',
      tags: ['测试', 'WebSocket']
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.status === 'ok') {
      console.log('✅ API 创建记录成功');
      console.log('   记录ID:', response.data.data.record._id);
      console.log('   记录标题:', response.data.data.record.title);
      testRecordId = response.data.data.record._id;
      return true;
    } else {
      console.log('❌ API 创建记录失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ API 创建记录请求失败:', error.message);
    return false;
  }
}

/**
 * 直接 API 更新记录
 */
async function updateRecordByApi() {
  if (!testRecordId) {
    console.log('\n⚠️  没有测试记录ID，跳过更新测试');
    return false;
  }
  
  console.log('\n=== 步骤 5: 通过 API 直接更新记录 ===');
  try {
    const response = await axios.put(`${API_BASE_URL}/api/records/${testRecordId}`, {
      title: 'API测试记录 - 已更新',
      content: '通过API直接更新的测试记录',
      tags: ['测试', 'WebSocket', '已更新']
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.status === 'ok') {
      console.log('✅ API 更新记录成功');
      console.log('   记录ID:', response.data.data.record._id);
      console.log('   记录标题:', response.data.data.record.title);
      return true;
    } else {
      console.log('❌ API 更新记录失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ API 更新记录请求失败:', error.message);
    return false;
  }
}

/**
 * 直接 API 删除记录
 */
async function deleteRecordByApi() {
  if (!testRecordId) {
    console.log('\n⚠️  没有测试记录ID，跳过删除测试');
    return false;
  }
  
  console.log('\n=== 步骤 6: 通过 API 直接删除记录 ===');
  try {
    const response = await axios.delete(`${API_BASE_URL}/api/records/${testRecordId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.status === 'ok') {
      console.log('✅ API 删除记录成功');
      console.log('   记录ID:', testRecordId);
      return true;
    } else {
      console.log('❌ API 删除记录失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ API 删除记录请求失败:', error.message);
    return false;
  }
}

/**
 * 测试完成后清理
 */
function cleanup() {
  console.log('\n=== 步骤 5: 清理测试 ===');
  if (socket) {
    socket.disconnect();
    console.log('✅ WebSocket 连接已关闭');
  }
  console.log('\n=== 测试完成 ===');
}

/**
 * 主测试函数
 */
async function runTest() {
  console.log('🧪 WebSocket 通知功能测试');
  console.log('='.repeat(50));
  
  try {
    // 步骤 1: 登录
    const loginSuccess = await login();
    if (!loginSuccess) {
      console.log('\n❌ 登录失败，测试终止');
      return;
    }
    
    // 步骤 2: 建立 WebSocket 连接
    const wsSuccess = await connectWebSocket();
    if (!wsSuccess) {
      console.log('\n❌ WebSocket 连接失败，测试终止');
      return;
    }
    
    // 等待 2 秒，确保 WebSocket 连接稳定
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 步骤 3: 通过小诺创建记录
    await createRecordByXiaoNuo();
    
    // 等待 5 秒，观察是否收到 WebSocket 通知
    console.log('\n⏳ 等待 5 秒，观察 WebSocket 通知...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 步骤 4: 通过 API 直接创建记录
    await createRecordByApi();
    
    // 等待 5 秒，观察是否收到 WebSocket 通知
    console.log('\n⏳ 等待 5 秒，观察 WebSocket 通知...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 步骤 5: 通过 API 直接更新记录
    await updateRecordByApi();
    
    // 等待 5 秒，观察是否收到 WebSocket 通知
    console.log('\n⏳ 等待 5 秒，观察 WebSocket 通知...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 步骤 6: 通过 API 直接删除记录
    await deleteRecordByApi();
    
    // 等待 5 秒，观察是否收到 WebSocket 通知
    console.log('\n⏳ 等待 5 秒，观察 WebSocket 通知...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.log('\n❌ 测试过程中发生错误:', error.message);
  } finally {
    cleanup();
  }
}

// 运行测试
runTest();

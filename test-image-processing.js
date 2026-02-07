const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs');
const FormData = require('form-data');

// 配置
const API_BASE_URL = 'http://localhost:3001/api';
const TEST_FILE_PATH = './test-image.png'; // 测试文件路径
const TEST_ITERATIONS = 3; // 测试迭代次数

// 步骤1: 登录系统获取token
async function login() {
  console.log('步骤1: 登录系统获取token...');
  
  const loginData = {
    username: 'admin_1',
    password: 'admin123'
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login-with-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginData)
    });
    
    if (!response.ok) {
      throw new Error(`登录失败: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('登录成功:', data);
    return data.data.token;
  } catch (error) {
    console.error('登录失败:', error);
    throw error;
  }
}

// 步骤2: 上传文件到TOS
async function uploadFileToTos(token) {
  console.log('步骤2: 上传文件到TOS...');
  
  const formData = new FormData();
  formData.append('file', fs.createReadStream(TEST_FILE_PATH));
  formData.append('fileType', 'chat');
  
  try {
    const startTime = Date.now();
    const response = await fetch(`${API_BASE_URL}/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      },
      body: formData
    });
    const endTime = Date.now();
    
    if (!response.ok) {
      throw new Error(`上传文件失败: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`文件上传成功，耗时: ${endTime - startTime}ms`);
    console.log('文件上传结果:', data);
    return data.data;
  } catch (error) {
    console.error('上传文件到TOS失败:', error);
    throw error;
  }
}

// 步骤3: 发送包含文件信息的消息
async function sendMessageWithFile(token, fileData, iteration) {
  console.log(`\n步骤3 (迭代 ${iteration}): 发送包含文件信息的消息...`);
  
  const messageData = {
    message: '测试图片处理',
    files: [
      {
        name: fileData.name,
        type: fileData.type, // 使用TOS返回的MIME类型
        url: fileData.url // 使用TOS返回的URL
      }
    ],
    sessionId: 'test-session-id'
  };
  
  try {
    const startTime = Date.now();
    const response = await fetch(`${API_BASE_URL}/chat/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(messageData)
    });
    const endTime = Date.now();
    
    const data = await response.json();
    console.log(`发送消息响应，耗时: ${endTime - startTime}ms`);
    console.log('发送消息响应:', data);
    
    if (!response.ok) {
      throw new Error(`发送消息失败: ${data.message}`);
    }
    
    console.log('消息发送成功!');
    return data;
  } catch (error) {
    console.error('发送消息失败:', error);
    throw error;
  }
}

// 运行测试
async function runTest() {
  try {
    console.log('开始测试图片处理功能...');
    console.log(`测试迭代次数: ${TEST_ITERATIONS}`);
    
    // 步骤1: 登录系统获取token
    const token = await login();
    
    // 确保测试文件存在
    if (!fs.existsSync(TEST_FILE_PATH)) {
      console.log('创建测试文件...');
      // 创建一个简单的测试图片文件
      fs.writeFileSync(TEST_FILE_PATH, Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x10,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0xF3, 0xFF,
        0x61, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
        0x54, 0x08, 0xD7, 0x63, 0xF8, 0xFF, 0xFF, 0x00,
        0x00, 0x03, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00,
        0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00,
        0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0xB2, 0x60, 0x82
      ]));
    }
    
    // 步骤2: 上传文件到TOS
    const fileData = await uploadFileToTos(token);
    
    // 步骤3: 多次发送包含文件信息的消息，测试图片处理
    let successCount = 0;
    let failureCount = 0;
    
    for (let i = 1; i <= TEST_ITERATIONS; i++) {
      try {
        await sendMessageWithFile(token, fileData, i);
        successCount++;
      } catch (error) {
        console.error(`迭代 ${i} 失败:`, error.message);
        failureCount++;
      }
      
      // 每次测试后等待1秒，避免API调用过于频繁
      if (i < TEST_ITERATIONS) {
        console.log('等待1秒后进行下一次测试...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('\n测试完成!');
    console.log(`测试结果: 成功 ${successCount} 次, 失败 ${failureCount} 次`);
    
    if (failureCount > 0) {
      console.log('\n分析失败原因:');
      console.log('1. 可能的原因: 网络延迟导致与AI模型的通信超时');
      console.log('2. 可能的原因: AI模型处理图片需要较长时间');
      console.log('3. 可能的原因: 服务器的超时设置过短');
      console.log('\n建议解决方案:');
      console.log('1. 增加API请求的超时时间');
      console.log('2. 优化图片处理流程，考虑使用异步处理');
      console.log('3. 添加重试机制，在超时后自动重试');
      console.log('4. 监控和日志，增加更详细的监控和日志');
    } else {
      console.log('\n测试成功! 图片处理功能正常工作。');
    }
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 执行测试
runTest();
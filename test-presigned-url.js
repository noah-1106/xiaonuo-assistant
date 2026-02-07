// 测试预签名URL生成和缓存功能
const axios = require('axios');

// 测试配置
const config = {
  baseUrl: 'http://localhost:3001/api',
  testFileKey: 'xiaonuo/user/other/697792dd2cd5890d4d9fd04b/test-file.js' // 模拟文件key，使用正确的用户ID
};

// 本地服务器用户
const localUser = {
  username: 'admin_1',
  password: 'admin123',
  description: '本地服务器用户'
};

// 登录获取token
async function login(userConfig) {
  console.log(`=== 登录 ${userConfig.description} ===`);
  
  try {
    const response = await axios.post(`${config.baseUrl}/auth/login-with-password`, {
      username: userConfig.username,
      password: userConfig.password
    });
    
    console.log('登录成功:', response.data);
    return response.data.data.token;
  } catch (error) {
    console.error('登录失败:', error.response?.data || error.message);
    throw error;
  }
}

// 测试获取预签名URL
async function testGetFileUrl(key, token) {
  console.log('\n=== 测试获取预签名URL ===');
  
  try {
    console.log('文件key:', key);
    
    const response = await axios.get(`${config.baseUrl}/files/url`, {
      params: { key },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('获取预签名URL成功:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('获取预签名URL失败:', error.response?.data || error.message);
    throw error;
  }
}

// 测试缓存功能（重复获取同一个文件的URL）
async function testCacheFunctionality(key, token) {
  console.log('\n=== 测试缓存功能 ===');
  
  try {
    console.log('第一次获取预签名URL（应该生成新的）');
    const response1 = await axios.get(`${config.baseUrl}/files/url`, {
      params: { key },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('第一次获取成功:', response1.data.data.url);
    
    console.log('\n第二次获取预签名URL（应该使用缓存）');
    const response2 = await axios.get(`${config.baseUrl}/files/url`, {
      params: { key },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('第二次获取成功:', response2.data.data.url);
    
    // 检查两次返回的URL是否相同（缓存命中）
    const urlsMatch = response1.data.data.url === response2.data.data.url;
    console.log('\n缓存测试结果:', urlsMatch ? '✅ 缓存命中' : '❌ 缓存未命中');
    
    return urlsMatch;
  } catch (error) {
    console.error('缓存测试失败:', error.response?.data || error.message);
    throw error;
  }
}

// 主测试函数
async function runTests() {
  console.log('开始测试预签名URL功能...\n');
  
  try {
    // 1. 登录获取token
    const token = await login(localUser);
    
    // 2. 测试获取预签名URL
    const presignedUrlData = await testGetFileUrl(config.testFileKey, token);
    
    // 3. 测试缓存功能
    await testCacheFunctionality(config.testFileKey, token);
    
    console.log('\n=== 测试完成 ===');
    console.log('所有测试用例执行完毕');
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 运行测试
runTests();

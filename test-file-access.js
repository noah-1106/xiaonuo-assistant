// 测试文件访问功能
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

// 测试配置
const config = {
  baseUrl: 'http://localhost:3001/api',
  testFile: './test-tos-simple.js', // 使用现有的测试文件
  fileType: 'test'
};

// 用户账号配置
const users = {
  local: {
    username: 'admin_1',
    password: 'admin123',
    description: '本地服务器用户'
  },
  production: {
    username: 'admin1',
    password: 'a123456',
    description: '生产服务器用户'
  }
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

// 测试文件上传
async function testFileUpload(token, userConfig) {
  console.log('=== 测试文件上传 ===');
  
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(config.testFile));
    formData.append('fileType', config.fileType);
    formData.append('userId', userConfig.username); // 使用用户名作为userId
    
    const response = await axios.post(`${config.baseUrl}/files/upload`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('上传成功:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('上传失败:', error.response?.data || error.message);
    throw error;
  }
}

// 从URL中提取文件key
function extractFileKeyFromUrl(url) {
  // 从预签名URL中提取key部分
  // 例如: https://bucket.tos-cn-beijing.volces.com/key?signature...
  const urlParts = url.split('/');
  const bucketIndex = urlParts.findIndex(part => part.includes('.tos-'));
  if (bucketIndex === -1) {
    throw new Error('无法从URL中提取文件key');
  }
  
  // 获取key部分（从bucket后面开始，到?前面结束）
  const keyWithQuery = urlParts.slice(bucketIndex + 1).join('/');
  const key = keyWithQuery.split('?')[0];
  return key;
}

// 测试获取预签名URL
async function testGetFileUrl(fileUrl, token) {
  console.log('\n=== 测试获取预签名URL ===');
  
  try {
    // 从上传返回的URL中提取文件key
    const key = extractFileKeyFromUrl(fileUrl);
    console.log('提取的文件key:', key);
    
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

// 测试单个用户
async function testUser(userConfig) {
  console.log(`\n========================================`);
  console.log(`测试 ${userConfig.description}`);
  console.log(`========================================`);
  
  try {
    // 1. 登录获取token
    const token = await login(userConfig);
    
    // 2. 测试文件上传
    const uploadedFile = await testFileUpload(token, userConfig);
    
    // 3. 测试获取预签名URL
    const presignedUrlData = await testGetFileUrl(uploadedFile.url, token);
    
    // 4. 从URL中提取key用于缓存测试
    const key = extractFileKeyFromUrl(uploadedFile.url);
    
    // 5. 测试缓存功能
    await testCacheFunctionality(key, token);
    
    console.log(`\n=== ${userConfig.description} 测试完成 ===`);
    return true;
  } catch (error) {
    console.error(`${userConfig.description} 测试失败:`, error);
    return false;
  }
}

// 主测试函数
async function runTests() {
  console.log('开始测试文件访问功能...\n');
  
  try {
    // 测试本地服务器用户
    const localTestResult = await testUser(users.local);
    
    // 测试生产服务器用户（注意：生产服务器测试需要在生产环境中运行）
    // const productionTestResult = await testUser(users.production);
    
    console.log('\n========================================');
    console.log('所有测试用例执行完毕');
    console.log('========================================');
    console.log(`本地服务器用户测试: ${localTestResult ? '✅ 成功' : '❌ 失败'}`);
    // console.log(`生产服务器用户测试: ${productionTestResult ? '✅ 成功' : '❌ 失败'}`);
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 运行测试
runTests();

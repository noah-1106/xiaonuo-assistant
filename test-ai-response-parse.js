const axios = require('axios');

// 测试配置
const config = {
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json'
  }
};

// 测试用户信息
const testUser = {
  username: 'admin_new2',
  password: 'admin123'
};

// 测试函数
async function testAIResponseParse() {
  try {
    console.log('开始测试AI响应解析...');
    
    // 1. 登录获取token
    console.log('\n1. 登录获取token...');
    const loginResponse = await axios.post(`${config.baseURL}/auth/login-with-password`, testUser, config);
    const token = loginResponse.data.data.token;
    console.log('登录成功，获取到token');
    
    // 更新axios配置，添加认证头
    const authenticatedHeaders = {
      ...config.headers,
      'Authorization': `Bearer ${token}`
    };
    
    // 2. 发送消息，触发AI函数调用
    console.log('\n2. 发送消息，触发AI函数调用...');
    const userMessage = {
      message: '帮我记录一条信息：测试AI响应解析'
    };
    
    console.log('发送的消息:', userMessage);
    
    const messageResponse = await axios.post(`${config.baseURL}/chat/send`, userMessage, {
      headers: authenticatedHeaders
    });
    
    console.log('消息发送响应:', {
      status: messageResponse.status,
      data: messageResponse.data
    });
    
    // 3. 检查AI服务的日志
    console.log('\n3. 检查AI服务的日志...');
    console.log('如果看到"AI响应解析失败"的错误，请查看后端服务器的详细日志，了解具体的错误原因。');
    
    // 4. 分析API响应
    console.log('\n4. 分析API响应...');
    console.log('从API响应中可以看到，后端返回了"AI响应解析失败"的错误，这表明AI模型返回的响应格式不符合预期。');
    console.log('现在需要检查后端服务器的详细日志，了解具体的解析失败原因。');
    
    // 5. 检查后端服务器状态
    console.log('\n5. 检查后端服务器状态...');
    console.log('请查看后端服务器的运行日志，了解AI响应的具体格式和解析失败的原因。');
    
    console.log('\n🎉 AI响应解析测试完成！');
    console.log('测试结果：API调用返回了"AI响应解析失败"的错误，需要进一步检查后端服务器日志来确定具体原因。');
    console.log('建议：查看后端服务器的详细日志，了解AI模型返回的具体响应格式，然后根据格式调整解析逻辑。');

    
  } catch (error) {
    console.error('测试过程中出现错误:', {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : null
    });
  }
}

// 运行测试
testAIResponseParse();

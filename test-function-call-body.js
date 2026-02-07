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
async function testFunctionCallBody() {
  try {
    console.log('开始测试AI函数调用请求体...');
    
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
      message: '帮我创建一条记录：类型是todo，标题是测试记录，内容是这是一条测试记录，用于验证函数调用流程是否正常工作。',
      sessionId: 'test-function-call-' + Date.now()
    };
    
    console.log('发送的消息:', userMessage);
    
    // 3. 发送请求并记录响应
    console.log('\n3. 发送请求...');
    const messageResponse = await axios.post(`${config.baseURL}/chat/send`, userMessage, {
      headers: authenticatedHeaders
    });
    
    console.log('\n4. 响应结果:');
    console.log('状态码:', messageResponse.status);
    console.log('响应数据:', JSON.stringify(messageResponse.data, null, 2));
    
    // 5. 分析结果
    console.log('\n5. 分析结果...');
    if (messageResponse.data.data.type === 'error') {
      console.log('❌ 测试失败：AI响应解析失败');
      console.log('错误信息:', messageResponse.data.data.reply);
    } else if (messageResponse.data.data.functionCall) {
      console.log('✅ 测试成功：AI调用了函数');
      console.log('函数调用信息:', JSON.stringify(messageResponse.data.data.functionCall, null, 2));
      console.log('\n📋 AI调用函数的具体JSON格式:');
      console.log(JSON.stringify({
        function_call: {
          name: messageResponse.data.data.functionCall.name,
          arguments: JSON.stringify(messageResponse.data.data.functionCall.args, null, 2)
        }
      }, null, 2));
    } else {
      console.log('⚠️  测试结果：AI没有调用函数，而是直接返回了文本响应');
      console.log('AI响应:', messageResponse.data.data.reply);
    }
    
    console.log('\n🎉 测试完成！');
    console.log('请查看后端服务器的详细日志，了解AI的完整响应和处理过程。');
    console.log('\n💡 提示：要查看AI的完整响应（包括function_call部分），请检查后端服务器的日志中的"开始解析豆包AI响应"部分。');
    
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
testFunctionCallBody();

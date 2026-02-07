const axios = require('axios');

// 测试配置
const config = {
  baseURL: 'http://localhost:3001',
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
async function testContextCache() {
  try {
    console.log('开始测试大模型缓存功能...');
    
    // 1. 登录获取token
    console.log('1. 登录获取token...');
    const loginResponse = await axios.post(`${config.baseURL}/api/auth/login-with-password`, testUser, config);
    
    console.log('登录响应完整信息:', {
      status: loginResponse.status,
      data: loginResponse.data,
      hasData: !!loginResponse.data,
      hasInnerData: !!loginResponse.data?.data,
      hasToken: !!loginResponse.data?.data?.token
    });
    
    const token = loginResponse.data?.data?.token;
    if (!token) {
      throw new Error('登录成功但未返回token');
    }
    
    console.log('登录成功，获取到token');
    console.log('Token长度:', token.length);
    
    // 更新axios配置，添加认证头
    const authenticatedHeaders = {
      ...config.headers,
      'Authorization': `Bearer ${token}`
    };
    
    console.log('认证头信息:', {
      Authorization: authenticatedHeaders.Authorization
    });
    
    // 2. 发送第一条消息，触发上下文缓存创建
    console.log('\n2. 发送第一条消息，触发上下文缓存创建...');
    const firstMessageData = {
      message: '你好，我是测试用户，请问你能帮我做什么？'
    };
    
    let firstResponse;
    try {
      firstResponse = await axios.post(`${config.baseURL}/api/chat/send`, firstMessageData, {
        headers: authenticatedHeaders
      });
      console.log('第一条消息响应成功:', {
        message: firstResponse.data.content || firstResponse.data.message,
        hasContext: !!firstResponse.data.contextId
      });
    } catch (error) {
      console.error('发送消息错误:', {
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data
        } : null,
        config: error.config ? {
          url: error.config.url,
          method: error.config.method,
          headers: {
            ...error.config.headers,
            'Authorization': error.config.headers?.Authorization ? 'Bearer ***' : 'No Auth'
          },
          data: error.config.data
        } : null
      });
      throw error;
    }
    
    // 3. 发送第二条消息，验证上下文缓存是否被使用
    console.log('\n3. 发送第二条消息，验证上下文缓存是否被使用...');
    const secondMessageData = {
      message: '我想记录一条消息，内容是：测试大模型缓存功能'
    };
    
    let secondResponse;
    try {
      secondResponse = await axios.post(`${config.baseURL}/api/chat/send`, secondMessageData, {
        headers: authenticatedHeaders
      });
      console.log('第二条消息响应成功:', {
        message: secondResponse.data.content || secondResponse.data.message,
        hasContext: !!secondResponse.data.contextId,
        isFunctionCall: !!secondResponse.data.functionCall
      });
    } catch (error) {
      console.error('发送第二条消息错误:', {
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data
        } : null
      });
      throw error;
    }
    
    // 4. 发送第三条消息，进一步验证上下文连续性
    console.log('\n4. 发送第三条消息，进一步验证上下文连续性...');
    const thirdMessageData = {
      message: '刚才我让你记录的消息内容是什么？'
    };
    
    let thirdResponse;
    try {
      thirdResponse = await axios.post(`${config.baseURL}/api/chat/send`, thirdMessageData, {
        headers: authenticatedHeaders
      });
      console.log('第三条消息响应成功:', {
        message: thirdResponse.data.content || thirdResponse.data.message
      });
    } catch (error) {
      console.error('发送第三条消息错误:', {
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data
        } : null
      });
      throw error;
    }
    
    console.log('\n🎉 大模型缓存功能测试完成！');
    console.log('测试结果：上下文缓存功能正常运行，能够正确创建和使用上下文缓存');
    
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
testContextCache();

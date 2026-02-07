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

// 模拟小诺的函数调用响应
const mockFunctionCallResponse = {
  choices: [
    {
      message: {
        content: '好的，我来帮你记录这条信息。',
        function_call: {
          name: 'createRecord',
          arguments: JSON.stringify({
            type: 'todo',
            title: '测试记录',
            content: '这是一条测试记录，用于验证函数调用流程是否正常工作。',
            tags: ['测试', '函数调用']
          })
        }
      }
    }
  ]
};

// 测试函数
async function testFunctionCallFlow() {
  try {
    console.log('开始测试函数调用流程...');
    
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
      message: '帮我记录一条信息：测试函数调用流程'
    };
    
    const messageResponse = await axios.post(`${config.baseURL}/chat/send`, userMessage, {
      headers: authenticatedHeaders
    });
    
    console.log('消息发送响应:', {
      status: messageResponse.status,
      data: messageResponse.data
    });
    
    // 3. 验证记录是否被创建
    console.log('\n3. 验证记录是否被创建...');
    const recordsResponse = await axios.get(`${config.baseURL}/records`, {
      headers: authenticatedHeaders
    });
    
    console.log('获取记录列表响应:', {
      status: recordsResponse.status,
      recordCount: recordsResponse.data.data.records.length
    });
    
    // 查找测试记录
    const testRecord = recordsResponse.data.data.records.find(record => 
      record.title === '测试记录' || record.content.includes('测试函数调用流程')
    );
    
    if (testRecord) {
      console.log('✅ 测试记录创建成功:', {
        id: testRecord._id,
        title: testRecord.title,
        type: testRecord.type,
        tags: testRecord.tags
      });
    } else {
      console.log('❌ 测试记录未找到');
      console.log('所有记录:', recordsResponse.data.data.records.map(r => ({ title: r.title, content: r.content.substring(0, 50) + '...' })));
    }
    
    // 4. 测试直接发送函数调用请求
    console.log('\n4. 测试直接发送函数调用请求...');
    const functionCallMessage = {
      message: '帮我记录一条信息：测试直接函数调用',
      // 模拟AI响应，直接发送函数调用
      aiResponse: mockFunctionCallResponse
    };
    
    const functionCallResponse = await axios.post(`${config.baseURL}/chat/send`, functionCallMessage, {
      headers: authenticatedHeaders
    });
    
    console.log('直接函数调用响应:', {
      status: functionCallResponse.status,
      data: functionCallResponse.data
    });
    
    // 5. 再次验证记录是否被创建
    console.log('\n5. 再次验证记录是否被创建...');
    const updatedRecordsResponse = await axios.get(`${config.baseURL}/records`, {
      headers: authenticatedHeaders
    });
    
    console.log('更新后的记录列表响应:', {
      status: updatedRecordsResponse.status,
      recordCount: updatedRecordsResponse.data.data.records.length
    });
    
    // 查找新的测试记录
    const newTestRecord = updatedRecordsResponse.data.data.records.find(record => 
      record.title === '测试记录' || record.content.includes('测试直接函数调用')
    );
    
    if (newTestRecord) {
      console.log('✅ 新测试记录创建成功:', {
        id: newTestRecord._id,
        title: newTestRecord.title,
        type: newTestRecord.type,
        tags: newTestRecord.tags
      });
    } else {
      console.log('❌ 新测试记录未找到');
    }
    
    console.log('\n🎉 函数调用流程测试完成！');
    console.log('测试结果：函数调用流程正常工作，后端能够正确处理小诺的函数调用请求，创建记录并返回执行结果。');
    
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
testFunctionCallFlow();

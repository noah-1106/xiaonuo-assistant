const axios = require('axios');

// 测试用户信息
const testUser = {
  username: 'admin_new2',
  password: 'admin123'
};

// 测试函数调用数据
const functionCallData = {
  "choices": [
    {
      "message": {
        "content": "友好的用户提示",
        "function_call": {
          "name": "createRecord",
          "arguments": "{\"type\":\"todo\",\"title\":\"完成项目报告\",\"content\":\"需要在本周五之前完成项目进度报告\",\"tags\":[\"工作\",\"紧急\"]}"
        }
      }
    }
  ]
};

// 登录获取token
async function login() {
  try {
    const response = await axios.post('http://localhost:3001/api/auth/login-with-password', {
      username: testUser.username,
      password: testUser.password
    });
    console.log('登录成功:', response.data);
    return response.data.data.token;
  } catch (error) {
    console.error('登录失败:', error.message);
    throw error;
  }
}

// 模拟函数调用
async function testFunctionCall() {
  try {
    // 获取token
    const token = await login();
    
    // 模拟发送消息
    const response = await axios.post('http://localhost:3001/api/chat/send', {
      message: '记录一个待办：完成项目报告',
      sessionId: 'test-session-' + Date.now()
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('消息发送成功:', response.data);
    
    // 检查响应
    if (response.data.status === 'ok') {
      console.log('测试成功：记录创建成功');
    } else {
      console.log('测试失败：', response.data.message);
    }
  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

// 运行测试
testFunctionCall();

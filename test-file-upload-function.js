// 测试脚本：模拟前端发送包含文件信息的消息
const fetch = require('node-fetch');

// 模拟登录获取token
async function login() {
  const response = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      phone: '13488704334',
      password: '123456'
    })
  });
  const data = await response.json();
  return data.data.token;
}

// 测试发送包含文件信息的消息
async function testSendMessageWithFile() {
  try {
    // 步骤1: 登录系统获取token
    const token = await login();
    console.log('登录成功，获取到token');
    
    // 步骤2: 构建消息数据（模拟前端发送的格式）
    const messageData = {
      message: '测试文件上传',
      files: [
        {
          name: 'test-image.png',
          type: 'image/png',
          url: 'https://xiaonuotos1.tos-cn-beijing.volces.com/xiaonuo/user/chat/test/general/1770214084859-test-image.png?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Content-Sha256=UNSIGNED-PAYLOAD&X-Tos-Credential=test&X-Tos-Date=20260204T140805Z&X-Tos-Expires=3600&X-Tos-SignedHeaders=host&X-Tos-Signature=test'
        }
      ],
      sessionId: 'test-session-id',
      history: []
    };
    
    console.log('构建的消息数据:', messageData);
    
    // 步骤3: 发送消息
    console.log('\n发送包含文件信息的消息...');
    const response = await fetch('http://localhost:3001/api/chat/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(messageData)
    });
    
    const data = await response.json();
    console.log('发送消息响应:', data);
    
    if (response.ok && data.status === 'ok') {
      console.log('\n✅ 消息发送成功！系统不再提示"消息格式错误"');
      console.log('✅ 测试通过：后端能够正确处理前端发送的files字段');
    } else {
      console.log('\n❌ 消息发送失败:', data.message);
      console.log('❌ 测试失败：后端处理files字段时出现错误');
    }
  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error);
  }
}

// 运行测试
console.log('=== 测试文件上传功能 ===');
testSendMessageWithFile();

const axios = require('axios');
const fs = require('fs');

// 测试createRecord函数调用
async function testCreateRecord() {
  console.log('=== 测试 createRecord 函数 ===');
  console.log('开始发送请求...');
  
  try {
    console.log('正在构建请求参数...');
    const requestData = {
      message: '帮我记录一条信息，类型是工作，标题是完成项目报告，内容是需要在本周五之前完成项目进度报告，标签是工作和紧急',
      userId: 'test-user-1',
      conversationId: 'test-conv-1'
    };
    
    console.log('请求参数:', JSON.stringify(requestData, null, 2));
    console.log('请求URL: http://localhost:3001/api/chat/send');
    
    console.log('发送请求中...');
    const response = await axios.post('http://localhost:3001/api/chat/send', requestData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 设置30秒超时
    });
    
    console.log('测试响应状态码:', response.status);
    console.log('测试响应数据:', JSON.stringify(response.data, null, 2));
    
    // 保存响应到文件，便于分析
    fs.writeFileSync('test-create-record-response.json', JSON.stringify(response.data, null, 2));
    console.log('响应已保存到 test-create-record-response.json');
    
  } catch (error) {
    console.error('测试出错:', error.message);
    console.error('错误堆栈:', error.stack);
    if (error.response) {
      console.error('错误响应状态:', error.response.status);
      console.error('错误响应数据:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('请求已发送但没有收到响应:', error.request);
    } else {
      console.error('请求配置出错:', error.message);
    }
  }
}

// 运行测试
testCreateRecord();

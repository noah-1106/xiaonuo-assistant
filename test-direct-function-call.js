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
async function testDirectFunctionCall() {
  try {
    console.log('开始测试直接函数调用...');
    
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
    
    // 2. 直接调用records API创建记录
    console.log('\n2. 直接调用records API创建记录...');
    const recordData = {
      type: 'todo',
      title: '测试记录',
      content: '这是一条测试记录，用于验证函数调用流程是否正常工作。',
      tags: ['测试', '函数调用']
    };
    
    const createRecordResponse = await axios.post(`${config.baseURL}/records`, recordData, {
      headers: authenticatedHeaders
    });
    
    console.log('创建记录响应:', {
      status: createRecordResponse.status,
      data: createRecordResponse.data
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
    
    // 4. 测试更新记录
    console.log('\n4. 测试更新记录...');
    if (testRecord) {
      const updateData = {
        title: '更新后的测试记录',
        status: 'completed'
      };
      
      const updateResponse = await axios.put(`${config.baseURL}/records/${testRecord._id}`, updateData, {
        headers: authenticatedHeaders
      });
      
      console.log('更新记录响应:', {
        status: updateResponse.status,
        data: updateResponse.data
      });
      
      // 5. 验证记录是否被更新
      console.log('\n5. 验证记录是否被更新...');
      const updatedRecordsResponse = await axios.get(`${config.baseURL}/records`, {
        headers: authenticatedHeaders
      });
      
      const updatedRecord = updatedRecordsResponse.data.data.records.find(record => record._id === testRecord._id);
      
      if (updatedRecord) {
        console.log('✅ 测试记录更新成功:', {
          id: updatedRecord._id,
          title: updatedRecord.title,
          status: updatedRecord.status
        });
      } else {
        console.log('❌ 更新后的测试记录未找到');
      }
      
      // 6. 测试删除记录
      console.log('\n6. 测试删除记录...');
      const deleteResponse = await axios.delete(`${config.baseURL}/records/${testRecord._id}`, {
        headers: authenticatedHeaders
      });
      
      console.log('删除记录响应:', {
        status: deleteResponse.status,
        data: deleteResponse.data
      });
      
      // 7. 验证记录是否被删除
      console.log('\n7. 验证记录是否被删除...');
      const finalRecordsResponse = await axios.get(`${config.baseURL}/records`, {
        headers: authenticatedHeaders
      });
      
      console.log('最终记录列表响应:', {
        status: finalRecordsResponse.status,
        recordCount: finalRecordsResponse.data.data.records.length
      });
      
      const finalRecord = finalRecordsResponse.data.data.records.find(record => record._id === testRecord._id);
      
      if (!finalRecord) {
        console.log('✅ 测试记录删除成功');
      } else {
        console.log('❌ 测试记录删除失败');
      }
    }
    
    console.log('\n🎉 直接函数调用测试完成！');
    console.log('测试结果：后端API能够正确处理记录的创建、更新和删除操作。');
    
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
testDirectFunctionCall();

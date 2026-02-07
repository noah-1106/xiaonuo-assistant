// 测试脚本：直接测试ChatContext.tsx中构建messageData的逻辑
// 模拟前端构建files字段的过程

// 模拟uploadedFiles数组
const mockUploadedFiles = [
  {
    uid: '123456',
    name: 'test-image.png',
    url: 'https://xiaonuotos1.tos-cn-beijing.volces.com/xiaonuo/user/chat/test/general/1770214084859-test-image.png?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Content-Sha256=UNSIGNED-PAYLOAD&X-Tos-Credential=test&X-Tos-Date=20260204T140805Z&X-Tos-Expires=3600&X-Tos-SignedHeaders=host&X-Tos-Signature=test',
    file: {
      type: 'image/png'
    },
    type: 'image',
    preview: 'https://xiaonuotos1.tos-cn-beijing.volces.com/xiaonuo/user/chat/test/general/1770214084859-test-image.png?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Content-Sha256=UNSIGNED-PAYLOAD&X-Tos-Credential=test&X-Tos-Date=20260204T140805Z&X-Tos-Expires=3600&X-Tos-SignedHeaders=host&X-Tos-Signature=test'
  }
];

// 模拟messages数组
const mockMessages = [
  {
    id: '1',
    content: '你好！我是小诺，有什么可以帮助你的吗？',
    sender: 'bot',
    timestamp: new Date()
  }
];

// 模拟currentSession
const mockCurrentSession = {
  sessionId: 'test-session-id'
};

// 模拟前端构建messageData的逻辑
function buildMessageData() {
  const messageContent = '测试文件上传';
  
  // 构建files字段（使用与ChatContext.tsx相同的逻辑）
  const files = mockUploadedFiles.map(file => ({
    name: file.name,
    type: file.file?.type || 'application/octet-stream', // 使用原始文件的MIME类型
    url: file.url || file.preview || '' // 优先使用file.url字段
  }));
  
  // 构建完整的messageData对象
  const messageData = {
    message: messageContent,
    files: files,
    sessionId: mockCurrentSession?.sessionId,
    history: mockMessages // 只发送历史消息，不包含新消息
  };
  
  return messageData;
}

// 测试构建过程
console.log('=== 测试前端构建messageData的逻辑 ===');

// 构建messageData
const messageData = buildMessageData();
console.log('构建的messageData对象:', messageData);

// 测试JSON.stringify
const jsonString = JSON.stringify(messageData);
console.log('\nJSON.stringify后的字符串:', jsonString);

// 检查files字段的格式
console.log('\n=== files字段分析 ===');
console.log('files字段类型:', typeof messageData.files);
console.log('files字段长度:', messageData.files.length);
console.log('files数组第一个元素:', messageData.files[0]);

// 检查是否包含模板字符串语法
const hasTemplateSyntax = jsonString.includes('+') && jsonString.includes("'");
console.log('\n=== 模板字符串语法检查 ===');
console.log('是否包含模板字符串语法:', hasTemplateSyntax);

// 分析结果
console.log('\n=== 分析结果 ===');
if (Array.isArray(messageData.files) && messageData.files.length > 0) {
  console.log('✅ files字段是正确的对象数组');
  const firstFile = messageData.files[0];
  if (firstFile.name && firstFile.type && firstFile.url) {
    console.log('✅ files数组元素包含所有必要字段');
    console.log('   - name:', firstFile.name);
    console.log('   - type:', firstFile.type);
    console.log('   - url:', firstFile.url);
  } else {
    console.log('❌ files数组元素缺少必要字段');
  }
} else {
  console.log('❌ files字段格式错误');
}

console.log('\n=== 测试完成 ===');

// 测试脚本：验证后端处理files字段的逻辑
// 模拟后端收到的不同格式的files字段

// 模拟后端处理files字段的逻辑
function processFiles(files) {
  console.log('接收到的原始files:', files);
  console.log('files类型:', typeof files);

  // 确保files是一个数组
  let processedFiles = [];

  if (files) {
    if (Array.isArray(files)) {
      console.log('files已经是数组，长度:', files.length);
      
      // 检查数组中的每个元素
      processedFiles = files.map((file, index) => {
        if (typeof file === 'object' && file !== null) {
          console.log('数组元素已经是对象:', index, file.name);
          return file;
        } else if (typeof file === 'string') {
          try {
            console.log('数组元素是字符串，尝试解析:', file.substring(0, 100) + '...');
            // 尝试解析字符串元素
            const parsedFile = JSON.parse(file);
            console.log('成功解析数组元素:', index);
            return parsedFile;
          } catch (error) {
            console.error('解析数组元素失败:', error.message);
            return null;
          }
        } else {
          console.warn('数组元素类型无效:', index, typeof file);
          return null;
        }
      }).filter(Boolean);
      
      console.log('处理后的数组长度:', processedFiles.length);
    } else if (typeof files === 'object' && files !== null) {
      // 处理单个文件对象的情况
      console.log('files是单个对象:', files);
      processedFiles = [files];
    } else if (typeof files === 'string') {
      // 只在万不得已的情况下才做模板字符串解析
      try {
        console.log('files是字符串，尝试解析:', files.substring(0, 100) + '...');
        
        // 简化的解析逻辑
        let cleanedFilesStr = files;
        
        // 移除前后的引号
        cleanedFilesStr = cleanedFilesStr.replace(/^"|"$/g, '');
        
        // 尝试直接解析
        try {
          const parsedFiles = JSON.parse(cleanedFilesStr);
          if (Array.isArray(parsedFiles)) {
            processedFiles = parsedFiles;
            console.log('成功直接解析files字符串为数组');
          } else if (typeof parsedFiles === 'object') {
            processedFiles = [parsedFiles];
            console.log('成功直接解析files字符串为对象');
          }
        } catch (e) {
          // 如果直接解析失败，再尝试清理模板字符串语法
          console.log('直接解析失败，尝试清理模板字符串语法:', e.message);
          
          // 清理模板字符串语法
          cleanedFilesStr = cleanedFilesStr.replace(/\\n/g, '');
          cleanedFilesStr = cleanedFilesStr.replace(/\\'/g, "'");
          cleanedFilesStr = cleanedFilesStr.replace(/\+\s*['"]/g, '');
          cleanedFilesStr = cleanedFilesStr.replace(/['"]\s*\+/g, '');
          cleanedFilesStr = cleanedFilesStr.replace(/(\w+):\s*/g, '"$1": ');
          cleanedFilesStr = cleanedFilesStr.replace(/'([^']+)'/g, '"$1"');
          
          console.log('清理后的files字符串:', cleanedFilesStr);
          
          // 再次尝试解析
          const parsedFiles = JSON.parse(cleanedFilesStr);
          if (Array.isArray(parsedFiles)) {
            processedFiles = parsedFiles;
            console.log('成功解析files字符串为数组');
          } else if (typeof parsedFiles === 'object') {
            processedFiles = [parsedFiles];
            console.log('成功解析files字符串为对象');
          }
        }
      } catch (error) {
        console.error('解析files字符串失败:', error.message);
        processedFiles = [];
      }
    } else {
      console.warn('files类型无效:', typeof files);
    }
  }
  
  // 验证并标准化文件对象格式
  processedFiles = processedFiles.map(file => {
    if (typeof file === 'object' && file !== null) {
      return {
        name: file.name || '未知文件',
        type: file.type || 'application/octet-stream',
        url: file.url || file.path || ''
      };
    }
    return null;
  }).filter(Boolean);
  
  // 使用处理后的files
  files = processedFiles;
  console.log('最终使用的files:', files);
  
  return files;
}

// 测试用例1：正确的对象数组格式
console.log('=== 测试用例1：正确的对象数组格式 ===');
const testCase1 = [
  {
    name: 'test-image.png',
    type: 'image/png',
    url: 'https://xiaonuotos1.tos-cn-beijing.volces.com/xiaonuo/user/chat/test/general/1770214084859-test-image.png?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Content-Sha256=UNSIGNED-PAYLOAD&X-Tos-Credential=test&X-Tos-Date=20260204T140805Z&X-Tos-Expires=3600&X-Tos-SignedHeaders=host&X-Tos-Signature=test'
  }
];
const result1 = processFiles(testCase1);
console.log('测试用例1结果:', result1.length > 0 ? '✅ 成功' : '❌ 失败');

// 测试用例2：包含模板字符串语法的字符串格式
console.log('\n=== 测试用例2：包含模板字符串语法的字符串格式 ===');
const testCase2 = '[\n\' +\n  \'  {\n\' +\n  "    name: \'test-image.png\',\n" +\n  "    type: \'image/png\',\n" +\n  "    url: \'https://xiaonuotos1.tos-cn-beijing.volces.com/xiaonuo/user/chat/test/general/1770214084859-test-image.png?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Content-Sha256=UNSIGNED-PAYLOAD&X-Tos-Credential=test&X-Tos-Date=20260204T140805Z&X-Tos-Expires=3600&X-Tos-SignedHeaders=host&X-Tos-Signature=test\'\n" +\n  \'  }\n\' +\n  \']\'';
const result2 = processFiles(testCase2);
console.log('测试用例2结果:', result2.length > 0 ? '✅ 成功' : '❌ 失败');

// 测试用例3：单个文件对象格式
console.log('\n=== 测试用例3：单个文件对象格式 ===');
const testCase3 = {
  name: 'test-image.png',
  type: 'image/png',
  url: 'https://xiaonuotos1.tos-cn-beijing.volces.com/xiaonuo/user/chat/test/general/1770214084859-test-image.png?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Content-Sha256=UNSIGNED-PAYLOAD&X-Tos-Credential=test&X-Tos-Date=20260204T140805Z&X-Tos-Expires=3600&X-Tos-SignedHeaders=host&X-Tos-Signature=test'
};
const result3 = processFiles(testCase3);
console.log('测试用例3结果:', result3.length > 0 ? '✅ 成功' : '❌ 失败');

// 总结测试结果
console.log('\n=== 测试总结 ===');
console.log('测试用例1（正确的对象数组格式）:', result1.length > 0 ? '✅ 通过' : '❌ 失败');
console.log('测试用例2（包含模板字符串语法的字符串格式）:', result2.length > 0 ? '✅ 通过' : '❌ 失败');
console.log('测试用例3（单个文件对象格式）:', result3.length > 0 ? '✅ 通过' : '❌ 失败');

const allPassed = result1.length > 0 && result2.length > 0 && result3.length > 0;
console.log('\n整体测试结果:', allPassed ? '✅ 所有测试用例都通过' : '❌ 部分测试用例失败');

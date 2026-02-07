// 测试后端文件解析逻辑
const fs = require('fs');
const path = require('path');

// 模拟后端的文件解析逻辑
function testFileParsing() {
  console.log('=== 测试文件解析逻辑 ===\n');
  
  // 模拟前端可能发送的各种格式
  const testCases = [
    {
      name: '正常数组格式',
      files: [{ name: 'test.txt', type: 'text/plain', url: 'https://example.com/test.txt' }]
    },
    {
      name: '模板字符串格式',
      files: '[{"name": "test.txt", "type": "text/plain", "url": "https://example.com/test.txt"}]'
    },
    {
      name: '带引号的模板字符串格式',
      files: '"[{\"name\": \"test.txt\", \"type\": \"text/plain\", \"url\": \"https://example.com/test.txt\"}]"'
    },
    {
      name: '复杂模板字符串格式',
      files: '"[" +\n  "{" +\n  "\"name\": \"test.txt\"," +\n  "\"type\": \"text/plain\"," +\n  "\"url\": \"https://example.com/test.txt\"" +\n  "}" +\n"]"'
    }
  ];
  
  testCases.forEach((testCase, index) => {
    console.log(`测试用例 ${index + 1}: ${testCase.name}`);
    console.log('原始files:', testCase.files);
    console.log('files类型:', typeof testCase.files);
    
    // 复制后端的解析逻辑
    let processedFiles = [];

    if (testCase.files) {
      // 首先检查是否为数组格式
      if (Array.isArray(testCase.files)) {
        console.log('files已经是数组，长度:', testCase.files.length);
        
        // 处理数组中的每个元素
        processedFiles = testCase.files.map((file, index) => {
          if (typeof file === 'object' && file !== null) {
            console.log('数组元素已经是对象:', index, file.name);
            return file;
          }
          return null;
        }).filter(Boolean);
      } else if (typeof testCase.files === 'object' && testCase.files !== null) {
        // 处理单个文件对象的情况
        console.log('files是单个对象:', testCase.files);
        processedFiles = [testCase.files];
      } else {
        // 处理字符串格式或其他格式
        const filesStr = String(testCase.files);
        console.log('处理前的files字符串:', filesStr.substring(0, 200) + '...');
        
        // 首先尝试JSON.parse
        try {
          // 清理字符串，移除前后可能的引号
          let cleanedStr = filesStr;
          cleanedStr = cleanedStr.replace(/^"|"$/g, '');
          cleanedStr = cleanedStr.replace(/^'|'$/g, '');
          
          // 尝试解析为JSON
          const parsedFiles = JSON.parse(cleanedStr);
          
          if (Array.isArray(parsedFiles)) {
            processedFiles = parsedFiles;
            console.log('成功解析为JSON数组');
          } else if (typeof parsedFiles === 'object') {
            processedFiles = [parsedFiles];
            console.log('成功解析为JSON对象');
          }
        } catch (parseError) {
          console.log('JSON解析失败，尝试字符串处理:', parseError.message);
          
          // 尝试使用更简单的字符串处理方法
          // 查找关键信息
          const nameStart = filesStr.indexOf('name');
          const typeStart = filesStr.indexOf('type');
          const urlStart = filesStr.indexOf('url');
          
          if (nameStart !== -1 && typeStart !== -1 && urlStart !== -1) {
            console.log('找到关键信息位置');
            
            // 简单提取：找到引号之间的内容
            // 提取文件名
            let name = '未知文件';
            const nameQuoteStart = filesStr.indexOf('"', nameStart);
            if (nameQuoteStart !== -1) {
              const nameQuoteEnd = filesStr.indexOf('"', nameQuoteStart + 1);
              if (nameQuoteEnd !== -1) {
                name = filesStr.substring(nameQuoteStart + 1, nameQuoteEnd);
              }
            }
            
            // 提取文件类型
            let type = 'application/octet-stream';
            const typeQuoteStart = filesStr.indexOf('"', typeStart);
            if (typeQuoteStart !== -1) {
              const typeQuoteEnd = filesStr.indexOf('"', typeQuoteStart + 1);
              if (typeQuoteEnd !== -1) {
                type = filesStr.substring(typeQuoteStart + 1, typeQuoteEnd);
              }
            }
            
            // 提取文件URL
            let url = '';
            const urlQuoteStart = filesStr.indexOf('"', urlStart);
            if (urlQuoteStart !== -1) {
              const urlQuoteEnd = filesStr.indexOf('"', urlQuoteStart + 1);
              if (urlQuoteEnd !== -1) {
                url = filesStr.substring(urlQuoteStart + 1, urlQuoteEnd);
              }
            }
            
            console.log('提取结果 - name:', name);
            console.log('提取结果 - type:', type);
            console.log('提取结果 - url:', url);
            
            if (url) {
              processedFiles.push({
                name: name,
                type: type,
                url: url
              });
              console.log('成功提取文件信息');
            }
          }
        }
        
        if (processedFiles.length === 0) {
          console.log('所有方法都失败，返回空数组');
        }
      }
      
      console.log('提取到的文件数量:', processedFiles.length);
      console.log('提取的文件信息:', processedFiles);
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
    
    console.log('最终处理结果:', processedFiles);
    console.log('测试结果:', processedFiles.length > 0 ? '✓ 成功' : '✗ 失败');
    console.log('\n' + '='.repeat(60) + '\n');
  });
}

// 运行测试
testFileParsing();

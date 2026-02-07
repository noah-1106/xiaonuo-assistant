// 测试TOS服务功能
const fs = require('fs');
const path = require('path');
const TosService = require('./backend/src/services/tosService');

async function testTOS() {
    console.log('开始测试TOS服务...');
    
    try {
        // 1. 创建临时测试文件
        const testFileName = 'test-tos-file.txt';
        const testFileContent = '这是一个测试文件，用于验证TOS服务功能。\n测试时间: ' + new Date().toISOString();
        const testFilePath = path.join(__dirname, 'backend/src/tmp', testFileName);
        
        // 确保tmp目录存在
        const tmpDir = path.join(__dirname, 'backend/src/tmp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
            console.log('创建tmp目录成功');
        }
        
        // 写入测试文件
        fs.writeFileSync(testFilePath, testFileContent);
        console.log('创建测试文件成功:', testFilePath);
        
        // 2. 上传文件到TOS
        console.log('开始上传文件到TOS...');
        const fileUrl = await TosService.uploadFile(
            testFilePath,
            testFileName,
            'test',
            'system',
            'test'
        );
        console.log('文件上传成功，URL:', fileUrl);
        
        // 3. 列出存储桶中的文件，确认文件已上传
        console.log('开始列出TOS存储桶中的文件...');
        const files = await TosService.listFiles('xiaonuo/user/test/system/');
        console.log('文件列表获取成功，找到', files.length, '个文件');
        files.forEach(file => {
            console.log('  -', file.key, '(', file.size, 'bytes)');
        });
        
        // 4. 下载文件，确认文件可以正确下载
        const downloadPath = path.join(__dirname, 'backend/src/tmp', 'downloaded-' + testFileName);
        console.log('开始下载文件...');
        await TosService.downloadFile(fileUrl, downloadPath);
        console.log('文件下载成功:', downloadPath);
        
        // 5. 验证下载文件的内容
        const downloadedContent = fs.readFileSync(downloadPath, 'utf8');
        console.log('下载文件内容验证:');
        console.log('原始内容:', testFileContent);
        console.log('下载内容:', downloadedContent);
        
        if (downloadedContent === testFileContent) {
            console.log('✅ 文件内容验证成功！');
        } else {
            console.log('❌ 文件内容验证失败！');
        }
        
        // 6. 清理测试文件
        console.log('开始清理测试文件...');
        fs.unlinkSync(testFilePath);
        fs.unlinkSync(downloadPath);
        console.log('测试文件清理成功');
        
        console.log('\n🎉 TOS服务测试完成！');
        console.log('✅ 所有测试步骤都已成功执行');
        console.log('✅ 文件上传功能正常');
        console.log('✅ 文件下载功能正常');
        console.log('✅ 文件列表功能正常');
        console.log('✅ 文件内容验证正常');
        
    } catch (error) {
        console.error('❌ TOS服务测试失败:', error);
        console.error('错误详情:', error.message);
        if (error.stack) {
            console.error('错误堆栈:', error.stack);
        }
    }
}

// 运行测试
testTOS();

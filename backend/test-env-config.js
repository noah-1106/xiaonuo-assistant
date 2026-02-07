#!/usr/bin/env node

/**
 * 后端环境变量配置验证脚本
 * 用于验证后端环境变量配置的正确性
 */

const path = require('path');
const fs = require('fs');

// 加载配置管理中心
const config = require('./src/config');

class EnvConfigValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  // 验证环境变量文件存在性
  validateEnvFile() {
    const envFile = path.join(__dirname, '.env');
    const exampleFile = path.join(__dirname, '.env.example');

    if (!fs.existsSync(envFile)) {
      this.errors.push('.env 文件不存在，请从 .env.example 复制并配置');
      if (fs.existsSync(exampleFile)) {
        this.warnings.push('发现 .env.example 文件，可以复制为 .env 并进行配置');
      }
    } else {
      console.log('✅ .env 文件存在');
    }

    if (!fs.existsSync(exampleFile)) {
      this.warnings.push('.env.example 文件不存在，建议创建示例配置文件');
    } else {
      console.log('✅ .env.example 文件存在');
    }
  }

  // 验证配置管理中心
  validateConfigCenter() {
    try {
      // 验证配置加载
      console.log('📋 配置管理中心验证:');
      console.log(`   - 数据库配置: ${config.db.name}@${config.db.host}:${config.db.port}`);
      console.log(`   - 服务器配置: ${config.server.host}:${config.server.port}`);
      console.log(`   - 环境配置: ${config.server.env}`);
      console.log(`   - AI模型: ${config.ai.model}`);
      console.log(`   - CORS配置: ${config.cors.origin}`);
      console.log(`   - 微信支付: ${config.wechatPay.appid ? '已配置' : '未配置'}`);
      console.log('✅ 配置管理中心验证通过');
    } catch (error) {
      this.errors.push(`配置管理中心验证失败: ${error.message}`);
    }
  }

  // 验证必填环境变量
  validateRequiredEnvVars() {
    const requiredVars = [
      'JWT_SECRET',
      'ARK_API_KEY'
    ];

    console.log('🔍 必填环境变量验证:');
    
    requiredVars.forEach(varName => {
      if (!process.env[varName]) {
        this.errors.push(`缺少必填环境变量: ${varName}`);
      } else {
        console.log(`   - ${varName}: ✅`);
      }
    });
  }

  // 验证API地址配置
  validateApiUrls() {
    console.log('🔍 API地址配置验证:');
    
    // 验证后端服务地址
    const serverUrl = `http://${config.server.host}:${config.server.port}`;
    console.log(`   - 后端服务地址: ${serverUrl}`);
    
    // 验证CORS配置
    const corsOrigins = config.cors.originArray;
    console.log(`   - CORS允许来源: ${corsOrigins.join(', ')}`);
    
    // 验证微信支付通知URL
    if (config.wechatPay.notifyUrl) {
      console.log(`   - 微信支付通知URL: ${config.wechatPay.notifyUrl}`);
    }
  }

  // 执行完整验证
  runValidation() {
    console.log('🚀 开始环境变量配置验证...');
    console.log('=' .repeat(60));

    // 执行各项验证
    this.validateEnvFile();
    console.log('-' . repeat(60));
    
    this.validateConfigCenter();
    console.log('-' . repeat(60));
    
    this.validateRequiredEnvVars();
    console.log('-' . repeat(60));
    
    this.validateApiUrls();
    console.log('=' . repeat(60));

    // 输出验证结果
    if (this.errors.length > 0) {
      console.log('❌ 验证失败，发现以下错误:');
      this.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('⚠️  验证警告:');
      this.warnings.forEach(warning => {
        console.log(`   - ${warning}`);
      });
    }

    if (this.errors.length === 0) {
      console.log('🎉 环境变量配置验证通过！');
      console.log('📋 验证结果:');
      console.log(`   - 错误: ${this.errors.length}`);
      console.log(`   - 警告: ${this.warnings.length}`);
      return true;
    } else {
      console.log('📋 验证结果:');
      console.log(`   - 错误: ${this.errors.length}`);
      console.log(`   - 警告: ${this.warnings.length}`);
      return false;
    }
  }
}

// 运行验证
if (require.main === module) {
  const validator = new EnvConfigValidator();
  const success = validator.runValidation();
  process.exit(success ? 0 : 1);
}

module.exports = EnvConfigValidator;

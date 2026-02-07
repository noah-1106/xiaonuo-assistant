const NotificationConfig = require('../models/NotificationConfig');
const notificationService = require('../services/notificationService');
const { BadRequestError, UnauthorizedError, ForbiddenError } = require('../utils/customErrors');

class NotificationController {
  // 检查是否为管理员
  checkAdmin(req, res, next) {
    try {
      const user = req.user;
      if (!user || user.role !== 'admin') {
        throw new ForbiddenError('只有管理员可以访问此功能');
      }
      next();
    } catch (error) {
      next(error);
    }
  }

  // 获取当前通知配置
  async getCurrentConfig(req, res, next) {
    try {
      const config = await NotificationConfig.getCurrentConfig();
      
      // 隐藏敏感信息
      const sanitizedConfig = {
        ...config.toObject(),
        sms: {
          ...config.sms,
          secretId: config.sms.secretId ? '******' : '',
          secretKey: config.sms.secretKey ? '******' : ''
        },
        email: {
          ...config.email
          // 不隐藏密码，以便前端正确显示和提交
        }
      };
      
      res.json({
        status: 'ok',
        message: '获取通知配置成功',
        data: sanitizedConfig
      });
    } catch (error) {
      next(error);
    }
  }

  // 更新通知配置
  async updateConfig(req, res, next) {
    try {
      const updateData = req.body;
      
      console.log('收到配置更新请求:', {
        hasEmailData: !!updateData.email,
        hasEmailPass: updateData.email && !!updateData.email.pass
      });
      
      // 验证更新数据
      if (!updateData) {
        throw new BadRequestError('请提供更新数据');
      }
      
      // 获取当前配置
      let config = await NotificationConfig.getCurrentConfig();
      
      console.log('更新前的配置:', {
        emailPass: config.email.pass ? '******' : '空'
      });
      
      // 更新配置
      if (updateData.sms) {
        console.log('更新短信配置:', {
          hasSecretId: !!updateData.sms.secretId,
          secretIdIsAsterisks: updateData.sms.secretId === '******',
          hasSecretKey: !!updateData.sms.secretKey,
          secretKeyIsAsterisks: updateData.sms.secretKey === '******'
        });
        // 如果secretId或secretKey是星号，不更新这些字段
        if (updateData.sms.secretId === '******' || updateData.sms.secretKey === '******') {
          const { secretId, secretKey, ...smsDataWithoutSecrets } = updateData.sms;
          config.sms = { ...config.sms, ...smsDataWithoutSecrets };
        } else {
          config.sms = { ...config.sms, ...updateData.sms };
        }
      }
      
      if (updateData.email) {
        console.log('更新邮箱配置:', {
          hasPass: !!updateData.email.pass,
          passIsAsterisks: updateData.email.pass === '******'
        });
        // 如果密码是星号，不更新密码字段
        if (updateData.email.pass === '******') {
          const { pass, ...emailDataWithoutPass } = updateData.email;
          config.email = { ...config.email, ...emailDataWithoutPass };
        } else {
          config.email = { ...config.email, ...updateData.email };
        }
      }
      
      if (updateData.verification) {
        config.verification = { ...config.verification, ...updateData.verification };
      }
      
      if (updateData.status) {
        config.status = updateData.status;
      }
      
      console.log('更新后的配置:', {
        emailPass: config.email.pass ? '******' : '空'
      });
      
      // 保存配置
      await config.save();
      console.log('配置保存成功');
      
      // 隐藏敏感信息
      const sanitizedConfig = {
        ...config.toObject(),
        sms: {
          ...config.sms,
          secretId: config.sms.secretId ? '******' : '',
          secretKey: config.sms.secretKey ? '******' : ''
        },
        email: {
          ...config.email,
          pass: config.email.pass ? '******' : ''
        }
      };
      
      res.json({
        status: 'ok',
        message: '更新通知配置成功',
        data: sanitizedConfig
      });
    } catch (error) {
      console.error('更新配置失败:', error);
      next(error);
    }
  }

  // 获取服务状态
  async getServiceStatus(req, res, next) {
    try {
      const status = await notificationService.getServiceStatus();
      
      res.json({
        status: 'ok',
        message: '获取服务状态成功',
        data: status
      });
    } catch (error) {
      next(error);
    }
  }

  // 测试短信发送
  async testSms(req, res, next) {
    try {
      const { phone, code } = req.body;
      
      if (!phone) {
        throw new BadRequestError('请提供手机号码');
      }
      
      const testCode = code || '123456';
      const result = await notificationService.sendSmsVerificationCode(phone, testCode);
      
      res.json({
        status: 'ok',
        message: '测试短信发送成功',
        data: {
          ...result,
          testCode: process.env.NODE_ENV === 'development' ? testCode : undefined
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // 测试邮件发送
  async testEmail(req, res, next) {
    try {
      const { email, code } = req.body;
      
      if (!email) {
        throw new BadRequestError('请提供邮箱地址');
      }
      
      const testCode = code || '123456';
      const result = await notificationService.sendEmailVerificationCode(email, testCode);
      
      res.json({
        status: 'ok',
        message: '测试邮件发送成功',
        data: {
          ...result,
          testCode: process.env.NODE_ENV === 'development' ? testCode : undefined
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // 重置配置为默认值
  async resetConfig(req, res, next) {
    try {
      // 获取当前配置
      const config = await NotificationConfig.getCurrentConfig();
      
      // 重置为默认值
      config.sms = {
        provider: 'tencent',
        secretId: '',
        secretKey: '',
        appId: '',
        signName: '',
        templateId: '',
        enabled: false
      };
      
      config.email = {
        provider: 'smtp',
        host: '',
        port: 587,
        secure: false,
        user: '',
        pass: '',
        from: '',
        template: '您的验证码是: {{code}}，有效期5分钟，请勿泄露给他人。',
        enabled: false
      };
      
      config.verification = {
        codeLength: 6,
        expiryMinutes: 5,
        resendInterval: 60,
        maxAttempts: 5
      };
      
      config.status = 'active';
      
      // 保存配置
      await config.save();
      
      res.json({
        status: 'ok',
        message: '重置通知配置成功',
        data: config
      });
    } catch (error) {
      next(error);
    }
  }

  // 发送验证码（通用接口）
  async sendVerificationCode(req, res, next) {
    try {
      const { contact, type } = req.body;
      
      if (!contact) {
        throw new BadRequestError('请提供联系方式');
      }
      
      const result = await notificationService.sendVerificationCode(contact, type);
      
      res.json({
        status: 'ok',
        message: result.message,
        data: {
          contact,
          contactType: result.contactType,
          code: result.code
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // 验证验证码（通用接口）
  async verifyVerificationCode(req, res, next) {
    try {
      const { contact, code } = req.body;
      
      if (!contact || !code) {
        throw new BadRequestError('请提供联系方式和验证码');
      }
      
      const result = notificationService.verifyVerificationCode(contact, code);
      
      if (!result.valid) {
        throw new BadRequestError(result.message);
      }
      
      res.json({
        status: 'ok',
        message: result.message,
        data: {
          contact,
          valid: result.valid
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();
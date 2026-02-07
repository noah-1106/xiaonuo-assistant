let nodemailer = null;
let tencentcloud = null;
try {
  nodemailer = require('nodemailer');
  tencentcloud = require('tencentcloud-sdk-nodejs');
} catch (error) {
  console.warn('通知服务依赖未安装，将使用模拟模式运行:', error.message);
}
const NotificationConfig = require('../models/NotificationConfig');

// 存储验证码的缓存
const verificationCodes = new Map();

class NotificationService {
  constructor() {
    this.smsClient = null;
    this.emailTransporter = null;
  }

  // 初始化服务
  async initialize() {
    try {
      const config = await NotificationConfig.getCurrentConfig();
      
      // 初始化腾讯云短信客户端
      if (config.sms.enabled && config.sms.secretId && config.sms.secretKey && tencentcloud) {
        try {
          const SmsClient = tencentcloud.sms.v20210111.Client;
          this.smsClient = new SmsClient({
            credential: {
              secretId: config.sms.secretId,
              secretKey: config.sms.secretKey,
            },
            region: 'ap-guangzhou',
            profile: {
              httpProfile: {
                endpoint: 'sms.tencentcloudapi.com',
              },
            },
          });
        } catch (error) {
          console.warn('初始化短信客户端失败，将使用模拟模式:', error.message);
        }
      }
      
      // 初始化邮件 transporter
      if (config.email.enabled && config.email.host && config.email.user && config.email.pass && nodemailer) {
        try {
          console.log('初始化邮件客户端，配置:', {
            host: config.email.host,
            port: config.email.port,
            secure: config.email.secure,
            user: config.email.user,
            from: config.email.from
          });
          this.emailTransporter = nodemailer.createTransport({
            host: config.email.host,
            port: config.email.port,
            secure: config.email.secure,
            auth: {
              user: config.email.user,
              pass: config.email.pass,
            },
            // 增加调试选项
            debug: true,
            logger: true
          });
          console.log('邮件客户端初始化成功');
          // 测试连接
          try {
            await this.emailTransporter.verify();
            console.log('SMTP连接验证成功');
          } catch (error) {
            console.error('SMTP连接验证失败:', error);
            throw error;
          }
        } catch (error) {
          console.warn('初始化邮件客户端失败，将使用模拟模式:', error.message);
          console.warn('详细错误信息:', error);
        }
      }
      
      return true;
    } catch (error) {
      console.error('初始化通知服务失败:', error);
      return false;
    }
  }

  // 生成验证码
  generateVerificationCode(length = 6) {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // 存储验证码
  storeVerificationCode(contact, code, expiryMinutes = 5) {
    const expireAt = Date.now() + expiryMinutes * 60 * 1000;
    verificationCodes.set(contact, {
      code,
      expireAt,
      attempts: 0,
      createdAt: Date.now()
    });
    
    // 自动清理过期验证码
    setTimeout(() => {
      verificationCodes.delete(contact);
    }, expiryMinutes * 60 * 1000);
  }

  // 验证验证码
  verifyVerificationCode(contact, code) {
    const storedCode = verificationCodes.get(contact);
    if (!storedCode) {
      return { valid: false, message: '验证码不存在或已过期' };
    }
    
    if (Date.now() > storedCode.expireAt) {
      verificationCodes.delete(contact);
      return { valid: false, message: '验证码已过期' };
    }
    
    if (storedCode.code !== code) {
      storedCode.attempts += 1;
      if (storedCode.attempts >= 5) {
        verificationCodes.delete(contact);
        return { valid: false, message: '验证码错误次数过多，请重新获取' };
      }
      return { valid: false, message: '验证码错误' };
    }
    
    // 验证成功，清除验证码
    verificationCodes.delete(contact);
    return { valid: true, message: '验证码验证成功' };
  }

  // 发送短信验证码
  async sendSmsVerificationCode(phone, code) {
    try {
      const config = await NotificationConfig.getCurrentConfig();
      
      if (!config.sms.enabled) {
        throw new Error('短信服务未启用');
      }
      
      if (!this.smsClient) {
        await this.initialize();
      }
      
      if (!this.smsClient) {
        throw new Error('短信客户端初始化失败');
      }
      
      const params = {
        SmsSdkAppId: config.sms.appId,
        PhoneNumberSet: [`+86${phone}`],
        SignName: config.sms.signName,
        TemplateId: config.sms.templateId,
        TemplateParamSet: [code, config.verification.expiryMinutes.toString()]
      };
      
      const result = await this.smsClient.SendSms(params);
      
      if (result.SendStatusSet[0].Code !== 'Ok') {
        throw new Error(`短信发送失败: ${result.SendStatusSet[0].Message}`);
      }
      
      return { success: true, message: '短信发送成功' };
    } catch (error) {
      console.error('发送短信失败:', error);
      // 开发环境下模拟发送成功
      // 注意：为了进行真实测试，请在通知配置中启用短信服务并输入正确的配置信息
      if (process.env.NODE_ENV === 'development') {
        console.log(`[开发环境] 模拟发送短信到 ${phone}: 验证码 ${code}`);
        console.log(`[开发环境] 实际错误: ${error.message}`);
        // 为了进行真实测试，这里不再模拟发送成功，而是抛出实际错误
        // 这样用户可以看到真实的错误信息，便于调试
        throw error;
      }
      throw error;
    }
  }

  // 发送邮箱验证码
  async sendEmailVerificationCode(email, code) {
    try {
      const config = await NotificationConfig.getCurrentConfig();
      
      if (!config.email.enabled) {
        throw new Error('邮箱服务未启用');
      }
      
      if (!this.emailTransporter) {
        await this.initialize();
      }
      
      if (!this.emailTransporter) {
        throw new Error('邮箱客户端初始化失败');
      }
      
      const emailContent = config.email.template.replace('{{code}}', code);
      
      // 设置发件人名称
      const senderName = '小诺 - 你的专属智能助理';
      const fromAddress = config.email.from.includes('<') ? config.email.from : `${senderName} <${config.email.from}>`;
      
      const mailOptions = {
        from: fromAddress,
        to: email,
        subject: '验证码',
        text: emailContent,
        html: `<p>${emailContent}</p>`
      };
      
      console.log('发送邮件配置:', {
        host: config.email.host,
        port: config.email.port,
        secure: config.email.secure,
        user: config.email.user,
        from: config.email.from,
        to: email
      });
      
      try {
        console.log('开始发送邮件，使用的配置:', {
          host: config.email.host,
          port: config.email.port,
          secure: config.email.secure,
          user: config.email.user,
          pass: config.email.pass ? '******' : '空',
          from: config.email.from,
          to: email
        });
        
        // 先测试连接
        await this.emailTransporter.verify();
        console.log('SMTP连接验证成功');
        
        const info = await this.emailTransporter.sendMail(mailOptions);
        console.log('邮件发送成功:', info);
        return { success: true, message: '邮箱发送成功', messageId: info.messageId };
      } catch (smtpError) {
        console.error('SMTP发送失败详情:', {
          code: smtpError.code,
          message: smtpError.message,
          response: smtpError.response,
          responseCode: smtpError.responseCode,
          command: smtpError.command,
          stack: smtpError.stack
        });
        
        // 处理常见的SMTP错误
        if (smtpError.code === 'EAUTH') {
          throw new Error('邮箱认证失败，请检查用户名和密码是否正确');
        } else if (smtpError.code === 'ECONNREFUSED') {
          throw new Error('邮箱服务器连接失败，请检查SMTP主机和端口是否正确');
        } else if (smtpError.code === 'ETIMEDOUT') {
          throw new Error('邮箱服务器连接超时，请检查网络连接');
        } else {
          throw new Error(`邮箱发送失败: ${smtpError.message}`);
        }
      }
    } catch (error) {
      console.error('发送邮箱失败:', error);
      // 开发环境下模拟发送成功
      // 注意：为了进行真实测试，请在通知配置中启用邮箱服务并输入正确的配置信息
      if (process.env.NODE_ENV === 'development') {
        console.log(`[开发环境] 模拟发送邮箱到 ${email}: 验证码 ${code}`);
        console.log(`[开发环境] 实际错误: ${error.message}`);
        // 为了进行真实测试，这里不再模拟发送成功，而是抛出实际错误
        // 这样用户可以看到真实的错误信息，便于调试
        throw error;
      }
      throw error;
    }
  }

  // 发送验证码（根据联系方式类型自动选择）
  async sendVerificationCode(contact, type = 'auto') {
    try {
      const config = await NotificationConfig.getCurrentConfig();
      const code = this.generateVerificationCode(config.verification.codeLength);
      
      // 检测联系方式类型
      let contactType = type;
      if (type === 'auto') {
        contactType = /^1[3-9]\d{9}$/.test(contact) ? 'sms' : 'email';
      }
      
      // 发送验证码
      let result;
      if (contactType === 'sms') {
        result = await this.sendSmsVerificationCode(contact, code);
      } else if (contactType === 'email') {
        result = await this.sendEmailVerificationCode(contact, code);
      } else {
        throw new Error('不支持的联系方式类型');
      }
      
      // 存储验证码
      this.storeVerificationCode(contact, code, config.verification.expiryMinutes);
      
      return {
        success: true,
        message: result.message || '验证码发送成功',
        code,
        contactType
      };
    } catch (error) {
      console.error('发送验证码失败:', error);
      throw error;
    }
  }

     // 发送记录到邮箱
     async sendRecordEmail(email, record) {
       try {
         const config = await NotificationConfig.getCurrentConfig();
         
         if (!config.email.enabled) {
           throw new Error('邮箱服务未启用');
         }
         
         if (!this.emailTransporter) {
           await this.initialize();
         }
         
         if (!this.emailTransporter) {
           throw new Error('邮箱客户端初始化失败');
         }
         
         // 构建邮件内容
         const emailContent = `您有一条新的记录：\n\n标题：${record.title || record.summary || '无标题'}\n内容：${record.content}\n\n${record.link ? `链接：${record.link}\n` : ''}${record.tags && record.tags.length > 0 ? `标签：${record.tags.join(', ')}\n` : ''}创建时间：${new Date(record.createdAt).toLocaleString()}`;
         
         // 设置发件人名称
        const senderName = '小诺 - 你的专属智能助理';
        const fromAddress = config.email.from.includes('<') ? config.email.from : `${senderName} <${config.email.from}>`;
        
        const mailOptions = {
           from: fromAddress,
           to: email,
           subject: `记录：${record.title || record.summary || '无标题'}`,
           text: emailContent,
           html: `<p>${emailContent.replace(/\n/g, '</p><p>')}</p>`
         };
         
         try {
           console.log('开始发送记录邮件，使用的配置:', {
             host: config.email.host,
             port: config.email.port,
             secure: config.email.secure,
             user: config.email.user,
             from: config.email.from,
             to: email
           });
           
           // 先测试连接
           await this.emailTransporter.verify();
           console.log('SMTP连接验证成功');
           
           const info = await this.emailTransporter.sendMail(mailOptions);
           console.log('邮件发送成功:', info);
           return { success: true, message: '记录已通过邮件发送', messageId: info.messageId };
         } catch (smtpError) {
           console.error('SMTP发送失败详情:', {
             code: smtpError.code,
             message: smtpError.message,
             response: smtpError.response,
             responseCode: smtpError.responseCode,
             command: smtpError.command,
             stack: smtpError.stack
           });
           
           // 处理常见的SMTP错误
           if (smtpError.code === 'EAUTH') {
             throw new Error('邮箱认证失败，请检查用户名和密码是否正确');
           } else if (smtpError.code === 'ECONNREFUSED') {
             throw new Error('邮箱服务器连接失败，请检查SMTP主机和端口是否正确');
           } else if (smtpError.code === 'ETIMEDOUT') {
             throw new Error('邮箱服务器连接超时，请检查网络连接');
           } else {
             throw new Error(`邮箱发送失败: ${smtpError.message}`);
           }
         }
       } catch (error) {
         console.error('发送记录邮件失败:', error);
         // 直接抛出错误，不进行模拟发送
         throw error;
       }
     }

  // 发送通知（通用方法）
  async sendNotification(contact, type, content, options = {}) {
    try {
      if (type === 'sms') {
        // 发送短信通知
        // 实现略
      } else if (type === 'email') {
        // 发送邮件通知
        // 实现略
      }
      
      return { success: true, message: '通知发送成功' };
    } catch (error) {
      console.error('发送通知失败:', error);
      throw error;
    }
  }

  // 获取服务状态
  async getServiceStatus() {
    try {
      const config = await NotificationConfig.getCurrentConfig();
      
      return {
        sms: {
          enabled: config.sms.enabled,
          configured: !!(config.sms.secretId && config.sms.secretKey && config.sms.signName && config.sms.templateId)
        },
        email: {
          enabled: config.email.enabled,
          configured: !!(config.email.host && config.email.user && config.email.pass && config.email.from)
        },
        verification: config.verification
      };
    } catch (error) {
      console.error('获取服务状态失败:', error);
      return {
        sms: { enabled: false, configured: false },
        email: { enabled: false, configured: false },
        verification: null
      };
    }
  }
}

// 导出单例
module.exports = new NotificationService();
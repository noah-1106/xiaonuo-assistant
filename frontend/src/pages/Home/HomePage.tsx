import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Layout,
  Button,
  Typography,
  Card,
  Row,
  Col,
  Space,
  Divider,
  Avatar,
  Collapse,
  Carousel,
  Badge,
  Modal,
  Form,
  Input,
  Tabs,
  message
} from 'antd';
import './HomePage.css';

import {
  LoginOutlined,
  MessageOutlined,
  FileTextOutlined,
  SettingOutlined,
  UserOutlined,
  CodeOutlined,
  CloudOutlined,
  StarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PhoneOutlined,
  MailOutlined,
  GithubOutlined,
  WechatOutlined,
  SendOutlined,
  LockOutlined,
  ReloadOutlined
} from '@ant-design/icons';

const {
  Header,
  Content,
  Footer
} = Layout;

const {
  Paragraph,
  Text
} = Typography;

const HomePage: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  
  // 登录表单状态
  const [phoneForm] = Form.useForm();
  const [emailForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [countdown, setCountdown] = useState(0);
  const [activeTab, setActiveTab] = useState('phone'); // 'phone', 'email' 或 'password'
  const [captchaId, setCaptchaId] = useState('');
  const [captchaUrl, setCaptchaUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // 使用message.useMessage()创建实例
  const [messageApi, contextHolder] = message.useMessage();

  // 监听滚动事件，用于导航栏样式变化
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 清理验证码URL
  useEffect(() => {
    return () => {
      if (captchaUrl) {
        URL.revokeObjectURL(captchaUrl);
      }
    };
  }, [captchaUrl]);

  // 处理登录按钮点击
  const handleLogin = () => {
    fetchCaptcha();
    setIsLoginModalVisible(true);
  };

  // 处理登录成功
  const handleLoginSuccess = () => {
    setIsLoginModalVisible(false);
    // 刷新页面或导航到主页
    window.location.reload();
  };

  // 获取验证码并保存验证码ID和图片URL
  const fetchCaptcha = async () => {
    try {
      // 确保在开发环境下才输出日志，保护用户隐私
      if (import.meta.env.DEV) {
        console.log('开始获取验证码...');
        console.log('API基础URL:', import.meta.env.VITE_API_BASE_URL);
      }
      
      // 检查API基础URL是否配置正确
      if (!import.meta.env.VITE_API_BASE_URL) {
        throw new Error('API基础URL未配置');
      }
      
      // 直接使用完整URL
      const fullUrl = `${import.meta.env.VITE_API_BASE_URL}/captcha`;
      
      // 使用最简化的fetch配置
      const response = await fetch(fullUrl);
      
      if (!response.ok) {
        throw new Error(`获取验证码失败，HTTP状态码: ${response.status}`);
      }
      
      // 获取验证码ID
      const id = response.headers.get('X-Captcha-Id');
      if (!id) {
        throw new Error('未获取到验证码ID');
      }
      
      setCaptchaId(id);
      
      // 将响应转换为blob，然后创建URL
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // 清理旧的URL，避免内存泄漏
      if (captchaUrl) {
        URL.revokeObjectURL(captchaUrl);
      }
      
      setCaptchaUrl(url);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('获取验证码失败:', error);
      }
      messageApi.error('获取验证码失败，请稍后重试');
      // 确保captchaUrl被重置，显示占位符
      setCaptchaUrl(null);
    }
  };

  // 刷新验证码
  const refreshCaptcha = () => {
    fetchCaptcha();
  };

  // 发送验证码
  const sendVerificationCode = async () => {
    let contact: string | undefined;
    let type: 'sms' | 'email';
    
    if (activeTab === 'phone') {
      contact = phoneForm.getFieldValue('phone');
      type = 'sms';
      if (!contact) {
        messageApi.error('请输入手机号码');
        return;
      }
    } else if (activeTab === 'email') {
      contact = emailForm.getFieldValue('email');
      type = 'email';
      if (!contact) {
        messageApi.error('请输入邮箱地址');
        return;
      }
    } else {
      return;
    }

    try {
      setLoading(true);
      // 调用后端API发送验证码
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/send-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contact,
          type
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '发送验证码失败');
      }
      
      const data = await response.json();
      console.log('发送验证码成功:', data);
      messageApi.success('验证码发送成功');
      
      // 开始倒计时
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      messageApi.error(error.message || '验证码发送失败，请稍后重试');
      console.error('发送验证码失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 验证验证码
  const verifyCaptcha = async (captchaText: string) => {
    try {
      // 移除开发环境日志，保护用户隐私
      if (!captchaId) {
        messageApi.error('验证码已失效，请刷新重试');
        fetchCaptcha();
        return false;
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/captcha/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: captchaId,
          code: captchaText
        })
      });
      
      if (!response.ok) {
        let errorMessage = '验证码错误，请重试';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || '验证码错误，请重试';
        } catch (jsonError) {
          // 生产环境不记录详细错误日志，保护用户隐私
        }
        messageApi.error(errorMessage);
        // 刷新验证码
        fetchCaptcha();
        return false;
      }
      
      return true;
    } catch (error: any) {
      // 生产环境不记录详细错误日志，保护用户隐私
      messageApi.error('验证码错误，请重试');
      // 刷新验证码
      fetchCaptcha();
      return false;
    }
  };

  // 手机验证码登录/注册
  const handlePhoneLogin = async (values: { phone: string; code: string; captcha: string }) => {
    try {
      setLoading(true);
      
      // 验证验证码
      const captchaValid = await verifyCaptcha(values.captcha);
      if (!captchaValid) {
        return;
      }
      
      // 调用后端登录API，包含验证码ID
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login-with-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...values,
          captchaId,
          contact: values.phone
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || '登录失败');
      }
      
      const data = await response.json();
      
      // 清除旧的用户缓存
      localStorage.removeItem('user_cache');
      
      // 保存token到localStorage
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('isLoggedIn', 'true');
      
      messageApi.success('登录成功');
      handleLoginSuccess();
    } catch (error: any) {
      messageApi.error(error.message || '登录失败，请检查验证码是否正确');
    } finally {
      setLoading(false);
    }
  };

  // 邮箱验证码登录/注册
  const handleEmailLogin = async (values: { email: string; code: string; captcha: string }) => {
    try {
      setLoading(true);
      
      // 验证验证码
      const captchaValid = await verifyCaptcha(values.captcha);
      if (!captchaValid) {
        return;
      }
      
      // 调用后端登录API，包含验证码ID
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login-with-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...values,
          captchaId,
          contact: values.email
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || '登录失败');
      }
      
      const data = await response.json();
      
      // 清除旧的用户缓存
      localStorage.removeItem('user_cache');
      
      // 保存token到localStorage
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('isLoggedIn', 'true');
      
      messageApi.success('登录成功');
      handleLoginSuccess();
    } catch (error: any) {
      messageApi.error(error.message || '登录失败，请检查验证码是否正确');
    } finally {
      setLoading(false);
    }
  };

  // 用户名密码登录
  const handlePasswordLogin = async (values: { username: string; password: string; captcha: string }) => {
    try {
      setLoading(true);
      
      // 验证验证码
      const captchaValid = await verifyCaptcha(values.captcha);
      if (!captchaValid) {
        return;
      }
      
      // 调用后端登录API，包含验证码ID
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login-with-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...values,
          captchaId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || '登录失败');
      }
      
      const data = await response.json();
      
      // 清除旧的用户缓存
      localStorage.removeItem('user_cache');
      
      // 保存token到localStorage
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('isLoggedIn', 'true');
      
      messageApi.success('登录成功');
      handleLoginSuccess();
    } catch (error: any) {
      messageApi.error(error.message || '登录失败，请检查用户名或密码是否正确');
    } finally {
      setLoading(false);
    }
  };

  // 功能特点数据
  const features = [
    {
      icon: <MessageOutlined className="feature-icon" />,
      title: "智能聊天助手",
      description: "基于先进的AI技术，提供自然语言交互，解答问题，提供建议，成为您的智能伙伴。"
    },
    {
      icon: <FileTextOutlined className="feature-icon" />,
      title: "记录管理",
      description: "自动保存聊天记录，支持分类管理，快速检索，让您的信息井井有条。"
    },
    {
      icon: <SettingOutlined className="feature-icon" />,
      title: "个性化设置",
      description: "根据您的喜好定制AI助手的行为和响应方式，打造专属的智能体验。"
    },
    {
      icon: <UserOutlined className="feature-icon" />,
      title: "用户管理",
      description: "完善的用户系统，支持多角色管理，保障账户安全。"
    },
    {
      icon: <CodeOutlined className="feature-icon" />,
      title: "多标签页浏览器",
      description: "内置多标签页浏览器，支持网页浏览和内容搜索，一站式解决方案。"
    },
    {
      icon: <CloudOutlined className="feature-icon" />,
      title: "云同步",
      description: "数据云端存储，多设备同步，随时随地访问您的信息。"
    }
  ];

  // 技术优势数据
  const advantages = [
    {
      icon: <CheckCircleOutlined className="advantage-icon" />,
      title: "安全可靠",
      description: "采用端到端加密技术，保护您的隐私和数据安全。"
    },
    {
      icon: <StarOutlined className="advantage-icon" />,
      title: "高性能",
      description: "优化的AI模型和服务器架构，提供快速响应和流畅体验。"
    },
    {
      icon: <CheckCircleOutlined className="advantage-icon" />,
      title: "易于使用",
      description: "直观的用户界面，简单的操作流程，无需专业知识即可上手。"
    },
    {
      icon: <ClockCircleOutlined className="advantage-icon" />,
      title: "7×24小时服务",
      description: "全天候在线，随时为您提供帮助和支持。"
    }
  ];

  // FAQ数据
  const faqItems = [
    {
      key: '1',
      label: '小诺智能助理是什么？',
      children: <Paragraph>小诺智能助理是一款基于先进AI技术的智能助手，能够通过自然语言与您交流，解答问题，提供建议，管理记录，成为您的智能伙伴。</Paragraph>
    },
    {
      key: '2',
      label: '如何开始使用小诺智能助理？',
      children: <Paragraph>您可以通过手机号验证码登录系统，登录后即可开始使用小诺智能助理的各项功能。</Paragraph>
    },
    {
      key: '3',
      label: '小诺智能助理支持哪些功能？',
      children: <Paragraph>小诺智能助理支持智能聊天、记录管理、多标签页浏览器、个性化设置、用户管理等多种功能，满足您的各种需求。</Paragraph>
    },
    {
      key: '4',
      label: '数据安全如何保障？',
      children: <Paragraph>我们采用端到端加密技术，保护您的隐私和数据安全。所有数据存储在安全的云端服务器，严格遵守数据保护法规。</Paragraph>
    },
    {
      key: '5',
      label: '是否需要付费使用？',
      children: <Paragraph>小诺智能助理提供免费版本，包含基本功能。同时我们也提供高级版，解锁更多高级功能和服务。</Paragraph>
    }
  ];

  // 客户评价数据
  const testimonials = [
    {
      name: '张先生',
      role: '企业CEO',
      avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20business%20man%20portrait&image_size=square',
      content: '小诺智能助理帮助我管理日常工作，提高了工作效率，是我不可或缺的智能助手。',
      rating: 5
    },
    {
      name: '李女士',
      role: '设计师',
      avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20business%20woman%20portrait&image_size=square',
      content: '智能聊天功能非常强大，能够理解我的需求并提供有价值的建议，设计灵感源源不断。',
      rating: 5
    },
    {
      name: '王先生',
      role: '学生',
      avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=young%20student%20portrait&image_size=square',
      content: '学习上的问题都能得到详细解答，记录管理功能也很实用，帮助我整理学习资料。',
      rating: 4
    }
  ];

  return (
    <Layout className="home-layout">
      {contextHolder}
      {/* 导航栏 */}
      <Header className={`home-header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="home-header-content">
          <div className="home-logo">
            <Typography.Title level={4} style={{ margin: 0, color: '#fff' }}>
              小诺 - 你的专属智能助理
            </Typography.Title>
          </div>
          <div className="home-nav">
            <Space size="large">
              <Link to="/" className="nav-link">首页</Link>
              <a href="#features" className="nav-link">功能</a>
              <a href="#advantages" className="nav-link">优势</a>
              <a href="#faq" className="nav-link">常见问题</a>
              <a href="#testimonials" className="nav-link">用户评价</a>
            </Space>
          </div>
          <div className="home-actions">
            <Button 
              type="primary" 
              icon={<LoginOutlined />} 
              onClick={handleLogin}
              className="login-button"
            >
              登录/注册
            </Button>
          </div>
        </div>
      </Header>

      {/* 英雄区域 */}
      <Content className="hero-section">
        <div className="hero-content">
          <Row gutter={[32, 32]} align="middle">
            <Col xs={24} lg={12}>
              <Typography.Title level={1} className="hero-title">
                智能助理，<br />
                <span className="hero-title-highlight">改变您的工作方式</span>
              </Typography.Title>
              <Typography.Paragraph className="hero-description">
                小诺智能助理是一款基于先进AI技术的智能助手，能够理解您的需求，提供个性化服务，
                帮助您提高工作效率，简化日常任务，成为您不可或缺的智能伙伴。
              </Typography.Paragraph>
              <div className="hero-buttons">
                <Button 
                  type="primary" 
                  size="large" 
                  onClick={handleLogin}
                  className="start-button"
                >
                  立即开始
                </Button>
              </div>

            </Col>
            <Col xs={24} lg={12}>
              <div className="hero-image">
                <img 
                  src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20AI%20assistant%20interface%20with%20chat%20messages%20and%20record%20management%2C%20clean%20design%2C%20professional%20look&image_size=landscape_16_9" 
                  alt="小诺智能助理" 
                  className="hero-img"
                />
                <Badge.Ribbon text="AI 驱动" color="blue" className="hero-badge" />
              </div>
            </Col>
          </Row>
        </div>
      </Content>

      {/* 功能特点 */}
      <Content className="features-section" id="features">
        <div className="section-content">
          <Typography.Title level={2} className="section-title glass-bg-text">
            核心功能
          </Typography.Title>
          <Typography.Paragraph className="section-description glass-bg-text-light">
            小诺智能助理提供丰富的功能，满足您的各种需求
          </Typography.Paragraph>
          <Row gutter={[32, 32]}>
            {features.map((feature, index) => (
              <Col xs={24} md={12} lg={8} key={index}>
                <Card className="feature-card" hoverable={true}>
                  <div className="feature-icon-container">
                    {feature.icon}
                  </div>
                  <Typography.Title level={4} className="feature-title light-card-text">
                    {feature.title}
                  </Typography.Title>
                  <Typography.Paragraph className="feature-description light-card-text-light">
                    {feature.description}
                  </Typography.Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </Content>

      {/* 技术优势 */}
      <Content className="advantages-section" id="advantages">
        <div className="section-content">
          <Typography.Title level={2} className="section-title glass-bg-text">
            技术优势
          </Typography.Title>
          <Typography.Paragraph className="section-description glass-bg-text-light">
            采用先进技术，提供卓越体验
          </Typography.Paragraph>
          <Row gutter={[32, 32]}>
            {advantages.map((advantage, index) => (
              <Col xs={24} md={12} lg={6} key={index}>
                <div className="advantage-card">
                  <div className="advantage-icon-container">
                    {advantage.icon}
                  </div>
                  <Typography.Title level={4} className="advantage-title light-card-text">
                    {advantage.title}
                  </Typography.Title>
                  <Typography.Paragraph className="advantage-description light-card-text-light">
                    {advantage.description}
                  </Typography.Paragraph>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </Content>

      {/* 客户评价 */}
      <Content className="testimonials-section" id="testimonials">
        <div className="section-content">
          <Typography.Title level={2} className="section-title glass-bg-text">
            用户评价
          </Typography.Title>
          <Typography.Paragraph className="section-description glass-bg-text-light">
            听听我们的用户怎么说
          </Typography.Paragraph>
          <Carousel 
            autoplay={true} 
            dots={true} 
            className="testimonials-carousel"
            effect="fade"
          >
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-header">
                  <Avatar src={testimonial.avatar} size={64} />
                  <div className="testimonial-info">
                    <Typography.Title level={5} style={{ margin: 0 }}>
                      {testimonial.name}
                    </Typography.Title>
                    <Typography.Text className="testimonial-role">
                      {testimonial.role}
                    </Typography.Text>
                  </div>
                </div>
                <Typography.Paragraph className="testimonial-content">
                  "{testimonial.content}"
                </Typography.Paragraph>
                <div className="testimonial-rating">
                  {[...Array(5)].map((_, i) => (
                    <StarOutlined 
                      key={i} 
                      className={`rating-star ${i < testimonial.rating ? 'filled' : ''}`} 
                    />
                  ))}
                </div>
              </div>
            ))}
          </Carousel>
        </div>
      </Content>

      {/* 常见问题 */}
      <Content className="faq-section" id="faq">
        <div className="section-content">
          <Typography.Title level={2} className="section-title glass-bg-text">
            常见问题
          </Typography.Title>
          <Typography.Paragraph className="section-description glass-bg-text-light">
            解答您可能遇到的问题
          </Typography.Paragraph>
          <div className="faq-container">
            <Collapse 
              className="faq-collapse" 
              bordered={false}
              items={faqItems.map(item => ({
                key: item.key,
                label: item.label,
                children: item.children
              }))}
            />
          </div>
        </div>
      </Content>

      {/* 行动召唤 */}
      <Content className="cta-section">
        <div className="cta-content">
          <Row gutter={[32, 32]} align="middle">
            <Col xs={24} lg={16}>
              <Typography.Title level={2} className="cta-title glass-bg-text">
                立即开始使用小诺智能助理
              </Typography.Title>
              <Typography.Paragraph className="cta-description glass-bg-text-light">
                注册并登录，体验智能助理带来的便捷和高效，
                让AI技术为您的工作和生活赋能。
              </Typography.Paragraph>
            </Col>
            <Col xs={24} lg={8}>
              <div className="cta-actions">
                <Button 
                  type="primary" 
                  size="large" 
                  onClick={handleLogin}
                  className="cta-button"
                >
                  开始使用
                </Button>
              </div>
            </Col>
          </Row>
        </div>
      </Content>

      {/* 页脚 */}
      <Footer className="home-footer">
        <div className="footer-content">
          <Row gutter={[32, 32]}>
            <Col xs={24} md={12} lg={8}>
              <div className="footer-section">
                <Typography.Title level={5} className="footer-title">
                  小诺 - 你的专属智能助理
                </Typography.Title>
                <Typography.Paragraph className="footer-description">
                  基于先进AI技术的智能助理，为您提供个性化服务，
                  提高工作效率，简化日常任务。
                </Typography.Paragraph>
                <Space size="middle" className="footer-social">
                  <a href="#" className="social-link"><GithubOutlined /></a>
                  <a href="#" className="social-link"><WechatOutlined /></a>
                  <a href="#" className="social-link"><MailOutlined /></a>
                </Space>
              </div>
            </Col>
            <Col xs={24} md={12} lg={8}>
              <div className="footer-section">
                <Typography.Title level={5} className="footer-title">
                  快速链接
                </Typography.Title>
                <Space orientation="vertical" size="middle" className="footer-links">
                  <Link to="/" className="footer-link">首页</Link>
                  <a href="#features" className="footer-link">功能</a>
                  <a href="#advantages" className="footer-link">优势</a>
                  <a href="#faq" className="footer-link">常见问题</a>
                  <a href="#testimonials" className="footer-link">用户评价</a>
                </Space>
              </div>
            </Col>
            <Col xs={24} md={24} lg={8}>
              <div className="footer-section">
                <Typography.Title level={5} className="footer-title">
                  联系我们
                </Typography.Title>
                <Space orientation="vertical" size="middle" className="footer-contact">
                  <div className="contact-item">
                    <PhoneOutlined className="contact-icon" />
                    <span>400-123-4567</span>
                  </div>
                  <div className="contact-item">
                    <MailOutlined className="contact-icon" />
                    <span>contact@xiaonuo.top</span>
                  </div>
                  <div className="contact-item">
                    <ClockCircleOutlined className="contact-icon" />
                    <span>7×24小时服务</span>
                  </div>
                </Space>
              </div>
            </Col>
          </Row>
          <Divider className="footer-divider" />
          <div className="footer-bottom">
            <Typography.Paragraph className="footer-copyright">
              © 2026 小诺 - 你的专属智能助理. 保留所有权利.
            </Typography.Paragraph>
            <Typography.Paragraph className="footer-icp">
              <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" style={{ color: '#999999', textDecoration: 'none' }}>
                京ICP备2024057402号-4
              </a>
            </Typography.Paragraph>
          </div>
        </div>
      </Footer>

      {/* 登录模态框 */}
      <Modal
        title=""
        open={isLoginModalVisible}
        onCancel={() => setIsLoginModalVisible(false)}
        footer={null}
        width={480}
        centered={true}
      >
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab} 
          centered={true}
          items={[
            {
              key: 'phone',
              label: '手机登录',
              children: (
                <Form
                  form={phoneForm}
                  layout="vertical"
                  onFinish={handlePhoneLogin}
                >
                  <Form.Item
                    name="phone"
                    label="手机号码"
                    rules={[
                      { required: true, message: '请输入手机号码' },
                      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' }
                    ]}
                  >
                    <Input
                      prefix={<PhoneOutlined />}
                      placeholder="请输入手机号码"
                      maxLength={11}
                    />
                  </Form.Item>

                  <Form.Item
                    name="code"
                    label="验证码"
                    rules={[{ required: true, message: '请输入验证码' }]}
                  >
                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                      <Input
                        style={{ width: '70%' }}
                        placeholder="请输入验证码"
                        maxLength={6}
                      />
                      <Button
                        type="primary"
                        icon={<SendOutlined />}
                        onClick={sendVerificationCode}
                        disabled={countdown > 0 || loading}
                        loading={loading}
                        style={{ width: '30%' }}
                      >
                        {countdown > 0 ? `${countdown}s` : '发送验证码'}
                      </Button>
                    </div>
                  </Form.Item>

                  <Form.Item
                    name="captcha"
                    label="图片验证码"
                    rules={[{ required: true, message: '请输入图片验证码' }]}
                  >
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
                      <Input
                        placeholder="请输入图片验证码"
                        maxLength={6}
                        style={{ width: '70%' }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {captchaUrl ? (
                          <img
                            src={captchaUrl}
                            alt="验证码"
                            style={{ 
                              width: '120px', 
                              height: '40px', 
                              cursor: 'pointer',
                              border: '1px solid #d9d9d9',
                              borderRadius: '4px',
                              backgroundColor: '#f5f5f5'
                            }}
                            onClick={refreshCaptcha}
                          />
                        ) : (
                          <div
                            style={{ 
                              width: '120px', 
                              height: '40px',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              border: '1px solid #d9d9d9',
                              borderRadius: '4px',
                              backgroundColor: '#f5f5f5',
                              cursor: 'pointer'
                            }}
                            onClick={refreshCaptcha}
                          >
                            点击获取验证码
                          </div>
                        )}
                        <Button
                          type="text"
                          icon={<ReloadOutlined />}
                          onClick={refreshCaptcha}
                          loading={loading}
                          style={{ padding: 0, color: '#1890ff' }}
                        />
                      </div>
                    </div>
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      style={{ width: '100%', height: 40, fontSize: 16 }}
                    >
                      登录/注册
                    </Button>
                  </Form.Item>
                </Form>
              )
            },
            {
              key: 'email',
              label: '邮箱登录',
              children: (
                <Form
                  form={emailForm}
                  layout="vertical"
                  onFinish={handleEmailLogin}
                >
                  <Form.Item
                    name="email"
                    label="邮箱地址"
                    rules={[
                      { required: true, message: '请输入邮箱地址' },
                      { type: 'email', message: '请输入正确的邮箱地址' }
                    ]}
                  >
                    <Input
                      prefix={<MailOutlined />}
                      placeholder="请输入邮箱地址"
                      maxLength={50}
                    />
                  </Form.Item>

                  <Form.Item
                    name="code"
                    label="验证码"
                    rules={[{ required: true, message: '请输入验证码' }]}
                  >
                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                      <Input
                        style={{ width: '70%' }}
                        placeholder="请输入验证码"
                        maxLength={6}
                      />
                      <Button
                        type="primary"
                        icon={<SendOutlined />}
                        onClick={sendVerificationCode}
                        disabled={countdown > 0 || loading}
                        loading={loading}
                        style={{ width: '30%' }}
                      >
                        {countdown > 0 ? `${countdown}s` : '发送验证码'}
                      </Button>
                    </div>
                  </Form.Item>

                  <Form.Item
                    name="captcha"
                    label="图片验证码"
                    rules={[{ required: true, message: '请输入图片验证码' }]}
                  >
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
                      <Input
                        placeholder="请输入图片验证码"
                        maxLength={6}
                        style={{ width: '70%' }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {captchaUrl ? (
                          <img
                            src={captchaUrl}
                            alt="验证码"
                            style={{ 
                              width: '120px', 
                              height: '40px', 
                              cursor: 'pointer',
                              border: '1px solid #d9d9d9',
                              borderRadius: '4px',
                              backgroundColor: '#f5f5f5'
                            }}
                            onClick={refreshCaptcha}
                          />
                        ) : (
                          <div
                            style={{ 
                              width: '120px', 
                              height: '40px',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              border: '1px solid #d9d9d9',
                              borderRadius: '4px',
                              backgroundColor: '#f5f5f5',
                              cursor: 'pointer'
                            }}
                            onClick={refreshCaptcha}
                          >
                            点击获取验证码
                          </div>
                        )}
                        <Button
                          type="text"
                          icon={<ReloadOutlined />}
                          onClick={refreshCaptcha}
                          loading={loading}
                          style={{ padding: 0, color: '#1890ff' }}
                        />
                      </div>
                    </div>
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      style={{ width: '100%', height: 40, fontSize: 16 }}
                    >
                      登录/注册
                    </Button>
                  </Form.Item>
                </Form>
              )
            },
            {
              key: 'password',
              label: '密码登录',
              children: (
                <Form
                  form={passwordForm}
                  layout="vertical"
                  onFinish={handlePasswordLogin}
                >
                  <Form.Item
                    name="username"
                    label="用户名"
                    rules={[
                      { required: true, message: '请输入用户名' }
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined />}
                      placeholder="请输入用户名"
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    label="密码"
                    rules={[
                      { required: true, message: '请输入密码' }
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="请输入密码"
                    />
                  </Form.Item>

                  <Form.Item
                    name="captcha"
                    label="图片验证码"
                    rules={[{ required: true, message: '请输入图片验证码' }]}
                  >
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
                      <Input
                        placeholder="请输入图片验证码"
                        maxLength={6}
                        style={{ width: '70%' }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {captchaUrl ? (
                          <img
                            src={captchaUrl}
                            alt="验证码"
                            style={{ 
                              width: '120px', 
                              height: '40px', 
                              cursor: 'pointer',
                              border: '1px solid #d9d9d9',
                              borderRadius: '4px',
                              backgroundColor: '#f5f5f5'
                            }}
                            onClick={refreshCaptcha}
                          />
                        ) : (
                          <div
                            style={{ 
                              width: '120px', 
                              height: '40px',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              border: '1px solid #d9d9d9',
                              borderRadius: '4px',
                              backgroundColor: '#f5f5f5',
                              cursor: 'pointer'
                            }}
                            onClick={refreshCaptcha}
                          >
                            点击获取验证码
                          </div>
                        )}
                        <Button
                          type="text"
                          icon={<ReloadOutlined />}
                          onClick={refreshCaptcha}
                          loading={loading}
                          style={{ padding: 0, color: '#1890ff' }}
                        />
                      </div>
                    </div>
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      style={{ width: '100%', height: 40, fontSize: 16 }}
                    >
                      登录
                    </Button>
                  </Form.Item>
                </Form>
              )
            }
          ]}
        />
      </Modal>

      {/* 全局样式 */}
      <style>{`
        /* 首页样式 */
        .home-layout {
          min-height: 100vh;
          overflow: visible;
        }
        
        .home-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          transition: all 0.3s ease;
          height: 64px;
          background-color: rgba(0, 0, 0, 0.85);
        }
        
        .home-header.scrolled {
          background-color: rgba(0, 0, 0, 0.95);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }
        
        .home-header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 100%;
          padding: 0 24px;
        }
        
        .home-logo {
          flex: 1;
        }
        
        .home-nav {
          flex: 2;
          display: flex;
          justify-content: center;
        }
        
        .home-actions {
          flex: 1;
          display: flex;
          justify-content: flex-end;
        }
        
        .nav-link {
          color: #ffffff;
          text-decoration: none;
          font-size: 16px;
          font-weight: 500;
          transition: all 0.3s ease;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        .nav-link:hover {
          color: #ffffff;
          opacity: 0.9;
        }
        
        .login-button {
          border-radius: 8px;
          background-color: #ffffff;
          color: #333;
          font-weight: 500;
        }
        
        .login-button:hover {
          background-color: #f0f0f0;
          color: #333;
        }
        
        /* 英雄区域 */
        .hero-section {
          padding: 120px 0 80px;
          background: linear-gradient(135deg, #1a1a1a 0%, #333 100%);
          color: #fff;
        }
        
        .hero-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }
        
        .hero-section .ant-typography {
          color: #ffffff !important;
        }
        
        .hero-title {
          font-size: 48px;
          font-weight: 700;
          margin-bottom: 24px;
          line-height: 1.2;
          color: #ffffff !important;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3) !important;
        }
        
        .hero-title-highlight {
          color: #ffffff;
        }
        
        .hero-description {
          font-size: 18px;
          margin-bottom: 32px;
          line-height: 1.5;
          opacity: 1;
          color: #ffffff !important;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2) !important;
        }
        
        .hero-buttons {
          margin-bottom: 48px;
        }
        
        .start-button {
          border-radius: 8px;
          padding: 0 32px;
          background-color: #ffffff;
          color: #333;
          border: 1px solid #ffffff;
          font-weight: 500;
        }
        
        .start-button:hover {
          background-color: #f0f0f0;
          color: #333;
        }
        
        .learn-button {
          border-radius: 8px;
          padding: 0 32px;
          background-color: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: #ffffff;
          font-weight: 500;
        }
        
        .learn-button:hover {
          background-color: rgba(255, 255, 255, 0.3);
          color: #ffffff;
        }
        
        .hero-stats {
          margin-top: 48px;
        }
        
        .stat-item {
          text-align: center;
        }
        
        .stat-number {
          font-size: 24px;
          font-weight: 700;
          color: #ffffff;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }
        
        .stat-label {
          font-size: 14px;
          opacity: 1;
          color: #ffffff;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }
        
        .hero-image {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }
        
        .hero-img {
          width: 100%;
          height: auto;
          border-radius: 16px;
        }
        
        .hero-badge {
          position: absolute;
          top: 0;
          right: 0;
        }
        
        /* 通用 section 样式 */
        .section-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 80px 24px;
        }
        
        .section-title {
          text-align: center;
          margin-bottom: 16px;
          color: #333;
        }
        
        .section-description {
          text-align: center;
          margin-bottom: 48px;
          color: #555;
          font-size: 16px;
        }
        
        /* 功能特点 */
        .features-section {
          background-color: #f9f9f9;
        }
        
        .feature-card {
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.3s ease;
          border: 1px solid #e0e0e0;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
          background-color: #fff;
        }
        
        .feature-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
          border: 1px solid #d0d0d0;
        }
        
        .feature-icon-container {
          margin-bottom: 24px;
        }
        
        .feature-icon {
          font-size: 48px;
          color: #333;
        }
        
        .feature-title {
          margin-bottom: 16px;
          color: #333;
        }
        
        .feature-description {
          color: #555;
        }
        
        /* 技术优势 */
        .advantages-section {
          background-color: #f5f5f5;
        }
        
        .advantage-card {
          background-color: #fff;
          padding: 32px;
          border-radius: 16px;
          text-align: center;
          transition: all 0.3s ease;
          border: 1px solid #e0e0e0;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
        }
        
        .advantage-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
          border: 1px solid #d0d0d0;
        }
        
        .advantage-icon-container {
          margin-bottom: 24px;
        }
        
        .advantage-icon {
          font-size: 48px;
          color: #333;
        }
        
        .advantage-title {
          margin-bottom: 16px;
          color: #333;
        }
        
        .advantage-description {
          color: #555;
          font-size: 14px;
        }
        
        /* 客户评价 */
        .testimonials-section {
          background-color: #f9f9f9;
        }
        
        .testimonials-carousel {
          max-width: 800px;
          margin: 0 auto;
        }
        
        .testimonial-card {
          background-color: #fff;
          padding: 48px;
          border-radius: 16px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
          text-align: center;
          border: 1px solid #e0e0e0;
        }
        
        .testimonial-header {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
        }
        
        .testimonial-info {
          margin-left: 16px;
          text-align: left;
        }
        
        .testimonial-role {
          color: #666;
          font-size: 14px;
        }
        
        .testimonial-content {
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 24px;
          color: #333;
        }
        
        .testimonial-rating {
          display: flex;
          justify-content: center;
        }
        
        .rating-star {
          font-size: 20px;
          margin: 0 4px;
          color: #e0e0e0;
        }
        
        .rating-star.filled {
          color: #333;
        }
        
        /* 常见问题 */
        .faq-section {
          background-color: #f5f5f5;
        }
        
        .faq-container {
          max-width: 800px;
          margin: 0 auto;
        }
        
        .faq-panel {
          margin-bottom: 16px;
          border-radius: 8px;
          overflow: hidden;
          background-color: #fff;
          border: 1px solid #e0e0e0;
        }
        
        /* 行动召唤 */
        .cta-section {
          background: linear-gradient(135deg, #1a1a1a 0%, #333 100%);
          color: #ffffff;
        }
        
        .cta-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 80px 24px;
        }
        
        .cta-section .ant-typography {
          color: #ffffff !important;
        }
        
        .cta-title {
          margin-bottom: 16px;
          color: #ffffff !important;
          font-size: 32px;
        }
        
        .cta-description {
          margin-bottom: 32px;
          color: #ffffff !important;
          font-size: 16px;
        }
        
        .cta-button {
          border-radius: 8px;
          padding: 0 32px;
          background-color: #ffffff;
          color: #333;
          border: 1px solid #ffffff;
          font-weight: 500;
        }
        
        .cta-button:hover {
          background-color: #f0f0f0;
          color: #333;
        }
        
        /* 页脚 */
        .home-footer {
          background-color: #1a1a1a;
          color: #ffffff;
        }
        
        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 48px 24px;
        }
        
        .footer-section {
          margin-bottom: 32px;
        }
        
        .footer-title {
          margin-bottom: 16px;
          color: #ffffff !important;
        }
        
        .footer-description {
          margin-bottom: 24px;
          color: #cccccc !important;
          font-size: 14px;
        }
        
        .footer-social {
          margin-top: 16px;
        }
        
        .social-link {
          color: #ffffff;
          font-size: 20px;
          transition: color 0.3s ease;
        }
        
        .social-link:hover {
          color: #1890ff;
        }
        
        .footer-links {
          margin-top: 8px;
        }
        
        .footer-link {
          color: #cccccc;
          text-decoration: none;
          transition: color 0.3s ease;
        }
        
        .footer-link:hover {
          color: #ffffff;
        }
        
        .footer-contact {
          margin-top: 8px;
        }
        
        .contact-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #cccccc;
          font-size: 14px;
        }
        
        .contact-icon {
          font-size: 16px;
        }
        
        .footer-divider {
          margin: 32px 0;
          border-color: #333;
        }
        
        .footer-bottom {
          text-align: center;
        }
        
        .footer-copyright {
          color: #999999 !important;
          font-size: 14px;
          margin-bottom: 8px;
          text-align: center;
        }
        
        .footer-icp {
          color: #999999 !important;
          font-size: 14px;
          text-align: center;
        }
        
        /* 响应式设计 */
        @media (max-width: 768px) {
          .hero-title {
            font-size: 36px;
          }
          
          .hero-description {
            font-size: 16px;
          }
          
          .section-content {
            padding: 60px 24px;
          }
          
          .home-header-content {
            padding: 0 16px;
          }
          
          .home-nav {
            display: none;
          }
        }
      `}</style>
    </Layout>
  );
};

export default HomePage;
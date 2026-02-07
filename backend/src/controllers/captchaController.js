// 存储验证码的临时缓存（实际项目中应该使用Redis或其他持久化存储）
const captchaCache = new Map();
const { BadRequestError } = require('../utils/customErrors');

/**
 * 生成验证码的函数
 * @returns {string} - 生成的验证码文本
 */
const generateCaptcha = () => {
  // 简单的数字和字母混合验证码
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let captcha = '';
  for (let i = 0; i < 6; i++) {
    captcha += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return captcha;
};

/**
 * 生成SVG验证码
 * @param {string} text - 验证码文本
 * @returns {string} - SVG格式的验证码图片
 */
const generateSvgCaptcha = (text) => {
  // 简单的SVG验证码生成
  const width = 120;
  const height = 40;
  const fontSize = 24;
  
  // 添加干扰线
  const noiseLines = [];
  for (let i = 0; i < 4; i++) {
    noiseLines.push(`
      <line
        x1="${Math.random() * width}"
        y1="${Math.random() * height}"
        x2="${Math.random() * width}"
        y2="${Math.random() * height}"
        stroke="#999"
        stroke-width="1"
        opacity="0.5"
      />
    `);
  }
  
  // 添加干扰点
  const noiseDots = [];
  for (let i = 0; i < 30; i++) {
    noiseDots.push(`
      <circle
        cx="${Math.random() * width}"
        cy="${Math.random() * height}"
        r="1"
        fill="#999"
        opacity="0.5"
      />
    `);
  }
  
  // 生成SVG
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#f5f5f5" />
      ${noiseLines.join('')}
      ${noiseDots.join('')}
      <text
        x="${width / 2}"
        y="${height / 2 + fontSize / 3}"
        font-family="Arial, sans-serif"
        font-size="${fontSize}"
        font-weight="bold"
        text-anchor="middle"
        fill="#333"
        transform="rotate(${Math.random() * 10 - 5}, ${width / 2}, ${height / 2})"
      >
        ${text}
      </text>
    </svg>
  `;
};

/**
 * 获取验证码
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 中间件next函数
 * @returns {Promise<void>}
 */
exports.getCaptcha = async (req, res, next) => {
  try {
    // 生成验证码文本
    const captchaText = generateCaptcha();
    
    // 生成SVG验证码
    const svg = generateSvgCaptcha(captchaText);
    
    // 生成唯一ID
    const captchaId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // 存储验证码，有效期5分钟
    captchaCache.set(captchaId, {
      text: captchaText.toLowerCase(), // 验证码不区分大小写
      expireAt: Date.now() + 5 * 60 * 1000
    });
    
    // 返回SVG和验证码ID
    res.set('Content-Type', 'image/svg+xml');
    res.set('X-Captcha-Id', captchaId);
    res.send(svg);
  } catch (error) {
    // 确保错误被正确传递给错误处理中间件
    next(error);
  }
};

/**
 * 验证验证码
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 中间件next函数
 * @returns {Promise<void>}
 */
exports.verifyCaptcha = async (req, res, next) => {
  try {
    const { id, code } = req.body;
    
    if (!id || !code) {
      throw new BadRequestError('请提供验证码ID和验证码文本');
    }
    
    // 查找验证码
    const storedCaptcha = captchaCache.get(id);
    
    if (!storedCaptcha) {
      throw new BadRequestError('验证码不存在或已过期');
    }
    
    // 检查验证码是否过期
    if (Date.now() > storedCaptcha.expireAt) {
      captchaCache.delete(id);
      throw new BadRequestError('验证码已过期');
    }
    
    // 检查验证码是否正确
    if (storedCaptcha.text !== code.toLowerCase()) {
      throw new BadRequestError('验证码错误');
    }
    
    // 验证码正确，删除已使用的验证码
    captchaCache.delete(id);
    
    res.json({
      status: 'ok',
      message: '验证码验证成功'
    });
  } catch (error) {
    next(error);
  }
};

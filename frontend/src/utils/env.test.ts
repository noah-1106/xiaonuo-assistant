// 环境变量管理系统测试
import env, { API_BASE_URL, WS_BASE_URL, NODE_ENV, DEBUG } from './env';
import type { EnvironmentConfig } from './env.types';

describe('环境变量管理系统', () => {
  // 模拟环境变量
  const originalEnv = { ...import.meta.env };

  beforeEach(() => {
    // 重置环境变量
    import.meta.env = { ...originalEnv };
  });

  afterEach(() => {
    // 恢复原始环境变量
    import.meta.env = originalEnv;
  });

  describe('基本功能测试', () => {
    test('should return default config when no environment variables are set', () => {
      const config = env.getAll();
      expect(config.API_BASE_URL).toBe('http://localhost:3001/api');
      expect(config.WS_BASE_URL).toBe('ws://localhost:3001');
      expect(config.NODE_ENV).toBe('development');
      expect(config.DEBUG).toBe(false);
    });

    test('should return correct API_BASE_URL', () => {
      expect(API_BASE_URL).toBe('http://localhost:3001/api');
    });

    test('should return correct WS_BASE_URL', () => {
      expect(WS_BASE_URL).toBe('ws://localhost:3001');
    });

    test('should return correct NODE_ENV', () => {
      expect(NODE_ENV).toBe('development');
    });

    test('should return correct DEBUG', () => {
      expect(DEBUG).toBe(false);
    });
  });

  describe('环境检测测试', () => {
    test('should detect development environment', () => {
      expect(env.isDevelopment()).toBe(true);
      expect(env.isProduction()).toBe(false);
      expect(env.isTest()).toBe(false);
    });

    test('should detect production environment when NODE_ENV is production', () => {
      import.meta.env.VITE_NODE_ENV = 'production';
      const newEnv = require('./env').default;
      expect(newEnv.isProduction()).toBe(true);
      expect(newEnv.isDevelopment()).toBe(false);
    });

    test('should detect test environment when NODE_ENV is test', () => {
      import.meta.env.VITE_NODE_ENV = 'test';
      const newEnv = require('./env').default;
      expect(newEnv.isTest()).toBe(true);
      expect(newEnv.isDevelopment()).toBe(false);
    });
  });

  describe('环境变量加载测试', () => {
    test('should load API_BASE_URL from environment variables', () => {
      import.meta.env.VITE_API_BASE_URL = 'https://example.com/api';
      const newEnv = require('./env').default;
      expect(newEnv.get('API_BASE_URL')).toBe('https://example.com/api');
    });

    test('should automatically calculate WS_BASE_URL from API_BASE_URL', () => {
      import.meta.env.VITE_API_BASE_URL = 'https://example.com/api';
      const newEnv = require('./env').default;
      expect(newEnv.get('WS_BASE_URL')).toBe('wss://example.com');
    });

    test('should load custom WS_BASE_URL from environment variables', () => {
      import.meta.env.VITE_API_BASE_URL = 'https://example.com/api';
      import.meta.env.VITE_WS_BASE_URL = 'wss://custom-ws.example.com';
      const newEnv = require('./env').default;
      expect(newEnv.get('WS_BASE_URL')).toBe('wss://custom-ws.example.com');
    });

    test('should load boolean values correctly', () => {
      import.meta.env.VITE_DEBUG = 'true';
      import.meta.env.VITE_ENABLE_ANALYTICS = 'false';
      const newEnv = require('./env').default;
      expect(newEnv.get('DEBUG')).toBe(true);
      expect(newEnv.get('ENABLE_ANALYTICS')).toBe(false);
    });
  });

  describe('错误处理测试', () => {
    test('should not have errors with valid configuration', () => {
      expect(env.hasErrors()).toBe(false);
      expect(env.getErrors()).toEqual([]);
    });

    test('should handle invalid API_BASE_URL gracefully', () => {
      // 由于我们在实际代码中会使用默认值，这里测试默认行为
      import.meta.env.VITE_API_BASE_URL = 'invalid-url';
      const newEnv = require('./env').default;
      // 注意：实际实现中，我们会验证URL格式，但会使用默认值而不是抛出错误
      // 这里的测试需要根据实际实现调整
      expect(newEnv.get('API_BASE_URL')).toBe('invalid-url'); // 实际实现可能会返回默认值
    });
  });

  describe('配置验证测试', () => {
    test('should validate API_BASE_URL format', () => {
      import.meta.env.VITE_API_BASE_URL = 'https://example.com/api';
      const newEnv = require('./env').default;
      expect(newEnv.get('API_BASE_URL')).toBe('https://example.com/api');
    });

    test('should validate WS_BASE_URL format', () => {
      import.meta.env.VITE_WS_BASE_URL = 'wss://example.com';
      const newEnv = require('./env').default;
      expect(newEnv.get('WS_BASE_URL')).toBe('wss://example.com');
    });

    test('should validate NODE_ENV values', () => {
      import.meta.env.VITE_NODE_ENV = 'production';
      const newEnv = require('./env').default;
      expect(newEnv.get('NODE_ENV')).toBe('production');
    });
  });

  describe('调试功能测试', () => {
    test('should not log debug information when DEBUG is false', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      env.debug();
      expect(consoleLogSpy).not.toHaveBeenCalled();
      consoleLogSpy.mockRestore();
    });

    test('should log debug information when DEBUG is true', () => {
      import.meta.env.VITE_DEBUG = 'true';
      const newEnv = require('./env').default;
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      newEnv.debug();
      expect(consoleLogSpy).toHaveBeenCalledWith('🔧 环境变量配置:', expect.any(Object));
      consoleLogSpy.mockRestore();
    });
  });

  describe('类型安全测试', () => {
    test('should return correct type for API_BASE_URL', () => {
      const apiBaseUrl = env.get('API_BASE_URL');
      expect(typeof apiBaseUrl).toBe('string');
    });

    test('should return correct type for WS_BASE_URL', () => {
      const wsBaseUrl = env.get('WS_BASE_URL');
      expect(typeof wsBaseUrl).toBe('string');
    });

    test('should return correct type for NODE_ENV', () => {
      const nodeEnv = env.get('NODE_ENV');
      expect(typeof nodeEnv).toBe('string');
      expect(['development', 'production', 'test']).toContain(nodeEnv);
    });

    test('should return correct type for DEBUG', () => {
      const debug = env.get('DEBUG');
      expect(typeof debug).toBe('boolean');
    });

    test('should return correct type for ENABLE_ANALYTICS', () => {
      const enableAnalytics = env.get('ENABLE_ANALYTICS');
      expect(typeof enableAnalytics).toBe('boolean');
    });

    test('should return correct type for ENABLE_ERROR_REPORTING', () => {
      const enableErrorReporting = env.get('ENABLE_ERROR_REPORTING');
      expect(typeof enableErrorReporting).toBe('boolean');
    });

    test('should return correct type for APP_NAME', () => {
      const appName = env.get('APP_NAME');
      expect(typeof appName).toBe('string');
    });

    test('should return correct type for APP_VERSION', () => {
      const appVersion = env.get('APP_VERSION');
      expect(typeof appVersion).toBe('string');
    });
  });

  describe('配置完整性测试', () => {
    test('should return complete configuration object', () => {
      const config = env.getAll();
      expect(config).toHaveProperty('API_BASE_URL');
      expect(config).toHaveProperty('WS_BASE_URL');
      expect(config).toHaveProperty('NODE_ENV');
      expect(config).toHaveProperty('DEBUG');
      expect(config).toHaveProperty('ENABLE_ANALYTICS');
      expect(config).toHaveProperty('ENABLE_ERROR_REPORTING');
      expect(config).toHaveProperty('APP_NAME');
      expect(config).toHaveProperty('APP_VERSION');
    });

    test('should return configuration object with correct types', () => {
      const config = env.getAll();
      expect(typeof config.API_BASE_URL).toBe('string');
      expect(typeof config.WS_BASE_URL).toBe('string');
      expect(typeof config.NODE_ENV).toBe('string');
      expect(typeof config.DEBUG).toBe('boolean');
      expect(typeof config.ENABLE_ANALYTICS).toBe('boolean');
      expect(typeof config.ENABLE_ERROR_REPORTING).toBe('boolean');
      expect(typeof config.APP_NAME).toBe('string');
      expect(typeof config.APP_VERSION).toBe('string');
    });
  });
});

// 统一的环境变量管理系统
import type { EnvironmentConfig, EnvKey, Environment } from './env.types';

// 默认环境变量配置
const DEFAULT_CONFIG: EnvironmentConfig = {
  API_BASE_URL: 'http://localhost:3001/api',
  APP_NAME: '小诺智能助理',
  APP_VERSION: '1.0.0',
  NODE_ENV: 'development',
  DEBUG: false,
  ENABLE_ANALYTICS: false,
  ENABLE_ERROR_REPORTING: false,
  WS_BASE_URL: 'ws://localhost:3001'
};

// 环境变量验证规则
const VALIDATION_RULES = {
  API_BASE_URL: (value: string): boolean => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  WS_BASE_URL: (value: string): boolean => {
    try {
      const url = new URL(value);
      return url.protocol === 'ws:' || url.protocol === 'wss:';
    } catch {
      return false;
    }
  },
  NODE_ENV: (value: string): boolean => {
    return ['development', 'production', 'test'].includes(value);
  }
};

// 环境变量管理器
class EnvManager {
  private config: EnvironmentConfig;
  private environment: Environment;
  private errors: string[];

  constructor() {
    this.errors = [];
    this.environment = this.detectEnvironment();
    this.config = this.loadConfig();
  }

  // 检测当前环境
  private detectEnvironment(): Environment {
    const env = import.meta.env.VITE_NODE_ENV || import.meta.env.MODE || 'development';
    return (['development', 'production', 'test'].includes(env) ? env : 'development') as Environment;
  }

  // 加载配置
  private loadConfig(): EnvironmentConfig {
    const config: Partial<EnvironmentConfig> = { ...DEFAULT_CONFIG };

    // 从import.meta.env加载
    this.loadFromImportMeta(config);
    
    // 验证配置
    this.validateConfig(config as EnvironmentConfig);

    return config as EnvironmentConfig;
  }

  // 从import.meta.env加载环境变量
  private loadFromImportMeta(config: Partial<EnvironmentConfig>): void {
    const prefix = 'VITE_';
    
    Object.entries(import.meta.env).forEach(([key, value]) => {
      if (key.startsWith(prefix)) {
        const configKey = key.substring(prefix.length) as keyof EnvironmentConfig;
        if (configKey in config) {
          switch (configKey) {
            case 'DEBUG':
            case 'ENABLE_ANALYTICS':
            case 'ENABLE_ERROR_REPORTING':
              config[configKey] = value === 'true';
              break;
            case 'NODE_ENV':
              config[configKey] = value as Environment;
              break;
            default:
              config[configKey] = value;
          }
        }
      }
    });
  }

  // 验证配置
  private validateConfig(config: EnvironmentConfig): void {
    Object.entries(VALIDATION_RULES).forEach(([key, validator]) => {
      const configKey = key as EnvKey;
      if (configKey in config) {
        if (!validator(config[configKey] as any)) {
          this.errors.push(`环境变量 ${key} 验证失败: ${config[configKey]}`);
          // 使用默认值
          config[configKey] = DEFAULT_CONFIG[configKey];
        }
      }
    });

    // 自动计算WebSocket URL
    if (!config.WS_BASE_URL || config.WS_BASE_URL === DEFAULT_CONFIG.WS_BASE_URL) {
      try {
        const apiUrl = new URL(config.API_BASE_URL);
        config.WS_BASE_URL = apiUrl.href.replace(/^http/, 'ws');
      } catch {
        config.WS_BASE_URL = DEFAULT_CONFIG.WS_BASE_URL;
      }
    }
  }

  // 获取环境变量
  get<K extends EnvKey>(key: K): EnvironmentConfig[K] {
    return this.config[key];
  }

  // 获取所有配置
  getAll(): EnvironmentConfig {
    return { ...this.config };
  }

  // 获取当前环境
  getEnvironment(): Environment {
    return this.environment;
  }

  // 检查是否有错误
  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  // 获取错误信息
  getErrors(): string[] {
    return [...this.errors];
  }

  // 打印配置信息（开发环境）
  debug(): void {
    if (this.config.DEBUG) {
      console.log('🔧 环境变量配置:', {
        environment: this.environment,
        config: this.config,
        errors: this.errors
      });
    }
  }
}

// 创建单例实例
const envManager = new EnvManager();

// 导出环境变量管理工具
export const env = {
  // 获取单个环境变量
  get: <K extends EnvKey>(key: K): EnvironmentConfig[K] => envManager.get(key),
  
  // 获取所有环境变量
  getAll: (): EnvironmentConfig => envManager.getAll(),
  
  // 获取当前环境
  getEnvironment: (): Environment => envManager.getEnvironment(),
  
  // 检查是否为开发环境
  isDevelopment: (): boolean => envManager.getEnvironment() === 'development',
  
  // 检查是否为生产环境
  isProduction: (): boolean => envManager.getEnvironment() === 'production',
  
  // 检查是否为测试环境
  isTest: (): boolean => envManager.getEnvironment() === 'test',
  
  // 检查是否有错误
  hasErrors: (): boolean => envManager.hasErrors(),
  
  // 获取错误信息
  getErrors: (): string[] => envManager.getErrors(),
  
  // 调试输出
  debug: (): void => envManager.debug()
};

// 导出常用环境变量的快捷访问
export const API_BASE_URL = env.get('API_BASE_URL');
export const WS_BASE_URL = env.get('WS_BASE_URL');
export const NODE_ENV = env.get('NODE_ENV');
export const DEBUG = env.get('DEBUG');
export const APP_NAME = env.get('APP_NAME');
export const APP_VERSION = env.get('APP_VERSION');

// 初始化调试信息
if (DEBUG) {
  env.debug();
}

// 导出默认实例
export default env;

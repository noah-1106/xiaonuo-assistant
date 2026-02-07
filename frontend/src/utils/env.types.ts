// 环境变量类型定义
export interface EnvironmentConfig {
  // API配置
  API_BASE_URL: string;
  
  // 应用配置
  APP_NAME: string;
  APP_VERSION: string;
  
  // 环境配置
  NODE_ENV: 'development' | 'production' | 'test';
  DEBUG: boolean;
  
  // 功能开关
  ENABLE_ANALYTICS: boolean;
  ENABLE_ERROR_REPORTING: boolean;
  
  // WebSocket配置
  WS_BASE_URL: string;
}

// 环境变量键类型
export type EnvKey = keyof EnvironmentConfig;

// 环境类型
export type Environment = 'development' | 'production' | 'test';

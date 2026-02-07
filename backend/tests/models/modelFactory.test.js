/**
 * 模型工厂单元测试
 */
const ModelFactory = require('../../src/models/modelFactory');
const DoubaoAdapter = require('../../src/models/doubaoAdapter');

describe('ModelFactory', () => {
  test('createModel方法应该创建豆包适配器', () => {
    const config = {
      model: 'doubao-seed-1-8-251228',
      apiKey: 'test-api-key'
    };
    const model = ModelFactory.createModel('doubao', config);
    expect(model).toBeInstanceOf(DoubaoAdapter);
    expect(model.model).toBe('doubao-seed-1-8-251228');
  });

  test('createModel方法应该默认使用豆包模型', () => {
    const config = {
      model: 'unknown-model',
      apiKey: 'test-api-key'
    };
    const model = ModelFactory.createModel('unknown', config);
    expect(model).toBeInstanceOf(DoubaoAdapter);
  });

  test('createModelFromConfig方法应该从配置创建模型适配器', () => {
    const aiSetting = {
      model: 'doubao-seed-1-8-251228',
      apiKey: 'db-api-key',
      temperature: 80,
      topP: 0.95
    };
    const envConfig = {
      apiKey: 'env-api-key'
    };
    const model = ModelFactory.createModelFromConfig(aiSetting, envConfig);
    expect(model).toBeInstanceOf(DoubaoAdapter);
    expect(model.model).toBe('doubao-seed-1-8-251228');
    expect(model.apiKey).toBe('db-api-key');
  });

  test('createModelFromConfig方法应该使用环境变量配置作为后备', () => {
    const envConfig = {
      model: 'doubao-seed-1-8-251228',
      apiKey: 'env-api-key'
    };
    const model = ModelFactory.createModelFromConfig(null, envConfig);
    expect(model).toBeInstanceOf(DoubaoAdapter);
    expect(model.model).toBe('doubao-seed-1-8-251228');
    expect(model.apiKey).toBe('env-api-key');
  });

  test('getModelType方法应该根据模型名称推断模型类型', () => {
    expect(ModelFactory.getModelType('doubao-seed-1-8-251228')).toBe('doubao');
    expect(ModelFactory.getModelType('gpt-4o')).toBe('gpt');
    expect(ModelFactory.getModelType('claude-3-opus')).toBe('claude');
    expect(ModelFactory.getModelType('unknown-model')).toBe('doubao');
  });

  test('getSupportedModelTypes方法应该返回支持的模型类型', () => {
    const supportedTypes = ModelFactory.getSupportedModelTypes();
    expect(Array.isArray(supportedTypes)).toBe(true);
    expect(supportedTypes).toEqual([{ value: 'doubao', label: '豆包模型' }]);
  });

  test('getModelConfigTemplate方法应该返回模型配置模板', () => {
    const template = ModelFactory.getModelConfigTemplate('doubao');
    expect(template).toEqual({
      model: 'doubao-seed-1-8-251228',
      apiKey: '',
      temperature: 80,
      topP: 0.95,
      capabilities: ['text', 'image', 'video', 'file', 'web_search']
    });
  });

  test('getModelConfigTemplate方法应该返回默认模板', () => {
    const template = ModelFactory.getModelConfigTemplate('unknown');
    expect(template).toEqual({
      model: 'doubao-seed-1-8-251228',
      apiKey: '',
      temperature: 80,
      topP: 0.95,
      capabilities: ['text', 'image', 'video', 'file', 'web_search']
    });
  });
});

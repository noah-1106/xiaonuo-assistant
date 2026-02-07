/**
 * 抽象模型接口单元测试
 */
const AbstractModel = require('../../src/models/abstractModel');

describe('AbstractModel', () => {
  let abstractModel;

  beforeEach(() => {
    abstractModel = new AbstractModel({ model: 'test-model' });
  });

  test('应该初始化配置', () => {
    expect(abstractModel.config).toEqual({ model: 'test-model' });
  });

  test('processText方法应该抛出错误', () => {
    expect(() => abstractModel.processText('test')).toThrow('Subclass must implement processText method');
  });

  test('processImage方法应该抛出错误', () => {
    expect(() => abstractModel.processImage('http://example.com/image.jpg')).toThrow('Subclass must implement processImage method');
  });

  test('processVideo方法应该抛出错误', () => {
    expect(() => abstractModel.processVideo('http://example.com/video.mp4')).toThrow('Subclass must implement processVideo method');
  });

  test('processFile方法应该抛出错误', () => {
    expect(() => abstractModel.processFile('http://example.com/file.pdf')).toThrow('Subclass must implement processFile method');
  });

  test('callTool方法应该抛出错误', () => {
    expect(() => abstractModel.callTool('web_search', { query: 'test' })).toThrow('Subclass must implement callTool method');
  });

  test('getCapabilities方法应该返回默认能力', () => {
    const capabilities = abstractModel.getCapabilities();
    expect(capabilities).toEqual({
      text: true,
      image: false,
      video: false,
      file: false,
      tools: []
    });
  });

  test('supports方法应该返回正确的能力状态', () => {
    expect(abstractModel.supports('text')).toBe(true);
    expect(abstractModel.supports('image')).toBe(false);
    expect(abstractModel.supports('video')).toBe(false);
    expect(abstractModel.supports('file')).toBe(false);
    expect(abstractModel.supports('unknown')).toBe(false);
  });
});

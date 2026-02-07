/**
 * Prettier 配置文件
 * 与 ESLint 协同工作，统一代码格式化风格
 */
export default {
  // 缩进使用 2 个空格
  tabWidth: 2,
  // 使用空格代替制表符
  useTabs: false,
  // 单行最大长度为 100 个字符
  printWidth: 100,
  // 尾随逗号：在多行配置中使用
  trailingComma: 'always-multiline',
  // 使用单引号
  singleQuote: true,
  // 箭头函数括号：总是使用括号
  arrowParens: 'always',
  // 分号：总是使用分号
  semi: true,
  // 对象括号中的空格：always
  bracketSpacing: true,
  // 换行符使用 Unix 风格
  endOfLine: 'lf'
};
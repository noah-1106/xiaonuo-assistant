# 贡献指南

感谢你对小诺智能助理项目的关注！我们欢迎所有形式的贡献，包括但不限于：

- 提交 Bug 报告
- 提交功能请求
- 提交代码修复
- 改进文档
- 分享使用经验

## 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
  - [报告 Bug](#报告-bug)
  - [建议功能](#建议功能)
  - [提交代码](#提交代码)
- [开发环境设置](#开发环境设置)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [发布流程](#发布流程)

## 行为准则

本项目采用 [Contributor Covenant](https://www.contributor-covenant.org/) 行为准则。参与本项目即表示你同意遵守其条款。

## 如何贡献

### 报告 Bug

在报告 Bug 之前，请先：

1. 检查 [Issues](https://github.com/noah-1106/xiaonuo-assistant/issues) 列表，确认该问题尚未被报告
2. 确认你使用的是最新版本
3. 收集尽可能多的相关信息

提交 Bug 报告时，请使用 [Bug 报告模板](https://github.com/noah-1106/xiaonuo-assistant/issues/new?template=bug_report.md) 并包含以下信息：

- 问题的清晰描述
- 复现步骤
- 预期行为
- 实际行为
- 环境信息（操作系统、浏览器、版本等）
- 相关截图或日志

### 建议功能

在建议新功能之前，请先：

1. 检查 [Issues](https://github.com/noah-1106/xiaonuo-assistant/issues) 列表，确认该功能尚未被建议
2. 考虑该功能是否符合项目的整体目标

提交功能请求时，请使用 [功能请求模板](https://github.com/noah-1106/xiaonuo-assistant/issues/new?template=feature_request.md) 并包含以下信息：

- 功能的清晰描述
- 该功能解决的问题
- 建议的实现方案
- 可能的替代方案

### 提交代码

#### 1. Fork 仓库

点击 GitHub 页面右上角的 "Fork" 按钮创建你的 Fork。

#### 2. 克隆仓库

```bash
git clone https://github.com/YOUR_USERNAME/xiaonuo.git
cd xiaonuo
```

#### 3. 添加上游仓库

```bash
git remote add upstream https://github.com/original-owner/xiaonuo.git
```

#### 4. 创建分支

```bash
git checkout -b feature/your-feature-name
# 或
git checkout -b fix/your-bug-fix-name
```

分支命名规范：
- `feature/` - 新功能
- `fix/` - Bug 修复
- `docs/` - 文档更新
- `refactor/` - 代码重构
- `test/` - 测试相关

#### 5. 进行更改

进行你的更改，确保：

- 代码符合项目的代码规范
- 所有测试通过
- 添加必要的测试
- 更新相关文档

#### 6. 提交更改

```bash
git add .
git commit -m "feat: add new feature"
```

#### 7. 保持同步

```bash
git fetch upstream
git rebase upstream/main
```

#### 8. 推送到你的 Fork

```bash
git push origin feature/your-feature-name
```

#### 9. 创建 Pull Request

在 GitHub 上创建 Pull Request，使用提供的模板填写相关信息。

## 开发环境设置

### 前提条件

- Node.js >= 20.0.0
- pnpm >= 8.0
- MongoDB >= 7.0

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/noah-1106/xiaonuo-assistant.git
cd xiaonuo

# 安装前端依赖
cd frontend
pnpm install

# 安装后端依赖
cd ../backend
pnpm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 启动开发服务器
# 终端1：启动后端
cd backend
pnpm run dev

# 终端2：启动前端
cd frontend
pnpm run dev
```

## 代码规范

### 前端

- 使用 TypeScript
- 遵循 ESLint 配置
- 使用 Prettier 格式化代码
- 组件使用函数式组件和 Hooks
- 使用 Ant Design 组件库

### 后端

- 使用 ES6+ 语法
- 遵循 ESLint 配置
- 使用 async/await 处理异步
- 错误处理使用 try-catch
- API 遵循 RESTful 规范

### 代码检查

```bash
# 前端
cd frontend
pnpm run lint
pnpm run lint:fix

# 后端
cd backend
pnpm run lint
pnpm run lint:fix
```

## 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

### 提交类型

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响代码运行的变动）
- `refactor`: 重构（既不是新增功能，也不是修改 bug 的代码变动）
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动
- `ci`: CI 配置相关

### 提交示例

```bash
# 新功能
git commit -m "feat: add user authentication"

# Bug 修复
git commit -m "fix: resolve login redirect issue"

# 文档更新
git commit -m "docs: update API documentation"

# 性能优化
git commit -m "perf: optimize database queries"
```

## 发布流程

1. 更新版本号（遵循 [Semantic Versioning](https://semver.org/)）
2. 更新 CHANGELOG.md
3. 创建发布分支
4. 运行完整测试
5. 创建 Pull Request 到 main 分支
6. 合并后创建 Git 标签
7. 创建 GitHub Release

## 获取帮助

如果你有任何问题或需要帮助：

- 查看 [文档](./README.md)
- 查看 [常见问题](./FAQ.md)
- 在 [Discussions](https://github.com/noah-1106/xiaonuo-assistant/discussions) 中提问
- 发送邮件到 noah-tan@live.com

## 致谢

感谢所有为本项目做出贡献的人！

---

再次感谢你的贡献！

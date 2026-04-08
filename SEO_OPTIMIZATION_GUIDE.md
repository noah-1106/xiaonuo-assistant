# 小诺智能助理 - SEO 与 AI 收录优化指南

## 已完成的优化文件

### 1. robots.txt
**位置**: `frontend/public/robots.txt`

已配置：
- 允许所有主流搜索引擎爬虫访问
- 禁止访问敏感路径（/api/, /admin/, 等）
- 指定 sitemap.xml 位置
- 针对各大AI爬虫（GPTBot, Claude-Web, Bytespider等）的专门配置

### 2. sitemap.xml
**位置**: `frontend/public/sitemap.xml`

只包含登录前可访问的页面：
- 首页
- 登录/注册页面
- 关于我们
- 帮助中心
- 隐私政策和服务条款

### 3. llms.txt
**位置**: `frontend/public/llms.txt`

专为AI模型设计的站点描述文件，包含：
- 站点概述和产品介绍
- 核心功能说明
- 技术架构概述
- 使用场景
- 关键词标签

**注意**: 已移除所有API端点、用户相关路径等敏感信息

### 4. Meta 标签优化
**位置**: `frontend/index.html`

已添加：
- SEO Meta Tags (description, keywords, author, robots)
- Canonical URL
- Open Graph Meta Tags
- Twitter Card Meta Tags
- JSON-LD 结构化数据

## 快速收录行动清单

### 第1步：提交到搜索引擎站长平台（立即执行）

#### Google Search Console
1. 访问 https://search.google.com/search-console
2. 添加属性：`xiaonuo.top`
3. 验证网站所有权
4. 提交 sitemap：`https://xiaonuo.top/sitemap.xml`

#### 百度搜索资源平台
1. 访问 https://ziyuan.baidu.com/
2. 添加站点：`xiaonuo.top`
3. 验证网站所有权
4. 提交 sitemap

#### 必应站长工具
1. 访问 https://www.bing.com/webmasters
2. 添加站点并验证
3. 提交 sitemap

### 第2步：社交媒体分享（今天完成）

- **微博**: 发布上线公告，带上链接 `https://xiaonuo.top`
- **知乎**: 在相关话题下分享
- **掘金**: 发布技术实现文章
- **V2EX**: 在"分享创造"板块发布

### 第3步：准备OG图片

准备一张 1200x630 的 `og-image.png` 图片上传到网站根目录

## 验证收录情况

### 检查搜索引擎收录
```
# Google
site:xiaonuo.top

# 百度
site:xiaonuo.top
```

### 检查AI模型收录
- 询问ChatGPT："你知道小诺智能助理吗？"
- 询问Claude："小诺智能助理是什么？"

## 重要提醒

1. **验证代码**: 将 index.html 中的验证代码替换为实际值：
   - `google-site-verification`
   - `baidu-site-verification`

2. **OG图片**: 准备 1200x630 的 og-image.png

3. **定期更新**: 每次发布新功能后，更新 sitemap 的 lastmod 日期

## 联系方式

如有SEO相关问题，请联系：noah-tan@live.com

---

**最后更新**: 2026-02-07

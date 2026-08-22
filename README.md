<p align="center">
  <a href="https://keru.in/">
    <img src="public/favicon.svg" width="96" height="96" alt="序栈" />
  </a>
</p>

<h1 align="center">序栈 · Blog Engine</h1>

<p align="center">
  在有序的世界里，寻一处生活的归栈。<br />
  基于 <strong>React 19</strong> + <strong>Rsbuild (Rspack)</strong> 构建的高性能现代化极简技术博客系统与可视化内容工作台。
</p>

<p align="center">
  <a href="https://keru.in/"><strong>🌐 在线站点 (keru.in)</strong></a>
</p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-19.1.0-149ECA?logo=react&logoColor=white">
  <img alt="Rsbuild" src="https://img.shields.io/badge/Build-Rsbuild-F59E0B?logo=rsbuild">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-6.0.3-3178C6?logo=typescript&logoColor=white">
  <img alt="Content" src="https://img.shields.io/badge/Content-MDX-1B1F24?logo=mdx">
  <img alt="ICP" src="https://img.shields.io/badge/萌ICP备-20268811号-ff69b4">
  <img alt="License" src="https://img.shields.io/badge/License-MIT%20%2F%20CC--BY--NC--SA-lightgrey">
</p>

---

## 🌟 核心特性

| 模块 | 特性与技术实现 |
| :--- | :--- |
| **页面体系** | 首页（精选文章轮播与分类瀑布流）、文章详情页、年份归档时光轴、友链导航网络、未发布草稿预览 |
| **内容引擎** | 全量 MDX 离线预编译、实时语法高亮（Shiki）、数学公式（KaTeX）、音乐简谱与五线谱（ABCjs）、阅读耗时估算与全站字数精确统计 |
| **交互体验** | 操作系统级明暗双色主题自适应（`next-themes`）、全局 `Ctrl+K` 快速检索（`MiniSearch`）、响应式侧边栏组件流、图片灯箱（Lightbox） |
| **静态生成** | 标准 Atom 订阅源（`/atom.xml`）、OPML 友链订阅（`/friends.opml`）、全站搜索索引与统计接口（`/api/search.json`, `/api/stats.json`） |
| **管理后台** | 内置本地极速可视化 CMS 控制台（`pnpm admin`）：文章列表与实时 MDX 编辑器、SEO 与品牌工坊、Git 状态与提交管理、全站统计看板 |
| **工程规范** | 全量 TypeScript 严格类型检查、ESLint 代码规范约束、Sass 模块化样式隔离与像素级设计系统 |

---

## 🛠️ 技术栈架构

```txt
UI 框架层       :  React 19  +  React Router DOM 7  +  Framer Motion
构建与打包工具   :  Rsbuild (Rspack 驱动，毫秒级 HMR 与极速生产编译)
样式设计系统     :  Sass Embedded + CSS Modules + 现代 CSS 变量规范
内容管理与渲染   :  @mdx-js/mdx + Shiki + KaTeX + ABCjs + gray-matter
客户端全文搜索   :  MiniSearch
本地 CMS 后台   :  原生 Node.js HTTP 服务 + TypeScript + TailwindCSS / Sass
```

---

## 🚀 快速开始

### 1. 环境准备

- **Node.js**: `>= 22.17.1`
- **包管理器**: `pnpm >= 10.0.0`

### 2. 本地开发与构建

```sh
# 安装依赖
pnpm install

# 启动前台开发服务 (包含 MDX 预编译与静态索引自动化构建)
pnpm dev

# 启动本地可视化 CMS 管理控制台 (默认运行在 http://localhost:4000)
pnpm admin

# 生产环境全量编译构建
pnpm build

# 本地预览生产构建产物
pnpm preview
```

### 3. 新建文章

```sh
# 交互式新建文章
pnpm new

# 快速创建指定 Slug 的文章
pnpm new my-first-article
```
新建文章将根据当前年份自动存放至 `content/posts/<年份>/` 目录下。

---

## 📂 目录结构

```txt
├── content/              # Markdown / MDX 博客文章与独立页面
│   ├── posts/            # 技术文章与生活随笔 (支持年级子目录)
│   ├── previews/         # 草稿与私密预览内容
│   ├── link.md           # 友链数据
│   └── theme.md          # 站点主题介绍
├── public/               # 公共静态资源与构建产物
│   ├── api/              # 预编译生成的全站搜索索引 (search.json) 与统计数据 (stats.json)
│   ├── atom.xml          # Atom 订阅源
│   ├── friends.opml      # OPML 友链订阅文件
│   └── site.webmanifest  # 现代 PWA Web Manifest 配置
├── remark-plugins/       # MDX 预编译 Remark / Rehype 核心插件
├── scripts/              # 自动化构建与工程脚本
│   ├── admin-server.ts   # 本地可视化 CMS 后端服务
│   ├── build-static.ts   # MDX 预编译、Atom 订阅生成与全站索引静态构建管道
│   ├── dev.ts            # 开发服务器启动与监听驱动
│   └── new-blog.ts       # 快速新建文章 CLI 工具
├── src/                  # 前端核心源码
│   ├── admin/            # 本地可视化 CMS 控制台前端界面
│   ├── assets/css/       # 全局样式系统、CSS 变量、排版与主题
│   ├── components/       # 业务组件与通用 UI 库 (Blog/Post/Widget/Partial/Content)
│   ├── data/             # 构建阶段生成的结构化 JSON 缓存数据
│   ├── hooks/            # 自定义 React Hooks
│   ├── lib/              # 内容获取、MDX 动态执行与编译逻辑
│   ├── pages/            # 前台页面视图 (首页、文章详情、年份归档、友链等)
│   ├── stores/           # Zustand 全局状态存储
│   ├── types/            # TypeScript 类型定义
│   └── utils/            # 核心工具库 (日期时间、字符串、图标映射等)
├── blog.config.ts        # 全站品牌、作者、导航与默认配置
├── src/app.config.ts     # 前端组件展示层与技术栈扩展配置
├── rsbuild.config.ts     # Rsbuild (Rspack) 构建配置
└── tsconfig.json         # TypeScript 严格模式配置
```

---

## ⚙️ 站点配置

### 站点基础配置 (`blog.config.ts`)

```typescript
export const blogConfig = {
  title: '序栈',
  homepage: 'https://keru.in/',
  url: 'https://keru.in/',
  sitenick: '序栈',
  author: {
    name: 'kerntau',
    avatar: '/avatar.webp',
    status: {
      emoji: '🍵',
      message: '在有序的世界里，寻一处生活的归栈。',
    },
  },
  // ...
}
```

### 前端功能与展示配置 (`src/app.config.ts`)

- **技术信息组件 (`tech`)**：配置部署平台、图片存储、规范域名与 8 项核心技术栈。
- **社交链接 (`social`)**：配置 GitHub、X (Twitter)、Telegram、邮箱等联系方式。
- **页脚信息 (`footer`)**：配置建站年份、版权声明及萌ICP备（`萌ICP备20268811号`）。

---

## 🔍 代码质量与自动化校验

```sh
# 代码规范与 Lint 检查
pnpm lint

# TypeScript 全量类型安全性校验
pnpm tsc --noEmit

# 全静态产物生成与生产打包验证
pnpm build
```

---

## 📄 许可证

- **代码实现**：遵循 [MIT](LICENSE) 开源协议。
- **文章与原创内容**：遵循 [CC BY-NC-SA 4.0](LICENCE-CC-BY-NC-SA)（知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议）。

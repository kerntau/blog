<p align="center">
  <a href="https://blog.cot.wiki/">
    <img src="/avatar.png" width="96" alt="kerntau" />
  </a>
</p>

<h1 align="center">kerntau · Blog Engine</h1>

<p align="center">
  基于 React 19 + Rsbuild 的高性能现代化极简博客
</p>

<p align="center">
  <a href="https://blog.cot.wiki/"><strong>在线站点</strong></a>
</p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white">
  <img alt="Rsbuild" src="https://img.shields.io/badge/Build-Rsbuild-F59E0B">
  <img alt="MDX" src="https://img.shields.io/badge/Content-MDX-1B1F24?logo=mdx">
  <img alt="License" src="https://img.shields.io/badge/License-MIT%20%2F%20CC--BY--NC--SA-lightgrey">
</p>

---

## 核心特性

| 领域 | 功能与实现 |
| --- | --- |
| 页面体系 | 首页（精选文章轮播与分类瀑布流）、文章详情页、年份归档、友链导航、未发布预览页 |
| 内容引擎 | MDX 预编译、实时语法高亮（Shiki）、数学公式（KaTeX）、音乐五线谱（ABCjs）、阅读耗时估算 |
| 交互体验 | 跟随系统/明暗主题切换、全局 Ctrl+K/快捷键搜索（MiniSearch）、响应式侧边栏与小组件、图片灯箱 |
| 静态生成 | Atom 订阅源（`/atom.xml`）、OPML 友链订阅（`/cotovo.opml`）、统计数据与搜索索引接口 |
| 工程规范 | 全量 TypeScript 严格类型检查、ESLint 规范约束 |

## 技术栈

```txt
React 19            /  React Router DOM 7  /  Rsbuild (Rspack)
SCSS + CSS Modules  /  Framer Motion       /  Zustand
MiniSearch          /  next-themes         /  pnpm
```

## 快速开始

```sh
# 安装依赖
pnpm i

# 启动本地开发服务 (包含 MDX 预编译与静态数据生成)
pnpm dev

# 生产环境构建打包
pnpm build

# 本地预览构建产物
pnpm preview
```

### 新建文章

```sh
pnpm new
pnpm new my-new-post
```

文章将自动生成到 `content/posts/<年份>/` 目录下。

## 目录结构

```txt
content/              Markdown / MDX 文章与页面内容
public/               公共静态资源与构建生成物
remark-plugins/       Remark / Rehype 插件
scripts/              构建与内容处理脚本
src/                  核心源码
  assets/css/         全局与主题样式
  components/         业务与基础 UI 组件
  data/               构建生成的静态数据
  hooks/              自定义 React Hooks
  lib/                内容与 MDX 编译渲染逻辑
  pages/              路由页面
  stores/             全局状态管理 (Zustand)
  types/              TypeScript 类型定义
  utils/              通用工具函数
blog.config.ts        站点公共配置
src/app.config.ts     前端展示配置
```

## 代码质量检查

```sh
pnpm lint
pnpm tsc --noEmit
pnpm build
```

## 许可证

- 代码：[MIT](LICENSE)
- 文章：[CC BY-NC-SA 4.0](LICENCE-CC-BY-NC-SA)

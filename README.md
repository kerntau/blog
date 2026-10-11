<div align="center">

# 序栈 · BLOG

**个人数字花园、技术文章与日常手记。**<br>
*A static personal garden for engineering notes and everyday records.*

[![GitHub](https://img.shields.io/badge/GitHub-kerntau%2Fblog-181717?style=for-the-badge&logo=github)](https://github.com/kerntau/blog)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=111111)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=ffffff)](https://www.typescriptlang.org)
[![Rsbuild](https://img.shields.io/badge/Rsbuild-Rspack-F97316?style=for-the-badge)](https://rsbuild.dev)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com)

</div>

---

## 01. PROJECT PURPOSE // 项目定位

Blog 是一个纯前端数字花园：文章、手记、说说和友链以 Markdown/JSON 管理，构建时生成索引、站点地图和 RSS，浏览器端按需加载正文。

项目默认面向静态托管，/admin 仅供本机编辑数据，不是线上多用户 CMS。

## 02. TECHNICAL ARCHITECTURE // 技术架构

~~~mermaid
graph TD
    A[src/content Markdown and JSON] --> B[generate-content-index]
    B --> C[content-index and dynamic loaders]
    C --> D[React + wouter pages]
    D --> E[Rsbuild dist]
    E --> F[Static hosting]
    B --> G[generate-sitemap and generate-rss]
~~~

- React 19、TypeScript 与 wouter 组成页面和路由。
- gray-matter 读取 front matter；Shiki、KaTeX、Mermaid、abcjs 在需要时渲染。
- 生成脚本将列表元数据与正文加载路径分离，减少首屏负担。

## 03. TECHNICAL MATRIX // 技术矩阵

| 模块 | 选型 | 作用 |
| --- | --- | --- |
| 页面 | React 19 + TypeScript | 组件化渲染与类型检查 |
| 构建 | Rsbuild/Rspack | 开发服务器、生产打包和预览 |
| 路由 | wouter | 轻量客户端路由 |
| 内容 | Markdown + gray-matter、JSON | 文章、手记、友链和站点配置 |
| 增强渲染 | Shiki、KaTeX、Mermaid、abcjs | 代码、公式、图表和乐谱 |
| 搜索 | Fuse.js | 客户端模糊检索 |

## 04. REPOSITORY TOPOLOGY // 源码工程拓扑

~~~text
.
├── src/content/
│   ├── posts/                # 技术文章
│   ├── diaries/              # 日常手记
│   ├── records/records.json  # 短记录
│   ├── pages/friends.json    # 友链
│   └── config/               # 站点配置
├── src/                      # 页面、组件和样式
├── scripts/                  # 索引、RSS、站点地图和封面生成
├── public/                   # 静态资源、feed、RSS 和 sitemap
├── start-dev.bat             # Windows 开发启动脚本
└── package.json              # 脚本与依赖
~~~

## 05. CLONE & QUICK START // 极速装配指南

环境要求：Node.js 18+；推荐 pnpm 10。

~~~bash
git clone https://github.com/kerntau/blog.git
cd blog
pnpm install
pnpm dev
~~~

没有 pnpm 时可使用 npm install 和 npm run dev。默认开发地址为 http://localhost:3000，端口占用时 Rsbuild 会选择可用端口。

## 06. DEPLOYMENT & VERIFICATION // 部署与验证

~~~bash
pnpm typecheck
pnpm lint
pnpm build
pnpm preview
~~~

pnpm build 会依次生成内容索引、sitemap、RSS 并输出 dist/。Vercel 配置已指定 dist/ 和 SPA 回退；其他静态托管平台也需要将非静态路由回退到 index.html。

后台数据保存在浏览器 localStorage。要发布后台修改，请使用导出功能写回 src/content/ 后再重新构建。

## 07. LICENSE // 许可证

许可证见仓库 LICENSE 文件。

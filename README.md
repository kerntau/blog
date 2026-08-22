<p align="center">
  <a href="https://zhilu-next.cot.wiki/">
    <img src="https://www.zhilu.site/api/icon.png" width="96" alt="纸鹿摸鱼处" />
  </a>
</p>

<h1 align="center">纸鹿摸鱼处 · Next.js Demo</h1>

<p align="center">
  将 <a href="https://github.com/L33Z22L11/blog-v3">blog-v3</a> 迁移到 Next.js App Router 的演示项目
</p>

<p align="center">
  <a href="https://zhilu-next.cot.wiki/"><strong>在线预览</strong></a>
  ·
  <a href="https://blog.zhilu.site/">原博客</a>
  ·
  <a href="https://github.com/L33Z22L11/blog-v3">原项目</a>
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-App%20Router-000?logo=nextdotjs">
  <img alt="React" src="https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white">
  <img alt="MDX" src="https://img.shields.io/badge/Content-MDX-1B1F24?logo=mdx">
  <img alt="EdgeOne" src="https://img.shields.io/badge/Deploy-EdgeOne-145DFF">
  <img alt="License" src="https://img.shields.io/badge/License-MIT%20%2F%20CC--BY--NC--SA-lightgrey">
</p>

---

> [!IMPORTANT]
> 请尊重原作者与开源协议。  
> 本仓库仅作为 Next.js 迁移 Demo。为方便对照效果，当前保留了原作者的文章、文案、头像、友链、统计与评论配置。  
> 若用于自己的站点，请先删除或替换所有原作者个性化内容。

## 亮点

| 方向 | 已迁移内容 |
| --- | --- |
| 页面 | 首页、文章页、归档、友链、预览、404、加载与错误页 |
| 内容 | MDX、frontmatter、阅读时间、旧链接重定向 |
| 交互 | 主题切换、搜索弹窗、移动端侧栏、图片灯箱、目录 |
| 小组件 | 博客统计、技术信息、更新日志、QQ群卡片、文章目录 |
| 接口 | `/atom.xml`、`/zhilu.opml`、`/api/stats`、`/api/search` |
| 工具 | 新建文章、友链检测、生产构建、ESLint 检查 |

## 技术栈

```txt
Next.js App Router  /  React 19  /  MDX
SCSS + CSS Modules  /  Framer Motion
MiniSearch          /  next-themes
EdgeOne Pages       /  pnpm
```

## 快速开始

```sh
pnpm i
pnpm dev
```

```sh
pnpm build
pnpm start
```

新建文章：

```sh
pnpm new
pnpm new my-new-post
```

文章生成到 `content/posts/<年份>/`，格式为 `.mdx`。

## 自定义前必改

| 文件 | 替换内容 |
| --- | --- |
| `content/` | 原作者文章、页面正文、预览内容 |
| `blog.config.ts` | 站点信息、作者信息、统计、评论 |
| `src/app.config.ts` | 导航、页脚、头像、QQ群、备案 |
| `src/feeds.ts` | 友链数据 |
| `public/` | 与原站绑定的静态资源 |

## 目录结构

```txt
content/              MDX 内容
public/               静态资源
remark-plugins/       MDX / rehype 插件
scripts/              项目脚本
src/app/              App Router 页面与接口
src/components/       页面组件、文章组件、小组件
src/hooks/            React hooks
src/lib/              内容、MDX、订阅源逻辑
src/stores/           客户端状态
src/utils/            通用工具
blog.config.ts        站点公共配置
src/app.config.ts     前端展示配置
redirects.json        旧链接重定向
```

## 部署

当前 Demo 部署在 EdgeOne Pages。

| 配置项 | 值 |
| --- | --- |
| 框架 | Next.js |
| 安装命令 | `pnpm i` |
| 构建命令 | `pnpm build` |
| 输出目录 | `.next` |
| Node.js | 见 `package.json` 的 `engines.node` |

## 检查

```sh
pnpm lint
pnpm build
```

建议同时检查：

```txt
/
/archive
/link
/preview
/atom.xml
/zhilu.opml
/api/stats
/api/search?q=next
```

## 致谢

感谢原作者开源优秀的个人博客项目。

- 原项目：[L33Z22L11/blog-v3](https://github.com/L33Z22L11/blog-v3)
- 原博客：[blog.zhilu.site](https://blog.zhilu.site/)

## 许可证

- 代码：[MIT](LICENSE)
- 文章：[CC BY-NC-SA 4.0](LICENCE-CC-BY-NC-SA)

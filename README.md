# 序栈 · chent-blog

个人数字花园与技术博客，内容以技术文章、日常手记和个人记录为主。

> 心中有景，花香满径。

## 技术栈

| 层级 | 选型 |
|------|------|
| 框架 | React 19 + TypeScript |
| 构建 | Rsbuild（Rspack） |
| 路由 | wouter |
| 样式 | Tailwind CSS 3 |
| 内容 | Markdown（gray-matter frontmatter） |
| 渲染增强 | Shiki / KaTeX / Mermaid / abcjs |
| 部署 | 静态托管（Vercel / GitHub Pages 等） |

## 快速开始

```bash
# 安装依赖（推荐 pnpm）
pnpm install
# 或
npm install
```

### 启动开发服务器

三种方式任选其一：

```bash
# 方式 1：双击或在 cmd 中运行（最省事，自动找 Node）
start-dev.bat

# 方式 2：npm / pnpm 脚本（需要 PATH 里有可用的 node）
npm run dev
pnpm dev

# 方式 3：手动两步
node scripts/generate-content-index.mjs
node node_modules/@rsbuild/core/bin/rsbuild.js dev
```

启动成功后访问 **http://localhost:3000**（端口被占用会自动切到 3001…）。

```bash
# 类型检查
npm run typecheck

# 生产构建（索引 → sitemap → RSS → rsbuild → 404 fallback）
npm run build

# 预览构建产物
npm run preview
```

> 若 `npm run dev` / `pnpm dev` 报 `node` 找不到，或 Node 路径含空格导致脚本失败，请改用 `start-dev.bat`。

## 内容架构

```
src/content/
  posts/*.md          # 技术文稿
  diaries/*.md        # 日常手记
  records/records.json
  pages/friends.json
  config/site.config.json
  generated/          # 构建期自动生成，勿手改
    content-index.json   # 元数据索引（标题/摘要/TOC/阅读时长）
    content-loaders.ts   # 正文动态 import 映射
```

正文 **按需加载**：列表/搜索只依赖元数据索引，进入详情页再拉对应 Markdown chunk。新增或删除文章后请执行：

```bash
pnpm generate:content-index
```

（`pnpm dev` / `pnpm build` 会自动执行。）

## 本地管理后台

访问 `http://localhost:<port>/admin`（仅 localhost / 127.0.0.1 可用，线上直接 404）。

支持：文章 / 手记 / 说说 / 友链 / 分类标签 / 站点设置 / 底层 JSON 编辑、草稿暂存、回收站、导入导出。

### CMS 工作流（重要）

后台数据保存在浏览器 **localStorage**，**不会自动写回仓库**。要让改动上线：

1. 在 `/admin` 编辑内容并保存
2. 使用「导出 / 下载」得到 JSON 或 Markdown
3. 覆盖写入 `src/content/` 对应文件
4. 执行 `pnpm generate:content-index`
5. `git commit` → `git push` 触发部署

换浏览器或清空站点数据会丢失本地后台修改，重要内容请及时导出。

## 常用脚本

| 命令 | 说明 |
|------|------|
| `pnpm generate:content-index` | 重新生成正文元数据索引与 loaders |
| `pnpm generate:sitemap` | 生成 sitemap.xml |
| `pnpm generate:rss` | 生成 feed.xml / rss.xml |
| `pnpm generate:covers` | 生成文章封面 SVG |
| `pnpm detect:friends` | 探测友链可达性 |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier 格式化 |

## 性能相关设计

- 路由级 `React.lazy`：Admin 与非首页栏目不进主包
- 文章/手记正文动态 `import()`，按篇拆 chunk
- Mermaid / abcjs / KaTeX / Shiki 均在使用时再加载
- 中文字体（MiSans）非阻塞加载 + `preconnect`

## 许可

见 [LICENSE](./LICENSE)。

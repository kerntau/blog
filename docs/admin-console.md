# 序栈控制台

控制台入口为 `/admin/dashboard`，使用 Material UI 主题与前台 CSS 变量共同定义色彩、圆角和深色视觉。

## 本地运行

```bash
pnpm dev
```

访问 `/admin` 会自动跳转到工作台。后台 PWA 清单位于 `/admin/manifest.webmanifest`，Service Worker 为 `public/admin-sw.js`。

## 服务端集成

Artalk Adapter 只从服务端环境变量读取凭据：

```bash
ARTALK_API_URL=https://artalk.example.com
ARTALK_ADMIN_TOKEN=replace-with-server-only-token
```

原子化内容推送仅接受已授权的服务端请求，并且只会暂存 `content/` 和 `public/` 下的文件：

```bash
ADMIN_GIT_PUSH_ENABLED=true
ADMIN_ACTION_TOKEN=replace-with-long-random-secret
```

调用 `PUT /api/admin/deployment` 时必须带上 `x-admin-action-token`。该流程固定执行 `git add -- content public`、规范化提交和 `git push origin main`；不会运行任意客户端传入的命令。

部署更新本身必须交给隔离的部署服务，运行中的 Next.js 目录不会执行拉取、构建或切换版本命令。

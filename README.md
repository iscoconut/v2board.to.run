# V2Board 文档

V2Board 运行问题处理方案与技术文档。

## 本地预览

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run docs:dev

# 构建静态文件
npm run docs:build

# 预览构建结果
npm run docs:preview
```

## 部署到 Cloudflare Pages

### 方式一：通过 Cloudflare Dashboard（推荐）

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Pages** > **Create a project**
3. 选择 **Connect to Git**
4. 授权并选择此 GitHub 仓库
5. 配置构建设置：
   - **Framework preset**: VitePress 或 None
   - **Build command**: `npm run docs:build`
   - **Build output directory**: `docs/.vitepress/dist`
   - **Root directory**: `/` (留空即可)
   - **Environment variables**:
     - `NODE_VERSION`: `18` 或 `20`
6. 点击 **Save and Deploy**

### 方式二：通过 Wrangler CLI

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录
wrangler login

# 部署
npm run docs:build
wrangler pages deploy docs/.vitepress/dist
```

## 自定义域名

1. 在 Cloudflare Pages 项目中进入 **Custom domains**
2. 添加您的域名
3. 按照提示配置 DNS 记录

## 自动部署

推送到 GitHub 后，Cloudflare Pages 会自动构建和部署：
- `main` 分支 → 生产环境
- 其他分支/PR → 预览环境

## 文档结构

```
docs/
├── .vitepress/
│   └── config.ts          # VitePress 配置
├── guide/                 # 使用指南
│   ├── getting-started.md
│   ├── requirements.md
│   ├── installation.md
│   └── configuration.md
├── troubleshooting/       # 故障排除
│   ├── index.md
│   ├── installation.md
│   ├── database.md
│   ├── performance.md
│   ├── network.md
│   └── permissions.md
├── faq/                   # 常见问题
│   ├── index.md
│   ├── payment.md
│   ├── nodes.md
│   └── users.md
└── index.md               # 首页
```

## 贡献

欢迎提交问题和改进建议！

1. Fork 此仓库
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 技术栈

- [VitePress](https://vitepress.dev/) - 文档框架
- [Cloudflare Pages](https://pages.cloudflare.com/) - 部署平台

## License

MIT

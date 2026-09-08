# 🚀 HTMLShare - 现代化 HTML 在线代码托管与实时分享平台

<p align="center">
  <b>极简 · 零门槛 · 跨平台 · 高颜值</b><br>
  编写、实时预览、代码格式化、多源导入、一键生成永久分享短链与全平台无缝部署。
</p>

---

## 📖 目录

- [✨ 核心功能特色](#-核心功能特色)
- [📂 完整的项目文件结构与每个文件深度作用详解](#-完整的项目文件结构与每个文件深度作用详解)
  - [1. 根目录核心配置文件与入口](#1-根目录核心配置文件与入口)
  - [2. 自动化部署工作流 (.github/workflows/)](#2-自动化部署工作流-githubworkflows)
  - [3. 前端源代码核心目录 (src/)](#3-前端源代码核心目录-src)
  - [4. 前端核心 UI 组件库 (src/components/)](#4-前端核心-ui-组件库-srccomponents)
  - [5. 辅助工具函数与初始模板 (src/utils/ 与 src/constants/)](#5-辅助工具函数与初始模板-srcutils-与-srcconstants)
  - [6. 静态资源与后台存储 (public/ 与 data/)](#6-静态资源与后台存储-public-与-data)
- [📱 移动端与多设备深度自适应优化](#-移动端与多设备深度自适应优化)
  - [1. 移动端视口与防乱缩放策略](#1-移动端视口与防乱缩放策略)
  - [2. 三态单触点切换底栏](#2-三态单触点切换底栏)
  - [3. 动态视口高度 (100dvh) 解决地址栏遮挡](#3-动态视口高度-100dvh-解决地址栏遮挡)
  - [4. 触控友好设计（44px 点击区域与响应式导航折叠）](#4-触控友好设计44px-点击区域与响应式导航折叠)
- [🛠️ 本地开发与快速上手](#️-本地开发与快速上手)
- [🚀 生产部署全指南（小白保姆级教程）](#-生产部署全指南小白保姆级教程)
  - [💡 核心架构原理：相对路径 (base: './') 与 SPA 单页防 404](#-核心架构原理相对路径-base--与-spa-单页防-404)
  - [方案一：GitHub Actions 自动化 CI/CD（自动打包并发布至 gh-pages 分支）](#方案一github-actions-自动化-cicd自动打包并发布至-gh-pages-分支)
  - [方案二：Cloudflare Pages 前端部署（https://dash.cloudflare.com/ 网页控制台）](#方案二cloudflare-pages-前端部署httpsdashcloudflarecom-网页控制台)
  - [方案三：Cloudflare 全栈 Serverless 部署（Worker + D1 数据库 + KV 缓存）](#方案三cloudflare-全栈-serverless-部署worker--d1-数据库--kv-缓存)
  - [方案四：Vercel 标准化极速部署（SPA 路由重写 + 全球 Anycast CDN）](#方案四vercel-标准化极速部署spa-路由重写--全球-anycast-cdn)
  - [方案五：Netlify 极速部署（Git 自动构建与 Netlify Drop 网页拖拽）](#方案五netlify-极速部署git-自动构建与-netlify-drop-网页拖拽)
  - [方案六：全栈 Node.js / Docker 容器化部署](#方案六全栈-nodejs--docker-容器化部署)
  - [📊 附录：四大主流平台部署与路径兼容性对照表](#-附录四大主流平台部署与路径兼容性对照表)
- [🔐 后台数据管理权限与安全体系](#-后台数据管理权限与安全体系)
- [⚠️ 开发者踩坑指南与常见问题 (FAQ 汇总)](#️-开发者踩坑指南与常见问题-faq-汇总)
- [📄 开源协议](#-开源协议)

---

## ✨ 核心功能特色

1. **三栏联动实时代码编辑器**：
   - 支持 HTML5、CSS3、现代 JavaScript（ES6+）独立分栏实时编写；
   - 内置 Prettier 一键格式化美化，自动对齐缩进，让代码井井有条；
   - 代码行数统计、字符量计算与代码一键快速清空。

2. **多通道代码导入系统**：
   - **🌐 从 URL 导入**：支持自动识别 GitHub（普通链接 `/blob/` 或原始链接 `raw.githubusercontent.com`）、Bitbucket、GitLab 及通用 HTTPS 原始 HTML 链接，通过服务端代理绕过浏览器 CORS 跨域；
   - **📝 粘贴全量代码**：直接粘贴包含 `<!DOCTYPE html>`、`<style>` 与 `<script>` 的单文件代码，支持一键智能拆分至对应编辑栏；
   - **📤 上传文件**：支持拖拽或选择本地 `.html` / `.htm` 文件，全局窗口拖拽即刻解析；
   - **🚀 一键生成永久链接**：无需手动复制，导入即可直接生成 `/p/:code` 永久访问短链。

3. **双重托管与分享体系**：
   - **短链直达**：自动生成 `/s/:slug` 预览页面与 `/raw/:slug` 原生 HTML 独立运行页面；
   - **密码保护**：发布时可设定保护密码，只有验证通过才允许查看与运行核心源码；
   - **多样化分享**：支持生成链接二维码、嵌入式 `<iframe>` 网页挂载标签及一键打包下载为 `.zip` 静态压缩包。

4. **📱 移动端深度自适应**：
   - 针对不同屏幕尺寸（手机 375px~430px、折叠屏、iPad/平板、桌面宽屏）做了严格视口与交互优化；
   - 移动端提供专属的 **「💻 代码编辑」**、**「👁️ 实时预览」** 与 **「⬍ 上下分屏」** 单触点切换底栏。

5. **🎨 三套高质感配色方案**：
   - 支持 **深色模式 (Dark)**、**浅色模式 (Light)** 与 **高对比度模式 (High-Contrast)**；
   - 基于 CSS 变量动态驱动，无缝换肤，记忆用户偏好。

6. **🤖 AI 智能辅助与重构**：
   - 支持 Gemini / OpenAI 兼容接口，提供代码错误诊断、样式优化与性能重构建议。

---

## 📂 完整的项目文件结构与每个文件深度作用详解

本项目采用 **现代化前后端一体化（Full-Stack）** 架构，前端使用 **React 19 + Vite 6 + Tailwind CSS v4**，后端使用 **Express + TypeScript** 与 **Cloudflare Serverless Worker**，每一个文件都有其清晰明确的职责：

```text
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions 自动化 CI/CD 构建并推送到 gh-pages 分支
├── data/
│   └── htmlshare_db.json         # 服务端轻量级 JSON 数据库（保存已发布的片段及浏览量）
├── public/
│   ├── _redirects                # Netlify / Cloudflare Pages 单页路由重写与 Worker 反向代理规则
│   └── assets/                   # 公共静态静态资源目录
├── src/
│   ├── components/               # 前端 UI 组件库
│   │   ├── AIAssistantModal.tsx  # AI 智能助手弹窗（代码性能诊断/语法纠错/重构建议）
│   │   ├── CloudflareModal.tsx   # Cloudflare D1/KV 配置向导与 Worker 代码复制弹窗
│   │   ├── CodeEditor.tsx        # 三栏代码编辑器（含 Prettier 一键美化、行号统计与清空）
│   │   ├── Header.tsx            # 响应式顶部导航栏（主题切换、新建、导入、后台管理、保存分享）
│   │   ├── ImportCodeModal.tsx   # 多源导入弹窗（URL拉取代理、直贴解析、文件上传与短链生成）
│   │   ├── MySnippetsModal.tsx   # 后台数据管理中心（探索广场/管理员面板/批量导出与导入）
│   │   ├── PasscodeModal.tsx     # 访问受保护代码片段时的密码解锁弹窗
│   │   ├── PreviewPanel.tsx      # 实时沙箱预览面板（含设备尺寸切换、控制台日志与全屏）
│   │   ├── PublishModal.tsx      # 代码保存与发布配置弹窗（自定义短链、有效期、加密保护）
│   │   └── ShareModal.tsx        # 分享完成落地卡片（短链直达、iframe嵌入、二维码、ZIP导出）
│   ├── constants/
│   │   └── defaultSnippet.ts     # 默认工作区初始代码模板（HTML5/CSS3/JS动效演示）
│   ├── utils/
│   │   ├── formatters.ts         # 常用格式化函数（日期、文件大小、浏览量数字转换）
│   │   ├── htmlParser.ts         # 智能 HTML 拆分器（提取 <style>、<script> 与 <body>）
│   │   └── prettierFormatter.ts  # 浏览器端运行的 Prettier 代码美化与缩进格式化工具
│   ├── App.tsx                   # 顶层主控大脑组件（全局状态协调、移动端视图切换与路由监听）
│   ├── index.css                 # 全局 Tailwind CSS 样式文件与 CSS 动态主题变量配置
│   ├── main.tsx                  # React 应用程序挂载入口点（挂载至 #root 容器）
│   └── types.ts                  # 全局 TypeScript 接口类型规范（Snippet、ThemeMode 等）
├── .env.example                  # 环境变量声明模板（GEMINI_API_KEY 等）
├── .gitignore                    # Git 忽略配置（忽略 node_modules、dist、临时缓存）
├── bun.lock                      # Bun 包管理器锁文件
├── index.html                    # 网站 HTML 模板骨架、移动端 Viewport 适配与 SEO 头信息
├── metadata.json                 # 项目元数据配置文件
├── package.json                  # 项目依赖包清单与运行脚本定义 (dev/build/start/lint)
├── schema.sql                    # Cloudflare D1 关系型 SQLite 数据库一键建表脚本
├── server.ts                     # 后端 Express 服务器（API、短链转发、URL拉取代理）
├── tsconfig.json                 # TypeScript 语言与编译规则配置
├── vercel.json                   # Vercel 单页应用 (SPA) 全局路由重写 (Rewrites) 规则
├── vite.config.ts                # Vite 静态打包配置（核心设置 base: './' 相对路径）
├── worker.js                     # 完整的 Cloudflare Worker 生产环境 Serverless 部署脚本
└── wrangler.jsonc                # Cloudflare 官方配置文件（Worker名称、D1/KV资源绑定）
```

---

### 1. 根目录核心配置文件与入口

- **`vite.config.ts`**：
  - **核心作用**：Vite 前端构建与打包工具的配置文件。
  - **关键机制**：配置了 `base: './'`（相对路径模式）。这是本项目的关键设计，确保打包后的 JS/CSS 资源引用使用相对路径 `./assets/index.js`，从而无论部署在任何域名的根路径，还是 GitHub Pages 的子目录（如 `https://用户名.github.io/仓库名/`）下，都能正常加载，绝对不会发生 404 白屏。
- **`index.html`**：
  - **核心作用**：单页应用（SPA）的主页面入口骨架。
  - **关键机制**：声明了 `<div id="root"></div>` 挂载点，并在 `<head>` 中配置了完整的移动端视口防护标签：`viewport-fit=cover` 与 `maximum-scale=1.0`，彻底杜绝手机端点击输入框时页面乱放大的问题。
- **`package.json`**：
  - **核心作用**：记录项目所需的全部 npm 依赖项与运行脚本。
  - **关键脚本**：
    - `"dev"`: 使用 `tsx server.ts` 启动本地前后端协同开发环境（监听 3000 端口）；
    - `"build"`: 执行 `vite build` 打包前端静态资源至 `dist/`，并使用 esbuild 将 `server.ts` 编译为 `dist/server.cjs`；
    - `"start"`: 使用 Node.js 启动打包后的生产环境服务器；
    - `"lint"`: 运行 TypeScript 语法与类型安全检查。
- **`vercel.json`**：
  - **核心作用**：Vercel 平台的生产环境路由分发配置。
  - **关键机制**：配置 `"rewrites": [{"source": "/(.*)", "destination": "/index.html"}]`。当用户直接在浏览器中刷新形如 `/s/my-app` 的深层链接时，Vercel 自动重写回 `index.html`，交由前端客户端路由接管渲染，避免静态 404 错误。
- **`worker.js`**：
  - **核心作用**：Cloudflare 边缘无服务器函数（Serverless Worker）的完整生产代码。
  - **关键机制**：
    - 全面支持 CORS 跨域请求；
    - 支持 `/api/snippets`、`/api/explore` 等 REST 接口；
    - `/raw/:slug` 直出页面优先读取 **Cloudflare KV 边缘缓存**，毫秒级直接输出原生 HTML；
    - 缓存未命中时查询 **Cloudflare D1 关系型 SQLite 数据库**，并使用 `ctx.waitUntil` 异步递增浏览量。
- **`wrangler.jsonc`**：
  - **核心作用**：Cloudflare 官方命令行工具 Wrangler 的标准配置文件。
  - **关键机制**：声明了 Worker 名称 `htmlshare-worker`、入口 `worker.js`，并完成了 D1 数据库（变量名 `DB`）与 KV 命名空间（变量名 `KV_SNIPPETS`）的自动绑定。
- **`schema.sql`**：
  - **核心作用**：Cloudflare D1 关系型 SQLite 数据库的建表 SQL。
  - **关键机制**：定义了 `snippets` 表，包含 `id`、`slug`、`html`、`css`、`js`、`is_public`、`passcode`、`views` 等字段，以及针对 `slug` 和 `created_at` 的高效索引。
- **`server.ts`**：
  - **核心作用**：全栈环境下的 Node.js Express 后端服务器。
  - **关键接口**：
    - `POST /api/fetch-url`：服务端代理抓取外部网页或 GitHub 代码（自动将 `github.com/.../blob/...` 转为 `raw.githubusercontent.com`），彻底解决浏览器端直接抓取报 CORS 跨域的问题；
    - `POST /generate` / `POST /api/snippets`：保存代码片段并生成唯一短链；
    - `GET /raw/:slug`：直接输出干净、可独立运行的纯 HTML 页面；
    - `GET /api/admin/*`：带管理员密码鉴权的数据管理和统计接口。
- **`tsconfig.json`**：
  - **核心作用**：TypeScript 编译器的规则配置文件，保证项目全链路拥有严格的类型推导与语法检查。
- **`.env.example`**：
  - **核心作用**：环境变量声明模板。如需启用大模型智能代码优化，可在此配置 `GEMINI_API_KEY`。

---

### 2. 自动化部署工作流 (`.github/workflows/`)

- **`.github/workflows/deploy.yml`**：
  - **核心作用**：GitHub Actions 持续集成与自动化发布流水线。
  - **工作全流程**：
    1. 监听 `main` / `master` 分支的 `git push` 事件；
    2. 在 Ubuntu 云端容器中拉取代码、配置 Node.js 20 并执行 `npm install`；
    3. 执行 `npx vite build` 按照相对路径编译输出静态文件至 `dist/` 目录；
    4. 执行 `cp dist/index.html dist/404.html` 生成单页路由兜底文件；
    5. 使用 `peaceiris/actions-gh-pages@v4` 插件自动将 `dist/` 内容推送到仓库专属的 **`gh-pages` 孤立分支**，实现秒级全自动上线。

---

### 3. 前端源代码核心目录 (`src/`)

- **`src/App.tsx`**：
  - **核心作用**：前端应用程序的顶层中枢。
  - **核心职责**：
    - 维护全局代码状态（HTML / CSS / JS 内容、标题、描述、自定义短链、标签等）；
    - 监听 URL 路由变化（如 `/s/:slug` 预览模式或编辑模式）；
    - 管理深色/浅色/高对比度主题切换；
    - 控制全部 Modal 弹窗（导入、发布、分享、后台、AI 等）的挂载与显示；
    - 实现响应式布局调度：在移动端自动切换为单触点三态视图，在宽屏下渲染经典双栏分屏。
- **`src/main.tsx`**：
  - **核心作用**：React 19 的启动入口，使用 `createRoot` 将 `App` 根组件挂载到 DOM 树的 `#root` 节点上。
- **`src/types.ts`**：
  - **核心作用**：TypeScript 接口与数据模型定义中心。
  - **核心定义**：`Snippet`（代码片段详情）、`ThemeMode`（主题模式）、`DeviceInfo`（预览设备分辨率）、`AdminStats`（后台统计数据）等。
- **`src/index.css`**：
  - **核心作用**：全局样式表，引入 Tailwind CSS 并定义基于 `data-theme` 属性的 CSS 变量系统（背景色、文本色、边框色、强调色），实现毫秒级平滑无刷新换肤。

---

### 4. 前端核心 UI 组件库 (`src/components/`)

- **`Header.tsx`**：
  - **核心作用**：顶部主导航工具栏。
  - **功能特色**：包含 Logo 徽章、主题切换菜单、新建清空、从 URL 导入、后台片段库、AI 智能助手、以及醒目的「保存 & 分享」按钮；小屏幕下自适应折叠文字，避免按钮溢出换行。
- **`CodeEditor.tsx`**：
  - **核心作用**：三栏式交互代码编辑器。
  - **功能特色**：
    - 提供 HTML、CSS、JavaScript 独立标签页切换；
    - 内置 **「一键美化代码」**（Prettier 格式化），瞬间格式化缩进与换行；
    - 动态统计代码行数与字符量，支持一键清空与重置。
- **`PreviewPanel.tsx`**：
  - **核心作用**：实时沙箱预览面板。
  - **功能特色**：
    - 采用隔离安全的 `<iframe>` 动态组装并渲染用户输入的 HTML + CSS + JS；
    - 支持一键切换模拟设备尺寸（💻 桌面端 100%、📱 手机端 375px、📱 平板端 768px）；
    - 支持一键刷新重载、一键全屏展开预览，并内置实时虚拟控制台（Console Log 捕获）。
- **`ImportCodeModal.tsx`**：
  - **核心作用**：多源代码导入与快捷短链生成弹窗。
  - **功能特色**：提供 **URL 远程拉取**、**整段代码直接粘贴** 和 **本地 .html 文件拖拽上传** 3 大通道，支持智能拆分解析并直接生成永久短链。
- **`PublishModal.tsx`**：
  - **核心作用**：代码发布配置中心。
  - **功能特色**：允许用户自定义专属短链接（如 `/s/my-demo`）、设置是否公开、设置有效期（1小时/1天/7天/永久）以及配置访问保护密码。
- **`ShareModal.tsx`**：
  - **核心作用**：分享落地与导出卡片。
  - **功能特色**：展示生成的短链链接、原生 HTML 直链、网页嵌入 `<iframe src="...">` 代码、动态二维码生成，并支持一键将 HTML/CSS/JS 打包下载为 `.zip` 压缩文件。
- **`MySnippetsModal.tsx`**：
  - **核心作用**：后台数据管理中心。
  - **功能特色**：
    - 提供公开广场片段浏览与后台管理员维护模式；
    - 管理员模式下需输入密码鉴权（默认账号 `admin`，默认密码 `123456`）；
    - 登录界面与密码维护强制使用密码掩码（`••••••`），杜绝明文泄露；
    - 支持查看系统总记录/总访问量/存储占用、整库 JSON 备份导出、数据导入恢复、清理过期片段与彻底删除。
- **`PasscodeModal.tsx`**：
  - **核心作用**：密码保护验证弹窗。当访客打开设置了密码的代码片段时弹出，输入正确密码后方可解密并加载源码。
- **`AIAssistantModal.tsx`**：
  - **核心作用**：AI 智能代码助手。向大模型发起智能分析，针对当前编辑区的代码提供语法纠错、性能优化与 CSS 样式美化建议。
- **`CloudflareModal.tsx`**：
  - **核心作用**：Cloudflare 专属部署指南弹窗。展示 D1 SQL 建表语句和 Worker 代码，支持一键复制代码。

---

### 5. 辅助工具函数与初始模板 (`src/utils/` 与 `src/constants/`)

- **`src/utils/htmlParser.ts`**：
  - **核心作用**：HTML 智能拆分器。
  - **工作原理**：利用浏览器的 `DOMParser` API，将完整的 HTML 代码解析为 DOM 树，自动提取 `<style>` 标签中的 CSS、`<script>` 标签中的 JS，以及 `<body>` 中的 DOM 元素，智能分发到编辑器的对应分栏中。
- **`src/utils/prettierFormatter.ts`**：
  - **核心作用**：浏览器端 Prettier 代码格式化工具，对 HTML、CSS、JS 代码进行标准语法排版与缩进美化。
- **`src/utils/formatters.ts`**：
  - **核心作用**：常用的数据格式化工具，包含时间相对距离（如“5分钟前”）、文件大小换算（B/KB/MB）及数字缩写格式化。
- **`src/constants/defaultSnippet.ts`**：
  - **核心作用**：默认初始工作区的示例代码，展示一个带有现代渐变、毛玻璃与交互动效的 HTML/CSS/JS 卡片。

---

### 6. 静态资源与后台存储 (`public/` 与 `data/`)

- **`public/_redirects`**：
  - **核心作用**：Netlify 与 Cloudflare Pages 的单页路由重定向配置文件。
  - **规则说明**：声明 `/* /index.html 200`，确保单页应用在任意深层子路由刷新时均返回 `index.html`。
- **`data/htmlshare_db.json`**：
  - **核心作用**：Node.js Express 本地运行时使用的轻量 JSON 数据库，免去安装大型数据库的繁琐配置。

---

## 📱 移动端与多设备深度自适应优化

为了让用户在任何设备（iPhone、Android 手机、折叠屏、iPad、平板及各类桌面显示器）上均能获得极佳的编写与预览体验，本项目进行了全方位的深度适配：

```text
┌──────────────────────────────────────────────────────────────┐
│                    移动端专属适配技术矩阵                    │
├──────────────────────────────┬───────────────────────────────┤
│ 📐 视口防乱缩放              │ maximum-scale=1.0, cover      │
│ 📱 动态视口高度              │ 100dvh 解决 Safari 地址栏遮挡 │
│ 👆 触控点击热区              │ min-height: 44px 防误触       │
│ 🎛️ 响应式导航栏              │ 自动隐藏长文本，保留精简图标  │
│ 🔄 三态单触点切换            │ [💻 编辑] [👁️ 预览] [⬍ 分屏]  │
└──────────────────────────────┴───────────────────────────────┘
```

### 1. 移动端视口与防乱缩放策略
- **iOS Safari 防自动放大**：在 iOS Safari 浏览器中，如果输入框文字字号小于 16px，点击输入框时系统会自动将整个网页画面放大，导致排版错乱。本项目在 `index.html` 中设定了 `maximum-scale=1.0, user-scalable=no, viewport-fit=cover`，并在移动端针对输入控件设置了最佳字号，彻底解决了误缩放问题。
- **刘海屏与安全区域适配**：利用 `viewport-fit=cover` 与 CSS `env(safe-area-inset-bottom)`，完美避开 iPhone 底部操作横条和顶部刘海。

### 2. 三态单触点切换底栏
在屏幕宽度小于 1024px（`< lg`）的移动设备上，界面会自动隐藏桌面端的双栏并排结构，转为专属的单触点三态切换视图：
- 💻 **「代码编辑」模式**：代码编辑区占满整个屏幕，手机软键盘弹起时有充足的编辑视野，编写顺畅；
- 👁️ **「实时预览」模式**：全屏渲染生成的 HTML 页面，方便触控测试网页的各种交互动效；
- ⬍ **「上下分屏」模式**：上半部分展示代码编辑器，下半部分展示实时预览窗口，兼顾即时反馈。

### 3. 动态视口高度 (`100dvh`) 解决地址栏遮挡
传统的 `100vh` 在移动端浏览器（特别是 Chrome / Safari）中容易被动态伸缩的顶部地址栏和底部工具栏遮挡内容。本项目全面采用现代 CSS 视口单位 `100dvh`（Dynamic Viewport Height），确保容器始终 100% 贴合可见区域，告别页面底部被截断的问题。

### 4. 触控友好设计（44px 点击区域与响应式导航折叠）
- **触控热区保证**：移动端所有按钮、选项卡和操作控件的最小高度均保证在 44px 以上，并带有清晰的按下反馈，杜绝手机误触；
- **智能导航折叠**：顶部导航栏根据屏幕宽度动态自适应，小屏下自动将长文本（如 `AI 智能助手` 缩减为 `AI`，`保存 & 生成短链` 缩减为 `分享`），确保所有关键按钮在单行内整齐排列不折行。

---

## 🛠️ 本地开发与快速上手

只需要安装 Node.js 18+ 环境：

```bash
# 1. 克隆代码仓库
git clone https://github.com/你的用户名/你的仓库名.git
cd 你的仓库名

# 2. 安装项目依赖
npm install

# 3. 启动本地全栈开发环境（端口 3000）
npm run dev
```

启动后在浏览器打开 `http://localhost:3000` 即可开始使用！

---

## 🚀 生产部署全指南（小白保姆级教程）

### 💡 核心架构原理：相对路径 (`base: './'`) 与 SPA 单页防 404

1. **为什么不需要担心子路径资源 404？**
   - 本项目在 `vite.config.ts` 中设定了 `base: './'`（相对路径模式）。
   - 绝大多数前端脚手架默认使用绝对路径 `/assets/xxx.js`，一旦部署到 GitHub Pages 的子路径（例如 `https://username.github.io/repo-name/`）时，浏览器会去根域名 `username.github.io/assets/...` 请求资源，导致全部 404 白屏。
   - 本项目通过相对路径模式，无论部署在**根域名**（如 Vercel/Netlify 自定义域名）还是**任意多级子目录**下，资源均能以当前 HTML 为基准完美加载！
2. **为什么单页应用 (SPA) 刷新不会 404？**
   - **GitHub Pages**：工作流构建步骤自动执行 `cp dist/index.html dist/404.html`，404 时优雅回退至单页路由；
   - **Vercel**：根目录内置 `vercel.json`，配置全局 rewrites 规则；
   - **Netlify & Cloudflare Pages**：`public/_redirects` 声明 `/* /index.html 200`，构建后自动生效。

---

### 方案一：GitHub Actions 自动化 CI/CD（自动打包并发布至 gh-pages 分支）

这是最推荐的代码托管与静态发布方案。只需将代码 push 到 GitHub，GitHub Actions 云端机器就会自动执行依赖安装、相对路径打包，并将产物独立推送到专用的 `gh-pages` 分支，由 GitHub Pages 全球 CDN 提供免费加速。

#### 1. 工作流程运行架构图
```text
┌─────────────────┐       ┌────────────────────────┐       ┌───────────────────────┐
│  本地 git push  │ ────> │  触发 GitHub Actions   │ ────> │  自动化构建容器       │
│  分支: main     │       │  .github/workflows/    │       │  • actions/setup-node │
└─────────────────┘       │  deploy.yml            │       │  • npm install        │
                          └────────────────────────┘       │  • npx vite build     │
                                                           │  • cp 404.html 兜底   │
                                                           └───────────┬───────────┘
                                                                       │
                                  ┌────────────────────────────────────┘
                                  ▼
                     ┌────────────────────────┐       ┌───────────────────────┐
                     │ 自动强制推送构建产物   │ ────> │ 开启 GitHub Pages     │
                     │ 至分支: gh-pages       │       │ 全球免费 CDN 极速上线 │
                     └────────────────────────┘       └───────────────────────┘
```

#### 2. 工作流配置文件解析（已内置于 `.github/workflows/deploy.yml`）
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main
      - master
  workflow_dispatch: # 支持在 GitHub 网页后台手动点击一键触发

# 赋予 GitHub Actions 机器人推送至 gh-pages 分支所需的写权限
permissions:
  contents: write
  pages: write
  id-token: write

# 保证同一时间只有一个部署任务运行，避免并发冲突
concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: 检出代码 (Checkout repository)
        uses: actions/checkout@v4

      - name: 设置 Node.js 环境 (Setup Node.js)
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: 安装项目依赖 (Install dependencies)
        run: npm ci || npm install

      - name: 相对路径静态打包 (Build with relative paths)
        run: npx vite build

      - name: 复制 404 兜底文件 (SPA Fallback for GitHub Pages)
        # 将 index.html 复制为 404.html，彻底解决 GitHub Pages 子路由刷新 404 的顽疾
        run: cp dist/index.html dist/404.html

      - name: 推送至 gh-pages 分支并发布 (Push to gh-pages branch)
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
          publish_branch: gh-pages
          force_orphan: true
          commit_message: "deploy: deploy application to gh-pages [skip ci]"
```

#### 3. 首次部署必须配置的关键权限（新手避坑必看 ⚠️）

为了让 GitHub Actions 能够自动创建并推送代码到 `gh-pages` 分支，必须开启仓库的写入权限：

1. 打开你的 GitHub 仓库主页；
2. 点击顶部导航栏的 **Settings**（仓库设置）；
3. 在左侧侧边栏中点击 **Actions** -> **General**；
4. 滚动到页面最底部的 **Workflow permissions**（工作流权限）区域；
5. 勾选 **Read and write permissions**（读写权限）；
6. 勾选下方 **Allow GitHub Actions to create and approve pull requests**；
7. 点击 **Save**（保存生效）。

> ⚠️ **如果不配置此权限**，Actions 运行到最后一步时会提示 `remote: Permission to <repo> denied to github-actions[bot]` 报错并中断。

#### 4. 配置 GitHub Pages 服务来源（仅需一次）

1. 当你首次将代码推送到 `main` 分支后，进入仓库顶部的 **Actions** 标签页，等待流水线显示绿色对勾（运行成功）；
2. 此时仓库中已由 Actions 自动创建好了名为 **`gh-pages`** 的纯静态分支；
3. 进入 **Settings** -> 左侧点击 **Pages**；
4. 在 **Build and deployment** 下的 **Source** 下拉框中，选择 **Deploy from a branch**；
5. **Branch**（分支）选择 **`gh-pages`**，目录保持 **`/ (root)`**；
6. 点击右侧的 **Save** 按钮保存；
7. 等待 1~2 分钟，刷新该页面，顶部就会显示绿色提示栏：
   > *"Your site is live at https://你的用户名.github.io/你的仓库名/"*

#### 5. 日常使用方式
日常开发中，你无需任何手动打包操作，只需像平常一样写代码：
```bash
git add .
git commit -m "update: 添加新功能"
git push origin main
```
推送成功后，GitHub Actions 就会在 1 分钟内自动完成打包、404 兜底注入与全网更新！

---

### 方案二：Cloudflare Pages 前端部署（https://dash.cloudflare.com/ 网页控制台）

Cloudflare Pages 依托于覆盖全球 300+ 城市的 Anycast 边缘网络，拥有极高的访问速度和**完全不限流量、不限请求次数**的永久免费特权。

#### 1. 方式 A：在 https://dash.cloudflare.com/ 连接 GitHub 仓库自动部署（最推荐）

1. **登录控制台**：打开并登录 [Cloudflare Dashboard (https://dash.cloudflare.com/)](https://dash.cloudflare.com/)；
2. **创建 Pages 应用**：
   - 在左侧主菜单中点击 **Workers & Pages** -> 点击右上角的 **Create application**；
   - 切换到 **Pages** 选项卡 -> 点击 **Connect to Git**；
3. **关联仓库与分支**：授权 GitHub 账号，并在列表中选中本仓库，点击 **Begin setup**；
4. **填写构建配置参数**：
   - **Project name（项目名称）**：填入你喜欢的名称（例如 `htmlshare`）；
   - **Production branch（生产分支）**：选择 `main`；
   - **Framework preset（框架预设）**：下拉选择 **`Vite`**；
   - **Build command（构建命令）**：填入 `npx vite build`；
   - **Build output directory（构建输出目录）**：填入 `dist`；
   - **Root directory（根目录）**：留空即可；
5. **保存并部署**：
   - 点击底部的 **Save and Deploy** 按钮；
   - Cloudflare 会自动拉取代码构建，约 30~60 秒即可部署成功，自动生成 `https://<项目名>.pages.dev` 免费全球访问域名！

#### 2. 方式 B：在 https://dash.cloudflare.com/ 网页端直接拖拽 Direct Upload 部署（零 Git 仓库要求）

1. **本地打包**：
   ```bash
   npm run build
   ```
   本地项目根目录下会生成一个静态产物文件夹 **`dist`**；
2. **在 Cloudflare 网页端上传**：
   - 打开 [Cloudflare 控制台 (https://dash.cloudflare.com/)](https://dash.cloudflare.com/) -> 进入 **Workers & Pages** -> 点击 **Create application**；
   - 选择 **Pages** 选项卡 -> 点击 **Upload assets**（直接上传资产）；
   - 输入项目名称（如 `htmlshare-direct`），点击 **Create project**；
   - 将本地的 **`dist` 文件夹直接拖拽**到网页上传框中；
   - 点击 **Deploy site**，几秒钟即可完成全球节点分发上线！

---

### 方案三：Cloudflare 全栈 Serverless 部署（Worker + D1 数据库 + KV 缓存）

采用 **D1 关系型 SQLite 数据库 + KV 边缘极速缓存** 的双引擎架构，实现全栈免运维上线：

#### 1. 创建 D1 数据库与执行建表 SQL：
1. 登录 [Cloudflare 控制台 (https://dash.cloudflare.com/)](https://dash.cloudflare.com/)；
2. 在左侧菜单点击 **Storage & Databases** -> **D1**；
3. 点击 **Create database**，输入名称 `htmlshare_d1`，点击创建；
4. 进入该数据库详情页，点击顶部 **Console** 控制台标签页；
5. 将根目录 `schema.sql` 中的全部 SQL 粘贴进去，点击 **Execute** 执行建表。

#### 2. 创建 KV 命名空间：
1. 左侧菜单点击 **Storage & Databases** -> **KV**；
2. 点击 **Create namespace**，输入名称 `KV_SNIPPETS`，点击保存。

#### 3. 创建 Worker 服务与代码上线：
1. 左侧菜单点击 **Workers & Pages** -> **Create application** -> **Workers**；
2. 命名为 `htmlshare-api`，先点击 **Deploy** 生成初始 Worker；
3. 点击右上角 **Edit code** 进入在线 Web IDE，将根目录 `worker.js` 代码全部粘贴覆盖进去，点击 **Save and deploy**；
4. 进入 Worker 的 **Settings -> Bindings**（绑定）：
   - **绑定 D1**：添加 D1 绑定，变量名严格填写大写的 **`DB`**，选择 `htmlshare_d1`；
   - **绑定 KV**：添加 KV 绑定，变量名严格填写大写的 **`KV_SNIPPETS`**，选择 `KV_SNIPPETS`；
5. 点击保存后，后端 Worker API 即可正常运行！

#### 4. 前端与 Worker 建立同域通信（彻底消除跨域）：
在项目的 `public/_redirects` 中加入反向代理规则：
```text
/api/*  https://htmlshare-api.你的子域.workers.dev/api/:splat  200
/raw/*  https://htmlshare-api.你的子域.workers.dev/raw/:splat  200
/*      /index.html                                            200
```
前端发起 `/api/*` 请求时，Cloudflare 边缘节点会自动反向代理到 Worker，彻底避免跨域 CORS 烦恼！

---

### 方案四：Vercel 标准化极速部署（SPA 路由重写 + 全球 Anycast CDN）

1. 打开 [Vercel 官网 (vercel.com)](https://vercel.com/) 并使用 GitHub 账号登录；
2. 点击右上角 **Add New...** -> 选择 **Project**；
3. 找到你的仓库，点击 **Import**；
4. 确认参数：**Framework Preset** 选择 `Vite`，**Build Command** 保持 `npm run build`，**Output Directory** 保持 `dist`；
5. 点击 **Deploy**，30 秒即可获得带免费 SSL 证书的永久二级域名！本项目已内置 `vercel.json`，任何路由刷新均不会 404。

---

### 方案五：Netlify 极速部署（Git 自动构建与 Netlify Drop 网页拖拽）

#### 方式 A：GitHub 仓库关联构建
1. 登录 [Netlify 官网 (netlify.com)](https://www.netlify.com/)，点击 **Add new site** -> **Import an existing project**；
2. 授权 GitHub 并选中你的仓库，**Build command** 填入 `npx vite build`，**Publish directory** 填入 `dist`；
3. 点击 **Deploy** 即可上线。

#### 方式 B：Netlify Drop 网页拖拽秒级发布
1. 本地执行 `npm run build` 生成 `dist` 文件夹；
2. 打开 [Netlify Drop (app.netlify.com/drop)](https://app.netlify.com/drop)；
3. 把 `dist` 文件夹直接拖拽到虚线框中，5 秒钟即刻生成线上访问网址！

---

### 方案六：全栈 Node.js / Docker 容器化部署

如果你想运行自带的 Express 后端，享受服务端代码抓取与本地 JSON 数据库功能：

#### 常规服务器启动：
```bash
# 构建全栈产物（Vite前端 + esbuild后端）
npm run build

# 启动全栈生产环境（监听 3000 端口）
npm start
```

#### Docker 容器化部署：
在根目录创建 `Dockerfile`：
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/server.cjs"]
```
构建并运行容器：
```bash
docker build -t htmlshare-app .
docker run -d -p 3000:3000 --name htmlshare htmlshare-app
```

---

### 📊 附录：四大主流平台部署与路径兼容性对照表

| 平台特性 / 指标 | GitHub Pages | Vercel | Netlify | Cloudflare Pages |
| :--- | :--- | :--- | :--- | :--- |
| **托管类型** | 纯静态资源托管 | 静态 + Serverless | 静态 + Edge Functions | 静态 + Workers Serverless |
| **构建命令** | `npx vite build` | `npx vite build` | `npx vite build` | `npx vite build` |
| **输出目录** | `dist` | `dist` | `dist` | `dist` |
| **路径基准 (Base Path)** | `base: './'` (零配置兼容子路径) | `base: './'` 或 `/` | `base: './'` 或 `/` | `base: './'` 或 `/` |
| **单页刷新 (SPA 404 兜底)** | `cp dist/index.html dist/404.html` | `vercel.json` rewrites | `public/_redirects` | `public/_redirects` |
| **部署触发方式** | `git push` 自动触发 Actions | `git push` / CLI 一键推送 | `git push` / Drop 网页拖拽 | `git push` / Wrangler CLI |
| **自定义域名支持** | 支持 (CNAME) | 支持 (免费 Anycast DNS) | 支持 (带 DNS 管理) | 支持 (Cloudflare 深度联动) |
| **免费 SSL 证书** | 自动 Let's Encrypt | 自动 Let's Encrypt | 自动 Let's Encrypt | 自动 Universal SSL / Anycast |
| **月度免费额度** | 100GB 带宽 / 2000 Actions 分钟 | 100GB 带宽 / 无限请求 | 100GB 带宽 / 300 构建分钟 | **完全无限流量 / 无限请求** |

---

## 🔐 后台数据管理权限与安全体系

1. **默认管理员凭证**：
   - 默认账号：`admin`
   - 默认密码：`123456`
   - 可在环境变量中设置 `ADMIN_USERNAME` 与 `ADMIN_PASSWORD` 自定义。
2. **免明文防泄漏规范**：
   - **登录界面**：密码输入组件强制使用 `type="password"` 掩码保护，字符即时打码（显示为 `••••••`），杜绝明文泄露；
   - **登出操作**：提供明确的「退出登录」按钮，点击后立即撤销客户端 `sessionStorage` 会话 Token，清空内存凭据；
   - **片段密码维护**：后台编辑片段访问密码时同样使用密码掩码输入框，全链路杜绝明文暴露。
3. **接口级中间件鉴权**：
   - 服务端使用 `requireAdminAuth` 中间件拦截所有 `/api/admin/*` 请求；
   - 请求必须携带 `Authorization: Bearer <token>` 请求头，非法访问统一返回 `401 Unauthorized`。

---

## ⚠️ 开发者踩坑指南与常见问题 (FAQ 汇总)

### 坑 1：GitHub Pages 部署后页面空白，控制台一堆 404 错误
- **原因**：GitHub Pages 默认托管在子目录（例如 `username.github.io/repo-name/`）。如果 Vite 打包使用的是绝对路径 `/assets/index.js`，浏览器会向根域名 `username.github.io/assets/index.js` 发送请求，导致找不到文件。
- **解决方案**：在 `vite.config.ts` 中明确加上 `base: './'`。本项目已预先配置好，无论部署在根目录还是任意多级子目录下，资源都能通过相对路径安全加载！

### 坑 2：直接在前端使用 `fetch()` 抓取 GitHub 链接报 CORS 跨域错误
- **原因**：浏览器的同源策略（Same-Origin Policy）会拦截绝大多数跨域请求。直接在浏览器中使用 `fetch('https://raw.githubusercontent.com/...')` 会被目标服务器拦截。
- **解决方案**：本项目设计了服务端中转代理接口 `/api/fetch-url`。由 Node.js / Worker 服务端向目标地址发起请求获取内容再返回给前端，彻底绕过浏览器的同源策略。

### 坑 3：预览区 `<iframe>` 运行用户自定义代码时无限循环卡死主页面
- **原因**：用户输入的 JS 代码若包含 `while(true)` 或频繁触发渲染，可能直接导致主网页线程崩溃。
- **解决方案**：本项目在 `PreviewPanel.tsx` 中为 `<iframe>` 施加了严格的 `sandbox="allow-scripts allow-modals allow-forms"` 属性限制，隔离执行上下文；同时提供了重置与重新加载机制。

### 坑 4：单页应用（SPA）部署后，刷新页面报 404 Not Found
- **原因**：静态托管服务器在收到 `/s/my-slug` 请求时，会试图在硬盘上寻找 `dist/s/my-slug` 文件夹，找不到就会报错。
- **解决方案**：
  - **GitHub Pages**：工作流脚本中自动执行 `cp dist/index.html dist/404.html`，404 时自动兜底回 `index.html`；
  - **Vercel**：配置 `vercel.json` rewrites；
  - **Netlify & Cloudflare Pages**：配置 `public/_redirects`。

### 坑 5：手机端输入代码时光标乱跳或页面被自动放大
- **原因**：iOS Safari 在输入框字体小于 16px 时，点击输入框会自动缩放整个网页页面。
- **解决方案**：在 `index.html` 的 meta viewport 中添加 `maximum-scale=1.0, user-scalable=no, viewport-fit=cover`，并在移动端针对输入控件设置最佳字号，彻底解决乱缩放体验。

### 坑 6：Cloudflare Worker 部署报错 `WorkerResource.getWorkerResult: response missing default_environment.script`
- **原因分析**：
  1. 在 Cloudflare Dashboard 网页端新建 Worker 时，创建了空白 Worker 但**从未在在线编辑器中点击过一次「Save and deploy」保存初始脚本**，此时 Worker 处于缺少脚本实体的空壳状态；
  2. 或者在 Cloudflare Worker 构建页面中，构建命令填写了 `bun run build`，或者部署命令没有指定入口文件。
- **一秒修复方案**：
  - **方案 A（如果是部署前端网页）**：在 Cloudflare 控制台选择 **Pages**（不要选 Workers），框架选 Vite，输出目录填 `dist` 即可秒级上线；
  - **方案 B（如果是部署 Worker 后端）**：进入该 Worker 详情页 -> 点击右上角 **Edit code** -> 将根目录 `worker.js` 代码粘贴进去并点击 **Save and deploy**，脚本实体即刻生成，随后再去绑定 D1 和 KV。

### 坑 7：Cloudflare Worker 报 `Cannot read properties of undefined (reading 'prepare')`
- **原因**：Worker 代码中通过 `env.DB` 读取数据库，但环境变量里绑定的名称不一致。
- **解决**：进入 Worker 的 **Settings -> Bindings**，确认 D1 数据库绑定的变量名严格为全大写的 **`DB`**（区分大小写），KV 绑定的变量名严格为全大写的 **`KV_SNIPPETS`**。

### 坑 8：GitHub Actions 推送 `gh-pages` 时报 `Permission to <repo> denied to github-actions[bot]`
- **原因**：GitHub 仓库默认关闭了 Actions 工作流对仓库分支的写入权限。
- **解决**：进入仓库 **Settings -> Actions -> General -> Workflow permissions**，勾选 **Read and write permissions** 并保存即可。

---

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 开源协议，欢迎自由修改、派生与商业化使用。
如有帮助，欢迎在 GitHub 上点一个 ⭐ Star 支持一下！

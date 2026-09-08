# 🚀 HTMLShare - 现代化 HTML 在线代码托管与实时分享平台

<p align="center">
  <b>极简 · 零门槛 · 跨平台 · 高颜值</b><br>
  编写、实时预览、代码格式化、多源导入、一键生成永久分享短链与全平台无缝部署。
</p>

---

## 📖 目录

- [✨ 核心功能特色](#-核心功能特色)
- [📂 完整的项目文件结构与作用详解](#-完整的项目文件结构与作用详解)
  - [1. 根目录核心配置文件](#1-根目录核心配置文件)
  - [2. 自动化部署工作流 (.github/workflows)](#2-自动化部署工作流-githubworkflows)
  - [3. 前端源代码目录 (src/)](#3-前端源代码目录-src)
  - [4. 前端核心组件 (src/components/)](#4-前端核心组件-srccomponents)
  - [5. 辅助工具与默认数据 (src/utils/ 与 src/constants/)](#5-辅助工具与默认数据-srcutils-与-srcconstants)
  - [6. 后台数据存储 (data/)](#6-后台数据存储-data)
- [📱 移动端自适应优化](#-移动端自适应优化)
- [🛠️ 本地开发与快速上手](#️-本地开发与快速上手)
- [🌐 多平台部署指南（小白教程）](#-多平台部署指南小白教程)
  - [方案一：GitHub Pages 自动化部署（内置 GitHub Actions 工作流）](#方案一github-pages-自动化部署内置-github-actions-工作流)
  - [方案二：Cloudflare Pages 静态与 Worker 部署](#方案二cloudflare-pages-静态与-worker-部署)
  - [方案三：Vercel 一键部署](#方案三vercel-一键部署)
  - [方案四：Netlify 极速部署](#方案四netlify-极速部署)
  - [方案五：全栈 Node.js / Docker 容器部署](#方案五全栈-nodejs--docker-容器部署)
- [⚠️ 开发者踩坑指南与常见问题 (FAQ)](#️-开发者踩坑指南与常见问题-faq)
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

## 📂 完整的项目文件结构与作用详解

本项目采用 **现代化前后端一体化（Full-Stack）** 架构，前端使用 **React 19 + Vite 6 + Tailwind CSS v4**，后端使用 **Express + TypeScript**，结构清晰，职责分明：

```text
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions 自动化构建并推送到 gh-pages 分支的流水线
├── data/
│   └── htmlshare_db.json         # 服务端轻量级 JSON 数据库（保存已发布的片段及浏览量）
├── src/
│   ├── components/               # 前端 UI 组件目录
│   │   ├── AIAssistantModal.tsx  # AI 智能助手弹窗（代码优化/重构建议）
│   │   ├── CloudflareModal.tsx   # Cloudflare D1/KV 配置与 Worker 部署指南弹窗
│   │   ├── CodeEditor.tsx        # 三栏代码编辑器（含 Prettier 一键美化与行统计）
│   │   ├── Header.tsx            # 顶部导航栏（主题切换、新建、导入、后台管理、分享按钮）
│   │   ├── ImportCodeModal.tsx   # 多源导入弹窗（URL拉取、直贴解析、文件上传与短链生成）
│   │   ├── MySnippetsModal.tsx   # 后台数据管理中心（片段检索、Fork、删除、统计）
│   │   ├── PasscodeModal.tsx     # 访问密码输入验证弹窗
│   │   ├── PreviewPanel.tsx      # 实时沙箱预览面板（含设备尺寸切换、控制台与全屏）
│   │   ├── PublishModal.tsx      # 代码保存与发布配置弹窗（自定义短链、有效期、加密）
│   │   └── ShareModal.tsx        # 分享完成弹窗（二维码、iframe嵌入代码、ZIP打包下载）
│   ├── constants/
│   │   └── defaultSnippet.ts     # 默认初始工作区示例模板
│   ├── utils/
│   │   └── htmlParser.ts         # HTML 智能拆分工具（解析抽取 <style>、<script> 与 body）
│   ├── App.tsx                   # 顶层应用组件（全局状态协调、移动端视图分发与路由监听）
│   ├── index.css                 # 全局 Tailwind CSS 样式文件与动态主题变量定义
│   ├── main.tsx                  # React 应用程序挂载入口点
│   └── types.ts                  # 全局 TypeScript 接口类型定义
├── .env.example                  # 环境变量声明模板（GEMINI_API_KEY 等）
├── index.html                    # 网站 HTML 模板骨架与 SEO Meta 头信息配置
├── metadata.json                 # 项目元数据配置文件
├── package.json                  # 项目依赖库清单与运行脚本定义
├── schema.sql                    # Cloudflare D1 关系型 SQLite 数据库一键建表脚本
├── server.ts                     # 后端 Express 服务器（API、短链转发、URL拉取代理）
├── tsconfig.json                 # TypeScript 编译配置
├── vite.config.ts                # Vite 静态打包与前端构建配置（已配置相对路径 base: './'）
├── worker.js                     # 完整的 Cloudflare Worker 生产环境部署代码模板（D1+KV）
└── wrangler.jsonc                # Cloudflare 官方配置文件（Worker名称、D1/KV资源绑定）
```

---

### 1. 根目录核心配置文件

- **`wrangler.jsonc`**：
  - **核心作用**：Cloudflare 官方标准的工程化配置文件。
  - **关键作用**：负责声明部署的 Worker 名称、入口文件（`worker.js`），并完成 **Cloudflare D1 关系型数据库 (`DB`)** 与 **Cloudflare KV 键值缓存空间 (`KV_SNIPPETS`)** 的环境绑定，无需手动在后台复杂关联。
- **`worker.js`**：
  - **核心作用**：轻量独立、生产就绪的 Cloudflare Serverless Worker 完整代码。
  - **运行逻辑**：
    - 全面支持全局 CORS 跨域，并提供 `/api/snippets`、`/api/explore` 等 REST 接口；
    - 针对 `/raw/:slug` 原生渲染页面，优先从 KV 边缘缓存直出毫秒级 HTML；
    - KV 未命中时回源查询 D1 关系型 SQLite 数据库，并使用 `ctx.waitUntil` 异步递增访问量。
- **`schema.sql`**：
  - **核心作用**：Cloudflare D1 关系数据库的建表 SQL。
  - **使用方式**：直接执行 `npx wrangler d1 execute htmlshare_d1 --file=./schema.sql --remote` 即可秒级完成表结构初始化。
- **`vite.config.ts`**：
  - **核心作用**：Vite 的打包配置文件。
  - **关键配置**：设置了 `base: './'`（相对路径模式）。这是项目能顺利在 **GitHub Pages 子路径**（如 `https://用户名.github.io/仓库名/`）下正常加载 JS/CSS 资源、不产生 404 错误的核心关键！
- **`server.ts`**：
  - **核心作用**：全栈环境下的 Express 后端服务器。
  - **主要接口**：
    - `POST /api/fetch-url`：接收前端发送的外部代码链接，服务端代为抓取并自动将 GitHub `blob` 页面链接转换为 `raw.githubusercontent.com`，彻底消除跨域限制；
    - `POST /generate`：支持直接生成永久短链；
    - `GET /p/:code` / `GET /s/:slug`：永久页面访问与预览；
    - `GET /raw/:slug`：输出干净、可直接运行的原生 HTML 文档；
    - `POST /api/snippets`：保存或更新代码片段数据。
- **`package.json`**：
  - **核心作用**：记录项目所需的第三方 npm 依赖包与执行脚本。
  - **核心脚本**：
    - `"dev"`: 使用 `tsx server.ts` 启动本地前后端协同开发模式（端口 3000）；
    - `"build"`: 先执行 Vite 打包前端到 `dist/`，再使用 esbuild 打包后端到 `dist/server.cjs`；
    - `"start"`: 启动编译完成的生产环境全栈服务；
    - `"lint"`: 运行 TypeScript 语法类型检查。
- **`index.html`**：
  - **核心作用**：单页应用的 HTML 容器入口。
  - **适配优化**：配置了 `viewport-fit=cover` 与严格移动端视口，保证在 iOS 底部横条和刘海屏下完美排版，不会产生乱缩放。
- **`.env.example`**：
  - 声明环境变量。如需启用 Gemini AI 智能分析与重构功能，可配置 `GEMINI_API_KEY`。

---

### 2. 自动化部署工作流 (`.github/workflows/deploy.yml`)

- **核心作用**：通过 GitHub 官方的 GitHub Actions 机制，实现 **「推送代码即可全自动完成打包并发布到 GitHub Pages」**。
- **工作机制**：
  1. 当代码推送到 `main` 或 `master` 分支时自动触发；
  2. 在云端服务器配置 Node.js 20 环境并安装项目依赖；
  3. 执行 `npx vite build` 按照相对路径打包生成 `dist/` 文件夹；
  4. 自动生成 `404.html` 保证单页应用路由在刷新时不丢失；
  5. 自动把打包产物推送至仓库专用的 `gh-pages` 分支，即刻生效！

---

### 3. 前端源代码目录 (`src/`)

- **`src/App.tsx`**：
  - **核心作用**：整个系统的主控大脑。
  - **状态管理**：统筹管理当前的 HTML、CSS、JS 代码状态、当前片段的标题/描述/自定义短链、主题模式（深色/浅色/高对比度）以及各弹窗的开关。
  - **移动端分发**：根据屏幕大小动态切换单栏模式（纯代码编辑、纯预览、上下分屏）与双栏桌面布局。
- **`src/types.ts`**：
  - **核心作用**：统一定义数据格式。规范了代码片段对象（`Snippet`）、AI 响应格式（`AIGenerateResponse`）、主题类型（`ThemeMode`）等。
- **`src/index.css`**：
  - **核心作用**：Tailwind CSS 导入以及基于 CSS 变量的色彩主题定义。通过改变 `data-theme` 属性无刷新更改界面全局主色、文字色、阴影与边框色。
- **`src/main.tsx`**：
  - **核心作用**：调用 `ReactDOM.createRoot` 将 `App` 组件挂载至页面的 `#root` 节点。

---

### 4. 前端核心组件 (`src/components/`)

- **`Header.tsx`**：
  - 顶部主工具栏，包含项目徽章、主题切换下拉菜单、新建按钮、导入/从 URL 按钮、片段库/后台管理入口、AI 助手呼出键以及保存/分享主按钮。在不同分辨率下能自动折叠或简化文本，防止溢出。
- **`CodeEditor.tsx`**：
  - 多语言代码编辑器。顶部提供 HTML / CSS / JS 选项卡切换，内建 **「一键美化代码」** 按钮，利用 Prettier 智能格式化缩进；带有动态行数统计与一键清空重置。
- **`PreviewPanel.tsx`**：
  - 实时渲染沙箱。通过内嵌的 `<iframe>` 即时合成 HTML、CSS 与 JS 代码；支持常见设备分辨率缩放测试（桌面、平板、移动端）、一键全屏、重载刷新及内置调试控制台日志显示。
- **`ImportCodeModal.tsx`**：
  - 导入与永久短链弹窗。整合了 **URL 拉取**、**代码粘贴** 与 **本地文件拖拽上传** 3 大通道，支持智能拆解提取，并支持一键生成永久托管短链。
- **`PublishModal.tsx`**：
  - 发布配置中心。用户在分享前可自定义短链别名（如 `/s/my-app`）、选择是否公开、设置有效时长（如 1 小时、1 天、7 天或永久）以及设置保护密码。
- **`ShareModal.tsx`**：
  - 分享落地卡片。提供分享短链的快速复制、原生全屏直链、网页嵌入 `<iframe src="...">` 标签、动态二维码生成以及代码一键打包导出为 `.zip` 压缩文件。
- **`MySnippetsModal.tsx`**：
  - 后台数据管理中心。包含公共片段探索（广场模式）与后台管理员维护两种视图。
  - **权限控制**：后台数据管理全面接入管理员鉴权体系（默认账号 `admin`，默认密码 `123456`，可在后端通过环境变量配置）。
  - **安全防泄漏**：登录与登出页面严格使用掩码密码框保护，任何界面和日志中均不展示明文密码；登出后彻底清除内存与客户端会话 Token。
  - **管理功能**：查看总记录数/访问量/存储占用统计、整库 JSON 导出备份、数据合并/覆盖导入、清理过期临时短链、全局片段元数据编辑与彻底删除。
- **`PasscodeModal.tsx`**：
  - 密码解锁模态框。当访问带密码保护的代码片段时自动弹出，校验正确方可载入源码。
- **`AIAssistantModal.tsx`**：
  - AI 辅助工具。支持向服务端大模型发起请求，对当前编辑区代码进行性能瓶颈检查、语义化重构及代码美化。
- **`CloudflareModal.tsx`**：
  - 数据库与无服务器 Worker 部署助手。提供配套的 Cloudflare D1 SQL 建表语句和 Worker 脚本模板，方便用户迁移到 Cloudflare 生态。

---

### 5. 辅助工具与默认数据 (`src/utils/` 与 `src/constants/`)

- **`src/utils/htmlParser.ts`**：
  - **核心作用**：智能 HTML 解析器。
  - **功能**：当用户传入一个完整的 HTML 单文件（如从外部下载的网页）时，本工具会通过 DOMParser 智能分离出 `<style>` 标签内的 CSS、`<script>` 标签内的 JS 以及 `<body>` 内的 DOM 元素，将它们自动填入对应的分栏中。
- **`src/constants/defaultSnippet.ts`**：
  - **核心作用**：定义新手首次进入工作区时的轻量卡片模板，包含基本的按钮互动与浮动特效，演示三栏协同效果。

---

### 6. 后台数据存储 (`data/`)

- **`data/htmlshare_db.json`**：
  - **核心作用**：轻量级本地 JSON 数据库。保存用户生成的短链、片段详情、密码哈希及浏览统计，实现开发与轻量生产环境下免安装大型数据库开箱即用。

---

## 🔐 后台数据管理权限与安全体系

为了防止未授权访客随意篡改、删除或批量导出系统数据，本项目后台数据管理模块配置了严格的权限校验机制：

1. **默认管理员凭证**：
   - 默认账号：`admin`
   - 默认密码：`123456`
   - 可在环境变量中设置 `ADMIN_USERNAME` 与 `ADMIN_PASSWORD` 自定义。
2. **免明文防泄漏规范**：
   - **登录界面**：密码输入组件强制使用 `type="password"` 掩码保护，字符即时打码（显示为 `••••••`），无明文显示切换，保护旁人偷窥；
   - **登出操作**：提供明确的「退出登录」操作按钮，点击后立即撤销客户端 `sessionStorage` 会话 Token，清空内存密码凭据，锁定后台面板；
   - **片段密码维护**：后台编辑片段访问密码时同样使用密码掩码输入框，全链路杜绝明文暴露。
3. **接口级中间件鉴权**：
   - 服务端使用 `requireAdminAuth` 中间件拦截所有 `/api/admin/*` 请求（包含统计、查询、删除、导入、导出、清理过期短链）；
   - 请求必须携带 `Authorization: Bearer <token>` 请求头，非法访问统一返回 `401 Unauthorized`。

---

## 📱 移动端自适应优化

为了确保在手机和平板上有优秀的体验，本项目做了多层次移动端适配：

1. **响应式视口保障**：`index.html` 增加 `viewport-fit=cover` 与 `maximum-scale=1.0`，杜绝输入代码时误触发页面缩放。
2. **三态触控底栏**：在小于 1024px（`< lg`）屏幕上，界面会自动隐藏双栏分屏，并在顶部展示切换按钮：
   - 💻 **代码编辑**：独占全屏高度，虚拟键盘弹起时不会遮挡预览；
   - 👁️ **实时预览**：一键切换到运行效果，全屏交互更直观；
   - ⬍ **上下分屏**：上半部分写代码，下半部分看实时效果。
3. **触控按钮防误触**：所有可点击控件在手机端保持至少 44px 的有效点击区域，并优化了触摸反馈动效。
4. **自适应导航栏**：小屏幕下自动折叠较长的文字描述（如 `AI 助手 / 代码优化` 自动缩减为 `AI`，`保存 & 生成短链` 缩减为 `分享`），避免工具栏挤压换行。

---

## 🛠️ 本地开发与快速上手

只需要安装 Node.js 18+ 环境：

```bash
# 1. 克隆代码仓库
git clone https://github.com/你的用户名/你的仓库名.git
cd 你的仓库名

# 2. 安装项目依赖
npm install

# 3. 启动本地全栈开发环境
npm run dev
```

启动后在浏览器打开 `http://localhost:3000` 即可开始使用！

---

## 🚀 生产部署全指南（GitHub Actions / Vercel / Netlify / Cloudflare Pages）

> 💡 **核心设计原则（零配置跨平台运行）**：
> 1. **为什么不需要担心子路径资源 404？**
>    - 本项目在 `vite.config.ts` 中设定了 `base: './'`（相对路径模式）。
>    - 绝大多数前端项目脚手架默认使用绝对路径 `/assets/xxx.js`，部署到 GitHub Pages 子路径（例如 `https://username.github.io/repo-name/`）时会导致所有 JS/CSS 资源找不到而整页白屏。
>    - 本项目通过相对路径模式，无论部署在**根域名**（如 Vercel/Netlify 自定义域名）还是**任意多级子目录**下，资源均能自动以当前 HTML 为基准完美加载！
> 2. **为什么单页应用 (SPA) 刷新不会 404？**
>    - 本项目已针对各平台内置了对应的重写规则：
>      - **GitHub Pages**：工作流构建步骤自动执行 `cp dist/index.html dist/404.html`，404 时优雅回退至单页路由；
>      - **Vercel**：根目录内置 `vercel.json`，配置全局 rewrites 规则；
>      - **Netlify & Cloudflare Pages**：`public/_redirects` 声明 `/* /index.html 200`，构建后自动打包生效。

---

### 方案一：GitHub Actions 自动化 CI/CD 工作流（一键打包并自动发布至 `gh-pages` 分支）

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

### 方案二：Vercel 标准化极速部署指南（SPA 路由重写 + 全球 Anycast CDN）

Vercel 是目前全球开发者最喜爱的现代化前端托管平台之一。具备全球边缘 CDN 加速、自动 HTTPS 证书申请、预览分支（Preview Deployments）以及毫秒级冷启动。

#### 1. 核心路由配置文件：`vercel.json`
本项目已在根目录预置了生产就绪的 `vercel.json` 配置文件：
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
- **配置作用**：由于本项目是基于 Vite 的单页应用（SPA），用户直接访问或在浏览器中刷新形如 `/s/my-component` 的深层 URL 时，静态服务器若没有找到对应的磁盘文件夹会抛出 404 错误。通过此 rewrites 规则，Vercel 会在底层将所有页面路由重定向到 `/index.html`，交由客户端路由接管并精准高保真渲染。

#### 2. 标准化部署步骤（4 步极速上线）

1. **登录并导入仓库**：
   - 打开 [Vercel 官网 (vercel.com)](https://vercel.com/) 并使用 GitHub 账号一键登录；
   - 点击右上角 **Add New...** -> 选择 **Project**；
   - 在仓库列表中找到你的 `htmlshare`（或你的项目名称）仓库，点击右侧的 **Import**（导入）。
2. **确认构建与输出设置（Build and Output Settings）**：
   - Vercel 会自动识别出 Vite 项目，确认以下默认参数即可：
     - **Framework Preset**: `Vite`
     - **Root Directory**: `./`（默认根目录）
     - **Build Command**: `npm run build` 或 `npx vite build`
     - **Output Directory**: `dist`
     - **Install Command**: `npm install`
3. **环境变量配置（Environment Variables，可选）**：
   - 若您需要在生产环境启用服务端 Gemini AI 助手增强，可在 **Environment Variables** 中添加：
     - `GEMINI_API_KEY`：你的 Google Gemini API 密钥；
   - 纯前端静态使用模式下无需配置任何环境变量，跳过此步即可。
4. **一键部署与上线**：
   - 点击底部蓝色的 **Deploy** 按钮；
   - 稍等 15~30 秒，构建成功后页面会升起庆祝彩带，并自动为你分配一个永久可用的免费 HTTPS 域名（例如 `https://htmlshare-xxx.vercel.app`）。

#### 3. 自定义域名绑定与路径验证
- **绑定自定义独立域名**：在项目主页点击 **Settings** -> **Domains**，输入你的专属域名（例如 `share.yourdomain.com`），按照 Vercel 提供的 DNS CNAME 记录在域名服务商处解析即可，Vercel 会在 1 分钟内自动完成全球 CDN 绑定与 SSL 证书签发。
- **路径与资源验证**：由于项目开启了 `base: './'`，无论在 Vercel 赠送的二级域名还是独立自定义顶级域名下，所有 JS/CSS 静态资源均以相对路径加载，网络面板返回 `200 OK`，没有任何 404 资源缺失。

---

### 方案三：Netlify 标准化极速部署指南（Git CI/CD 与拖拽即时上线）

Netlify 提供了极其便捷的前端自动化构建平台与即时分发网络。支持 Git 仓库代码推送自动触发构建，也支持无需任何命令行操作的浏览器端一键拖拽部署（Netlify Drop）。

#### 1. 核心单页路由配置文件：`public/_redirects`
本项目已在 `public/_redirects` 中预置了单页应用兼容规则：
```text
/*    /index.html   200
```
- **配置作用**：Vite 在执行打包（`npm run build`）时，会自动将 `public/` 目录下的所有文件原封不动复制到输出目录 `dist/` 的根部。当 Netlify 检测到根目录下的 `_redirects` 时，便会自动执行 SPA 路由重定向：无论用户访问 `/explore`、`/s/:slug` 还是任意路由，Netlify 均会以 HTTP 200 状态返回 `index.html`，彻底告别白屏和 404。

#### 2. 标准部署方式 A：通过 GitHub 仓库自动持续集成（推荐）

1. 登录 [Netlify 官网 (netlify.com)](https://www.netlify.com/)；
2. 点击 **Add new site** -> 选择 **Import an existing project**；
3. 选择 **Deploy with GitHub**，并在弹窗中授权 Netlify 读取你的项目仓库；
4. 选中你的 `htmlshare` 仓库，进入构建配置页，核对参数：
   - **Branch to deploy**: `main`
   - **Base directory**: 保持留空（默认根目录）
   - **Build command**: `npx vite build`
   - **Publish directory**: `dist`
5. 点击底部的 **Deploy htmlshare** 按钮；
6. 约 1 分钟后即可完成全网构建与上线，获得类似 `https://peaceful-xxx.netlify.app` 的访问地址。

#### 3. 标准部署方式 B：Netlify Drop 零命令行秒级拖拽部署（无 Git 环境亦可上线）

如果你不想连接 GitHub，或希望在本地快速打包后直接上线测试：
1. 在本地终端执行打包：
   ```bash
   npm run build
   ```
   打包完成后会在项目根目录生成一个纯静态的 **`dist/`** 文件夹；
2. 浏览器打开 [Netlify Drop 页面 (app.netlify.com/drop)](https://app.netlify.com/drop)；
3. 将本地的 **`dist` 文件夹直接拖拽到浏览器虚线框区域**；
4. 等待 5 秒钟文件上传完毕，Netlify 就会立即生成一条在线访问网址！

---

### 方案四：Cloudflare Pages 标准化前端边缘部署（https://dash.cloudflare.com/ 网页控制台部署）

Cloudflare Pages 依托于 Cloudflare 覆盖全球 300+ 城市的 Anycast 边缘网络，拥有极高的访问速度和**完全不限流量、不限请求次数**的永久免费特权。

#### 1. 方式 A：在 https://dash.cloudflare.com/ 网页控制台连接 GitHub 仓库自动部署（最推荐）

1. **登录控制台**：
   - 打开并登录 [Cloudflare Dashboard (https://dash.cloudflare.com/)](https://dash.cloudflare.com/)；
2. **创建 Pages 应用**：
   - 在左侧主菜单中点击 **Workers & Pages**（工作线程和页面）-> 点击右上角的 **Create application**（创建应用程序）；
   - 切换到 **Pages** 选项卡 -> 点击 **Connect to Git**（连接到 Git）；
3. **关联仓库与分支**：
   - 授权 GitHub 账号，并在仓库列表中选中本项目的仓库，点击 **Begin setup**（开始设置）；
4. **填写构建配置参数**：
   - **Project name（项目名称）**：填入你喜欢的名称（例如 `htmlshare`）；
   - **Production branch（生产分支）**：选择 `main`（或你的主分支）；
   - **Framework preset（框架预设）**：下拉选择 **`Vite`**；
   - **Build command（构建命令）**：填入 `npx vite build`；
   - **Build output directory（构建输出目录）**：填入 `dist`；
   - **Root directory（根目录）**：留空即可（代表项目根目录）；
5. **保存并部署**：
   - 点击底部的 **Save and Deploy**（保存并部署）按钮；
   - Cloudflare 会自动拉取代码并进行容器化构建，约 30~60 秒即可部署成功，自动生成 `https://<项目名>.pages.dev` 免费全球访问域名！

#### 2. 方式 B：在 https://dash.cloudflare.com/ 网页控制台直接拖拽 Direct Upload 部署（零 Git 仓库要求）

如果你本地没有配置 Git 仓库，或者希望直接将本地打包好的文件秒级发布到 Cloudflare：

1. **本地打包**：
   ```bash
   npm run build
   ```
   本地项目根目录下会生成一个静态产物文件夹 **`dist`**；
2. **在 Cloudflare 网页端上传**：
   - 打开 [Cloudflare 控制台 (https://dash.cloudflare.com/)](https://dash.cloudflare.com/) -> 进入 **Workers & Pages** -> 点击 **Create application**；
   - 选择 **Pages** 选项卡 -> 点击 **Upload assets**（直接上传资产）；
   - 输入项目名称（如 `htmlshare-direct`），点击 **Create project**；
   - 将本地的 **`dist` 文件夹或压缩包直接拖拽**到网页上传框中；
   - 点击 **Deploy site**，几秒钟即可完成全球节点分发上线！

#### 3. 方式 C：通过 Wrangler 命令行一键极速上传部署
如果你本地已安装了 Wrangler CLI，只需两条命令即可直推 Cloudflare Pages：
```bash
# 1. 静态打包
npm run build

# 2. 一键上传并部署至 Cloudflare Pages
npx wrangler pages deploy dist --project-name htmlshare
```

#### 4. 边缘反向代理 Worker（彻底免去跨域繁琐配置）
如果你同时部署了 Cloudflare Worker 后端（见下方方案五），可在 `public/_redirects` 中加入边缘代理规则，让 Cloudflare 边缘 CDN 自动将 API 请求同域转发给 Worker：
```text
/api/*   https://htmlshare-worker.<你的worker名>.workers.dev/api/:splat  200
/raw/*   https://htmlshare-worker.<你的worker名>.workers.dev/raw/:splat  200
/*       /index.html                                                     200
```
- **核心收益**：前端在页面中发起 `fetch('/api/snippets')` 时，直接请求当前网站同源域名，由 Cloudflare 边缘节点在毫秒级内反向代理到 Worker，彻底避免浏览器跨域 (CORS) 限制！

---

### 方案五：Cloudflare 全栈 Serverless 深度部署（Worker + D1 关系数据库 + KV 边缘缓存）

Cloudflare 提供全球 300+ 边缘节点的极速 CDN 与极其慷慨的免费配额（**0 元月费**即可支撑数十万次日常访问）。本项目已针对 Cloudflare 生态深度优化，采用 **D1 关系型数据库 + KV 边缘极速缓存** 的双引擎架构：

```text
                                 ┌───────────────┐
                                 │  用户终端访问  │
                                 └───────┬───────┘
                                         │
                        ┌────────────────┴────────────────┐
                        ▼                                 ▼
             【前端 HTML/CSS/JS 静态资源】      【后端 Serverless 业务请求】
             Cloudflare Pages 全球 CDN 加速    Cloudflare Worker 边缘函数计算
                                                          │
                                         ┌────────────────┴────────────────┐
                                         ▼                                 ▼
                             【KV_SNIPPETS (键值缓存)】         【DB: htmlshare_d1 (关系库)】
                             • 缓存已编译好的 /raw/:slug         • 永久保存 snippet 记录、标签
                             • 毫秒级极速直出，减轻 D1 压力      • 支持 SQL 查询、搜索、密码比对
```

#### 免费配额说明：
- **Cloudflare D1**：每天免费赠送 **5,000,000 次** 行读取、**100,000 次** 行写入，存储上限 5GB；
- **Cloudflare KV**：每天免费赠送 **100,000 次** 读取、**1,000 次** 写入，存储上限 1GB；
- **Cloudflare Workers**：每天免费赠送 **100,000 次** 边缘函数请求；
- **Cloudflare Pages**：每月无限次全球带宽与请求流量，无限次构建！

---

#### 路线 A：使用 Wrangler CLI 命令行一键极速部署（推荐，全流程仅需 2 分钟）

如果你本地安装了 Node.js，推荐使用 Cloudflare 官方的 `wrangler` 命令行进行自动化初始化与部署：

##### 1. 安装与登录 Wrangler
```bash
# 全局安装或使用 npx
npm install -g wrangler

# 登录你的 Cloudflare 账户（会自动唤起浏览器完成一键授权）
wrangler login
```

##### 2. 创建 D1 数据库与初始化数据表
```bash
# 创建名为 htmlshare_d1 的关系数据库
wrangler d1 create htmlshare_d1
```
终端会输出类似以下内容，**请复制并记录 `database_id`**：
```text
[[d1_databases]]
binding = "DB"
database_name = "htmlshare_d1"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

接下来在本地保存建表文件 `schema.sql`：
```sql
-- schema.sql: HTMLShare D1 表结构
CREATE TABLE IF NOT EXISTS snippets (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  html TEXT,
  css TEXT,
  js TEXT,
  is_public INTEGER DEFAULT 1,
  passcode TEXT,
  expires_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  forks_count INTEGER DEFAULT 0,
  forked_from TEXT,
  tags TEXT
);

CREATE INDEX IF NOT EXISTS idx_snippets_slug ON snippets(slug);
CREATE INDEX IF NOT EXISTS idx_snippets_created ON snippets(created_at DESC);
```

执行命令将表结构应用到 Cloudflare 远端生产数据库：
```bash
# 执行远端数据库初始化
wrangler d1 execute htmlshare_d1 --file=./schema.sql --remote
```

##### 3. 创建 Cloudflare KV 命名空间（用于页面边缘加速缓存）
```bash
# 创建生产环境 KV 命名空间
wrangler kv namespace create KV_SNIPPETS
```
终端会输出类似以下信息，**请复制并记录 KV 的 `id`**：
```text
[[kv_namespaces]]
binding = "KV_SNIPPETS"
id = "yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy"
```

##### 4. 配置 `wrangler.jsonc`（或 `wrangler.toml`）
在项目根目录新建或确认 `wrangler.jsonc`，将前面获取的 `database_id` 和 KV `id` 填入：
```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "htmlshare-worker",
  "main": "src/worker.js",
  "compatibility_date": "2026-09-01",
  // 绑定 D1 关系型数据库，代码中通过 env.DB 调用
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "htmlshare_d1",
      "database_id": "你的D1_DATABASE_ID"
    }
  ],
  // 绑定 KV 边缘极速缓存，代码中通过 env.KV_SNIPPETS 调用
  "kv_namespaces": [
    {
      "binding": "KV_SNIPPETS",
      "id": "你的KV_NAMESPACE_ID"
    }
  ]
}
```

##### 5. 准备 Worker 入口文件 `src/worker.js`
创建 `src/worker.js`，粘贴以下完整的 Serverless 处理逻辑（亦可直接点击应用顶部 **「Cloudflare D1/KV」** 按钮一键复制）：
```javascript
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname, searchParams } = url;

    // 允许跨域
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Snippet-Passcode",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const json = (data, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
      });

    try {
      // 1. 全球极速直出: /raw/:slug 或 /embed/:slug
      if (pathname.startsWith("/raw/") || pathname.startsWith("/embed/")) {
        const isEmbed = pathname.startsWith("/embed/");
        const slug = pathname.replace(isEmbed ? "/embed/" : "/raw/", "");
        const inputPasscode = searchParams.get("passcode") || request.headers.get("X-Snippet-Passcode") || "";

        // 优先从 KV 缓存获取
        const cacheKey = `html:${slug}`;
        let cached = await env.KV_SNIPPETS.get(cacheKey);

        // 未命中或有密码校验要求则查 D1
        const snippet = await env.DB.prepare("SELECT * FROM snippets WHERE slug = ? OR id = ?")
          .bind(slug, slug)
          .first();

        if (!snippet) {
          return new Response("404 - 代码片段不存在或已被清理", {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
          });
        }

        if (snippet.passcode && snippet.passcode.trim() && snippet.passcode !== inputPasscode) {
          return new Response("401 - 受密码保护的页面", {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
          });
        }

        // 异步递增浏览量
        ctx.waitUntil(
          env.DB.prepare("UPDATE snippets SET views = views + 1 WHERE id = ?")
            .bind(snippet.id)
            .run()
        );

        let fullHtml = cached;
        if (!fullHtml) {
          fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${snippet.title || 'HTMLShare'}</title><style>${snippet.css || ''}</style></head><body>${snippet.html || ''}<script>${snippet.js || ''}<\/script></body></html>`;
          if (!snippet.passcode) {
            // 写入 KV 缓存 1 小时
            ctx.waitUntil(env.KV_SNIPPETS.put(cacheKey, fullHtml, { expirationTtl: 3600 }));
          }
        }

        return new Response(fullHtml, {
          headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
        });
      }

      // 2. 读取片段详情: GET /api/snippets/:idOrSlug
      if (pathname.startsWith("/api/snippets/") && request.method === "GET") {
        const idOrSlug = pathname.replace("/api/snippets/", "");
        const inputPasscode = searchParams.get("passcode") || request.headers.get("X-Snippet-Passcode") || "";

        const snippet = await env.DB.prepare("SELECT * FROM snippets WHERE slug = ? OR id = ?")
          .bind(idOrSlug, idOrSlug)
          .first();

        if (!snippet) return json({ success: false, error: "代码片段不存在" }, 404);
        if (snippet.passcode && snippet.passcode.trim() && snippet.passcode !== inputPasscode) {
          return json({ success: false, error: "密码错误", requiresPasscode: true }, 401);
        }

        return json({
          success: true,
          data: {
            ...snippet,
            isPublic: Boolean(snippet.is_public),
            tags: snippet.tags ? JSON.parse(snippet.tags) : [],
          },
        });
      }

      // 3. 发布新代码: POST /api/snippets
      if (pathname === "/api/snippets" && request.method === "POST") {
        const body = await request.json();
        const id = crypto.randomUUID();
        const slug = body.slug?.trim() || Math.random().toString(36).substring(2, 8);
        const now = new Date().toISOString();

        const existing = await env.DB.prepare("SELECT id FROM snippets WHERE slug = ?").bind(slug).first();
        if (existing) return json({ success: false, error: "个性化短链接已被占用，请更换" }, 409);

        await env.DB.prepare(`
          INSERT INTO snippets (
            id, slug, title, description, html, css, js,
            is_public, passcode, expires_at, created_at, updated_at,
            views, forks_count, forked_from, tags
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
        `).bind(
          id, slug, body.title || "未命名代码", body.description || "",
          body.html || "", body.css || "", body.js || "",
          body.isPublic !== false ? 1 : 0, body.passcode || null,
          body.expiresAt || null, now, now, body.forkedFrom || null,
          JSON.stringify(body.tags || [])
        ).run();

        return json({ success: true, data: { id, slug, url: `${url.origin}/raw/${slug}` } });
      }

      // 4. 公开广场探索: GET /api/explore
      if (pathname === "/api/explore" && request.method === "GET") {
        const { results } = await env.DB.prepare(
          "SELECT id, slug, title, description, created_at, views, forks_count, tags FROM snippets WHERE is_public = 1 ORDER BY created_at DESC LIMIT 50"
        ).all();

        return json({
          success: true,
          data: results.map((r) => ({ ...r, tags: r.tags ? JSON.parse(r.tags) : [] })),
        });
      }

      return json({ success: true, message: "HTMLShare Cloudflare Worker API 正在正常运行" });
    } catch (err) {
      return json({ success: false, error: err.message }, 500);
    }
  }
};
```

##### 6. 一键部署后端 Worker
```bash
wrangler deploy
```
部署成功后，终端将立即生成一个类似 `https://htmlshare-worker.你的子域.workers.dev` 的在线 API 服务！

##### 7. 部署前端静态网站（Cloudflare Pages）
```bash
# 构建前端打包产物
npm run build

# 一键部署至 Cloudflare Pages
wrangler pages deploy dist --project-name htmlshare
```

---

#### 路线 B：Cloudflare 控制台 Web UI 可视化部署（无需安装本地工具）

如果你不希望在电脑安装 Node/CLI 环境，可以直接在 Cloudflare 网页后台点选完成：

##### 1. 创建 D1 数据库与执行建表 SQL：
1. 登录 [Cloudflare Dashboard 控制台](https://dash.cloudflare.com/)；
2. 在左侧侧边栏中点击 **Storage & Databases** -> **D1**；
3. 点击右上角 **Create database**，输入数据库名称：`htmlshare_d1`，点击 **Create**；
4. 进入刚刚创建的数据库详情页，点击顶部 **Console**（控制台）标签页；
5. 将上述 `schema.sql` 建表代码粘贴到 SQL 输入框中，点击 **Execute** 执行建表。

##### 2. 创建 KV 命名空间：
1. 左侧侧边栏点击 **Storage & Databases** -> **KV**；
2. 点击右上角 **Create namespace**，输入命名空间名称：`KV_SNIPPETS`，点击 **Add**。

##### 3. 创建 Worker 服务：
1. 左侧侧边栏点击 **Workers & Pages** -> **Create application**；
2. 选择 **Worker** 选项卡，点击 **Create Worker**；
3. 命名为 `htmlshare-api`，点击右下角 **Deploy**。

##### 4. 绑定 D1 与 KV 到 Worker（核心关键步骤）：
1. 在刚创建的 Worker 管理页面中，点击顶部 **Settings**（设置）选项卡；
2. 找到 **Bindings**（或 **Variables and Secrets**）模块：
   - **绑定 D1 数据库**：点击 **Add** -> 选择 **D1 database binding**：
     - **Variable name（变量名）**：必须严格填写大写的 **`DB`**；
     - **D1 database**：下拉选择刚才创建的 **`htmlshare_d1`**；
   - **绑定 KV 命名空间**：点击 **Add** -> 选择 **KV namespace binding**：
     - **Variable name（变量名）**：必须严格填写大写的 **`KV_SNIPPETS`**；
     - **KV namespace**：下拉选择刚才创建的 **`KV_SNIPPETS`**；
3. 点击 **Save and Deploy** 保存绑定关系。

##### 5. 粘贴并上线 Worker 代码：
1. 回到 Worker 的概览页面，点击右上角 **Edit code** 进入在线 Web IDE；
2. 将编辑器左侧的文件全部清空，粘贴前面给出的完整 `worker.js` 代码；
3. 点击右上角 **Deploy** 保存并部署；
4. 此时访问你 Worker 的默认二级域名（如 `https://htmlshare-api.xxx.workers.dev`），若返回 JSON 状态信息则说明部署大功告成！

##### 6. 部署前端 Pages 并建立通信：
1. 回到 **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**；
2. 关联你的 GitHub 仓库，配置构建命令为 `npx vite build`，输出目录为 `dist`；
3. **API 转发配置（解决跨域与同域访问）**：
   - 在项目的 `public/` 目录下添加 `_redirects` 文件，加入一行反向代理规则：
     ```text
     /api/*  https://htmlshare-api.你的子域.workers.dev/api/:splat  200
     /raw/*  https://htmlshare-api.你的子域.workers.dev/raw/:splat  200
     ```
   - 这样前端通过当前网站域名直接发起 `/api/...` 请求时，Cloudflare CDN 边缘节点会自动反向代理到 Worker，彻底免去跨域烦恼！

---

#### 💡 Cloudflare 部署排错与避坑指南（FAQ）：

- **Q1: 报错 `TypeError: Cannot read properties of undefined (reading 'prepare')`**
  - **原因**：Worker 代码中通过 `env.DB` 读取数据库，但 Cloudflare 环境变量里没有绑定名为 `DB` 的 D1 变量。
  - **解决**：进入 Worker 设置页面的 Bindings，检查 D1 绑定的变量名是否严格为全大写的 `DB`（区分大小写）。
- **Q2: 报错 `TypeError: Cannot read properties of undefined (reading 'get')`**
  - **原因**：KV 缓存命名空间未正确绑定。
  - **解决**：进入 Worker 设置页面的 Bindings，检查 KV 绑定的变量名是否为全大写的 `KV_SNIPPETS`。
- **Q3: 报错 `D1_ERROR: no such table: snippets`**
  - **原因**：D1 数据库尚未执行建表 SQL，或者之前执行时只在本地测试库运行而未在生产库运行。
  - **解决**：在 D1 Console 控制台里重新执行一遍 `schema.sql` 中的 `CREATE TABLE` 语句。
- **Q4: 为什么发布带密码的片段没有进入 KV 缓存？**
  - **机制说明**：为了安全起见，带有自定义访问密码的私密片段不会被缓存在公共边缘 KV 中，而是每次经过 D1 动态校验密码后方才放行，保障私密数据安全。

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

## ⚠️ 开发者踩坑指南与常见问题 (FAQ)

初学前端和部署项目时容易遇到以下典型问题，这里整理了解决方案：

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
- **原因**：静态托管服务器（如 GitHub Pages、Nginx 默认配置）在收到 `/s/my-slug` 请求时，会试图在硬盘上寻找 `dist/s/my-slug` 文件夹，找不到就会报错。
- **解决方案**：
  - **GitHub Pages**：工作流脚本中自动执行 `cp dist/index.html dist/404.html`，404 时自动兜底回 `index.html`，交由前端路由解析；
  - **Vercel**：配置 `vercel.json` rewrites；
  - **Netlify**：配置 `_redirects`。

### 坑 5：手机端输入代码时光标乱跳或页面被自动放大
- **原因**：iOS Safari 在输入框字体小于 16px 时，点击输入框会自动缩放整个网页页面。
- **解决方案**：在 `index.html` 的 meta viewport 中添加 `maximum-scale=1.0, user-scalable=no, viewport-fit=cover`，并在移动端针对输入控件设置最佳字号，彻底解决乱缩放体验。

---

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 开源协议，欢迎自由修改、派生与商业化使用。
如有帮助，欢迎在 GitHub 上点一个 ⭐ Star 支持一下！

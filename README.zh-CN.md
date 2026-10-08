# DocViewKit 官网

[English](https://github.com/docviewkit/website/blob/main/README.md) · [简体中文](https://github.com/docviewkit/website/blob/main/README.zh-CN.md)

**轻量预览，快速集成，融入每一种业务。**

DocViewKit 是面向 OA 附件、审批流程、后台管理、CRM/ERP、网盘和客户应用的文档预览组件，也适用于企业 SaaS、AI 知识库、法务审阅与财务审计。文档在前端本地解析、渲染和搜索，无需部署文档转换服务器。

[官网](https://docviewkit.com/zh-cn/) · [在线体验](https://docviewkit.com/zh-cn/demo/) · [使用文档](https://docviewkit.com/docs/quickstart/) · [Viewer 源码](https://github.com/docviewkit/viewer)

## 为什么选择 DocViewKit

- **快速集成：** 导入现成组件，挂载 `<docviewkit-viewer>`，调用 `open(file)` 即可开始预览。
- **轻量与高性能：** 精简核心与按需加载的格式包减少初始加载，页面和表格视口按需渲染。
- **文件在本地处理：** 预览和搜索在浏览器内完成，附件存储与访问权限由业务应用掌控。
- **多种格式，一致体验：** 支持 Office、WPS、PDF、OFD 1.0/1.1、OpenDocument、iWork、XPS、CSV 和 RTF。兼容性和渲染深度随格式与文档而异，可用自己的文件体验 Demo。
- **可定制、可扩展：** 使用 Viewer 界面或通过 Engine API 自定义渲染、访问原文对象。
- **开源与专业服务：** Viewer 和 Engine 采用 Apache-2.0，商业服务围绕支持、定制和企业交付展开。

## 两个仓库，独立管理

本仓库 [docviewkit/website](https://github.com/docviewkit/website) 负责官网、产品介绍、文档和在线 Demo，采用 [Apache-2.0](LICENSE)。Viewer 与 Engine 的源码、构建和 npm 发布由 [docviewkit/viewer](https://github.com/docviewkit/viewer) 负责。

官网安装精确锁定版本的 `@docviewkit/viewer` npm 包，直接使用其完整运行时，不在本仓库编译 Rust、Wasm 或核心源码。官网和 Viewer 各自维护版本与发布记录。

Apache-2.0 条款适用于从当前源码构建的版本；旧版已发布包继续适用其随附许可证。DocViewKit Omni 使用其单独说明的产品许可证。

## 本仓库包含什么

- `/en/` 与 `/zh-cn/`：英文和中文产品首页。
- `/en/for-ide/` 与 `/zh-cn/for-ide/`：DocViewKit Omni for IDE。
- `/en/for-browser/` 与 `/zh-cn/for-browser/`：DocViewKit Omni for Browser。
- `/en/privacy/docviewkit-omni/` 与 `/zh-cn/privacy/docviewkit-omni/`：浏览器扩展隐私政策。
- `/en/license/docviewkit-omni/` 与 `/zh-cn/license/docviewkit-omni/`：Omni 产品许可证。
- `/en/demo/` 与 `/zh-cn/demo/`：在浏览器本地运行的 Viewer Demo。
- `/docs/<slug>/`：服务端渲染、使用规范 URL 的文档页面。
- `/robots.txt`、`/sitemap.xml` 与 `/docs.json`：爬虫入口及机器可读文档目录。
- `/llms.txt` 与 `/llms-full.txt`：面向 AI 的文档索引及完整纯文本内容。

官网部署于 [docviewkit.com](https://docviewkit.com)，线上与本地应用使用相同路径。DNS、TLS、生产部署与服务协议分别验证。

OFD 使用按需加载的 `ofd-formats` 格式包。已实现的格式范围与签名完整性限制见[支持格式](https://docviewkit.com/docs/supported-formats/)。

## 前端与跨平台环境

Viewer 需要 DOM/Custom Elements、模块 Worker、WebAssembly、Canvas/OffscreenCanvas、ImageBitmap 和 FontFace。浏览器以及 Electron、Tauri、Ionic、Capacitor 中具备这些能力的 WebView 均可接入。React Native 与 Flutter 可通过兼容 WebView 嵌入；其原生渲染层不直接运行 Web Component。

请在目标平台验证实际内核、资源加载、CSP、字体和所需交互，具体要求见[运行环境兼容性](https://docviewkit.com/docs/browser-compatibility/)。

## 本地运行

独立克隆并启动官网：

```sh
git clone https://github.com/docviewkit/website.git
cd website
npm ci
npm run dev
```

默认地址为 `http://127.0.0.1:4310`，可用 `PORT` 或 `HOST` 调整。官网无需数据库、用户账号或登录服务，也不接收文档上传。

生产环境可设置 `DOCVIEWKIT_GOOGLE_SITE_VERIFICATION`、`DOCVIEWKIT_BING_SITE_VERIFICATION` 和 `DOCVIEWKIT_INDEXNOW_KEY`。前两项为双语首页添加站长验证元标签，IndexNow 密钥通过 `/<key>.txt` 提供。部署后提交规范 URL：

```sh
DOCVIEWKIT_INDEXNOW_KEY=replace-with-production-key npm run indexnow
```

## 检查与验证

```sh
npm ci
npm run verify
npm run test:browsers:install
npm run test:browsers
```

官网检查覆盖内容、资源、许可证和真实 Demo。Demo 使用与用户相同的 npm Viewer；所有按需加载格式包及其资源，包括 `office-viewer-xps.wasm` 和 `office-viewer-ofd.wasm`，必须保留在公共 SDK 资源白名单中。

## 部署与 Viewer 升级

提交到 `main` 后，自动验证官网，在 Chromium、Firefox 和 WebKit 中检查真实 Demo，再将已测试归档部署到官网。文档和 `/sdk/version.json` 使用实际安装的 Viewer 版本，`/site-version.json` 记录官网版本、部署提交与 Viewer 版本。

`website-production` 环境保存 `DOCVIEWKIT_WEBSITE_SSH_HOST`、`DOCVIEWKIT_WEBSITE_SSH_USER`、`DOCVIEWKIT_WEBSITE_SSH_PRIVATE_KEY` 和 `DOCVIEWKIT_WEBSITE_SSH_KNOWN_HOSTS`。SSH 使用端口 `21098`。现有 Namecheap Node.js 应用目录为 `apps/docviewkit`，启动文件为 `server.js`。部署保留历史版本用于回滚，保护归档数据，并通过 `tmp/restart.txt` 重启 Passenger。

在干净工作区运行 `npm ci` 和 `npm run build` 生成归档。归档包含官网源码及完整 Viewer 包，包括 Worker、Wasm、字体、LICENSE、NOTICE 和第三方许可证，排除开发依赖和私有数据。锁文件校验下载的 npm 包完整性。

Dependabot 通过修改 `package.json` 与 `package-lock.json` 提议 Viewer 补丁升级，官网检查和三浏览器检查通过后才能合并并部署。大版本与次版本升级单独审查。手动升级时运行 `npm install --save-exact @docviewkit/viewer@<version>`，验证后提交两个清单文件。

## 发布后的搜索收录检查

部署后，在 Google Search Console 检查 `/en/`、`/zh-cn/`、`/docs/overview/` 和 `/docs/quickstart/` 的线上 URL、规范地址、可索引状态与最近抓取时间，提交 `/sitemap.xml`，必要时请求重新收录。IndexNow 与 Google URL 检查分别操作。

保留发布前基线，在最初 48 小时每天查看收录状态与搜索数据。按页面、地区、设备和相同查询条件比较展现、点击、CTR 与平均排名；数据稀疏时延长观察窗口。结构化数据描述页面内容，搜索表现需结合抓取、收录和数据可用性判断。

参考：[Google AI 优化指南](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)、[FAQ 富媒体结果更新](https://developers.google.com/search/updates#may-2026)、[生成式 AI 报告](https://support.google.com/webmasters/answer/16984139)、[重新抓取指南](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl)。

## 开源与专业服务

Viewer 和 Engine 开源，全部已实现格式均可使用，无需注册、应用登记或运行时许可证。支持、定制和企业交付请联系 [novalag778@gmail.com](mailto:novalag778@gmail.com)，公开问题请提交到 [Viewer Issues](https://github.com/docviewkit/viewer/issues)。

历史客户数据所在的 `data/` 目录继续由 Git 忽略，当前官网不读取或修改这些数据。机密支持文件通过双方约定的私密渠道提供。

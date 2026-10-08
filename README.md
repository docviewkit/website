# DocViewKit website

[English](https://github.com/docviewkit/website/blob/main/README.md) · [简体中文](https://github.com/docviewkit/website/blob/main/README.zh-CN.md)

DocViewKit is a lightweight document viewer for everyday OA attachment previews, approval workflows, admin portals, CRM/ERP systems, cloud drives, and customer-facing apps, as well as enterprise SaaS, AI knowledge bases, legal review, and financial audit. Quick integration starts with the ready-made Viewer: import the component, mount `<docviewkit-viewer>`, and call `open(file)`. A compact core and on-demand format packs keep unused parsers out of the initial load, with no document-conversion server to deploy. Use the Engine API when you need custom rendering or source-object access.

This website source lives in [docviewkit/website](https://github.com/docviewkit/website) and uses [Apache-2.0](LICENSE). The Viewer and Engine source lives in [docviewkit/viewer](https://github.com/docviewkit/viewer). It presents the open source Viewer and Engine plus optional support, customization and enterprise delivery. These terms apply to releases built from this source; older published versions retain their included licenses. DocViewKit Omni retains its separately documented product license.

This repository installs an exact, locked `@docviewkit/viewer` npm release. It does not build Rust, Wasm, or the core source. It contains only the public web surface:

- `/en/` and `/zh-cn/` — localized landing pages
- `/en/for-ide/` and `/zh-cn/for-ide/` — DocViewKit Omni for IDE
- `/en/for-browser/` and `/zh-cn/for-browser/` — DocViewKit Omni for Browser
- `/en/privacy/docviewkit-omni/` and `/zh-cn/privacy/docviewkit-omni/` — browser-extension privacy policy
- `/en/license/docviewkit-omni/` and `/zh-cn/license/docviewkit-omni/` — Omni product license
- `/en/demo/` and `/zh-cn/demo/` — browser-local Viewer demo
- `/docs/<slug>/` — server-rendered, canonical documentation pages
- `/robots.txt`, `/sitemap.xml`, and `/docs.json` — crawler and machine-readable discovery
- `/llms.txt` — AI-oriented documentation index
- `/llms-full.txt` — complete plain-text documentation

The website is intended for `https://docviewkit.com`, with the same paths as the local application. DNS, TLS, production deployment, and service agreements are separate release gates.

The product supports Office, WPS, PDF, OFD 1.0/1.1, OpenDocument, iWork, XPS, CSV, and RTF with local frontend processing. OFD uses the on-demand `ofd-formats` pack; the published supported-formats page describes its implemented subset and signature-integrity limits.

The Viewer runs in frontend environments that provide DOM/Custom Elements, module Workers, WebAssembly, Canvas/OffscreenCanvas, ImageBitmap, and FontFace. These include browsers and compatible WebView hosts in Electron, Tauri, Ionic and Capacitor. React Native and Flutter applications can embed it through a WebView that provides the same APIs; their native rendering layers do not run the Web Component directly. Validate the actual host engine, asset loading, CSP, fonts, and required interactions on each target platform.

## Run

Clone and run this repository independently:

```sh
git clone https://github.com/docviewkit/website.git
cd website
npm ci
npm run dev
```

The default address is `http://127.0.0.1:4310`. Override with `PORT` or `HOST`. The website needs no database, user accounts or authentication service.

Production may set `DOCVIEWKIT_GOOGLE_SITE_VERIFICATION`, `DOCVIEWKIT_BING_SITE_VERIFICATION`, and `DOCVIEWKIT_INDEXNOW_KEY`. The first two add the official webmaster verification meta tags to both localized home pages. The IndexNow key is served at `/<key>.txt`; after deployment, submit every canonical URL with:

```sh
DOCVIEWKIT_INDEXNOW_KEY=replace-with-production-key npm run indexnow
```

## Search verification after deployment

After publishing, inspect `/en/`, `/zh-cn/`, `/docs/overview/`, and `/docs/quickstart/` in Google Search Console. Check the live URL, selected canonical, indexability, and last crawl; request indexing for the changed pages and confirm `/sitemap.xml` is submitted. IndexNow is separate from Google's URL Inspection workflow.

Save a pre-release baseline, then review daily for the first 48 hours: indexing status and the Search results report filtered by page and target queries such as `JavaScript document viewer`, `OA attachment preview`, and `纯前端文档预览`. Compare impressions, clicks, CTR, and average position using the same country/device filters. Also record page impressions in the Generative AI performance report when available; it is not a separate AI-click attribution report. Continue over a longer comparable window if data is sparse.

The localized home derives FAQPage from its six visible plain-text answers; documentation already emits TechArticle. These describe content, not ranking guarantees. Google discontinued FAQ rich results in May 2026, and recrawling can take days to weeks. After 48 hours without a change, check crawl/index status and data availability before drawing conclusions about content or Schema.

Sources: [Google AI optimization guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide), [FAQ rich result retirement](https://developers.google.com/search/updates#may-2026), [Generative AI report](https://support.google.com/webmasters/answer/16984139), [recrawl guidance](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl).

## Verify

```sh
npm ci
npm run verify
npm run test:browsers:install
npm run test:browsers
```

Support, customization and enterprise delivery are handled directly at [novalag778@gmail.com](mailto:novalag778@gmail.com). Public issues go to [GitHub](https://github.com/docviewkit/viewer/issues). The website does not accept document uploads. Retired customer data under `data/` remains ignored by Git; the website no longer opens or modifies it.

The Viewer and Engine are Apache-2.0 open source and require no runtime license. Paid services cover support, customization and enterprise delivery. No registration, application record or runtime license is required. The official Demo uses the same Viewer. Every lazy format pack used by the Demo, including `office-viewer-xps.wasm` and `office-viewer-ofd.wasm`, must be present in the public SDK asset allowlist.

## Deployment and core updates

Pushes to `main` verify the website, check the real Demo in Chromium, Firefox and WebKit, and deploy the tested archive to `docviewkit.com`. The website has its own version; documentation and `/sdk/version.json` use the installed Viewer version. `/site-version.json` records the deployed website commit and Viewer version.

The `website-production` environment holds `DOCVIEWKIT_WEBSITE_SSH_HOST`, `DOCVIEWKIT_WEBSITE_SSH_USER`, `DOCVIEWKIT_WEBSITE_SSH_PRIVATE_KEY` and `DOCVIEWKIT_WEBSITE_SSH_KNOWN_HOSTS`. SSH uses port `21098`. The existing Namecheap Node.js 24 application root remains `apps/docviewkit`, with `server.js` as its startup file. Deployment retains releases for rollback, preserves archived data, and restarts Passenger through `tmp/restart.txt`.

Build a release archive from a clean checkout with `npm ci` and `npm run build`. Archives contain website source and the complete installed Viewer package, including workers, Wasm, fonts, LICENSE, NOTICE and third-party licenses. Development dependencies and private data are excluded. The lockfile verifies the downloaded npm package integrity.

Dependabot proposes Viewer patch upgrades by changing `package.json` and `package-lock.json`. Required website and browser checks must pass before an upgrade can merge and deploy. Major and minor upgrades are reviewed separately. To update manually, run `npm install --save-exact @docviewkit/viewer@<version>`, verify, and commit both manifests.

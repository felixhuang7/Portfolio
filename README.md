# 项目作品展示

本仓库是一个无后端依赖、可直接迁移的静态作品集。所有样式、脚本与图片均在目录内，可直接双击 `index.html`，或运行 `serve.bat` / `serve.sh` 后访问 `http://localhost:5175`。

## 页面

- `index.html`：作品入口页，卡片由 `assets/js/works.js` 数据驱动生成。
- `zhishi-picture.html`：智识图库展示页，包含产品概览、核心能力、实时协同链路、空间级 RBAC、前端运行截图与技术栈。
- `wikibot.html`：WikiBot 企业知识库问答与经验管理展示页。
- `agenthub.html`：AgentHub AI 资产注册与治理展示页。

## 智识图库展示口径

页面内容来自智识图库源项目及其简历、项目技术知识点资料。可量化信息均由代码统计或配置核验：

- 7 个业务控制器、52 个 HTTP 端点。
- 5 个空间权限点、3 个团队角色。
- 6 个空间分析接口。
- WebSocket + Disruptor 图片协同事件链路。
- 以图搜图、颜色检索、AI 扩图、对象存储与空间分片能力。

`assets/screenshots/zp-*.png` 来自源项目原有 Vue + Ant Design Vue 业务前端的实际运行页面，覆盖团队图片空间、空间分析和协同编辑。截图时仅为未启动的后端接口注入本地测试数据；页面组件、路由、样式与交互均使用原前端代码，测试数据不代表线上真实指标。

通俗的项目流程说明见 `doc/智识图库页面与技术流程说明.md`。

页面不使用缺少证据的性能数据。源码中标记为 `@Deprecated` 的 Caffeine + Redis 双层缓存接口按“性能实验路径”呈现；当前关闭组件开关的动态分表管理器也在说明文档中明确标注。

## 截图与视觉校验

`capture/capture-picture.mjs` 使用本机 Edge + Playwright 渲染页面并生成：

- `_qa-*.png`：桌面、移动端及关键区块的内部视觉校验图。

运行方式：

```powershell
cd capture
node capture-picture.mjs
```

脚本会同时检查页面脚本错误、破损图片与横向溢出。

`capture/capture-zhishi-frontend.mjs` 用于从运行中的智识图库原业务前端抓取三张截图，并在浏览器侧拦截 API 请求以提供测试数据。默认访问 `http://127.0.0.1:5199`，也可以通过 `ZHISHI_FRONTEND_URL` 指定地址。

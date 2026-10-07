# 芝士 Blog · felixhuang7

`main` 保存完整静态博客，沿用原来的 Butterfly 页面样式。可用任意静态文件服务器预览或托管。

本机博客仓库位于 `D:\code\project\blog`，带独立 `.git`，维护 `main`。`D:\code\project\portfolio` 维护 `portfolio` 分支。推送 `main` 后由已有的 EdgeOne 部署流程发布。

文章左侧目录可直接收起，正文随之居中；左下角按钮可重新展开。留言板保留信封动画，使用邮件联系；友链头像与信封资源本地保存。音乐、照片、电影尚无内容时显示空状态。
留言板、友链页面正文模板分别在 `tools/templates/comments-content.html` 与 `tools/templates/link-content.html`。
信封素材沿用原站的 `hexo-butterfly-envelope@1.0.15`，友链图标来自各站原有资源。

## 新文章

- [AI 应用 Harness 完整架构：面试系统设计版](2026/10/01/harness-architecture/)
- [AI 应用与 Agent 开发面试题及优质回答](2026/10/01/agent-interview/)

可编辑 Markdown 原文在 `content/posts/`；原文引用的五张 PNG 保存在同目录的 `images/` 下。网站使用压缩后的 WebP，Mermaid 在构建时渲染为 SVG。

## 本地预览与更新

直接提供静态文件即可运行，无需安装博客框架或后端：

```powershell
python -m http.server 5175 --bind 127.0.0.1
```

访问 `http://127.0.0.1:5175/`。文章、目录、时间轴、标签、分类及搜索索引均已生成。

更新原文后，使用构建脚本同步页面：

```powershell
python -m pip install -r tools/requirements.txt
npm.cmd ci --prefix tools
python tools/build_blog.py
node tools/render-diagrams.mjs
python tools/build_blog.py
```

渲染与验证使用本机 Microsoft Edge。测试前启动上面的 HTTP 服务，然后执行：

```powershell
cd tools
npm.cmd run check
```

验证涵盖桌面/手机布局、图片、搜索、目录跳转、图片放大、深色模式、页面路由和外部资源请求，截图与报告保存在被 Git 忽略的 `tools/qa/`。

## 加载优化

移除等待 `window.load` 的全屏遮罩；必要图标与脚本本地化，使用系统字体。先绘制正文与页面框架，随后在空闲时自动加载当前页的全部图片（无需滚动触发），优先处理可见图片，其余低优先级、最多三张并行；背景也在首屏绘制后请求。图片尺寸固定，避免加载时跳动，无 JavaScript 时保留原生图片懒加载与背景。头像约 19 KB，背景从 7.36 MB 压缩到约 110 KB；搜索索引只在打开搜索时读取。文章正文不依赖浏览器端 Markdown/Mermaid 解析，也不请求外部 CDN。

`edgeone.json` 为样式、脚本、图片和图标设置浏览器缓存；这些资源以及 CSS 中的字体、背景链接均带内容版本号，文件变更后自动使用新地址。HTML 保留平台默认的新鲜度策略。鼠标悬停文章/导航链接时按需预取目标 HTML（最多六页，省流量/低速网络下关闭），点击仍使用原生页面跳转。

线上博客地址为 `https://blog.felixhuang7.dpdns.org/`。

保留入场动画，并使用本地 `js/effects.js` 恢复文章卡片弹入、首页打字、夜间霓虹、点击烟花和输入粒子效果。粒子只在交互时创建与绘制；页面隐藏时暂停动画，系统启用“减少动态效果”时关闭装饰动画。

如需导出到自定义子目录，可使用 `--base /blog/ --site <博客完整地址> --out <输出目录>`，并一起复制 `css/`、`js/`、`img/`、`vendor/`、`content/posts/` 静态资源。

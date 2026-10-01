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

移除等待 `window.load` 的全屏遮罩；必要图标与脚本本地化，使用系统字体与原生图片懒加载。头像约 19 KB，背景从 7.36 MB 压缩到约 110 KB；搜索索引只在打开搜索时读取。文章正文不依赖浏览器端 Markdown/Mermaid 解析，也不请求外部 CDN。

保留入场动画，并使用本地 `js/effects.js` 恢复文章卡片弹入、首页打字和夜间霓虹效果。页面隐藏时暂停打字动画，系统启用“减少动态效果”时关闭装饰动画。

点击烟花和输入抖动已恢复为原站 Butterfly 扩展的效果，并调整为低饱和配色以适配背景。脚本放在 `js/fireworks.min.js` 与 `js/activate-power-mode.min.js`，不依赖外部 CDN。

如需导出到自定义子目录，可使用 `--base /blog/ --site <博客完整地址> --out <输出目录>`，并一起复制 `css/`、`js/`、`img/`、`vendor/`、`content/posts/` 静态资源。

# WikiBot 作品展示

一个**自包含、可迁移**的静态作品集，包含一个**作品选择入口页**与若干**作品详情展示页**。

> ✅ 整个 `show/` 目录无任何外部依赖（截图为本地 PNG，样式/脚本为本地文件）。
> **把 `show/` 目录整体拷到任何位置，直接打开 `index.html` 或运行启动脚本即可访问。**

## 目录结构

```
show/
├── index.html              # 作品选择入口页（Portfolio Landing）：点击作品卡片进入对应详情页
├── wikibot.html            # WikiBot 详情展示页（Hero / 项目概览 / 核心能力 / 问答输出 / 页面截图 / 技术架构 / 技术栈）
├── agenthub.html           # AgentHub 详情展示页（项目概览 / 三种用法 / 核心能力 / 页面截图 / 对话即操作 / 亮点 / 技术栈）
├── serve.bat               # Windows：本地服务开关（再跑一次即停止）
├── serve.sh                # macOS / Linux / Git Bash：本地服务开关（再跑一次即停止）
├── README.md               # 本说明
├── assets/
│   ├── css/style.css       # 样式（含选择页与详情页共用设计系统）
│   ├── js/main.js          # WikiBot 详情页：截图画廊与灯箱交互
│   ├── js/agenthub.js      # AgentHub 详情页：截图画廊与灯箱交互
│   ├── js/works.js         # 选择页：作品卡片数据驱动渲染（在 WORKS 数组里加一项即可新增作品）
│   └── screenshots/        # Playwright 抓取的真实系统页面截图（wikibot *.* 与 agenthub ah-*.png）
└── capture/                # 截图抓取工具（可重跑）
    ├── capture.mjs             # WikiBot 抓取
    ├── capture-agenthub.mjs   # AgentHub 抓取（铸 admin JWT 后逐页截图）
    └── package.json
```

## 如何查看

### 方式一：本地服务开关（关掉终端也一直在线）

**Windows** 双击 `serve.bat` / **macOS·Linux·Git Bash** 运行 `bash serve.sh`：

```
展示 URL：http://localhost:5175
```

打开后先落到**作品选择页**，点击任一作品卡片即可进入该作品的详情展示页。

- 脚本为**开关**型：服务没在跑就启动，已在跑就停止。再跑一次即停止。
- Windows 用 `pythonw` 隐藏后台进程方式启动，**关掉终端 / 关掉 Claude 仍持续运行**；macOS/Linux 用 `nohup` 后台进程，同理。
- 启动后会自动打开浏览器，PID 写入 `serve.pid`，访问日志写入 `serve.log` / `serve.err`。
- **停止**：再双击一次 `serve.bat`（或再 `bash serve.sh`）。
- **开机自启**（可选，Windows）：把 `serve.bat` 的快捷方式放进 `shell:startup`（开始菜单 → 运行 → 输入 `shell:startup`）。

> 属于**本地访问**，仅本机可访问；如需其他设备访问，把 `localhost` 换成本机 IP（同一局域网即可）。

### 方式二：直接打开

直接双击 `index.html` 用浏览器打开（无需服务）。部分浏览器对 `file://` 下的图片懒加载有限制，若截图不显示请改用方式一。

## 新增作品

在 [assets/js/works.js](assets/js/works.js) 顶部的 `WORKS` 数组里追加一个对象即可，选择页会自动渲染新卡片：

```js
{
  id: 'my-app',
  title: 'My App',
  tagline: '一句话副标题',
  desc: '2-3 行作品描述……',
  cover: 'assets/screenshots/xxx.png',  // 封面图
  href: 'my-app.html',                  // 对应的详情页文件
  category: 'Web · 工具',
  tags: ['React', 'Node'],
  stats: [{ n: '1.2万', l: '用户' }],
  featured: false,                       // true 时渲染为横版大卡并跨整行
}
```

详情页可复制 `wikibot.html` 改写，沿用同一套 `assets/css/style.css` 设计系统即可保持视觉一致。

## 截图素材说明

`assets/screenshots/` 下为运行中系统的真实页面截图，通过 Playwright 自动抓取。

### WikiBot 截图

| 截图 | 页面 |
|------|------|
| `01-guide.png` | 使用指引 |
| `02-my-repos.png` | 我的仓库 |
| `03-admin-dashboard.png` | 管理仪表盘 |
| `04-admin-metrics.png` | 指标看板 |
| `05-admin-users.png` | 用户管理 |
| `06-admin-modules.png` | 模块管理 |
| `07-logs.png` | 系统日志 |
| `08-feedback.png` | 反馈汇总 |
| `09-group.png` | Group 详情 |
| `10-chat.png` | 前端问答 |
| `11-wiki-kb.png` | 知识库页面 |

### AgentHub 截图

| 截图 | 页面 |
|------|------|
| `ah-01-skills.png` | Skills 资产浏览 |
| `ah-02-skill-detail.png` | Skill 详情（侧边抽屉） |
| `ah-03-search.png` | 关键字检索 |
| `ah-05-pending.png` | 待审批工作台（含敏感信息扫描 高危/中危） |
| `ah-10-approval-log.png` | 审批记录（历史弹窗） |
| `ah-06-users.png` | 用户与角色管理 |
| `ah-07-groups.png` | 用户组 |
| `ah-09-guide.png` | 使用指引 |

### 重新抓取截图（可选）

#### WikiBot

当 WikiBot 系统在本机运行（默认 `http://localhost:8000`，且 `.env` 中 `DEV_MODE=true`）时，可重新抓取截图：

```bash
cd show/capture
npm install
npm run capture          # 产物输出到 ../assets/screenshots/
# 若系统不在默认地址：
# WIKIBOT_URL=http://192.168.188.92:8000 npm run capture
```

> 抓取依赖 `DEV_MODE=true` 时开放的 `/auth/dev/login` 端点免登录签发 JWT。生产环境（`DEV_MODE=false`）该端点禁用，无法直接抓取。

#### AgentHub

AgentHub 截图取自本机运行的 AgentHub 实例（默认 `http://localhost:8080`，需已用 `docker/docker-compose.yml` 起来且库里有真实资产）。脚本通过 `.env` 中的 Ed25519 JWT 种子铸造一个 admin 会话 token，注入浏览器 localStorage 后逐页截图（实例未开放 dev-login）：

```bash
cd show/capture
npm install                       # 依赖 playwright
# 需提供 JWT 种子（32 字节 hex）与 admin open_id，从 docker/.env 获取
AGENTHUB_JWT_SEED=<ed25519-seed-hex> \
AGENTHUB_ADMIN_OPEN_ID=<admin-open-id> \
AGENTHUB_ADMIN_NAME="Jixiang Huang" \
node capture-agenthub.mjs         # 产物输出到 ../assets/screenshots/ah-*.png
# 系统不在默认地址时加 AGENTHUB_URL=http://...
```

> ⚠️ `AGENTHUB_JWT_SEED` 即部署方签名私钥，仅在本机运行抓取脚本时通过环境变量注入，**切勿入库**。脚本本身不含密钥。

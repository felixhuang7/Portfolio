// WikiBot 真实页面截图抓取脚本
// 通过 /auth/dev/login（DEV_MODE=true 时开放）获取 JWT，注入 localStorage 后逐页截图。
// 运行：在 show/capture 目录下执行  npm run capture
// 产物输出到：../assets/screenshots/*.png

import { chromium } from 'playwright'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = resolve(__dirname, '../assets/screenshots')
const BASE = process.env.WIKIBOT_URL || 'http://localhost:8000'
// 用真实存在的全局管理员 open_id 登录，截图才能带上真实数据（仓库/bot/指标）。
// 可通过环境变量 WIKIBOT_DEV_OPEN_ID 覆盖。
const DEV_OPEN_ID = process.env.WIKIBOT_DEV_OPEN_ID || 'ou_6f2c2fdd68e9ec403a26095a9830a9af'
const DEV_NAME = 'WikiBot Demo'

// 待截图的页面：name -> 路由。Guide / Login 类静态页面优先；
// 需要数据的页面若渲染为空，仍会得到一张带真实布局/导航的截图。
const PAGES = [
  { name: '01-guide',            path: '/guide',                        title: '使用指引' },
  { name: '02-my-repos',         path: '/my-repos',                     title: '我的仓库' },
  { name: '03-admin-dashboard',  path: '/admin/dashboard',              title: '管理仪表盘' },
  { name: '04-admin-metrics',    path: '/admin/metrics',                title: '指标看板' },
  { name: '05-admin-users',      path: '/admin/users',                  title: '用户管理' },
  { name: '06-admin-modules',    path: '/admin/module-management',      title: '模块管理' },
  { name: '07-logs',             path: '/logs',                          title: '系统日志' },
  { name: '08-feedback',         path: '/feedback',                     title: '反馈汇总' },
  { name: '09-group',           path: '/groups/Test_Bot',              title: 'Group 详情' },
]

// 带查询参数的特殊页面（知识库页 / 飞书问答页）
const SPECIAL = [
  { name: '10-chat',    url: '/chat',                                                       title: '飞书机器人问答' },
  { name: '11-wiki-kb', url: '/chat?bot_id=Test_Bot&view=kb&source=concepts/api-gateway.md', title: '知识库页面' },
]

async function main() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })

  const browser = await chromium.launch()
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2, // 高清截图
    locale: 'zh-CN',
  })
  const page = await ctx.newPage()
  page.setDefaultTimeout(20000)

  // 1) 通过 dev 登录拿 token。dev-login 会 302 到 ${FRONTEND_URL}/login#token=xxx，
  //    FRONTEND_URL 通常是 :5174（vite dev）。我们只需从最终 URL 的 hash 里取出 token，
  //    再手动注入到 :8000 的 localStorage（截图在 :8000 抓取，与 :5174 不同源）。
  console.log(`[dev-login] ${BASE}/auth/dev/login?open_id=${DEV_OPEN_ID}&name=${encodeURIComponent(DEV_NAME)}`)
  let token = ''
  try {
    await page.goto(`${BASE}/auth/dev/login?open_id=${DEV_OPEN_ID}&name=${encodeURIComponent(DEV_NAME)}`, {
      waitUntil: 'domcontentloaded',
    })
    const m = (page.url().match(/token=([^&#]+)/) || [])[1]
    if (m) token = decodeURIComponent(m)
  } catch (e) { console.warn('  dev-login 跳转异常:', e.message) }
  if (!token) {
    token = await page.evaluate(() => localStorage.getItem('token') || '')
  }
  console.log(`[token] ${token ? '已获取(' + token.slice(0, 12) + '...)' : '未获取 — 截图将为登录页'}`)

  // 2) 把 token 写入 :8000 的 localStorage（在 /login 页面操作，该页不会自动跳走）
  if (token) {
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
    await page.evaluate((t) => { try { localStorage.setItem('token', t) } catch(e){} }, token)
  }

  let okCount = 0
  for (const p of PAGES) {
    const url = `${BASE}${p.path}`
    try {
      console.log(`[capture] ${p.name}  ${url}`)
      await page.goto(url, { waitUntil: 'networkidle' })
      await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(2000)
      // 回到顶部，保证截到主界面而非滚动后的位置
      await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {})
      const out = resolve(OUT_DIR, `${p.name}.png`)
      // 视口截图（非 fullPage）：固定尺寸、体积可控，画廊统一 16:9 展示更整齐
      await page.screenshot({ path: out })
      okCount++
      console.log(`  -> ${out}`)
    } catch (e) {
      console.warn(`  !! 截图失败 ${p.name}: ${e.message}`)
    }
  }

  // 带查询参数的特殊页面（Chat 由 PersistentChat 挂载，需更长等待；知识库页 view=kb）
  for (const s of SPECIAL) {
    try {
      console.log(`[capture] ${s.name}  ${s.url}`)
      await page.goto(`${BASE}${s.url}`, { waitUntil: 'networkidle' })
      await page.waitForTimeout(2500)
      await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {})
      await page.screenshot({ path: resolve(OUT_DIR, `${s.name}.png`) })
      okCount++
      console.log(`  -> ${resolve(OUT_DIR, s.name + '.png')}`)
    } catch (e) {
      console.warn(`  !! 截图失败 ${s.name}: ${e.message}`)
    }
  }

  await browser.close()
  console.log(`\n完成：成功 ${okCount}/${PAGES.length + 1} 张，输出目录：${OUT_DIR}`)
}

main().catch((e) => { console.error(e); process.exit(1) })

// 抓取「测试机器人」经验管理两张截图：模板管理 + 经验条目
// 复用 capture.mjs 的 dev-login 注入 token 方案，输出到 ../assets/screenshots/
import { chromium } from 'playwright'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = resolve(__dirname, '../assets/screenshots')
const BASE = process.env.WIKIBOT_URL || 'http://localhost:8000'
const DEV_OPEN_ID = process.env.WIKIBOT_DEV_OPEN_ID || 'ou_6f2c2fdd68e9ec403a26095a9830a9af'
const DEV_NAME = 'WikiBot Demo'
const BOT = 'Test_Bot'

const SHOTS = [
  { name: '14-exp-template', path: `/groups/${BOT}?tab=template`,   title: '模板管理' },
  { name: '15-exp-items',    path: `/groups/${BOT}?tab=experience`, title: '经验条目' },
]

async function main() {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    locale: 'zh-CN',
  })
  const page = await ctx.newPage()
  page.setDefaultTimeout(20000)

  // dev-login 拿 token
  console.log(`[dev-login] ${BASE}/auth/dev/login?open_id=${DEV_OPEN_ID}&name=${encodeURIComponent(DEV_NAME)}`)
  let token = ''
  try {
    await page.goto(`${BASE}/auth/dev/login?open_id=${DEV_OPEN_ID}&name=${encodeURIComponent(DEV_NAME)}`, { waitUntil: 'domcontentloaded' })
    const m = (page.url().match(/token=([^&#]+)/) || [])[1]
    if (m) token = decodeURIComponent(m)
  } catch (e) { console.warn('  dev-login 跳转异常:', e.message) }
  if (!token) token = await page.evaluate(() => localStorage.getItem('token') || '')
  if (token) {
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
    await page.evaluate((t) => { try { localStorage.setItem('token', t) } catch(e){} }, token)
  }
  console.log(`[token] ${token ? '已获取' : '未获取'}`)

  for (const s of SHOTS) {
    const url = `${BASE}${s.path}`
    try {
      console.log(`[capture] ${s.name}  ${url}`)
      await page.goto(url, { waitUntil: 'networkidle' })
      await page.waitForTimeout(2500)
      await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {})
      const out = resolve(OUT_DIR, `${s.name}.png`)
      await page.screenshot({ path: out })
      console.log(`  -> ${out}`)
    } catch (e) {
      console.warn(`  !! 截图失败 ${s.name}: ${e.message}`)
    }
  }

  await browser.close()
}
main().catch((e) => { console.error(e); process.exit(1) })

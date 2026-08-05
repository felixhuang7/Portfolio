// 仅重新抓取 Group 详情页截图（09-group.png）。
// 复用 capture/ 的 dev-login 流程，输出到 ../assets/screenshots/
import { chromium } from 'playwright'
import { resolve } from 'node:path'

const __dirname = new URL('.', import.meta.url).pathname.replace(/^\//, '')
const OUT_DIR = resolve(__dirname, '../assets/screenshots')
const BASE = process.env.WIKIBOT_URL || 'http://localhost:8000'
const DEV_OPEN_ID = process.env.WIKIBOT_DEV_OPEN_ID || 'ou_6f2c2fdd68e9ec403a26095a9830a9af'
const DEV_NAME = 'WikiBot Demo'
const GROUP_PATH = process.env.GROUP_PATH || '/groups/Test_Bot'

const browser = await chromium.launch()
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  locale: 'zh-CN',
})
const page = await ctx.newPage()
page.setDefaultTimeout(20000)

let token = ''
try {
  await page.goto(`${BASE}/auth/dev/login?open_id=${DEV_OPEN_ID}&name=${encodeURIComponent(DEV_NAME)}`, { waitUntil: 'domcontentloaded' })
  const m = (page.url().match(/token=([^&#]+)/) || [])[1]
  if (m) token = decodeURIComponent(m)
} catch (e) { console.warn('dev-login 跳转异常:', e.message) }
if (!token) token = await page.evaluate(() => localStorage.getItem('token') || '')
if (token) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
  await page.evaluate((t) => { try { localStorage.setItem('token', t) } catch(e){} }, token)
}
console.log('token:', token ? 'ok' : 'NONE')

const url = `${BASE}${GROUP_PATH}`
console.log('capture:', url)
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(2500)
await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {})
const out = resolve(OUT_DIR, '09-group.png')
await page.screenshot({ path: out })
console.log('->', out)
await browser.close()

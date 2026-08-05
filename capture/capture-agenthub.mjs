// AgentHub 真实页面截图抓取脚本
// 通过生产环境 JWT 签名密钥（Ed25519）铸造一个 admin 会话 token，注入 localStorage 后逐页截图。
// 产物输出到：../assets/screenshots/ah-*.png
//
// 安全说明：本脚本仅在本地运行，用于为作品展示页生成截图；所用密钥来自部署方本机 .env，
// 铸造的 token 仅以本展示页截图为目的、过期时间同生产会话。脚本与密钥不入库。
import { chromium } from 'playwright'
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = resolve(__dirname, '../assets/screenshots')
const BASE = process.env.AGENTHUB_URL || 'http://localhost:8080'

// 由部署方 .env 提供（Ed25519 种子，hex）。运行时注入，不入库。
const JWT_SEED_HEX = process.env.AGENTHUB_JWT_SEED || ''
const ADMIN_OPEN_ID = process.env.AGENTHUB_ADMIN_OPEN_ID || 'ou_91817e29ceb2111b8b7f0979a3aa481d'
const ADMIN_NAME = process.env.AGENTHUB_ADMIN_NAME || 'Jixiang Huang'

function mintToken() {
  if (!JWT_SEED_HEX) throw new Error('AGENTHUB_JWT_SEED 未设置')
  // 用 Python 的 PyJWT + cryptography 铸造 EdDSA(Ed25519) token（写临时文件执行，避免 -c 转义问题）
  const script = `import time
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
import jwt
seed = bytes.fromhex("${JWT_SEED_HEX}")
pk = Ed25519PrivateKey.from_private_bytes(seed)
now = int(time.time())
claims = {
  "iss": "agent-registry",
  "iat": now, "nbf": now, "exp": now + 365*24*3600,
  "auth_method": "oidc",
  "auth_method_sub": "${ADMIN_OPEN_ID}",
  "permissions": [
    {"action":"read","resource":"*"},
    {"action":"publish","resource":"*"},
    {"action":"edit","resource":"*"},
    {"action":"delete","resource":"*"},
    {"action":"deploy","resource":"*"},
  ],
}
print(jwt.encode(claims, pk, algorithm="EdDSA"))
`
  const tmpPy = resolve(__dirname, '_mint_token.py')
  writeFileSync(tmpPy, script, 'utf-8')
  try {
    return execFileSync('python', [tmpPy], { encoding: 'utf-8' }).trim()
  } finally {
    rmSync(tmpPy, { force: true })
  }
}

const SHOTS = [
  { name: 'ah-01-skills',      path: '/?tab=skills',                     title: 'Skills 资产浏览', wait: 2500 },
  { name: 'ah-02-skill-detail', path: '/?tab=skills',                    title: 'Skill 详情',      action: 'openSkillDetail', wait: 2000 },
  { name: 'ah-03-search',       path: '/?tab=skills',                    title: '关键字检索',       action: 'search', text: 'api', wait: 1800 },
  { name: 'ah-05-pending',      path: '/?tab=pending',                   title: '待审批',          wait: 2200 },
  { name: 'ah-10-approval-log',  path: '/?tab=pending',                   title: '审批记录',        action: 'openApprovalLog', wait: 2000 },
  { name: 'ah-06-users',        path: '/?tab=users',                     title: '用户与角色',       wait: 2200 },
  { name: 'ah-07-groups',       path: '/?tab=groups',                    title: '用户组',          wait: 2000 },
  { name: 'ah-09-guide',        path: '/guide',                          title: '使用指引',        wait: 1500 },
]

async function main() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })
  const token = mintToken()
  console.log(`[token] 已铸造 admin token（${token.slice(0, 16)}...）`)

  // 优先用本机已装的 Edge（与日常浏览同一字体/渲染），依次回退 Chrome、Playwright 自带 Chromium
  let browser
  try {
    browser = await chromium.launch({ channel: 'msedge' })
    console.log('[browser] 使用 Microsoft Edge 通道')
  } catch {
    try {
      browser = await chromium.launch({ channel: 'chrome' })
      console.log('[browser] msedge 不可用，回退 Chrome 通道')
    } catch {
      browser = await chromium.launch()
      console.log('[browser] 回退 Playwright 自带 Chromium（字体可能与 Edge 略有差异）')
    }
  }
  const ctx = await browser.newContext({
    viewport: { width: 1480, height: 920 },
    deviceScaleFactor: 2,
    locale: 'zh-CN',
  })
  const page = await ctx.newPage()
  page.setDefaultTimeout(25000)

  // 0) 字体对齐：应用 tailwind 的 font-sans 依赖 --font-jakarta，但 layout.tsx 未用
  //    next/font 注入该变量，默认回退 system-ui。经实测：在 Windows 11 的 Edge 下
  //    system-ui 解析为「Segoe UI Variable」（字体文件 SegUIVar.ttf），而非旧的
  //    「Segoe UI」。本机已装 Segoe UI Variable。故显式定义 --font-jakarta 为
  //    [Segoe UI Variable 优先, 回退 Segoe UI, 中文 Microsoft YaHei UI / YaHei]，
  //    与 Edge 的 system-ui 完全一致，消除英文字体差异、中文不出现乱码/豆腐块。
  await ctx.addInitScript({
    content: `(function(){var s=document.createElement('style');s.id='ah-font-fix';s.textContent=":root{--font-jakarta:'Segoe UI Variable','Segoe UI','Microsoft YaHei UI','Microsoft YaHei',system-ui,-apple-system,'Segoe UI Emoji',sans-serif!important;}";document.documentElement.appendChild(s);})();`,
  })

  // 1) 先到首页（同源），注入 localStorage
  console.log(`[init] ${BASE}/`)
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
  await page.evaluate(({ t, oid, name }) => {
    localStorage.setItem('agentregistry_admin_token', t)
    localStorage.setItem('agentregistry_token_source', 'feishu')
    localStorage.setItem('agentregistry_user_role', 'admin')
    localStorage.setItem('agentregistry_user_open_id', oid)
    localStorage.setItem('agentregistry_user_name', name)
  }, { t: token, oid: ADMIN_OPEN_ID, name: ADMIN_NAME })

  await page.reload({ waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready).catch(() => {})
  await page.waitForTimeout(1500)

  let ok = 0
  for (const s of SHOTS) {
    try {
      console.log(`[capture] ${s.name}  ${s.path}  (${s.title})`)
      await page.goto(`${BASE}${s.path}`, { waitUntil: 'networkidle' })
      await page.waitForLoadState('domcontentloaded')
      await page.evaluate(() => document.fonts.ready).catch(() => {})
      await page.waitForTimeout(s.wait || 1500)

      // 水合后再注入字体：Next.js 水合会把 <html> 还原成服务端 HTML，从而清掉
      // init-script 注入的内联 style / <style> 节点。这里用 addStyleTag 在水合后
      // 以「CSS 规则」形式定义 --font-jakarta（本机 Segoe UI Variable，即 Win11
      // Edge 的 system-ui 实际字体），React 不会回收这种方式注入的 <style> 节点，
      // 故能稳定生效——确保截图英文字体与 Edge 完全一致，中文用微软雅黑。
      await page.addStyleTag({
        content: `:root{--font-jakarta:'Segoe UI Variable','Segoe UI','Microsoft YaHei UI','Microsoft YaHei',sans-serif;}`,
      }).catch(() => {})
      await page.evaluate(() => document.fonts.ready).catch(() => {})
      await page.waitForTimeout(300)

      if (s.action === 'openSkillDetail') {
        // 点击第一张 Skill 卡片打开侧边详情（Sheet，role=dialog）
        const card = page.locator('div.group.cursor-pointer:has(h3)').first()
        await card.click({ timeout: 8000 }).catch(() => {})
        await page.waitForSelector('[role="dialog"]', { timeout: 8000 }).catch(() => {})
        await page.waitForTimeout(1500)
      } else if (s.action === 'search') {
        const input = page.locator('input[placeholder*="搜索"], input[placeholder*="search"], input[type="search"]').first()
        await input.fill(s.text || '').catch(() => {})
        await page.waitForTimeout(1200)
      } else if (s.action === 'openApprovalLog') {
        // 点击「审批记录」按钮，弹出全部审批历史 Dialog
        const btn = page.getByRole('button', { name: /审批记录/ }).first()
        await btn.click({ timeout: 8000 }).catch(() => {})
        await page.waitForSelector('[role="dialog"]', { timeout: 8000 }).catch(() => {})
        await page.waitForTimeout(1500)
      }

      await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {})
      const out = resolve(OUT_DIR, `${s.name}.png`)
      await page.screenshot({ path: out })
      ok++
      console.log(`  -> ${out}`)
    } catch (e) {
      console.warn(`  !! 截图失败 ${s.name}: ${e.message}`)
    }
  }

  await browser.close()
  console.log(`\n完成：成功 ${ok}/${SHOTS.length} 张，输出目录：${OUT_DIR}`)
}

main().catch((e) => { console.error(e); process.exit(1) })

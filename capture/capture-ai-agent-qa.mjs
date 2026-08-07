import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' })
for (const item of [
  { name: '_qa-ai-agent-home.png', url: 'http://127.0.0.1:8765/index.html#works', width: 1440, height: 1000 },
  { name: '_qa-ai-agent-detail.png', url: 'http://127.0.0.1:8765/ai-agent.html', width: 1440, height: 1000 },
  { name: '_qa-ai-agent-mobile.png', url: 'http://127.0.0.1:8765/ai-agent.html', width: 390, height: 844 },
]) {
  const page = await browser.newPage({ viewport: { width: item.width, height: item.height } })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(item.url, { waitUntil: 'networkidle' })
  await page.screenshot({ path: `assets/screenshots/${item.name}`, fullPage: true })
  const result = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    brokenImages: [...document.images].filter((img) => !img.complete || !img.naturalWidth).map((img) => img.src),
  }))
  console.log(JSON.stringify({ ...item, ...result, errors }))
  await page.close()
}
await browser.close()

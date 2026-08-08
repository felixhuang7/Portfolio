import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' })
for (const item of [
  { url: 'http://127.0.0.1:8765/index.html#works', width: 1440, height: 1000 },
  { url: 'http://127.0.0.1:8765/ai-agent.html', width: 1440, height: 1000 },
  { url: 'http://127.0.0.1:8765/ai-agent.html', width: 390, height: 844 },
]) {
  const page = await browser.newPage({ viewport: { width: item.width, height: item.height } })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(item.url, { waitUntil: 'networkidle' })
  const tabPanels = []
  if (item.url.includes('ai-agent.html')) {
    const tabs = page.locator('.agent-tab')
    for (let index = 0; index < await tabs.count(); index += 1) {
      await tabs.nth(index).click()
      tabPanels.push(await page.locator('.agent-panel.active').getAttribute('id'))
    }
  }
  const result = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    brokenImages: [...document.images].filter((img) => !img.complete || !img.naturalWidth).map((img) => img.src),
    activePanel: document.querySelector('.agent-panel.active')?.id || null,
  }))
  console.log(JSON.stringify({ ...item, ...result, tabPanels, errors }))
  await page.close()
}
await browser.close()

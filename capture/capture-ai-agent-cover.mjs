import { chromium } from 'playwright'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
await page.goto(pathToFileURL(path.resolve('capture/ai-agent-cover-source.html')).href, { waitUntil: 'load' })
await page.screenshot({ path: 'assets/screenshots/ai-agent-console-cover.png' })
await browser.close()

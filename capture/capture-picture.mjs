import { chromium } from 'playwright'
import { dirname, resolve } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const showDir = resolve(here, '..')
const screenshots = resolve(showDir, 'assets/screenshots')
const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const browser = await chromium.launch({ executablePath: edge, headless: true })

async function capture(name, file, viewport, fullPage = true) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, locale: 'zh-CN' })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(pathToFileURL(resolve(showDir, file)).href, { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: resolve(screenshots, name), fullPage })
  const audit = await page.evaluate(() => ({
    title: document.title,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    bodyText: document.body.innerText.slice(0, 160),
    brokenImages: [...document.images].filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.src),
  }))
  console.log(JSON.stringify({ name, viewport, errors, ...audit }))
  await context.close()
}

await capture('_qa-zhishi-picture-desktop.png', 'zhishi-picture.html', { width: 1440, height: 900 })
await capture('_qa-zhishi-picture-mobile.png', 'zhishi-picture.html', { width: 390, height: 844 })
await capture('_qa-portfolio.png', 'index.html', { width: 1440, height: 900 })

const detailContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, locale: 'zh-CN' })
const detailPage = await detailContext.newPage()
await detailPage.goto(pathToFileURL(resolve(showDir, 'zhishi-picture.html')).href, { waitUntil: 'load' })
await detailPage.evaluate(() => document.fonts.ready)
for (const id of ['capabilities', 'collaboration', 'permission', 'screens']) {
  await detailPage.locator(`#${id}`).screenshot({ path: resolve(screenshots, `_qa-${id}.png`) })
}
await detailContext.close()
await browser.close()

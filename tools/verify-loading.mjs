import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const origin = process.env.BLOG_URL || 'http://127.0.0.1:5176'
const browser = await chromium.launch({ channel: 'msedge', headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const images = []
  page.on('request', r => { if (/\/img\/(posts|diagrams)\//.test(r.url())) images.push(r.url()) })
  await page.goto(origin + '/2026/10/01/harness-architecture/')
  await page.waitForTimeout(250)
  assert.deepEqual(images, [], 'far article images must not download on entry')
  const first = page.locator('#article-container img').first()
  const before = await first.boundingBox()
  const source = await first.getAttribute('data-src')
  assert.match(source, /\?v=[a-f0-9]{12}$/)
  await first.scrollIntoViewIfNeeded()
  await page.waitForFunction(() => document.querySelector('#article-container img').naturalWidth > 1)
  const after = await first.boundingBox()
  assert.ok(Math.abs(before.height - after.height) < 1, 'image loading must preserve its reserved height')
  assert.ok(images.some(url => url.endsWith(source)))
  assert.ok(await page.locator('#article-container img[data-src]').count() > 0, 'later images must remain deferred')
  assert.match(await first.locator('..').getAttribute('href'), /\.webp\?v=/, 'opening an image in a new tab must use the real source')
  await first.click()
  await page.waitForFunction(() => document.querySelector('dialog[open] img')?.naturalWidth > 1)
  await page.keyboard.press('Escape')
  await page.evaluate(() => scrollTo(0, 0))
  const homePrefetch = page.waitForResponse(r => r.url() === origin + '/')
  await page.locator('#site-name').hover()
  await homePrefetch
  assert.equal(await page.locator(`link[rel="prefetch"][href="${origin}/"]`).count(), 1)
  await Promise.all([page.waitForURL(origin + '/'), page.locator('#site-name').click()])
  assert.match(await page.title(), /芝士 Blog/)
  await page.locator('.article-title').first().scrollIntoViewIfNeeded()
  const target = origin + '/2026/10/01/harness-architecture/'
  const articlePrefetch = page.waitForResponse(r => r.url() === target)
  await page.locator('.article-title').first().hover()
  await articlePrefetch
  assert.equal(await page.locator(`link[rel="prefetch"][href="${target}"]`).count(), 1)
  await Promise.all([page.waitForURL(target), page.locator('.article-title').first().click()])
  assert.equal(await page.locator('#toc-toggle').getAttribute('aria-expanded'), 'true')

  const noJS = await browser.newPage({ javaScriptEnabled: false })
  await noJS.goto(target)
  await noJS.waitForTimeout(800)
  const fallback = noJS.locator('#article-container noscript img').first()
  await fallback.scrollIntoViewIfNeeded()
  await fallback.evaluate(image => image.decode())
  assert.ok(await fallback.isVisible())
  assert.ok(await fallback.evaluate(image => image.naturalWidth > 1))
  assert.equal(await noJS.locator('#article-container img[data-src]').first().isVisible(), false)

  const config = JSON.parse(await readFile('../edgeone.json', 'utf8'))
  for (const folder of ['css', 'js', 'img', 'vendor']) {
    assert.ok(config.headers.find(h => h.source === `/${folder}/*`).headers.some(h => h.key === 'Cache-Control' && h.value.includes('immutable')))
  }
  console.log('PASS: images load near the viewport with stable dimensions; real lightbox and new-tab sources; intent-prefetch and native navigation; no-JS fallback; cache configuration')
} finally {
  await browser.close()
}

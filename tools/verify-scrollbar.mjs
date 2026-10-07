import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'

const origin = process.env.BLOG_URL || 'http://127.0.0.1:5176'
// Headless Chromium normally hides native scrollbars; show them to catch gutters.
const browser = await chromium.launch({ channel: 'msedge', headless: true, ignoreDefaultArgs: ['--hide-scrollbars'] })
await mkdir('qa', { recursive: true })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(origin + '/')
  await page.waitForTimeout(1000)
  const bar = page.locator('.page-scrollbar')
  const thumb = page.locator('.page-scrollbar-thumb')
  for (const theme of ['light', 'dark']) {
    await page.evaluate(theme => document.documentElement.setAttribute('data-theme', theme), theme)
    await page.waitForTimeout(350)
    const edge = await page.evaluate(() => ({
      viewport: innerWidth,
      content: document.documentElement.clientWidth,
      background: document.getElementById('web_bg').getBoundingClientRect().right,
      track: getComputedStyle(document.querySelector('.page-scrollbar')).backgroundColor,
      thumb: getComputedStyle(document.querySelector('.page-scrollbar-thumb')).backgroundColor
    }))
    assert.equal(edge.content, edge.viewport, 'there must be no reserved native scrollbar gutter')
    assert.equal(edge.background, edge.viewport, 'the image must reach the right edge')
    assert.equal(edge.track, 'rgba(0, 0, 0, 0)')
    assert.equal(edge.thumb, 'rgba(140, 140, 140, 0.4)')
    await page.screenshot({ path: `qa/scrollbar-${theme}.png` })
    await page.screenshot({ path: `qa/scrollbar-edge-${theme}.png`, clip: { x: 1240, y: 0, width: 200, height: 900 } })
  }
  await page.mouse.move(700, 450)
  await page.mouse.wheel(0, 350)
  await page.waitForTimeout(400)
  assert.ok(await page.evaluate(() => scrollY > 100), 'wheel scrolling should stay native')
  const initial = await page.evaluate(() => scrollY)
  const handle = await thumb.boundingBox()
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2)
  await page.mouse.down()
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2 + 100, { steps: 8 })
  await page.mouse.up()
  await page.waitForTimeout(150)
  assert.ok(await page.evaluate(() => scrollY) > initial + 30, 'dragging the translucent thumb should scroll the page')
  await bar.focus()
  await page.keyboard.press('End')
  await page.waitForTimeout(100)
  assert.equal(await bar.getAttribute('aria-valuenow'), '100')
  await page.keyboard.press('Home')
  await page.waitForTimeout(100)
  assert.equal(await bar.getAttribute('aria-valuenow'), '0')
  // Clicking the unpainted track remains usable as a scroll control.
  await bar.click({ position: { x: 6, y: 850 } })
  await page.waitForTimeout(100)
  assert.ok(await page.evaluate(() => scrollY > 0))
  await page.goto(origin + '/2026/10/01/harness-architecture/')
  await page.waitForTimeout(500)
  await page.evaluate(() => scrollTo(0, 12000))
  await page.waitForTimeout(800)
  assert.ok(Number(await bar.getAttribute('aria-valuenow')) > 0)
  const activeVisible = await page.locator('#card-toc .toc-link.active').evaluate(item => {
    const area = item.closest('.toc-content').getBoundingClientRect()
    const rect = item.getBoundingClientRect()
    return rect.top >= area.top && rect.bottom <= area.bottom
  })
  assert.ok(activeVisible, 'the article TOC must still follow the current chapter')
  // Changing document height must update the handle without a window resize.
  const heightBefore = (await thumb.boundingBox()).height
  await page.evaluate(() => {
    const space = document.createElement('div')
    space.style.height = '100000px'
    document.querySelector('#post').append(space)
  })
  await page.waitForTimeout(200)
  assert.ok((await thumb.boundingBox()).height <= heightBefore)
  assert.deepEqual(errors, [])
  await page.emulateMedia({ forcedColors: 'active' })
  await page.waitForTimeout(150)
  assert.equal(await bar.isVisible(), false, 'high contrast mode should use the native scrollbar')
  assert.equal(await page.locator('html').evaluate(e => e.classList.contains('overlay-scrollbar')), false)

  const touch = await browser.newPage({ viewport: { width: 390, height: 900 }, isMobile: true, hasTouch: true })
  await touch.goto(origin + '/')
  assert.equal(await touch.locator('.page-scrollbar').isVisible(), false, 'touch devices should keep native scrolling')
  await touch.evaluate(() => scrollTo(0, 1000))
  assert.ok(await touch.evaluate(() => scrollY > 0))
  const noJS = await browser.newPage({ javaScriptEnabled: false })
  await noJS.goto(origin + '/')
  assert.notEqual(await noJS.locator('html').evaluate(e => getComputedStyle(e).scrollbarWidth), 'none')
  console.log('PASS: transparent overlay in both themes; wheel, drag, track, keyboard, TOC, resize and native fallbacks')
} finally {
  await browser.close()
}

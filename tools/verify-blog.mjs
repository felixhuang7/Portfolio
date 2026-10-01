import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
const origin = process.env.BLOG_URL || 'http://127.0.0.1:5175'
const base = process.env.BLOG_BASE || ''
const browser = await chromium.launch({ channel: 'msedge', headless: true })
await mkdir('qa', { recursive: true })
const reports = []
// Sample the rendered text throughout both transitions to catch squeeze/reflow.
const animateToc = async (page, control) => {
  const frames = await page.evaluate(async control => {
    const card = document.getElementById('card-toc')
    const link = card.querySelector('.toc-link')
    const text = card.textContent
    const frames = []
    document.getElementById(control).click()
    const start = performance.now()
    do {
      frames.push({ width: card.getBoundingClientRect().width, height: link.getBoundingClientRect().height, sameText: card.textContent === text })
      await new Promise(requestAnimationFrame)
    } while (performance.now() - start < 850)
    return frames
  }, control)
  assert.ok(Math.max(...frames.map(f => f.width)) - Math.min(...frames.map(f => f.width)) < 1, 'TOC card width must stay fixed during toggling')
  assert.ok(Math.max(...frames.map(f => f.height)) - Math.min(...frames.map(f => f.height)) < 1, 'TOC text must not reflow during toggling')
  assert.ok(frames.every(f => f.sameText), 'TOC text must stay unchanged')
}
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, locale: 'zh-CN' })
    await context.addInitScript(() => localStorage.setItem('theme', JSON.stringify({ value: 'light', expiry: Date.now() + 86400000 })))
    const page = await context.newPage()
    const errors = [], external = [], failures = []
    page.on('pageerror', e => errors.push(e.message))
    page.on('request', r => { if (!r.url().startsWith(origin) && !r.url().startsWith('data:')) external.push(r.url()) })
    page.on('response', r => { if (r.status() >= 400) failures.push(`${r.status()} ${r.url()}`) })
    await page.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort())
    for (const [name, path] of [['home', '/'], ['harness', '/2026/10/01/harness-architecture/'], ['interview', '/2026/10/01/agent-interview/']]) {
      await page.goto(origin + base + path, { waitUntil: 'load' })
      await page.evaluate(() => document.fonts.ready)
      await page.evaluate(async () => {
        for (const image of document.images) {
          image.loading = 'eager'
          await image.decode().catch(() => {})
        }
      })
      const audit = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        broken: [...document.images].filter(i => !i.naturalWidth).map(i => i.src),
        requests: performance.getEntriesByType('resource').length,
        bytes: performance.getEntriesByType('resource').reduce((sum, r) => sum + r.transferSize, 0),
        load: performance.getEntriesByType('navigation')[0].loadEventEnd,
        hasOverlay: !!document.getElementById('loading-box'),
        headings: document.querySelectorAll('#article-container h2, #article-container h3, #article-container h4').length,
        diagrams: document.querySelectorAll('.diagram img').length,
      }))
      assert.equal(audit.overflow, false, `${width} ${name}: horizontal overflow`)
      assert.deepEqual(audit.broken, [], `${width} ${name}: broken images`)
      assert.equal(audit.hasOverlay, false)
      await page.screenshot({ path: `qa/${name}-${width}.png` })
      if (name === 'home') {
        assert.equal(await page.locator('.recent-post-item').count(), 2)
        assert.equal(await page.locator('#card-info-btn').getAttribute('href'), 'https://github.com/felixhuang7')
        assert.equal(await page.locator('#card-info-btn').innerText(), '🚀 去康康我的 GitHub')
        assert.equal(await page.locator('#card-info-btn .fa-github').count(), 0)
        assert.equal(await page.locator('a[href*="zhishimianbao"]').count(), 0)
        assert.equal(await page.locator('.author-info__description').count(), 0)
        await page.locator('#search-button .search').click()
        await page.locator('#local-search-input input').fill('Harness')
        await page.waitForFunction(() => document.querySelectorAll('.search-result-title').length === 2)
        await page.locator('#local-search-input input').fill('[不存在的关键词]')
        await page.waitForFunction(() => document.getElementById('local-search-results').textContent.includes('找不到'))
        await page.keyboard.press('Escape')
        if (width === 390) {
          await page.locator('#toggle-menu').click()
          await page.waitForFunction(() => document.getElementById('sidebar-menus').classList.contains('open'))
          await page.locator('#menu-mask').click({ position: { x: 10, y: 300 } })
        }
      } else {
        assert.ok(audit.headings > 60)
        if (name === 'harness') assert.equal(audit.diagrams, 5)
        if (width === 1440) {
          const tocBox = await page.locator('#card-toc').boundingBox()
          const postBox = await page.locator('#post').boundingBox()
          assert.ok(tocBox.x + tocBox.width <= postBox.x, 'TOC should be on the left')
          assert.ok((await page.locator('#aside-content').evaluate(e => getComputedStyle(e).transitionDuration)).includes('0.75s'))
          assert.match(await page.locator('#toc-close').textContent(), /收起/)
          assert.match(await page.locator('#toc-toggle').textContent(), /展开目录/)
          for (const scrollPosition of [3000, 12000]) {
            await page.evaluate(y => scrollTo(0, y), scrollPosition)
            await page.waitForTimeout(600)
            const stickyToc = await page.locator('#card-toc').boundingBox()
            assert.ok(stickyToc.y >= 60 && stickyToc.y < 100, 'TOC should follow the viewport deep in the article')
            assert.ok(stickyToc.y + stickyToc.height <= 900, 'sticky TOC should fit in the viewport')
          }
          await animateToc(page, 'toc-close')
          assert.equal(await page.locator('#card-toc').evaluate(e => getComputedStyle(e.closest('#aside-content')).opacity), '0')
          assert.equal(await page.locator('#card-toc').evaluate(e => getComputedStyle(e.closest('#aside-content')).pointerEvents), 'none')
          const centered = await page.locator('#post').boundingBox()
          assert.ok(Math.abs(centered.x + centered.width / 2 - width / 2) < 2, 'collapsed article should be centered')
          await animateToc(page, 'toc-toggle')
          assert.equal(await page.locator('#card-toc').isVisible(), true)
          assert.match(await page.locator('#toc-toggle').textContent(), /展开目录/)
          await page.locator('#card-toc .toc-link').nth(4).click()
          await page.waitForTimeout(350)
          assert.ok(await page.evaluate(() => scrollY > 0))
          await page.locator('#article-container img').first().click()
          assert.equal(await page.locator('dialog[open]').count(), 1)
          await page.keyboard.press('Escape')
          assert.equal(await page.locator('dialog[open]').count(), 0)
        } else {
          assert.match(await page.locator('#toc-toggle').textContent(), /展开目录/)
          assert.match(await page.locator('#toc-close').textContent(), /收起/)
          await page.locator('#toc-toggle').click()
          await page.waitForTimeout(100)
          assert.equal(await page.locator('#card-toc').evaluate(e => getComputedStyle(e).animationDuration), '0.55s')
          await page.waitForTimeout(550)
          assert.equal(await page.locator('#toc-toggle').getAttribute('aria-expanded'), 'true')
          assert.match(await page.locator('#toc-toggle').textContent(), /展开目录/)
          await page.locator('#toc-close').click()
          await page.waitForTimeout(100)
          assert.equal(await page.locator('#card-toc').evaluate(e => getComputedStyle(e).animationDuration), '0.45s')
          await page.waitForTimeout(450)
          assert.equal(await page.locator('#toc-toggle').getAttribute('aria-expanded'), 'false')
          await page.locator('#toc-toggle').click()
          await page.waitForTimeout(650)
          await page.locator('#card-toc .toc-link').nth(4).click()
          await page.waitForTimeout(450)
          assert.equal(await page.locator('#toc-toggle').getAttribute('aria-expanded'), 'false')
          assert.ok(await page.evaluate(() => scrollY > 0))
        }
      }
      await page.evaluate(() => document.getElementById('darkmode').click())
      assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark')
      await page.screenshot({ path: `qa/${name}-${width}-dark.png` })
      reports.push({ width, name, ...audit })
    }
    for (const path of ['/comments/', '/link/', '/Gallery/', '/music/', '/movies/', '/tags/', '/tags/harness/', '/tags/agent/', '/tags/interview/', '/categories/', '/categories/ai-agent/', '/archives/', '/about/']) {
      await page.goto(origin + base + path, { waitUntil: 'load' })
      await page.evaluate(async () => {
        for (const image of document.images) { image.loading = 'eager'; await image.decode() }
      })
      assert.ok((await page.locator('#page, #archive').innerText()).trim().length > 0, `empty page: ${path}`)
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width} ${path}: overflow`)
      if (path === '/comments/') {
        assert.equal(await page.locator('.guestbook-contact').getAttribute('href'), 'mailto:1677518554@qq.com?subject=%E5%8D%9A%E5%AE%A2%E7%95%99%E8%A8%80')
        await page.locator('.guestbook-contact').scrollIntoViewIfNeeded()
        assert.equal(await page.locator('#article-container img[src="/img/favicon.png"]').count(), 0)
      }
      if (path === '/link/') {
        assert.equal(await page.locator('.flink-list-item > a').count(), 2)
        // Avatars must follow the friend link rather than opening the image dialog.
        assert.equal(await page.locator('.flink-item-icon img').evaluateAll(images => images.every(image => image.closest('a').target === '_blank')), true)
      }
      if (['/comments/', '/link/', '/Gallery/'].includes(path)) {
        await page.locator('#content-inner').scrollIntoViewIfNeeded()
        await page.waitForTimeout(600)
        await page.screenshot({ path: `qa/${path.slice(1, -1)}-${width}.png` })
      }
    }
    assert.deepEqual(errors, [], `browser errors: ${errors.join('; ')}`)
    assert.deepEqual(external, [], 'external resources requested')
    assert.deepEqual(failures, [], 'HTTP failures')
    await context.close()
  }
  const request = await browser.newContext()
  for (const route of ['/archives/', '/archives/2026/', '/archives/2026/10/', '/tags/', '/tags/harness/', '/tags/agent/', '/tags/interview/', '/categories/', '/categories/ai-agent/', '/about/', '/Gallery/', '/comments/', '/link/', '/music/', '/movies/', '/search.xml', '/sitemap.xml']) {
    assert.equal((await request.request.get(origin + base + route)).status(), 200, route)
  }
  assert.equal((await request.request.get(origin + base + '/2022/12/21/测试用/')).status(), 404)
  await request.close()
  await writeFile('qa/verification.json', JSON.stringify(reports, null, 2))
  console.log(JSON.stringify(reports, null, 2))
} finally {
  await browser.close()
}

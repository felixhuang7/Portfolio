import { chromium } from 'playwright'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'

const here = dirname(fileURLToPath(import.meta.url))
const output = resolve(here, '../assets/screenshots')
const mockImages = resolve(here, '../assets/mock-images')
const cropperStyles = resolve(here, '../../zhishi-picture/yu-picture/yu-picture-frontend/node_modules/vue-cropper/dist/index.css')
const base = process.env.ZHISHI_FRONTEND_URL || 'http://127.0.0.1:5199'
const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'

const imageDataUri = (filename) => `data:image/jpeg;base64,${readFileSync(resolve(mockImages, filename)).toString('base64')}`
const logoDataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(readFileSync(resolve(here, '../assets/img/zhishi-picture-logo.svg'), 'utf8'))}`

const imageSeeds = [
  { title: '湖畔现代住宅', file: 'architecture.jpg', color: '#7c8f9c', category: '建筑', tags: ['建筑', '空间'] },
  { title: '森林晨光步道', file: 'forest.jpg', color: '#4f6f35', category: '自然', tags: ['森林', '旅行'] },
  { title: '陶瓷器物静物', file: 'ceramics.jpg', color: '#aa9a88', category: '产品', tags: ['陶瓷', '静物'] },
  { title: '健康餐食俯拍', file: 'food.jpg', color: '#4f9aaa', category: '美食', tags: ['餐食', '生活'] },
  { title: '雨夜城市街景', file: 'city-night.jpg', color: '#182e42', category: '城市', tags: ['夜景', '街道'] },
  { title: '产品团队工作坊', file: 'workshop.jpg', color: '#b78f70', category: '团队', tags: ['协作', '会议'] },
  { title: '蓝色海岸航拍', file: 'coast.jpg', color: '#31758d', category: '旅行', tags: ['海岸', '风景'] },
  { title: '极简家居空间', file: 'interior.jpg', color: '#c7b9a5', category: '家居', tags: ['室内', '设计'] },
  { title: '山野晨跑记录', file: 'runner.jpg', color: '#b48a56', category: '运动', tags: ['跑步', '户外'] },
  { title: '粉色大丽花微距', file: 'flower.jpg', color: '#c02f76', category: '自然', tags: ['花卉', '微距'] },
  { title: '桌面办公场景', file: 'workspace.jpg', color: '#9e927d', category: '办公', tags: ['桌面', '效率'] },
  { title: '高山镜湖清晨', file: 'mountain-lake.jpg', color: '#27798b', category: '旅行', tags: ['高山', '湖泊'] },
]

const images = imageSeeds.map((seed, index) => ({
  id: index + 1,
  name: seed.title,
  introduction: `${seed.title}，用于团队空间的演示测试数据。`,
  url: imageDataUri(seed.file),
  thumbnailUrl: imageDataUri(seed.file),
  category: seed.category,
  tags: seed.tags,
  picWidth: 960,
  picHeight: 640,
  picScale: '3:2',
  picSize: 786432 + index * 10240,
  picFormat: 'jpg',
  picColor: seed.color,
  permissionList: ['picture:view', 'picture:edit', 'picture:delete'],
  spaceId: 1001,
  userId: 1,
  createTime: `2026-08-${String(index + 1).padStart(2, '0')}T10:00:00`,
  user: { id: 1, userName: '智识团队' },
}))

const outPaintingImage = {
  ...images[0],
  id: 9901,
  name: 'AI 扩图结果',
  introduction: '由 AI 扩图任务生成的横向背景补全版本。',
  url: imageDataUri('cabin-outpaint-result.jpg'),
  thumbnailUrl: imageDataUri('cabin-outpaint-result.jpg'),
}

const editImageUrl = imageDataUri('cabin-original.jpg')

const loginUser = {
  id: 1,
  userName: '智识团队',
  userRole: 'admin',
  userAvatar: logoDataUri,
}

const teamSpace = {
  id: 1001,
  spaceName: '智识产品设计团队',
  spaceType: 1,
  spaceLevel: 1,
  totalSize: 73400320,
  maxSize: 209715200,
  totalCount: 128,
  maxCount: 500,
  permissionList: ['spaceUser:manage', 'picture:view', 'picture:upload', 'picture:edit', 'picture:delete'],
  userId: 1,
}

const searchResults = imageSeeds.slice(3, 11).map((seed, index) => ({
  name: `${seed.title} 相似结果`,
  thumbUrl: imageDataUri(seed.file),
  fromUrl: `https://example.com/zhishi/search/${index + 1}`,
}))

const apiData = (pathname, request) => {
  if (pathname === '/api/picture/search/color') {
    return images.filter((image) => ['#31758d', '#27798b'].includes(image.picColor))
  }
  const responses = {
    '/api/user/get/login': loginUser,
    '/api/spaceUser/list/my': [{ id: 11, spaceId: 1001, userId: 1, spaceRole: 'admin', space: teamSpace }],
    '/api/space/get/vo': teamSpace,
    '/api/picture/list/page/vo': { records: images, total: images.length, size: 12, current: 1 },
    '/api/picture/get/vo': {
      ...images[0],
      name: '湖畔木屋原图',
      introduction: '用于展示 AI 横向扩图与多人协同编辑的真实摄影测试素材。',
      url: editImageUrl,
      thumbnailUrl: editImageUrl,
    },
    '/api/picture/search/picture': searchResults,
    '/api/picture/tag_category': { categoryList: ['设计', '摄影', '运营'], tagList: ['品牌', '视觉', '产品', '活动', 'UI'] },
    '/api/picture/out_painting/create_task': { output: { taskId: 'demo-outpainting-20260806' } },
    '/api/picture/out_painting/get_task': {
      output: { taskStatus: 'SUCCEEDED', outputImageUrl: outPaintingImage.url },
    },
    '/api/picture/upload/url': outPaintingImage,
    '/api/space/analyze/usage': { usedSize: 73400320, maxSize: 209715200, sizeUsageRatio: 35, usedCount: 128, maxCount: 500, countUsageRatio: 26 },
    '/api/space/analyze/category': [
      { category: '设计', count: 52, totalSize: 30408704 },
      { category: '摄影', count: 36, totalSize: 23068672 },
      { category: '运营', count: 25, totalSize: 12582912 },
      { category: '产品', count: 15, totalSize: 7340032 },
    ],
    '/api/space/analyze/tag': [
      { tag: '品牌', count: 42 }, { tag: '视觉', count: 37 }, { tag: '产品', count: 31 },
      { tag: '活动', count: 27 }, { tag: 'UI', count: 24 }, { tag: '摄影', count: 18 },
      { tag: '海报', count: 16 }, { tag: '报告', count: 12 },
    ],
    '/api/space/analyze/size': [
      { sizeRange: '< 500 KB', count: 31 }, { sizeRange: '500 KB - 1 MB', count: 45 },
      { sizeRange: '1 - 3 MB', count: 38 }, { sizeRange: '> 3 MB', count: 14 },
    ],
    '/api/space/analyze/user': [
      { period: '08-01', count: 7 }, { period: '08-02', count: 12 }, { period: '08-03', count: 9 },
      { period: '08-04', count: 18 }, { period: '08-05', count: 14 }, { period: '08-06', count: 21 },
    ],
    '/api/space/analyze/rank': [
      { spaceName: '智识产品设计', totalSize: 73400320 }, { spaceName: '品牌中心', totalSize: 58720256 },
      { spaceName: '运营素材库', totalSize: 45088768 }, { spaceName: '移动端团队', totalSize: 32505856 },
    ],
  }
  return responses[pathname] ?? true
}

async function preparePage(context) {
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  await page.route('**/api/**', async (route) => {
    const requestUrl = new URL(route.request().url())
    if (requestUrl.port !== '8123' || !requestUrl.pathname.startsWith('/api/')) {
      await route.continue()
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify({ code: 0, data: apiData(requestUrl.pathname, route.request()), message: 'ok' }),
    })
  })
  await page.addInitScript(() => {
    class DemoWebSocket {
      static CONNECTING = 0
      static OPEN = 1
      static CLOSING = 2
      static CLOSED = 3
      constructor(url) {
        this.url = url
        this.readyState = DemoWebSocket.CONNECTING
        setTimeout(() => {
          this.readyState = DemoWebSocket.OPEN
          this.onopen?.({ type: 'open' })
        }, 30)
      }
      send(raw) {
        const request = JSON.parse(raw)
        if (request.type === 'ENTER_EDIT') {
          setTimeout(() => this.onmessage?.({ data: JSON.stringify({
            type: 'ENTER_EDIT',
            message: '智识团队进入协同编辑',
            user: { id: 1, userName: '智识团队' },
          }) }), 60)
        }
      }
      close() {
        this.readyState = DemoWebSocket.CLOSED
        this.onclose?.({ type: 'close', code: 1000 })
      }
    }
    window.WebSocket = DemoWebSocket
  })
  return { page, errors }
}

async function cleanBrand(page) {
  await page.evaluate((brandLogo) => {
    if (!document.getElementById('portfolio-capture-cleanup')) {
      const style = document.createElement('style')
      style.id = 'portfolio-capture-cleanup'
      style.textContent = `
        html, body { overflow-x: hidden !important; }
        vite-plugin-vue-devtools,
        vue-devtools,
        #__vue-devtools-container__,
        .vue-devtools__anchor,
        .vue-devtools__panel {
          display: none !important;
        }
      `
      document.head.appendChild(style)
    }
    const replacements = new Map([
      ['鱼皮云图库', '智识图库'],
      ['编程导航', '项目说明'],
      ['程序员鱼皮', '智识图库'],
    ])
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    const nodes = []
    while (walker.nextNode()) nodes.push(walker.currentNode)
    for (const node of nodes) {
      let value = node.nodeValue || ''
      for (const [from, to] of replacements) value = value.replaceAll(from, to)
      node.nodeValue = value
    }
    document.querySelectorAll('a[href*="codefather"], a[target="_blank"]').forEach((link) => {
      if (link.textContent?.includes('项目说明')) link.closest('li')?.remove()
    })
    document.querySelectorAll('*').forEach((element) => {
      const text = element.textContent?.trim() || ''
      const style = window.getComputedStyle(element)
      const isSmallFloating = style.position === 'fixed' && element.getBoundingClientRect().height < 120
      if (isSmallFloating && (text.includes('项目说明 by') || text.includes('Vue DevTools'))) {
        element.remove()
      }
    })
    document.querySelectorAll('.title-bar .logo').forEach((logo) => {
      logo.setAttribute('src', brandLogo)
    })
  }, logoDataUri)
}

const browser = await chromium.launch({ executablePath: edge, headless: true })
const scenes = [
  {
    name: 'zp-01-gallery.png',
    path: '/space/1001',
    ready: '#spaceDetailPage',
  },
  {
    name: 'zp-02-color-search.png',
    path: '/space/1001',
    ready: '#spaceDetailPage .vc-color-wrap',
    action: async (page) => {
      await page.locator('.vc-color-wrap').first().click()
      await page.locator('.vc-colorpicker').first().waitFor({ state: 'visible' })
      const responsePromise = page.waitForResponse((response) => response.url().includes('/api/picture/search/color'), { timeout: 5000 }).catch(() => null)
      const picker = await page.locator('.vc-colorpicker').first().boundingBox()
      if (picker) {
        await page.mouse.click(picker.x + 222, picker.y + 36)
      }
      await responsePromise
      await page.waitForTimeout(300)
    },
  },
  {
    name: 'zp-03-image-search.png',
    path: '/search_picture?pictureId=1',
    ready: '#searchPicturePage',
  },
  {
    name: 'zp-04-ai-outpainting.png',
    path: '/add_picture?id=1&spaceId=1001',
    ready: '#addPicturePage',
    action: async (page) => {
      await page.getByRole('button', { name: /AI 扩图/ }).click()
      await page.locator('.image-out-painting').waitFor({ state: 'visible' })
      await page.getByRole('button', { name: /生成图片/ }).click()
      await page.locator('.image-out-painting img').nth(1).waitFor({ state: 'visible', timeout: 6000 })
    },
  },
  {
    name: 'zp-05-collaboration.png',
    path: '/add_picture?id=1&spaceId=1001',
    ready: '#addPicturePage',
    action: async (page) => {
      await page.getByRole('button', { name: /编辑图片/ }).click()
      await page.locator('.image-cropper').waitFor({ state: 'visible' })
      await page.addStyleTag({ path: cropperStyles })
      const activeCropper = page.locator('.ant-modal-content:visible .vue-cropper')
      await activeCropper.evaluate((element) => element.__vueParentComponent?.proxy?.refresh())
      await page.waitForTimeout(600)
      await page.getByRole('button', { name: '进入编辑' }).click()
      await page.getByRole('button', { name: /正在编辑/ }).waitFor()
      const modalButtons = page.locator('.ant-modal-content button')
      const labels = (await modalButtons.allTextContents()).map((label) => label.replace(/\s/g, ''))
      if (!labels.includes('放大')) throw new Error(`协同编辑弹窗未找到放大按钮：${labels.join(' / ')}`)
      const zoomButton = modalButtons.filter({ hasText: /放\s*大/ }).first()
      await zoomButton.click()
      await zoomButton.click()
      await page.waitForTimeout(300)
      const topLeft = await page.locator('.ant-modal-content:visible .crop-point.point1').boundingBox()
      if (topLeft) {
        await page.mouse.move(topLeft.x + topLeft.width / 2, topLeft.y + topLeft.height / 2)
        await page.mouse.down()
        await page.mouse.move(topLeft.x + 70, topLeft.y + 70, { steps: 12 })
        await page.mouse.up()
      }
      const bottomRight = await page.locator('.ant-modal-content:visible .crop-point.point8').boundingBox()
      if (bottomRight) {
        await page.mouse.move(bottomRight.x + bottomRight.width / 2, bottomRight.y + bottomRight.height / 2)
        await page.mouse.down()
        await page.mouse.move(bottomRight.x - 70, bottomRight.y - 70, { steps: 12 })
        await page.mouse.up()
      }
      await page.waitForTimeout(300)
      await page.evaluate(() => {
        const style = document.createElement('style')
        style.textContent = '#addPicturePage img { visibility: hidden !important; }'
        document.head.appendChild(style)
      })
    },
  },
]

const selectedScenes = process.env.CAPTURE_SCENE
  ? scenes.filter((scene) => scene.name === process.env.CAPTURE_SCENE)
  : scenes

for (const scene of selectedScenes) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
    locale: 'zh-CN',
  })
  const { page, errors } = await preparePage(context)
  await page.goto(`${base}${scene.path}`, { waitUntil: 'networkidle' })
  try {
    await page.locator(scene.ready).first().waitFor({ state: 'visible' })
  } catch (error) {
    console.error(JSON.stringify({ scene: scene.name, url: page.url(), errors, body: await page.locator('body').innerText() }))
    throw error
  }
  await cleanBrand(page)
  await scene.action?.(page)
  await cleanBrand(page)
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(700)
  await page.screenshot({ path: resolve(output, scene.name), fullPage: false })
  const audit = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    hasYupi: document.body.innerText.includes('鱼皮'),
    hasCodefather: document.body.innerText.includes('编程导航'),
    brokenImages: [...document.images].filter((image) => !image.complete || image.naturalWidth === 0).length,
  }))
  console.log(JSON.stringify({ name: scene.name, errors, ...audit }))
  await context.close()
}

await browser.close()

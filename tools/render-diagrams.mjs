// Render Mermaid at build time, so readers download SVG instead of a JS runtime.
import { chromium } from 'playwright'
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('..', import.meta.url))
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage({ viewport: { width: 1800, height: 1000 } })
await page.setContent('<html><body></body></html>')
await page.addScriptTag({ path: resolve(root, 'tools/node_modules/mermaid/dist/mermaid.min.js') })
await page.evaluate(() => mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'strict', fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif' }))
await mkdir(resolve(root, 'img/diagrams'), { recursive: true })
let i = 0
for (const file of await readdir(resolve(root, 'content/diagrams'))) {
  if (!file.endsWith('.mmd')) continue
  const code = await readFile(resolve(root, 'content/diagrams', file), 'utf8')
  const svg = await page.evaluate(async ({ code, id }) => {
    const { svg } = await mermaid.render(id, code)
    const holder = document.createElement('div')
    holder.innerHTML = svg
    return new XMLSerializer().serializeToString(holder.querySelector('svg'))
  }, { code, id: `diagram-${i++}` })
  await writeFile(resolve(root, 'img/diagrams', file.replace('.mmd', '.svg')), svg)
  console.log(file)
}
await browser.close()

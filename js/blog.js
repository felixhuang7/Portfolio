// Small local enhancements; initial content remains available without JavaScript.
document.addEventListener('DOMContentLoaded', () => {
  const toc = document.getElementById('card-toc')
  const tocClose = document.getElementById('toc-close')
  const tocToggle = document.getElementById('toc-toggle')
  if (toc && tocClose && tocToggle) {
    const desktop = matchMedia('(min-width: 901px)')
    const sync = () => {
      const open = desktop.matches
        ? !document.documentElement.classList.contains('hide-aside')
        : getComputedStyle(toc).pointerEvents !== 'none'
      tocToggle.setAttribute('aria-expanded', String(open))
      toc.inert = !open
    }
    const setOpen = open => {
      if (desktop.matches) {
        document.documentElement.classList.toggle('hide-aside', !open)
      } else if (window.mobileToc) {
        window.mobileToc[open ? 'open' : 'close']()
      }
      sync()
    }
    tocClose.addEventListener('click', () => { setOpen(false); tocToggle.focus() })
    tocToggle.addEventListener('click', () => setOpen(tocToggle.getAttribute('aria-expanded') !== 'true'))
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !desktop.matches) setOpen(false)
    })
    new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    new MutationObserver(sync).observe(toc, { attributes: true, attributeFilter: ['style'] })
    desktop.addEventListener('change', sync)
    document.body.classList.add('toc-interactive')
    // Each article starts open; collapsing a TOC only affects this visit.
    setOpen(true)
  }
  const article = document.getElementById('article-container')
  if (!article) return
  article.querySelectorAll('pre').forEach(pre => {
    const code = pre.querySelector('code')
    if (!code) return
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'copy-code'
    button.textContent = '复制代码'
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code.textContent)
        button.textContent = '已复制'
      } catch {
        button.textContent = '请选择代码复制'
      }
      setTimeout(() => { button.textContent = '复制代码' }, 1800)
    })
    pre.appendChild(button)
  })
  // A native dialog keeps image zoom available without a CDN lightbox library.
  const dialog = document.createElement('dialog')
  dialog.className = 'image-dialog'
  const close = document.createElement('button')
  close.type = 'button'
  close.textContent = '关闭 ×'
  const image = document.createElement('img')
  close.addEventListener('click', () => dialog.close())
  dialog.append(close)
  document.body.append(dialog)
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close() })
  article.querySelectorAll('img').forEach(img => {
    if (img.classList.contains('no-lightbox')) return
    let link = img.closest('a')
    if (!link) {
      link = document.createElement('a')
      link.href = img.src
      img.replaceWith(link)
      link.append(img)
    }
    link.addEventListener('click', event => {
      event.preventDefault()
      image.src = img.src
      image.alt = img.alt
      dialog.append(image)
      dialog.showModal()
      close.focus()
    })
  })
})

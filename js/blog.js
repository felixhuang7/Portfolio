// Small local enhancements; initial content remains available without JavaScript.
document.addEventListener('DOMContentLoaded', () => {
  // Preserve native document scrolling; replace only its desktop scrollbar UI.
  const scrollbarMedia = matchMedia('(hover: hover) and (pointer: fine) and (forced-colors: none)')
  const root = document.documentElement
  const scrollbar = document.createElement('div')
  scrollbar.className = 'page-scrollbar'
  scrollbar.hidden = true
  scrollbar.tabIndex = 0
  scrollbar.setAttribute('role', 'scrollbar')
  scrollbar.setAttribute('aria-label', '页面滚动')
  scrollbar.setAttribute('aria-orientation', 'vertical')
  scrollbar.setAttribute('aria-controls', 'body-wrap')
  scrollbar.setAttribute('aria-valuemin', '0')
  scrollbar.setAttribute('aria-valuemax', '100')
  const thumb = document.createElement('div')
  thumb.className = 'page-scrollbar-thumb'
  scrollbar.append(thumb)
  document.body.append(scrollbar)
  let frame = 0
  let geometry = { range: 0, travel: 0, height: 0 }
  let drag = null
  const updateScrollbar = () => {
    frame = 0
    const viewport = root.clientHeight
    const range = Math.max(0, root.scrollHeight - viewport)
    scrollbar.hidden = !scrollbarMedia.matches || !range || getComputedStyle(document.body).overflowY === 'hidden'
    if (scrollbar.hidden) return
    const track = scrollbar.clientHeight
    const height = Math.min(track, Math.max(28, track * viewport / root.scrollHeight))
    const travel = track - height
    const progress = Math.max(0, Math.min(1, window.scrollY / range))
    geometry = { range, travel, height }
    thumb.style.height = `${height}px`
    thumb.style.transform = `translateY(${progress * travel}px)`
    scrollbar.setAttribute('aria-valuenow', String(Math.round(progress * 100)))
  }
  const scheduleScrollbar = () => {
    if (!frame) frame = requestAnimationFrame(updateScrollbar)
  }
  const syncScrollbar = () => {
    root.classList.toggle('overlay-scrollbar', scrollbarMedia.matches)
    scheduleScrollbar()
  }
  scrollbar.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !geometry.travel) return
    event.preventDefault()
    scrollbar.focus({ preventScroll: true })
    if (event.target !== thumb) {
      const position = event.clientY - scrollbar.getBoundingClientRect().top - geometry.height / 2
      window.scrollTo({ top: position / geometry.travel * geometry.range, behavior: 'instant' })
    }
    drag = { y: event.clientY, scroll: window.scrollY }
    scrollbar.setPointerCapture(event.pointerId)
    scrollbar.classList.add('dragging')
  })
  scrollbar.addEventListener('pointermove', event => {
    if (!drag || !geometry.travel) return
    window.scrollTo({ top: drag.scroll + (event.clientY - drag.y) * geometry.range / geometry.travel, behavior: 'instant' })
  })
  const endDrag = () => {
    drag = null
    scrollbar.classList.remove('dragging')
  }
  scrollbar.addEventListener('pointerup', endDrag)
  scrollbar.addEventListener('pointercancel', endDrag)
  scrollbar.addEventListener('lostpointercapture', endDrag)
  scrollbar.addEventListener('keydown', event => {
    const destinations = { ArrowDown: scrollY + 48, ArrowUp: scrollY - 48, PageDown: scrollY + innerHeight * .9, PageUp: scrollY - innerHeight * .9, Home: 0, End: geometry.range }
    if (!(event.key in destinations)) return
    event.preventDefault()
    window.scrollTo({ top: destinations[event.key], behavior: 'instant' })
  })
  window.addEventListener('scroll', scheduleScrollbar, { passive: true })
  window.addEventListener('resize', scheduleScrollbar)
  new ResizeObserver(scheduleScrollbar).observe(document.body)
  new MutationObserver(scheduleScrollbar).observe(document.body, { attributes: true, attributeFilter: ['style', 'class'] })
  scrollbarMedia.addEventListener('change', syncScrollbar)
  syncScrollbar()

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

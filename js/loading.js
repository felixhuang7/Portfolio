// Inline at the end of the document: start without waiting for deferred scripts.
(() => {
  // Let the browser paint the text/layout first, then load every page image.
  // Visible images go first; three workers keep background downloads bounded.
  const startImages = () => {
    const background = document.getElementById('web_bg')
    if (background?.dataset.background) {
      background.style.setProperty('--page-background', `url("${background.dataset.background}")`)
    }
    const visible = image => {
      const rect = image.getBoundingClientRect()
      return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight
    }
    const images = [...document.querySelectorAll('img[data-src]')]
      .sort((a, b) => Number(visible(b)) - Number(visible(a)))
    const load = image => new Promise(resolve => {
      const finish = () => {
        clearTimeout(timeout)
        image.removeEventListener('load', finish)
        image.removeEventListener('error', finish)
        resolve()
      }
      // One stalled image must not hold the remaining background queue forever.
      const timeout = setTimeout(finish, 8000)
      image.addEventListener('load', finish)
      image.addEventListener('error', finish)
      image.fetchPriority = visible(image) ? 'auto' : 'low'
      image.src = image.dataset.src
      image.removeAttribute('data-src')
      if (image.complete) finish()
    })
    const worker = async () => {
      while (images.length) await load(images.shift())
    }
    for (let i = 0; i < 3; i++) worker()
  }
  const scheduleImages = () => {
    if ('requestIdleCallback' in window) requestIdleCallback(startImages, { timeout: 300 })
    else setTimeout(startImages, 0)
  }
  if (performance.getEntriesByType('paint').some(entry => entry.name === 'first-contentful-paint')) {
    scheduleImages()
  } else if (window.PerformanceObserver?.supportedEntryTypes.includes('paint')) {
    // Animation frames may run before text is actually painted; wait for FCP.
    const painted = new PerformanceObserver(list => {
      if (!list.getEntries().some(entry => entry.name === 'first-contentful-paint')) return
      painted.disconnect()
      scheduleImages()
    })
    painted.observe({ type: 'paint', buffered: true })
  } else requestAnimationFrame(() => requestAnimationFrame(scheduleImages))

  // Prepare only a link the visitor shows interest in; leave navigation native.
  const connection = navigator.connection
  const prepared = new Set()
  let timer
  const prepare = anchor => {
    if (!anchor || connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '')) return
    if (anchor.hasAttribute('download') || anchor.target || prepared.size >= 6) return
    const url = new URL(anchor.href, location.href)
    if (url.origin !== location.origin || url.hash || !url.pathname.endsWith('/')) return
    if (url.pathname === location.pathname || prepared.has(url.href)) return
    prepared.add(url.href)
    const hint = document.createElement('link')
    hint.rel = 'prefetch'
    hint.as = 'document'
    hint.href = url.href
    document.head.append(hint)
  }
  document.addEventListener('pointerover', event => {
    clearTimeout(timer)
    const anchor = event.target.closest('a[href]')
    if (anchor) timer = setTimeout(() => prepare(anchor), 120)
  }, { passive: true })
  document.addEventListener('pointerout', () => clearTimeout(timer), { passive: true })
  document.addEventListener('focusin', event => prepare(event.target.closest('a[href]')))
  document.addEventListener('pointerdown', event => {
    if (event.button === 0) prepare(event.target.closest('a[href]'))
  }, { passive: true })
})();

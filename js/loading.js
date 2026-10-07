// Inline at the end of the document: start without waiting for deferred scripts.
(() => {
  const images = document.querySelectorAll('img[data-src]')
  const load = image => {
    image.src = image.dataset.src
    image.removeAttribute('data-src')
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        load(entry.target)
        observer.unobserve(entry.target)
      }
    }, { rootMargin: '300px 0px' })
    images.forEach(image => observer.observe(image))
  } else images.forEach(load)

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

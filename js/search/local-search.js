document.addEventListener('DOMContentLoaded', () => {
  const dialog = document.querySelector('#local-search .search-dialog')
  const mask = document.getElementById('search-mask')
  const input = document.querySelector('#local-search-input input')
  const results = document.getElementById('local-search-results')
  const loading = document.getElementById('loading-database')
  let database, previousFocus
  const close = () => {
    document.body.style.overflow = ''
    dialog.style.display = 'none'
    mask.style.display = 'none'
    previousFocus?.focus()
  }
  const render = async () => {
    const query = input.value.trim().toLowerCase()
    results.replaceChildren()
    if (!query) return
    try {
      const data = await database
      if (query !== input.value.trim().toLowerCase()) return
      const words = query.split(/\s+/)
      const matches = data.filter(item => words.every(word => (item.title + ' ' + item.content).toLowerCase().includes(word)))
      if (!matches.length) results.textContent = `找不到您查询的内容：${input.value.trim()}`
      for (const item of matches) {
        const row = document.createElement('div')
        row.className = 'local-search__hit-item'
        const link = document.createElement('a')
        link.className = 'search-result-title'
        link.href = item.url
        link.textContent = item.title
        const excerpt = document.createElement('p')
        excerpt.className = 'search-result'
        const position = Math.max(0, item.content.toLowerCase().indexOf(words[0]) - 35)
        excerpt.textContent = item.content.slice(position, position + 180) + '…'
        row.append(link, excerpt)
        results.append(row)
      }
    } catch {
      results.textContent = '搜索索引暂时无法加载，请稍后重新打开搜索。'
    }
  }
  const fetchDatabase = async () => {
    const response = await fetch(GLOBAL_CONFIG.localSearch.path)
    if (!response.ok) throw new Error('搜索索引加载失败')
    const xml = new DOMParser().parseFromString(await response.text(), 'text/xml')
    return [...xml.querySelectorAll('entry')].map(entry => ({
      title: entry.querySelector('title').textContent,
      content: entry.querySelector('content').textContent,
      url: entry.querySelector('url').textContent
    }))
  }
  const open = async () => {
    previousFocus = document.activeElement
    document.body.style.overflow = 'hidden'
    dialog.style.display = 'block'
    mask.style.display = 'block'
    input.focus()
    if (!database) {
      loading.style.display = 'block'
      database = fetchDatabase()
      try {
        await database
        loading.style.display = 'none'
        loading.nextElementSibling.style.display = 'block'
        await render()
      } catch {
        database = undefined
        loading.textContent = '搜索索引暂时无法加载，请稍后重新打开搜索。'
      }
    }
  }
  document.querySelector('#search-button > .search').addEventListener('click', open)
  document.querySelector('#local-search .search-close-button').addEventListener('click', close)
  mask.addEventListener('click', close)
  input.addEventListener('input', render)
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') close()
    if (event.key === 'Tab' && dialog.style.display === 'block') {
      const focusable = [...dialog.querySelectorAll('button, input, a[href]')]
      const first = focusable[0], last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
  })
  dialog.setAttribute('role', 'dialog')
  dialog.setAttribute('aria-modal', 'true')
  dialog.setAttribute('aria-label', '搜索文章')
})

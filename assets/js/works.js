// 作品选择页交互脚本
// 数据驱动：在 WORKS 数组里加一项即可新增一个作品卡。
// 1) 渲染作品卡片（含特色大卡 + 筹备中占位卡）
// 2) hover / 点击进入对应展示页

const WORKS = [
  {
    id: 'wikibot',
    title: 'WikiBot',
    tagline: '企业知识库问答',
    desc: '多机器人企业知识库：大模型把 GitLab 文档摄取为结构化 Wiki，LLM 选页 + 向量检索双路定位，飞书 / 前端回复带来源标注的流式回答；并含经验管理模块——模板驱动 LLM 抽取结构化经验、人工审核、写回 Git 复用。',
    cover: 'assets/screenshots/13-extra-thumb.png',
    href: 'wikibot.html',
    category: 'AI · 知识库',
    tags: ['FastAPI', 'React', 'pgvector', 'Claude', '飞书'],
    stats: [
      { n: '3.4万', l: 'wiki 页' },
      { n: '19.2万', l: '向量段落' },
      { n: '1800+', l: '真实提问' },
      { n: '双路', l: 'wiki选页+向量' },
    ],
    featured: true,
  },
  // —— 第二个作品：AgentHub ——
  {
    id: 'agenthub',
    title: 'AgentHub',
    tagline: 'MCP / Agent / Skill 统一注册中心',
    desc: '团队共享的 AI 资产仓库：把做好的 MCP Server / Agent / Skill / Prompt 上传，经审核后在 Claude Code / Cursor 里用一句话搜到、一键部署。AgentHub 对外提供 MCP 供接入，对话即操作。',
    cover: 'assets/screenshots/ah-cover-thumb.png',
    href: 'agenthub.html',
    category: 'AI · 资产治理',
    tags: ['Go', 'Next.js', 'MCP', '飞书', 'Docker'],
    stats: [
      { n: '40+', l: 'Skill 资产' },
      { n: '100+', l: '真实用户' },
      { n: '30+', l: '位贡献者' },
      { n: '对话', l: '即操作' },
    ],
    featured: true,
  },
  // —— 以下为「筹备中」占位卡，新增作品时替换为真实对象即可 ——
  { ghost: true, title: '筹备中', tagline: '更多作品正在路上', category: 'Coming Soon' },
]

const grid = document.getElementById('works-grid')
const frag = document.createDocumentFragment()

const escapeTag = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))

WORKS.forEach((w) => {
  const card = document.createElement('article')
  card.className = 'work' + (w.featured ? ' featured' : '') + (w.ghost ? ' ghost' : '')
  if (w.id) card.dataset.id = w.id

  if (w.ghost) {
    card.innerHTML = `
      <div class="work-ghost-body">
        <div class="work-ghost-ico">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </div>
        <span class="work-ghost-badge">${escapeTag(w.category)}</span>
        <h3>${escapeTag(w.title)}</h3>
        <p>${escapeTag(w.tagline)}</p>
      </div>`
    frag.appendChild(card)
    return
  }

  const tags = (w.tags || [])
    .map((t) => `<span class="work-tag">${escapeTag(t)}</span>`)
    .join('')
  const stats = (w.stats || [])
    .map((s) => `<div class="ws"><b>${escapeTag(s.n)}</b><span>${escapeTag(s.l)}</span></div>`)
    .join('')

  card.innerHTML = `
    <a class="work-cover" href="${w.href}" aria-label="进入 ${escapeTag(w.title)} 展示页">
      <img src="${w.cover}" alt="${escapeTag(w.title)} 封面" loading="lazy"
           onerror="this.style.display='none';this.parentElement.classList.add('no-img')">
      <span class="work-go">查看详情 →</span>
    </a>
    <div class="work-body">
      <div class="work-head">
        <h3>${escapeTag(w.title)}</h3>
        <span class="work-tagline">${escapeTag(w.tagline)}</span>
      </div>
      <p class="work-desc">${escapeTag(w.desc)}</p>
      <div class="work-tags">${tags}</div>
      ${stats ? `<div class="work-stats">${stats}</div>` : ''}
      <a class="work-cta" href="${w.href}">进入展示页 <span class="arr">→</span></a>
    </div>`

  // 整卡可点击（特色卡内已有链接，这里仅对非链接区域兜底）
  card.addEventListener('click', (e) => {
    if (e.target.closest('a')) return
    window.location.href = w.href
  })

  frag.appendChild(card)
})

grid.appendChild(frag)

// —— 统计：作品数 ——
const realCount = WORKS.filter((w) => !w.ghost).length
const statEl = document.getElementById('stat-works')
if (statEl) statEl.textContent = realCount

// —— 导航高亮（轻量，沿用展示页做法）——
const navLinks = document.querySelectorAll('.nav ul a')
const sections = [...document.querySelectorAll('section[id], header[id]')]
const observer = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (en.isIntersecting) {
      const id = en.target.id
      navLinks.forEach((a) => (a.style.color = a.getAttribute('href') === `#${id}` ? 'var(--ink)' : ''))
    }
  })
}, { rootMargin: '-40% 0px -55% 0px' })
sections.forEach((s) => observer.observe(s))

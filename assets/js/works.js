// 作品选择页：数据驱动渲染。新增作品只需向 WORKS 追加一项。
const WORKS = [
  {
    id: 'wikibot',
    title: 'WikiBot',
    tagline: '企业知识库问答',
    desc: '多机器人企业知识库：大模型把 GitLab 文档摄取为结构化 Wiki，LLM 选页 + 向量检索双路定位，飞书 / 前端输出带来源标注的流式回答，并把工程经验抽取、审核后写回 Git 复用。',
    cover: 'assets/screenshots/13-extra-thumb.png',
    href: 'wikibot.html',
    category: 'AI · 知识库',
    tags: ['FastAPI', 'React', 'pgvector', 'Claude', '飞书'],
    stats: [
      { n: '3.4万', l: 'Wiki 页' },
      { n: '19.2万', l: '向量段落' },
      { n: '200+', l: '用户' },
      { n: '双路', l: '选页 + 向量' },
    ],
    featured: true,
  },
  {
    id: 'agenthub',
    title: 'AgentHub',
    tagline: 'MCP / Agent / Skill 统一注册中心',
    desc: '团队共享的 AI 资产仓库：上传 MCP Server / Agent / Skill / Prompt，经审核后在 Claude Code / Cursor 中用一句话搜索、一键部署。平台对外提供 MCP 接入，让对话直接驱动资产治理。',
    cover: 'assets/screenshots/ah-cover-thumb.png',
    href: 'agenthub.html',
    category: 'AI · 资产治理',
    tags: ['Go', 'Next.js', 'MCP', '飞书', 'Docker'],
    stats: [
      { n: '40+', l: 'Skill 资产' },
      { n: '100+', l: '真实用户' },
      { n: '30+', l: '贡献者' },
      { n: '对话', l: '即操作' },
    ],
    featured: true,
  },
  {
    id: 'zhishi-picture',
    title: '智识图库',
    tagline: '可协同的企业级云图库平台',
    desc: '以图片全生命周期管理为基础，串联公共图库、私有空间与团队空间；通过细粒度 RBAC、WebSocket + Disruptor 协同链路、以图搜图、颜色检索、AI 扩图与空间分析，展示一套完整的 Java 后端工程实践。',
    cover: 'assets/screenshots/zp-01-gallery.png',
    href: 'zhishi-picture.html',
    category: 'Java · 云图库',
    tags: ['Spring Boot', 'WebSocket', 'Sa-Token', 'ShardingSphere', '腾讯云 COS'],
    featured: true,
  },
  {
    id: 'ai-agent',
    title: 'AI 智能体应用平台',
    tagline: '三个智能体，一套可扩展执行底座',
    desc: '基于 Spring Boot 3 与 Spring AI 构建 TripMind 旅行规划、MyManus 通用工具和情感陪伴智能体；以 ChatMemory、SSE 流式响应、MCP / Tool Calling 与 ReAct 状态机串起从理解需求到调用外部能力的完整链路。',
    cover: 'assets/screenshots/ai-agent-console-cover.png',
    href: 'ai-agent.html',
    category: 'Java · AI Agent',
    tags: ['Spring AI', 'ReAct', 'MCP', 'Tool Calling', 'SSE'],
    featured: true,
  },
]

const grid = document.getElementById('works-grid')
const frag = document.createDocumentFragment()
const escapeTag = (s) => String(s).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
}[c]))

WORKS.forEach((work) => {
  const card = document.createElement('article')
  card.className = `work${work.featured ? ' featured' : ''}`
  card.dataset.id = work.id
  const tags = work.tags.map((tag) => `<span class="work-tag">${escapeTag(tag)}</span>`).join('')
  const stats = (work.stats || []).map((stat) => `<div class="ws"><b>${escapeTag(stat.n)}</b><span>${escapeTag(stat.l)}</span></div>`).join('')
  const statsBlock = stats ? `<div class="work-stats">${stats}</div>` : ''

  card.innerHTML = `
    <a class="work-cover" href="${escapeTag(work.href)}" aria-label="进入 ${escapeTag(work.title)} 展示页">
      <img src="${escapeTag(work.cover)}" alt="${escapeTag(work.title)} 封面" loading="lazy"
        onerror="this.style.display='none';this.parentElement.classList.add('no-img')">
      <span class="work-go">查看完整项目 →</span>
    </a>
    <div class="work-body">
      <div class="work-head"><h3>${escapeTag(work.title)}</h3><span class="work-tagline">${escapeTag(work.tagline)}</span></div>
      <p class="work-desc">${escapeTag(work.desc)}</p>
      <div class="work-tags">${tags}</div>
      ${statsBlock}
      <a class="work-cta" href="${escapeTag(work.href)}">进入展示页 <span class="arr">→</span></a>
    </div>`

  card.addEventListener('click', (event) => {
    if (!event.target.closest('a')) window.location.href = work.href
  })
  frag.appendChild(card)
})

grid.appendChild(frag)

const navLinks = document.querySelectorAll('.nav ul a')
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return
    navLinks.forEach((link) => {
      link.style.color = link.getAttribute('href') === `#${entry.target.id}` ? 'var(--ink)' : ''
    })
  })
}, { rootMargin: '-40% 0px -55% 0px' })
document.querySelectorAll('section[id], header[id]').forEach((section) => observer.observe(section))

// WikiBot 展示页交互脚本
// 1) 动态渲染截图画廊（图片缺失时显示占位，不报错）
// 2) 灯箱放大查看

const SHOTS = [
  { file: '13-extra.png',           title: '问答页面', badge: 'Web', desc: 'Web 问答首页：展示历史会话与热门问题，并可选择机器人、知识库、回答模式和常见问题入口。' },
  { file: '10-chat.png',            title: '前端问答', badge: 'Web', desc: 'Web 端完整回答：呈现分歧来源、AI 延展分析、原文件参考链接及复制、重试与反馈操作。' },
  { file: '11-wiki-kb.png',         title: '知识库页面', badge: 'Wiki', desc: '知识库总览：展示文件、源摘要、实体页和概念页统计，以及 Group 权限、构建状态与常见问题排行。' },
  { file: '飞书询问与热门问题.png', title: '飞书问答与热门问题', badge: '飞书', desc: '飞书机器人问答入口：发送问候即可开始查询，并展示近 30 天常见问题及一键提问按钮。' },
  { file: '飞书回答-带源文件链接与反馈按钮.png', title: '飞书回答与来源反馈', badge: '飞书', desc: '飞书端回答卡片：区分知识库内容与 AI 分析，附可点击的参考源文件，并提供有帮助与无帮助反馈按钮。' },
  { file: '飞书命令管理.png',       title: '飞书命令与模式切换', badge: '飞书', desc: '飞书 /help 命令面板：支持 Wiki 与经验管理模式切换、单条前缀查询、审核列表和状态查看。' },
  { file: '02-my-repos.png',         title: '仓库管理', badge: '后台', desc: '管理知识库仓库：查看 URL、分支、类型、所属 Group、同步时间和目录过滤，并支持注册、同步、编辑与删除。' },
  { file: '04-admin-metrics.png',    title: 'RAG 性能监控', badge: '监控', desc: '按天查看查询量、P10/均值分、Fallback 率、改写率、知识库意图、P95 延迟、双路率与 LLM 补充页等指标。' },
  { file: '06-admin-modules.png',    title: '模块管理', badge: '配置', desc: '管理问答与检索模块开关：包括标题上下文增强、关键词双路径、文本清洗、意图识别、问题改写和候选扩大等能力。' },
  { file: '08-feedback.png',         title: '反馈汇总', badge: '运营', desc: '汇总各 Group 的用户评价、问题、回答摘要与补充说明，支持筛选、检索及导出负面反馈。' },
  { file: '12-feedback-loop.png',   title: '反馈规则审核', badge: '闭环', desc: '审核从负反馈中提炼的提示规则：查看原始问题、用户反馈、规则建议、置信分和状态，并执行生成、通过、拒绝或启用。' },
  { file: '09-group.png',           title: 'Group 成员管理', badge: 'Group', desc: 'Group 成员管理页：配置公开访问，添加成员，并维护成员角色、保密访问权限和成员移除操作。' },
  { file: '14-exp-template.png',    title: '模板管理', badge: '经验', desc: '经验模板编辑器：管理模板与激活状态，编辑 Markdown 模板，查看解析字段、提取 Prompt 和 JSON Schema，并在测试台试提取。' },
  { file: '15-exp-items.png',       title: '经验条目', badge: '经验', desc: '经验条目页：展示状态统计和按模板字段渲染的条目，支持生成、重建、扫描、编辑、筛选与导出手册。' },
  { file: '07-logs.png',            title: '系统日志', badge: '运维', desc: '日志中心汇总操作、查询与经验审计记录，展示问答详情、模型调用链、耗时、操作人和状态。' },
  { file: '05-admin-users.png',      title: '用户管理', badge: '管理', desc: '统一管理用户 Open ID、所属 Group、全局管理员/管理员/用户角色、注册时间及成员增删。' },
]

const gallery = document.getElementById('gallery')
const frag = document.createDocumentFragment()

SHOTS.forEach((s, i) => {
  const card = document.createElement('article')
  card.className = 'shot'
  card.innerHTML = `
    <div class="frame">
      <img src="assets/screenshots/${s.file}" alt="${s.title} 截图" loading="lazy"
           onerror="this.style.display='none';this.parentElement.querySelector('.ph').style.display='block'">
      <div class="ph" style="display:none">
        截图待生成<br><span style="font-size:12px">${s.file}</span>
      </div>
    </div>
    <div class="meta">
      <h4>${s.title} <span class="badge">${s.badge}</span></h4>
      <p>${s.desc}</p>
    </div>`
  card.addEventListener('click', () => openLightbox(s))
  frag.appendChild(card)
})
gallery.appendChild(frag)

// ---- 灯箱 ----
const lb = document.getElementById('lightbox')
const lbImg = document.getElementById('lbImg')
const lbCap = document.getElementById('lbCap')
function openLightbox(s){
  lbImg.src = `assets/screenshots/${s.file}`
  lbCap.textContent = `${s.title} — ${s.desc}`
  lb.classList.add('open')
  document.body.style.overflow = 'hidden'
}
function closeLightbox(){
  lb.classList.remove('open')
  document.body.style.overflow = ''
}
document.getElementById('lbClose').addEventListener('click', closeLightbox)
lb.addEventListener('click', (e)=>{ if(e.target === lb || e.target.id === 'lbClose') closeLightbox() })
document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeLightbox() })

// 通用灯箱触发：任何带 .js-lb 的元素，读取 data-file/data-title/data-desc
document.querySelectorAll('.js-lb').forEach(el => {
  el.addEventListener('click', () => openLightbox({
    file: el.dataset.file,
    title: el.dataset.title || '',
    desc: el.dataset.desc || '',
  }))
})

// ---- 导航高亮当前区块（轻量）----
const navLinks = document.querySelectorAll('.nav ul a')
const sections = [...document.querySelectorAll('section[id], header[id]')]
const observer = new IntersectionObserver((entries)=>{
  entries.forEach(en=>{
    if(en.isIntersecting){
      const id = en.target.id
      navLinks.forEach(a => a.style.color = a.getAttribute('href') === `#${id}` ? 'var(--ink)' : '')
    }
  })
}, { rootMargin: '-40% 0px -55% 0px' })
sections.forEach(s => observer.observe(s))

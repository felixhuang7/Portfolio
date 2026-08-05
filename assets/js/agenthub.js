// AgentHub 展示页交互脚本
// 1) 动态渲染截图画廊（图片缺失时显示占位，不报错）
// 2) 灯箱放大查看
// 3) 导航高亮当前区块

const SHOTS = [
  { file: 'ah-01-skills.png',       title: 'Skills 资产浏览', badge: '网页', desc: '登录后的资产首页：Skills 标签页，卡片网格展示名称、版本、来源、发布者与可见性。' },
  { file: 'ah-02-skill-detail.png', title: 'Skill 详情',     badge: '侧边抽屉', desc: '点击卡片右侧滑出详情：元数据、版本历史、审批状态、可见性设置，可切换版本、复制 JSON。' },
  { file: 'ah-03-search.png',       title: '关键字检索',     badge: '搜索', desc: '顶部搜索框实时过滤资产，跨 Server / Skill / Agent / Prompt 四类即时匹配。' },
  { file: 'ah-05-pending.png',      title: '待审批',         badge: '审批', desc: '管理员审批工作台：新发布 Skill 在此通过或驳回，每项附敏感信息扫描结果——高危（enforce）/ 中危（warn）分级标注疑似硬编码密钥、Token，凭据值已脱敏。' },
  { file: 'ah-10-approval-log.png', title: '审批记录',       badge: '审计', desc: '审批工作台「审批记录」弹窗：全部 Skill / Server 的通过 / 驳回历史，含操作人、版本、驳回理由，状态全程可追溯。' },
  { file: 'ah-06-users.png',        title: '用户与角色',     badge: '管理', desc: '系统管理 → 用户面板：100+ 名用户，飞书 union_id（ou_ 开头 32 位 hex）为主键，user / developer / admin 三级角色分级管理。' },
  { file: 'ah-07-groups.png',       title: '用户组',         badge: '权限', desc: '用户组与成员管理：按组授权资源可见性，实现数据集等敏感资产的细粒度访问控制。' },
  { file: 'ah-09-guide.png',        title: '使用指引',       badge: '引导', desc: 'Guide 页：三种使用方式（AI 对话 / 网页 / arctl 命令行）与客户端接入说明。' },
]

const gallery = document.getElementById('gallery')
const frag = document.createDocumentFragment()
const thumbnailFile = (file) => file.replace(/(\.[^.]+)$/, '-thumb$1')

SHOTS.forEach((s) => {
  const card = document.createElement('article')
  card.className = 'shot'
  card.innerHTML = `
    <div class="frame">
      <img src="assets/screenshots/${thumbnailFile(s.file)}" alt="${s.title} 截图" loading="lazy" decoding="async"
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

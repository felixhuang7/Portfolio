document.querySelectorAll('.agent-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.agent-tab').forEach((item) => item.classList.toggle('active', item === tab))
    document.querySelectorAll('.agent-panel').forEach((panel) => panel.classList.toggle('active', panel.id === tab.dataset.target))
  })
})

const navLinks = document.querySelectorAll('.ai-agent-page .nav ul a')
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return
    navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`))
  })
}, { rootMargin: '-40% 0px -55% 0px' })
document.querySelectorAll('.ai-agent-page section[id], .ai-agent-page header[id]').forEach((section) => observer.observe(section))

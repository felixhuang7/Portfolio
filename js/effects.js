// Local replacements for the old WOW, Typed, fireworks and power-mode effects.
document.addEventListener('DOMContentLoaded', () => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
  const active = () => !reducedMotion.matches && !document.hidden
  const subtitle = document.getElementById('subtitle')
  const fallback = subtitle?.textContent || ''
  const phrases = ['Welcome to 🍞芝士🍞 home 🧐🧐🧐', 'Happy every day! 😉😉😉', fallback]
  let typingTimer, phrase = 0, letters = Array.from(fallback), count = letters.length, deleting = true

  const type = () => {
    if (!subtitle || !active()) return
    subtitle.classList.add('typing')
    if (deleting) {
      count = Math.max(0, count - 1)
      subtitle.textContent = letters.slice(0, count).join('')
      if (count === 0) {
        deleting = false
        letters = Array.from(phrases[phrase])
        typingTimer = setTimeout(type, 300)
      } else typingTimer = setTimeout(type, 45)
    } else {
      count++
      subtitle.textContent = letters.slice(0, count).join('')
      if (count >= letters.length) {
        deleting = true
        phrase = (phrase + 1) % phrases.length
        typingTimer = setTimeout(type, 1800)
      } else typingTimer = setTimeout(type, 110)
    }
  }
  if (subtitle && active()) typingTimer = setTimeout(type, 1800)

  // Nothing is hidden while waiting for the observer or a slow resource.
  const reveal = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting || !active()) continue
      const card = entry.target
      card.classList.add(card.classList.contains('card-widget') && card.id !== 'card-toc' ? 'motion-enter-right' : 'motion-enter-left')
      card.dataset.motionRevealed = 'true'
      reveal.unobserve(card)
    }
  }, { threshold: .08 })
  document.querySelectorAll('.recent-post-item, .card-widget, .pagination').forEach(card => reveal.observe(card))

  // Allocate a canvas on the first interaction; request frames only while particles exist.
  const colors = ['#fff1a8', '#ff806f', '#62e6d4', '#c58cff', '#62cfff', '#ff9fc8', '#ffffff']
  let canvas, context, frame, previousTime = 0, lastInput = 0
  let particles = []
  const prepare = () => {
    if (!canvas) {
      canvas = document.createElement('canvas')
      canvas.className = 'effects-canvas fireworks'
      canvas.setAttribute('aria-hidden', 'true')
      document.body.append(canvas)
      context = canvas.getContext('2d')
    }
    if (!context) return false
    const scale = Math.min(devicePixelRatio || 1, 1.5)
    const width = Math.round(innerWidth * scale), height = Math.round(innerHeight * scale)
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
      context.setTransform(scale, 0, 0, scale, 0, 0)
    }
    return true
  }
  const draw = time => {
    frame = undefined
    if (!active()) { particles = []; context?.clearRect(0, 0, innerWidth, innerHeight); return }
    const step = Math.min((time - previousTime) / 16.67 || 1, 2)
    previousTime = time
    context.clearRect(0, 0, innerWidth, innerHeight)
    particles = particles.filter(particle => particle.life > 0)
    for (const particle of particles) {
      particle.px = particle.x
      particle.py = particle.y
      particle.x += particle.vx * step
      particle.y += particle.vy * step
      particle.vy += .045 * step
      particle.life -= step
      context.globalAlpha = Math.max(0, particle.life / particle.total)
      context.fillStyle = particle.color
      context.shadowBlur = particle.radius * 3
      context.shadowColor = particle.color
      context.strokeStyle = particle.color
      context.lineWidth = particle.radius * 1.35
      context.lineCap = 'round'
      context.beginPath()
      context.moveTo(particle.px, particle.py)
      context.lineTo(particle.x, particle.y)
      context.stroke()
      context.beginPath()
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
      context.fill()
    }
    context.globalAlpha = 1
    context.shadowBlur = 0
    if (particles.length) frame = requestAnimationFrame(draw)
    else { context.clearRect(0, 0, innerWidth, innerHeight); previousTime = 0 }
  }
  const burst = (x, y, amount, speed) => {
    if (!active() || !prepare()) return
    particles = particles.slice(-180)
    for (let i = 0; i < amount; i++) {
      const angle = Math.random() * Math.PI * 2
      const velocity = (.4 + Math.random()) * speed
      const life = 34 + Math.random() * 28
      particles.push({ x, y, vx: Math.cos(angle) * velocity, vy: Math.sin(angle) * velocity,
        px: x, py: y, life, total: life, radius: 2.2 + Math.random() * 2.5, color: colors[i % colors.length] })
    }
    if (!frame) frame = requestAnimationFrame(draw)
  }
  document.addEventListener('pointerdown', event => {
    if (event.button !== 0) return
    burst(event.clientX, event.clientY, innerWidth < 768 ? 28 : 48, 3.6)
  }, { passive: true })
  document.addEventListener('input', event => {
    const input = event.target
    if (!active() || !input.matches('input:not([type="password"]), textarea, [contenteditable="true"]')) return
    if (performance.now() - lastInput < 70) return
    lastInput = performance.now()
    const rect = input.getBoundingClientRect()
    burst(rect.left + Math.min(rect.width - 12, 14 + (input.value?.length || 0) * 9), rect.top + rect.height / 2, 14, 1.8)
    input.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-1px)' },
      { transform: 'translateX(1px)' }, { transform: 'translateX(0)' }], { duration: 130 })
  }, { passive: true })
  const pause = () => {
    clearTimeout(typingTimer)
    document.documentElement.classList.toggle('motion-paused', document.hidden)
    if (!active()) {
      cancelAnimationFrame(frame)
      frame = undefined
      particles = []
      context?.clearRect(0, 0, innerWidth, innerHeight)
      if (reducedMotion.matches && subtitle) { subtitle.classList.remove('typing'); subtitle.textContent = fallback }
    } else if (subtitle) typingTimer = setTimeout(type, 1000)
  }
  document.addEventListener('visibilitychange', pause)
  reducedMotion.addEventListener('change', pause)
})

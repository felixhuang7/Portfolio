// Local replacements for the old WOW and Typed effects. Fireworks and power mode
// are restored from the original Butterfly extension and served locally.
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

  const pause = () => {
    clearTimeout(typingTimer)
    document.documentElement.classList.toggle('motion-paused', document.hidden)
    if (!active()) {
      if (reducedMotion.matches && subtitle) { subtitle.classList.remove('typing'); subtitle.textContent = fallback }
    } else if (subtitle) typingTimer = setTimeout(type, 1000)
  }
  document.addEventListener('visibilitychange', pause)
  reducedMotion.addEventListener('change', pause)
})

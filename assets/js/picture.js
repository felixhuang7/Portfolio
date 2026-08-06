const pictureNavLinks = document.querySelectorAll('.picture-page .nav ul a')
const pictureSections = document.querySelectorAll('.picture-page section[id], .picture-page header[id]')

const pictureObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return
    pictureNavLinks.forEach((link) => {
      const active = link.getAttribute('href') === `#${entry.target.id}`
      link.classList.toggle('active', active)
    })
  })
}, { rootMargin: '-35% 0px -58% 0px' })

pictureSections.forEach((section) => pictureObserver.observe(section))

const runtimeLightbox = document.getElementById('runtime-lightbox')
if (runtimeLightbox) {
  const image = runtimeLightbox.querySelector('img')
  const caption = runtimeLightbox.querySelector('p')
  const close = () => runtimeLightbox.classList.remove('open')

  document.querySelectorAll('.runtime-shot').forEach((shot) => {
    shot.addEventListener('click', () => {
      image.src = shot.dataset.image
      image.alt = shot.querySelector('h3').textContent
      caption.textContent = shot.querySelector('h3').textContent
      runtimeLightbox.classList.add('open')
    })
  })
  runtimeLightbox.querySelector('button').addEventListener('click', close)
  runtimeLightbox.addEventListener('click', (event) => {
    if (event.target === runtimeLightbox) close()
  })
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close()
  })
}

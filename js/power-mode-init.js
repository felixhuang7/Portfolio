document.addEventListener('DOMContentLoaded', () => {
  if (typeof POWERMODE === 'undefined') return
  POWERMODE.colorful = true
  POWERMODE.shake = true
  POWERMODE.mobile = false
  document.body.addEventListener('input', POWERMODE)
})

document.addEventListener('DOMContentLoaded', () => {
  if (typeof POWERMODE === 'undefined') return
  POWERMODE.colorful = false
  POWERMODE.shake = true
  POWERMODE.mobile = false
  document.body.addEventListener('input', POWERMODE)
})

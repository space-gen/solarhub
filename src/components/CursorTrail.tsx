import { useEffect } from 'react'

export default function CursorTrail() {
  useEffect(() => {
    const tails: HTMLDivElement[] = []
    const max = 8

    for (let i = 0; i < max; i++) {
      const el = document.createElement('div')
      el.style.position = 'fixed'
      el.style.pointerEvents = 'none'
      el.style.width = `${8 - (i * 0.6)}px`
      el.style.height = el.style.width
      el.style.borderRadius = '50%'
      el.style.background = `rgba(16,185,129, ${0.7 - i * 0.08})` // brand green
      el.style.transform = 'translate3d(-50%,-50%,0)'
      el.style.mixBlendMode = 'screen'
      el.style.zIndex = '9999'
      document.body.appendChild(el)
      tails.push(el)
    }

    let mouseX = -100
    let mouseY = -100
    const pos = tails.map(() => ({ x: mouseX, y: mouseY }))

    function onMove(e: MouseEvent) {
      mouseX = e.clientX
      mouseY = e.clientY
    }

    function loop() {
      pos[0].x += (mouseX - pos[0].x) * 0.35
      pos[0].y += (mouseY - pos[0].y) * 0.35
      for (let i = 1; i < tails.length; i++) {
        pos[i].x += (pos[i - 1].x - pos[i].x) * 0.25
        pos[i].y += (pos[i - 1].y - pos[i].y) * 0.25
      }
      for (let i = 0; i < tails.length; i++) {
        const el = tails[i]
        el.style.left = `${pos[i].x}px`
        el.style.top = `${pos[i].y}px`
        el.style.opacity = `${1 - i / (tails.length + 1)}`
      }
      requestAnimationFrame(loop)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    const raf = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
      tails.forEach(t => document.body.removeChild(t))
    }
  }, [])

  return null
}

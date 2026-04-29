import React, { useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'

interface MouseParallaxProps {
  children: React.ReactNode
  strength?: number
  className?: string
}

export default function MouseParallax({ children, strength = 18, className = '' }: MouseParallaxProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)

  useEffect(() => {
    function handle(e: MouseEvent) {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5
      mx.set(x * strength)
      my.set(y * strength)
    }

    function handleLeave() {
      mx.set(0)
      my.set(0)
    }

    const node = ref.current
    window.addEventListener('mousemove', handle)
    if (node) node.addEventListener('mouseleave', handleLeave)
    return () => {
      window.removeEventListener('mousemove', handle)
      if (node) node.removeEventListener('mouseleave', handleLeave)
    }
  }, [mx, my, strength])

  const x = useTransform(mx, v => `${v}px`)
  const y = useTransform(my, v => `${v}px`)

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div style={{ x, y }} className="pointer-events-none absolute inset-0">
        {children}
      </motion.div>
      {/* passthrough slot for content that sits above parallax layers */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
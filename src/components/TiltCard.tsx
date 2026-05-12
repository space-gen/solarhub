import React, { useRef } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'

interface TiltCardProps {
  children: React.ReactNode
  className?: string
  maxTilt?: number
}

export default function TiltCard({ children, className = '', maxTilt = 10 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)

  function handleMove(e: React.MouseEvent) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    mx.set((x - 0.5) * maxTilt)
    my.set((y - 0.5) * maxTilt)
  }

  function handleLeave() {
    mx.set(0)
    my.set(0)
  }

  const rotateY = useTransform(mx, v => `${v}deg`)
  const rotateX = useTransform(my, v => `${-v}deg`)
  const shadow = useTransform(my, v => `${Math.abs(v) / maxTilt * 24}px`) 

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY }}
      className={`transform-gpu will-change-transform bg-white/6 border border-white/6 rounded-2xl p-4 ${className}`}
      whileTap={{ scale: 0.98 }}
    >
      <motion.div style={{ boxShadow: `0 ${shadow} ${shadow} rgba(0,0,0,0.45)` }}>
        {children}
      </motion.div>
    </motion.div>
  )
}

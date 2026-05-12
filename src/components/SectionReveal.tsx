import React from 'react'
import { motion } from 'framer-motion'

interface SectionRevealProps {
  children: React.ReactNode
  className?: string
  stagger?: number
}

const container = (stagger = 0.08) => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger } }
})

const item = {
  hidden: { opacity: 0, y: 10, scale: 0.995 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.2, 0.8, 0.2, 1] } }
}

export default function SectionReveal({ children, className = '', stagger = 0.08 }: SectionRevealProps) {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={container(stagger)}
      className={className}
    >
      {React.Children.map(children as any, child => (
        <motion.div variants={item} className="will-change-transform">
          {child}
        </motion.div>
      ))}
    </motion.section>
  )
}

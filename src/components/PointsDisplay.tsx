import { motion } from 'framer-motion'
import { formatNumber } from '../utils/formatters'

interface PointsDisplayProps {
  points: number
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function PointsDisplay({
  points,
  label = 'Total Points',
  size = 'md',
}: PointsDisplayProps) {
  const sizeClasses = {
    sm: { wrapper: 'px-3 py-2', value: 'text-lg', label: 'text-xs' },
    md: { wrapper: 'px-5 py-3', value: 'text-2xl', label: 'text-xs' },
    lg: { wrapper: 'px-6 py-4', value: 'text-4xl', label: 'text-sm' },
  }

  const cls = sizeClasses[size]

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className={`glass inline-flex flex-col items-center ${cls.wrapper} glow-solar`}
    >
      <motion.span
        key={points}
        initial={{ scale: 1.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className={`${cls.value} font-bold text-gradient`}
      >
        {formatNumber(points)}
      </motion.span>
      <span className={`${cls.label} text-white/40 mt-0.5`}>{label}</span>
    </motion.div>
  )
}

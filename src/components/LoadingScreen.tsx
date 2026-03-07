import { motion } from 'framer-motion'

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-space-950">
      <div className="flex flex-col items-center gap-6">
        {/* Animated solar orb */}
        <div className="relative">
          <motion.div
            className="w-20 h-20 rounded-full bg-gradient-to-br from-solar-300 via-solar-500 to-solar-700"
            animate={{
              boxShadow: [
                '0 0 20px rgba(255,149,0,0.4), 0 0 60px rgba(255,69,0,0.2)',
                '0 0 40px rgba(255,149,0,0.7), 0 0 100px rgba(255,69,0,0.4)',
                '0 0 20px rgba(255,149,0,0.4), 0 0 60px rgba(255,69,0,0.2)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Orbiting ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-solar-400/30"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            style={{ transform: 'scale(1.4)' }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border border-solar-300/20"
            animate={{ rotate: -360 }}
            transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
            style={{ transform: 'scale(1.7)' }}
          />
        </div>

        {/* Brand */}
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold"
          >
            <span className="text-gradient">Solar</span>
            <span className="text-white">Hub</span>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-white/40 text-sm mt-1"
          >
            Loading…
          </motion.p>
        </div>

        {/* Progress bar */}
        <motion.div className="w-48 h-0.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-solar-500 to-solar-300 rounded-full"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>
    </div>
  )
}

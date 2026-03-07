import { motion } from 'framer-motion'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { pageVariants, staggerContainer, staggerChild } from '../animations/pageTransitions'
import { formatNumber, formatConfidence, ordinalSuffix } from '../utils/formatters'
import PointsDisplay from '../components/PointsDisplay'
import LoadingScreen from '../components/LoadingScreen'

const RANK_STYLES: Record<number, string> = {
  1: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5',
  2: 'text-slate-300 border-slate-300/30 bg-slate-300/5',
  3: 'text-orange-400 border-orange-400/30 bg-orange-400/5',
}

const RANK_MEDALS = ['🥇', '🥈', '🥉']

export default function Leaderboard() {
  const { entries, loading, isDemoMode } = useLeaderboard()

  if (loading) return <LoadingScreen />

  const totalClassifications = entries.reduce(
    (sum, e) => sum + e.classifications,
    0,
  )
  const topPoints = entries[0]?.total_points ?? 0

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="page-wrapper relative"
    >
      <div className="stars-bg" />

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <p className="text-solar-400/80 text-xs font-mono tracking-widest uppercase mb-3">
            Community Rankings
          </p>
          <h1 className="text-4xl font-black mb-3">
            <span className="text-gradient">Leader</span>
            <span className="text-white">board</span>
          </h1>
          <p className="text-white/40">
            The top contributors making solar science possible.
          </p>

          {isDemoMode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 inline-flex glass text-xs text-solar-400 px-3 py-2 items-center gap-2"
            >
              <span>🌐</span>
              <span>Demo mode — sample data</span>
            </motion.div>
          )}
        </motion.div>

        {/* Summary stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8"
        >
          <PointsDisplay points={topPoints} label="Top Score" size="sm" />
          <PointsDisplay
            points={totalClassifications}
            label="Total Classifications"
            size="sm"
          />
          <PointsDisplay
            points={entries.length}
            label="Contributors"
            size="sm"
          />
        </motion.div>

        {/* Entries */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="flex flex-col gap-3"
        >
          {entries.map((entry, idx) => {
            const rankStyle =
              RANK_STYLES[entry.rank] ??
              'text-white/60 border-white/10 bg-white/2'
            const isTopThree = entry.rank <= 3

            return (
              <motion.div
                key={entry.username}
                variants={staggerChild}
                whileHover={{
                  x: 4,
                  boxShadow: isTopThree
                    ? '0 8px 32px rgba(255,149,0,0.15)'
                    : '0 4px 16px rgba(255,255,255,0.05)',
                  transition: { type: 'spring', stiffness: 300 },
                }}
                className={`glass flex items-center gap-4 p-4 border ${rankStyle} transition-colors`}
              >
                {/* Rank */}
                <div className="w-10 text-center shrink-0">
                  {isTopThree ? (
                    <span className="text-2xl">{RANK_MEDALS[idx]}</span>
                  ) : (
                    <span className="text-sm font-bold text-white/40">
                      {ordinalSuffix(entry.rank)}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <motion.img
                  whileHover={{ scale: 1.1 }}
                  src={entry.avatar_url}
                  alt={entry.username}
                  className="w-10 h-10 rounded-full bg-space-800 border border-white/10 shrink-0"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src =
                      `https://api.dicebear.com/7.x/initials/svg?seed=${entry.username}`
                  }}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm truncate">
                      {entry.username}
                    </span>
                    {entry.badge && (
                      <span className="text-[10px] font-medium text-solar-400 glass px-1.5 py-0.5 whitespace-nowrap">
                        {entry.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-white/30 text-xs">
                      {formatNumber(entry.classifications)} classified
                    </span>
                    <span className="text-white/20 text-xs">·</span>
                    <span className="text-green-400/70 text-xs">
                      {formatConfidence(entry.accuracy)} accuracy
                    </span>
                  </div>
                </div>

                {/* Points */}
                <div className="text-right shrink-0">
                  <div
                    className={`text-lg font-black ${isTopThree ? 'text-gradient' : 'text-white/70'}`}
                  >
                    {formatNumber(entry.total_points)}
                  </div>
                  <div className="text-white/30 text-[10px]">pts</div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-10"
        >
          <p className="text-white/30 text-sm mb-4">
            Don't see your name? Start classifying to earn points!
          </p>
          <motion.a
            href="/solarhub/classify"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary inline-flex"
          >
            🚀 Start Classifying
          </motion.a>
        </motion.div>
      </div>
    </motion.div>
  )
}

import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import TaskViewer from '../components/TaskViewer'
import AnnotationPanel from '../components/AnnotationPanel'
import LoadingScreen from '../components/LoadingScreen'
import { useTasks } from '../hooks/useTasks'
import { pageVariants, slideInLeft, slideInRight } from '../animations/pageTransitions'

export default function Classify() {
  const {
    currentTask,
    currentIndex,
    totalTasks,
    loading,
    nextTask,
    prevTask,
    isDemoMode,
  } = useTasks()

  if (loading) return <LoadingScreen />

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="page-wrapper relative"
    >
      <div className="stars-bg" />
      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-black">
              <span className="text-gradient">Classify</span>{' '}
              <span className="text-white">Solar Images</span>
            </h1>
            <p className="text-white/40 text-sm mt-1">
              Review each image and select the best matching category.
            </p>
          </div>

          {isDemoMode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass text-xs text-solar-400 px-3 py-2 flex items-center gap-2"
            >
              <span className="text-lg">🌐</span>
              <span>Demo mode — using local dataset</span>
            </motion.div>
          )}
        </motion.div>

        {currentTask ? (
          <div className="grid lg:grid-cols-[1fr_380px] gap-6">
            <motion.div variants={slideInLeft} initial="initial" animate="animate">
              <TaskViewer
                task={currentTask}
                currentIndex={currentIndex}
                totalTasks={totalTasks}
                onNext={nextTask}
                onPrev={prevTask}
              />
            </motion.div>
            <motion.div variants={slideInRight} initial="initial" animate="animate">
              <AnnotationPanel task={currentTask} onSubmitted={nextTask} />
            </motion.div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24"
          >
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-2">All caught up!</h2>
            <p className="text-white/40 mb-8">
              You've classified all available tasks. Check back soon for more.
            </p>
            <Link to="/leaderboard">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary"
              >
                🏆 See Your Ranking
              </motion.button>
            </Link>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

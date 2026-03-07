import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Task } from '../services/taskService'
import { formatTaskType, formatConfidence } from '../utils/formatters'
import { taskTypeColor, confidenceLabel } from '../utils/helpers'

interface TaskViewerProps {
  task: Task
  currentIndex: number
  totalTasks: number
  onNext: () => void
  onPrev: () => void
}

export default function TaskViewer({
  task,
  currentIndex,
  totalTasks,
  onNext,
  onPrev,
}: TaskViewerProps) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)

  return (
    <div className="card flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/40 text-xs font-mono uppercase tracking-widest">
            Task {currentIndex + 1} / {totalTasks}
          </p>
          <h2 className="text-xl font-bold mt-0.5">
            <span className={taskTypeColor(task.task_type)}>
              {formatTaskType(task.task_type)}
            </span>
          </h2>
        </div>
        <div className="text-right">
          <p className="text-white/40 text-xs">ML Prediction</p>
          <p className="text-sm font-medium text-white/80 mt-0.5">
            {formatTaskType(task.ml_prediction)}
          </p>
          <div className="mt-1 flex items-center justify-end gap-1.5">
            <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-solar-600 to-solar-300 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${task.confidence * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <span className="text-xs text-solar-400">
              {formatConfidence(task.confidence)}
            </span>
          </div>
          <p className="text-white/30 text-xs mt-0.5">
            {confidenceLabel(task.confidence)}
          </p>
        </div>
      </div>

      {/* Image */}
      <div className="relative aspect-video rounded-lg overflow-hidden bg-space-800">
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="w-8 h-8 rounded-full border-2 border-solar-500 border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        )}

        {imgError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/30">
            <span className="text-4xl">🌅</span>
            <p className="text-sm">Image unavailable</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.img
              key={task.id}
              src={task.url}
              alt={`Solar observation – ${formatTaskType(task.task_type)}`}
              className="w-full h-full object-cover"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={imgLoaded ? { opacity: 1, scale: 1 } : { opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              onLoad={() => {
                setImgLoaded(true)
                setImgError(false)
              }}
              onError={() => {
                setImgError(true)
                setImgLoaded(false)
              }}
            />
          </AnimatePresence>
        )}

        {/* Task ID badge */}
        <div className="absolute top-3 left-3">
          <span className="glass text-xs font-mono px-2 py-1 text-white/60">
            #{task.id}
          </span>
        </div>

        {/* Points badge */}
        <div className="absolute top-3 right-3">
          <motion.span
            className="bg-solar-500/80 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-md"
            whileHover={{ scale: 1.05 }}
          >
            +{task.points} pts
          </motion.span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <motion.button
          whileHover={{ scale: 1.05, x: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={onPrev}
          className="btn-secondary text-sm px-4 py-2"
        >
          ← Previous
        </motion.button>

        {/* Dot indicators */}
        <div className="flex gap-1.5 overflow-hidden max-w-[120px]">
          {Array.from({ length: Math.min(totalTasks, 7) }).map((_, i) => {
            const index = Math.min(i, totalTasks - 1)
            return (
              <motion.div
                key={index}
                className={`rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'w-4 h-1.5 bg-solar-400'
                    : 'w-1.5 h-1.5 bg-white/20'
                }`}
              />
            )
          })}
        </div>

        <motion.button
          whileHover={{ scale: 1.05, x: 2 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNext}
          className="btn-secondary text-sm px-4 py-2"
        >
          Next →
        </motion.button>
      </div>
    </div>
  )
}

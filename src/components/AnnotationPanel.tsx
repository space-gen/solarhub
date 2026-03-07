import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Task } from '../services/taskService'
import {
  submitAnnotation,
  saveAnnotationLocally,
} from '../services/annotationService'
import { formatTaskType } from '../utils/formatters'

const LABELS = [
  { value: 'sunspot', emoji: '🌑', color: 'from-yellow-600 to-yellow-800' },
  { value: 'solar_flare', emoji: '⚡', color: 'from-orange-500 to-red-700' },
  { value: 'coronal_hole', emoji: '🕳️', color: 'from-blue-600 to-blue-900' },
  { value: 'prominence', emoji: '🌊', color: 'from-purple-500 to-purple-800' },
  { value: 'filament', emoji: '🧵', color: 'from-pink-500 to-pink-800' },
  { value: 'other', emoji: '❓', color: 'from-gray-600 to-gray-800' },
]

interface AnnotationPanelProps {
  task: Task
  onSubmitted: () => void
}

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error'

export default function AnnotationPanel({
  task,
  onSubmitted,
}: AnnotationPanelProps) {
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)
  const [confidence, setConfidence] = useState(0.8)
  const [comments, setComments] = useState('')
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit() {
    if (!selectedLabel) return

    setStatus('loading')
    const annotation = {
      task_id: task.id,
      user_label: selectedLabel,
      confidence,
      comments,
    }

    const token = localStorage.getItem('solarhub_gh_token') ?? ''

    try {
      if (token) {
        const result = await submitAnnotation(annotation, token)
        setMessage(`✓ Submitted! View issue: ${result.issueUrl}`)
      } else {
        saveAnnotationLocally(annotation)
        setMessage('✓ Saved locally (no GitHub token configured)')
      }
      setStatus('success')
      setTimeout(() => {
        setStatus('idle')
        setSelectedLabel(null)
        setComments('')
        setMessage('')
        onSubmitted()
      }, 2000)
    } catch (err) {
      setStatus('error')
      setMessage(
        err instanceof Error ? err.message : 'Submission failed. Try again.',
      )
      setTimeout(() => setStatus('idle'), 4000)
    }
  }

  return (
    <div className="card flex flex-col gap-5">
      <div>
        <h3 className="font-bold text-lg text-white">Your Classification</h3>
        <p className="text-white/40 text-sm mt-0.5">
          What do you see in this solar image?
        </p>
      </div>

      {/* Label selection */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {LABELS.map(({ value, emoji, color }) => {
          const isSelected = selectedLabel === value
          return (
            <motion.button
              key={value}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedLabel(value)}
              className={`relative p-3 rounded-lg border text-sm font-medium transition-all duration-200 text-left ${
                isSelected
                  ? `bg-gradient-to-br ${color} border-white/30 text-white shadow-lg`
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white hover:border-white/20'
              }`}
            >
              <span className="text-xl block mb-1">{emoji}</span>
              <span className="block leading-tight">
                {formatTaskType(value)}
              </span>
              {isSelected && (
                <motion.div
                  layoutId="label-check"
                  className="absolute top-2 right-2 w-4 h-4 rounded-full bg-white/30 flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  <span className="text-[10px]">✓</span>
                </motion.div>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Confidence slider */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-white/70">
            Your confidence
          </label>
          <span className="text-sm font-bold text-solar-400">
            {Math.round(confidence * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={confidence}
          onChange={(e) => setConfidence(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #ff9500 ${confidence * 100}%, rgba(255,255,255,0.1) ${confidence * 100}%)`,
          }}
        />
      </div>

      {/* Comments */}
      <div>
        <label className="text-sm font-medium text-white/70 block mb-2">
          Comments (optional)
        </label>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Describe what you see…"
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-solar-500/50 focus:bg-white/8 transition-colors"
        />
      </div>

      {/* Submit */}
      <motion.button
        whileHover={selectedLabel && status === 'idle' ? { scale: 1.02 } : {}}
        whileTap={selectedLabel && status === 'idle' ? { scale: 0.98 } : {}}
        onClick={handleSubmit}
        disabled={!selectedLabel || status === 'loading' || status === 'success'}
        className={`btn-primary w-full justify-center ${
          !selectedLabel
            ? 'opacity-40 cursor-not-allowed'
            : status === 'loading'
              ? 'opacity-70'
              : ''
        }`}
      >
        {status === 'loading' ? (
          <>
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="inline-block"
            >
              ⟳
            </motion.span>
            Submitting…
          </>
        ) : status === 'success' ? (
          '✓ Submitted!'
        ) : (
          'Submit Classification'
        )}
      </motion.button>

      {/* Status message */}
      <AnimatePresence>
        {message && (
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`text-xs rounded-lg px-3 py-2 ${
              status === 'error'
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : 'bg-green-500/10 text-green-400 border border-green-500/20'
            }`}
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

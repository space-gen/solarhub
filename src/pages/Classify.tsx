/**
 * src/pages/Classify.tsx
 *
 * The main classification workflow page.
 *
 * Layout (desktop):
 *  ┌────────────────────────────────────────────────────────┐
 *  │  Progress bar + task counter                           │
 *  ├────────────────────────────────────────────┬───────────┤
 *  │  TaskViewer (solar image + ML prediction)  │  Panel:   │
 *  │                                            │  - Points │
 *  │                                            │  - Annot. │
 *  │                                            │    Form   │
 *  ├────────────────────────────────────────────┴───────────┤
 *  │  ← Previous          Task N of M          Next task → │
 *  └────────────────────────────────────────────────────────┘
 *
 * Features:
 *  - Retrieves tasks via useTasks hook (with loading/error states).
 *  - TaskViewer shows the current solar image.
 *  - AnnotationPanel lets the user classify and submit.
 *  - Points increase by 10 per successful submission.
 *  - Navigation prev/next buttons with keyboard shortcut support
 *    (ArrowLeft / ArrowRight).
 *  - A brief fireworks/celebration animation plays after submission.
 *  - Framer Motion AnimatePresence transitions the TaskViewer when the
 *    task changes.
 *
 * Props:
 *   points         – current total points (passed from App state)
 *   onPointsChange – callback to update points in App state
 */

import { useEffect, useCallback, useState, useRef }  from 'react';
import { motion, AnimatePresence }            from 'framer-motion';
import { useTasks }                           from '@/hooks/useTasks';
import TaskViewer                             from '@/components/TaskViewer';
import AnnotationPanel                        from '@/components/AnnotationPanel';
import PointsDisplay                          from '@/components/PointsDisplay';
import LoadingScreen                          from '@/components/LoadingScreen';
import type { AnnotationInput }               from '@/services/annotationService';
import {
  pageVariants,
  itemVariantsLeft,
  itemVariantsRight,
} from '@/animations/pageTransitions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ClassifyProps {
  points:         number;
  onPointsChange: (newPoints: number) => void;
}

// ---------------------------------------------------------------------------
// Progress bar sub-component
// ---------------------------------------------------------------------------

interface ProgressBarProps {
  current: number;   // 1-based current task number
  total:   number;
  completedCount: number;
}

/**
 * ProgressBar
 *
 * Displays a thin animated bar at the top of the classify section showing
 * how many tasks have been completed in this session.
 */
function ProgressBar({ current, total, completedCount }: ProgressBarProps) {
  const pct = total > 0 ? (completedCount / total) * 100 : 0;

  return (
    <div className="flex flex-col gap-2">
      {/* Counter text */}
      <div className="flex justify-between items-center text-xs text-slate-400">
        <span>Task <span className="text-slate-200 font-semibold">{current}</span> of {total}</span>
        <span>
          <span className="text-solar-300 font-semibold">{completedCount}</span> classified this session
        </span>
      </div>

      {/* Bar track */}
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-solar-600 to-solar-400"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Navigation buttons
// ---------------------------------------------------------------------------

interface NavButtonProps {
  direction: 'prev' | 'next';
  onClick:   () => void;
  disabled?: boolean;
}

function NavButton({ direction, onClick, disabled }: NavButtonProps) {
  const isPrev = direction === 'prev';

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.04, x: isPrev ? -3 : 3 }}
      whileTap={disabled  ? {} : { scale: 0.97 }}
      className={[
        'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium',
        'transition-colors border',
        disabled
          ? 'border-white/5 text-slate-700 cursor-not-allowed'
          : 'border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/5',
      ].join(' ')}
    >
      {isPrev && (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      )}
      {isPrev ? 'Previous' : 'Next'}
      {!isPrev && (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      )}
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Celebration burst (shown after a submission)
// ---------------------------------------------------------------------------

/**
 * CelebrationBurst
 *
 * A small overlay that briefly shows "+10 pts ✨" floating up after a
 * successful annotation submission.
 */
function CelebrationBurst({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50
                     pointer-events-none select-none"
          initial={{ opacity: 0, y: 0, scale: 0.8 }}
          animate={{ opacity: 1, y: -60, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className="glass px-6 py-3 rounded-2xl text-solar-300 font-bold text-lg
                          border border-solar-500/30 shadow-solar">
            +10 pts ✨
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="glass rounded-2xl p-8 max-w-md text-center flex flex-col gap-4">
        <span className="text-4xl">⚠️</span>
        <h2 className="text-xl font-bold text-slate-100">Could not load tasks</h2>
        <p className="text-sm text-slate-400">{message}</p>
        <button
          onClick={() => window.location.reload()}
          className="btn-solar mt-2"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function Classify({ points, onPointsChange }: ClassifyProps) {
  const {
    currentTask,
    taskIndex,
    totalTasks,
    loading,
    error,
    nextTask,
    previousTask,
    markTaskCompleted,
    completedCount,
  } = useTasks();

  // Whether to show the celebration burst animation
  const [showCelebration, setShowCelebration] = useState(false);
  // Store timeout ID so we can clear it if the component unmounts
  const celebrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Keyboard navigation ──────────────────────────────────────────────────
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      // Don't intercept when user is typing in a textarea/input
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (tag === 'textarea' || tag === 'input') return;

      if (e.key === 'ArrowRight') nextTask();
      if (e.key === 'ArrowLeft')  previousTask();
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [nextTask, previousTask]);

  // ── Annotation submission handler ────────────────────────────────────────
  const handleAnnotationSubmit = useCallback((input: AnnotationInput) => {
    // Award 10 points per annotation
    onPointsChange(points + 10);

    // Mark the task as done (also auto-advances to next)
    markTaskCompleted(input.task_id);

    // Show celebration burst for 2 seconds
    setShowCelebration(true);
    if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);
    celebrationTimerRef.current = setTimeout(() => setShowCelebration(false), 2_500);
  }, [points, onPointsChange, markTaskCompleted]);

  // Clean up the celebration timer on unmount
  useEffect(() => {
    return () => {
      if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);
    };
  }, []);

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return <LoadingScreen message="Loading solar observations…" />;
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return <ErrorState message={error} />;
  }

  // ── Empty state ──────────────────────────────────────────────────────────
  if (!currentTask) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="glass rounded-2xl p-8 max-w-md text-center flex flex-col gap-4">
          <span className="text-4xl">🎉</span>
          <h2 className="text-xl font-bold text-slate-100">All tasks completed!</h2>
          <p className="text-sm text-slate-400">
            You've classified all available solar observations. Check back soon for more.
          </p>
        </div>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="min-h-screen pt-20 pb-16 px-4 cosmic-bg"
    >
      <div className="max-w-6xl mx-auto flex flex-col gap-6">

        {/* ── Progress bar ──────────────────────────────────────────────── */}
        <motion.div variants={itemVariantsLeft}>
          <ProgressBar
            current={taskIndex + 1}
            total={totalTasks}
            completedCount={completedCount}
          />
        </motion.div>

        {/* ── Main content grid ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">

          {/* Left: TaskViewer */}
          <motion.div variants={itemVariantsLeft}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTask.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="glass rounded-2xl p-6"
              >
                <TaskViewer task={currentTask} />
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Right: sidebar */}
          <motion.div
            variants={itemVariantsRight}
            className="flex flex-col gap-5"
          >
            {/* Points display */}
            <PointsDisplay points={points} />

            {/* Annotation panel */}
            <div className="glass rounded-2xl p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTask.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <AnnotationPanel
                    taskId={currentTask.id}
                    onSubmit={handleAnnotationSubmit}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* ── Navigation buttons ─────────────────────────────────────────── */}
        <motion.div
          variants={itemVariantsLeft}
          className="flex items-center justify-between pt-2"
        >
          <NavButton
            direction="prev"
            onClick={previousTask}
            disabled={taskIndex === 0}
          />

          {/* Centre: task identifier */}
          <span className="text-xs text-slate-600 font-mono hidden sm:block">
            {currentTask.id}
          </span>

          <NavButton
            direction="next"
            onClick={nextTask}
            disabled={taskIndex >= totalTasks - 1}
          />
        </motion.div>

        {/* Keyboard hint */}
        <p className="text-center text-xs text-slate-700 hidden md:block">
          Tip: use ← → arrow keys to navigate between tasks
        </p>
      </div>

      {/* Celebration overlay */}
      <CelebrationBurst show={showCelebration} />
    </motion.div>
  );
}

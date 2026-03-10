/**
 * src/components/AnnotationPanel.tsx
 *
 * The classification input panel shown next to each solar observation.
 *
 * UI elements:
 *  - Three large icon-buttons for the three classification options:
 *      ☀️  Sunspot
 *      🔥  Solar Flare
 *      🕳️  Coronal Hole
 *    Each has a hover-lift animation and a persistent glow when selected.
 *  - A confidence slider (0–100%) with a live percentage display.
 *  - An optional free-text comments textarea.
 *  - A "Submit" button that shows a loading spinner while the annotation
 *    is being submitted.
 *  - Inline success / error toast feedback animated via Framer Motion.
 *
 * After a successful submission the panel shows a brief "Thank you!" screen
 * before clearing its state for the next task.
 *
 * Props:
 *   taskId       – ID of the task being classified.
 *   onSubmit     – Callback fired with the AnnotationInput after successful
 *                  submission so the parent can add points and advance the task.
 *   isSubmitting – Whether the parent is currently awaiting an async operation.
 */

import { useState, useCallback, useEffect, useRef }      from 'react';
import { motion, AnimatePresence }    from 'framer-motion';
import { submitAnnotation }           from '@/services/annotationService';
import type { UserLabel }             from '@/services/annotationService';
import type { AnnotationInput }       from '@/services/annotationService';
import { classifyTaskType }           from '@/utils/helpers';
import { containerVariants, itemVariants } from '@/animations/pageTransitions';
import { classifyButtonVariants }    from '@/animations/hoverAnimations';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AnnotationPanelProps {
  taskId:       string;
  onSubmit:     (input: AnnotationInput) => void;
  isSubmitting?: boolean;
}

// ---------------------------------------------------------------------------
// Classification option definitions
// ---------------------------------------------------------------------------

interface ClassOption {
  value: UserLabel;
  label: string;
  icon:  string;
  description: string;
}

const CLASS_OPTIONS: ClassOption[] = [
  {
    value:       'sunspot',
    label:       'Sunspot',
    icon:        '☀️',
    description: 'Dark, magnetically intense region on the photosphere',
  },
  {
    value:       'solar_flare',
    label:       'Solar Flare',
    icon:        '🔥',
    description: 'Sudden, intense burst of radiation from the Sun\'s surface',
  },
  {
    value:       'coronal_hole',
    label:       'Coronal Hole',
    icon:        '🕳️',
    description: 'Dark region in the corona where solar wind streams outward',
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * ClassificationButton
 *
 * A single large option button for one classification type.
 * Renders with a coloured glow border when selected.
 */
function ClassificationButton({
  option,
  isSelected,
  onClick,
}: {
  option:     ClassOption;
  isSelected: boolean;
  onClick:    () => void;
}) {
  const style = classifyTaskType(option.value);

  return (
    <motion.button
      variants={classifyButtonVariants}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      animate={isSelected ? 'selected' : 'rest'}
      onClick={onClick}
      className={[
        'relative w-full flex items-center gap-3 p-4 rounded-xl text-left',
        'transition-colors duration-200 outline-none',
        isSelected
          ? `${style.bg} ${style.text} border ${style.border}`
          : 'bg-white/3 text-slate-400 border border-white/8 hover:text-slate-200',
      ].join(' ')}
      aria-pressed={isSelected}
    >
      {/* Emoji icon */}
      <span className="text-2xl" role="img" aria-hidden="true">{option.icon}</span>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{option.label}</p>
        <p className="text-xs opacity-60 truncate">{option.description}</p>
      </div>

      {/* Selected checkmark */}
      {isSelected && (
        <motion.div
          className={`w-5 h-5 rounded-full flex items-center justify-center ${style.bg} border ${style.border}`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        >
          <svg viewBox="0 0 12 12" className={`w-3 h-3 ${style.text}`} fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
          </svg>
        </motion.div>
      )}
    </motion.button>
  );
}

/**
 * ConfidenceSlider
 *
 * Range input that displays the selected confidence with a live label.
 */
function ConfidenceSlider({
  value,
  onChange,
}: {
  value:    number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-xs text-slate-400">
        <span>Confidence</span>
        <motion.span
          key={value}
          className="font-semibold text-solar-300"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          {value}%
        </motion.span>
      </div>

      {/* Custom-styled range input */}
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer
                   bg-white/10 accent-solar-500"
        aria-label="Classification confidence"
      />

      {/* Confidence level label */}
      <div className="flex justify-between text-xs text-slate-600">
        <span>Not sure</span>
        <span>Certain</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Success overlay
// ---------------------------------------------------------------------------

/**
 * SuccessOverlay
 *
 * Full-panel overlay shown for ~2 seconds after a successful submission.
 * Shows an animated checkmark and "Thank you!" message.
 */
function SuccessOverlay({ onDone }: { onDone: () => void }) {
  // Store the auto-dismiss timer so it can be cleaned up on unmount
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(onDone, 2_000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onDone]);
  return (
    <motion.div
      className="absolute inset-0 z-10 glass-strong rounded-2xl flex flex-col
                 items-center justify-center gap-4 text-center p-6"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      {/* Animated check circle */}
      <motion.div
        className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40
                   flex items-center justify-center"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <motion.svg
          viewBox="0 0 24 24"
          className="w-8 h-8 text-emerald-400"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <motion.path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </motion.svg>
      </motion.div>

      <div>
        <p className="text-lg font-bold text-emerald-300 mb-1">Annotation Saved!</p>
        <p className="text-sm text-slate-400">Thanks for contributing to solar science.</p>
        <p className="text-xs text-slate-500 mt-2">+10 points earned 🌟</p>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function AnnotationPanel({ taskId, onSubmit }: AnnotationPanelProps) {
  // ── Form state ─────────────────────────────────────────────────────────────
  const [selectedLabel, setSelectedLabel] = useState<UserLabel | null>(null);
  const [confidence,    setConfidence]    = useState(75);
  const [comments,      setComments]      = useState('');

  // ── Submission state ───────────────────────────────────────────────────────
  const [submitting,   setSubmitting]   = useState(false);
  const [showSuccess,  setShowSuccess]  = useState(false);
  const [submitError,  setSubmitError]  = useState<string | null>(null);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!selectedLabel) return;

    setSubmitting(true);
    setSubmitError(null);

    const input: AnnotationInput = {
      task_id:     taskId,
      user_label:  selectedLabel,
      confidence,
      comments:    comments.trim(),
    };

    try {
      // submitAnnotation always returns a result (never throws)
      await submitAnnotation(input);

      setShowSuccess(true);
      // Notify parent of successful submission
      onSubmit(input);

    } catch {
      // submitAnnotation shouldn't throw, but just in case:
      setSubmitError('Unexpected error. Your annotation has been saved locally.');
    } finally {
      setSubmitting(false);
    }
  }, [selectedLabel, confidence, comments, taskId, onSubmit]);

  /** Called when the SuccessOverlay auto-dismisses */
  const handleSuccessDone = useCallback(() => {
    setShowSuccess(false);
    // Reset form for the next task
    setSelectedLabel(null);
    setConfidence(75);
    setComments('');
    setSubmitError(null);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="relative">
      {/* ------------------------------------------------------------------ */}
      {/* Success overlay (AnimatePresence handles enter/exit animation)       */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence>
        {showSuccess && <SuccessOverlay onDone={handleSuccessDone} />}
      </AnimatePresence>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-5"
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <h2 className="text-lg font-bold text-slate-100 mb-0.5">Classify this observation</h2>
          <p className="text-sm text-slate-500">
            What do you see in the solar image above?
          </p>
        </motion.div>

        {/* ── Classification buttons ───────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="flex flex-col gap-2">
          {CLASS_OPTIONS.map(option => (
            <ClassificationButton
              key={option.value}
              option={option}
              isSelected={selectedLabel === option.value}
              onClick={() => setSelectedLabel(option.value)}
            />
          ))}
        </motion.div>

        {/* ── Confidence slider ────────────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="glass rounded-xl p-4">
          <ConfidenceSlider value={confidence} onChange={setConfidence} />
        </motion.div>

        {/* ── Comments textarea ────────────────────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <label htmlFor="comments" className="block text-xs text-slate-400 mb-2">
            Notes <span className="text-slate-600">(optional)</span>
          </label>
          <textarea
            id="comments"
            value={comments}
            onChange={e => setComments(e.target.value)}
            placeholder="Describe what you see, e.g. 'Large sunspot group near the solar equator…'"
            rows={3}
            className="w-full bg-white/4 border border-white/8 rounded-xl px-4 py-3
                       text-sm text-slate-300 placeholder-slate-600
                       resize-none focus:outline-none focus:border-solar-500/60
                       focus:bg-white/6 transition-colors"
          />
        </motion.div>

        {/* ── Error message ────────────────────────────────────────────────── */}
        <AnimatePresence>
          {submitError && (
            <motion.p
              className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20
                         rounded-lg px-3 py-2"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              ⚠️ {submitError}
            </motion.p>
          )}
        </AnimatePresence>

        {/* ── Submit button ────────────────────────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <motion.button
            onClick={handleSubmit}
            disabled={!selectedLabel || submitting}
            className={[
              'w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200',
              selectedLabel && !submitting
                ? 'btn-solar cursor-pointer'
                : 'bg-white/5 text-slate-600 border border-white/8 cursor-not-allowed',
            ].join(' ')}
            whileHover={selectedLabel && !submitting ? { scale: 1.02 } : {}}
            whileTap={selectedLabel  && !submitting ? { scale: 0.98 } : {}}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                {/* Spinning loader */}
                <motion.span
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.7, ease: 'linear', repeat: Infinity }}
                />
                Submitting…
              </span>
            ) : selectedLabel ? (
              `Submit: ${CLASS_OPTIONS.find(o => o.value === selectedLabel)?.label}`
            ) : (
              'Select a classification above'
            )}
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}

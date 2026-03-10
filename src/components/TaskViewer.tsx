/**
 * src/components/TaskViewer.tsx
 *
 * Displays a single solar observation image with metadata overlays.
 *
 * Features:
 *  - Progressive image loading with a shimmer skeleton shown while the image
 *    downloads, transitioning smoothly once loaded.
 *  - Image zoom: clicking the image opens a fullscreen lightbox (pure React
 *    state + Framer Motion, no external lightbox library).
 *  - Task type badge (colour-coded by classifyTaskType helper).
 *  - ML prediction panel showing the model's predicted class + a confidence
 *    bar that animates in when the component mounts.
 *  - Instrument / observation date metadata row.
 *  - Keyboard support: Escape closes the lightbox.
 *
 * Props:
 *   task  – the Task object to display (from taskService)
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence }           from 'framer-motion';
import type { Task }                          from '@/services/taskService';
import { classifyTaskType }                  from '@/utils/helpers';
import { formatDate, formatConfidence, formatTaskType } from '@/utils/formatters';
import { fadeVariants }                      from '@/animations/pageTransitions';

interface TaskViewerProps {
  task: Task;
}

// ---------------------------------------------------------------------------
// Confidence bar sub-component
// ---------------------------------------------------------------------------

/**
 * ConfidenceBar
 *
 * Animated horizontal bar showing the ML model's confidence (0–1 → 0–100%).
 * The bar width animates from 0 to the actual value when it first appears,
 * drawing the user's eye to it.
 */
function ConfidenceBar({ confidence, color }: { confidence: number; color: string }) {
  const pct = Math.round(confidence * 100);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-slate-400">ML Confidence</span>
        <span className="text-xs font-semibold" style={{ color }}>
          {formatConfidence(confidence)}
        </span>
      </div>
      {/* Track */}
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        {/* Animated fill */}
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}99, ${color})` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Image skeleton / loading placeholder
// ---------------------------------------------------------------------------

/**
 * ImageSkeleton
 * Shown while the solar image is downloading.  Displays a shimmer animation
 * inside a rounded rectangle of the same aspect ratio as the real image.
 */
function ImageSkeleton() {
  return (
    <div className="absolute inset-0 shimmer-skeleton rounded-xl" />
  );
}

// ---------------------------------------------------------------------------
// Lightbox (fullscreen image overlay)
// ---------------------------------------------------------------------------

interface LightboxProps {
  imageUrl: string;
  alt:      string;
  onClose:  () => void;
}

/**
 * Lightbox
 *
 * A full-screen overlay that presents the image at maximum size.
 * Clicking the backdrop or pressing Escape dismisses it.
 */
function Lightbox({ imageUrl, alt, onClose }: LightboxProps) {
  // Close on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 cursor-zoom-out"
      variants={fadeVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={onClose}
    >
      {/* Close button */}
      <motion.button
        className="absolute top-4 right-4 w-10 h-10 rounded-full glass flex items-center
                   justify-center text-slate-300 hover:text-white"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onClose}
        aria-label="Close lightbox"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </motion.button>

      {/* Full-size image */}
      <motion.img
        src={imageUrl}
        alt={alt}
        className="max-w-full max-h-full object-contain rounded-lg shadow-glass-lg"
        layoutId="solar-image"
        onClick={e => e.stopPropagation()} // don't close when clicking the image itself
      />
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function TaskViewer({ task }: TaskViewerProps) {
  const [imageLoaded,    setImageLoaded]    = useState(false);
  const [imageError,     setImageError]     = useState(false);
  const [lightboxOpen,   setLightboxOpen]   = useState(false);

  const typeStyle = classifyTaskType(task.ml_prediction);

  // Reset loading state when the task changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [task.id]);

  const handleImageLoad  = useCallback(() => setImageLoaded(true),  []);
  const handleImageError = useCallback(() => { setImageError(true); setImageLoaded(true); }, []);
  const openLightbox     = useCallback(() => { if (!imageError) setLightboxOpen(true); }, [imageError]);
  const closeLightbox    = useCallback(() => setLightboxOpen(false), []);

  return (
    <>
      <div className="flex flex-col gap-4">

        {/* ── Image container ─────────────────────────────────────────────── */}
        <div className="relative aspect-square rounded-xl overflow-hidden bg-cosmic-900 group">

          {/* Shimmer skeleton shown while loading */}
          {!imageLoaded && <ImageSkeleton />}

          {imageError ? (
            /* Error state – shown if image fails to load */
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-500">
              <svg viewBox="0 0 24 24" className="w-12 h-12 opacity-40" fill="none" stroke="currentColor" strokeWidth={1}>
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
              </svg>
              <p className="text-sm">Image unavailable</p>
              <p className="text-xs text-slate-600 max-w-xs text-center px-4">
                {task.image_url}
              </p>
            </div>
          ) : (
            /* Main solar image */
            <motion.img
              key={task.id}
              layoutId="solar-image"
              src={task.image_url}
              alt={`Solar observation: ${formatTaskType(task.ml_prediction)}`}
              className={[
                'w-full h-full object-cover cursor-zoom-in transition-opacity duration-500',
                'group-hover:brightness-110',
                imageLoaded ? 'opacity-100' : 'opacity-0',
              ].join(' ')}
              onLoad={handleImageLoad}
              onError={handleImageError}
              onClick={openLightbox}
            />
          )}

          {/* Zoom hint overlay */}
          {imageLoaded && !imageError && (
            <motion.div
              className="absolute top-3 right-3 px-2 py-1 rounded-lg glass text-xs text-slate-400
                         flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" d="M21 21l-4.35-4.35M11 8v6m-3-3h6" />
              </svg>
              Click to zoom
            </motion.div>
          )}

          {/* Task type badge – bottom-left of image */}
          <motion.div
            className={`absolute bottom-3 left-3 px-3 py-1.5 rounded-lg text-xs font-semibold
                        flex items-center gap-1.5 ${typeStyle.bg} ${typeStyle.text}
                        border ${typeStyle.border} backdrop-blur-sm`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span>{typeStyle.icon}</span>
            {typeStyle.label}
          </motion.div>
        </div>

        {/* ── Metadata row ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{task.instrument ?? 'Unknown instrument'}</span>
          <span>{task.observation_date ? formatDate(task.observation_date) : '—'}</span>
        </div>

        {/* ── Description ─────────────────────────────────────────────────── */}
        {task.description && (
          <motion.p
            className="text-sm text-slate-400 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            {task.description}
          </motion.p>
        )}

        {/* ── ML Prediction card ──────────────────────────────────────────── */}
        <motion.div
          className="glass rounded-xl p-4 flex flex-col gap-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          {/* Header */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: typeStyle.hex }} />
            <span className="text-xs text-slate-400 uppercase tracking-widest">ML Prediction</span>
          </div>

          {/* Predicted label */}
          <p className="text-sm font-semibold" style={{ color: typeStyle.hex }}>
            {typeStyle.icon}&nbsp; {typeStyle.label}
          </p>

          {/* Confidence bar */}
          <ConfidenceBar confidence={task.ml_confidence} color={typeStyle.hex} />
        </motion.div>

        {/* ── Annotation count ────────────────────────────────────────────── */}
        {task.annotation_count !== undefined && (
          <p className="text-xs text-slate-500 text-center">
            {task.annotation_count} citizen{task.annotation_count !== 1 ? 's' : ''} have classified this image
          </p>
        )}
      </div>

      {/* ── Lightbox portal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {lightboxOpen && (
          <Lightbox
            imageUrl={task.image_url}
            alt={`Solar observation: ${formatTaskType(task.ml_prediction)}`}
            onClose={closeLightbox}
          />
        )}
      </AnimatePresence>
    </>
  );
}

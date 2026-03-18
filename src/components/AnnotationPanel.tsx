/**
 * src/components/AnnotationPanel.tsx
 *
 * Citizen-science classification form — plain English, step-by-step.
 *
 * Designed for non-scientists:
 *  - Every option shows a plain-English "what to look for" description
 *  - Two clearly numbered questions guide the user
 *  - Friendly confidence slider and notes field
 *  - Success screen celebrates the contribution
 *
 * Technical aurora values are submitted unchanged; only the display text
 * is simplified so anyone can participate without prior knowledge.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence }   from 'framer-motion';
import { submitAnnotation }          from '@/services/annotationService';
import type { TaskType, UserLabel, AnnotationInput } from '@/services/annotationService';
import { containerVariants, itemVariants } from '@/animations/pageTransitions';
import GuidePanel from '@/components/GuidePanel';

// ---------------------------------------------------------------------------
// Citizen-friendly task option definitions
// ---------------------------------------------------------------------------

interface SubLabel { value: UserLabel; label: string; hint: string }
interface TaskOption {
  value:       TaskType;
  label:       string;    // plain-English display name
  icon:        string;
  lookFor:     string;    // one-line description of what to look for
  color:       string;    // Tailwind text colour for selected state
  bg:          string;
  border:      string;
  subLabels:   SubLabel[];
}

// Scientific phrasing + plain-English helper per task type. The `uncertainLabel`
// maps to the aurora-compatible label to use when the image doesn't match.
const SCIENTIFIC_HELP: Record<TaskType, { scientific: string; plain: string; uncertainLabel: UserLabel }> = {
  sunspot: {
    scientific: 'Find dark spots on the bright sun surface.',
    plain: 'Look for dark dots (like freckles). Mark the biggest ones you see.',
    uncertainLabel: 'none',
  },
  magnetogram: {
    scientific: 'Show where small patches of opposite signs appear (display helper).',
    plain: 'Look for clear patches or messy areas. Mark the middle of the patch and use the radius to cover it.',
    uncertainLabel: 'none',
  },
  solar_flare: { scientific: 'A very bright quick flash on the sun.', plain: 'Find the brightest flash and mark its centre.', uncertainLabel: 'none' },
  coronal_hole: { scientific: 'A big dark area on the sun.', plain: 'Find the large dark patch and mark its middle. If long, put one or two markers along it.', uncertainLabel: 'none' },
  prominence: { scientific: 'A bright arch sticking out from the sun edge.', plain: 'Look at the edge of the sun for a bright looping arch and mark the top or a footpoint.', uncertainLabel: 'none' },
  active_region: { scientific: 'A busy area with lots happening.', plain: 'Find the busy bright area with spots and mark where most activity is.', uncertainLabel: 'none' },
  cme: { scientific: 'A cloud shooting away from the sun.', plain: 'Find the place the cloud came from and mark it.', uncertainLabel: 'none' },
};

const TASK_OPTIONS: TaskOption[] = [
  {
    value:   'sunspot',
    label:   'Sun Spots',
    icon:    '🟤',
    lookFor: 'Dark dots on the bright sun (like freckles).',
    color:   'text-orange-300', bg: 'bg-orange-500/15', border: 'border-orange-500/40',
    subLabels: [
      { value: 'class_a', label: 'Class A (tiny)', hint: 'Very tiny dot, like a tiny freckle' },
      { value: 'class_b', label: 'Class B (small)', hint: 'A small dark dot you can see clearly' },
      { value: 'class_c', label: 'Class C (medium)', hint: 'A medium-sized group of dots' },
      { value: 'class_d', label: 'Class D (large)', hint: 'A large group of dark spots' },
      { value: 'class_e', label: 'Class E (very large)', hint: 'Very big group covering lots of area' },
      { value: 'class_f', label: 'Class F (extensive)', hint: 'Many spots spread across the sun' },
      { value: 'class_h', label: 'Class H (giant)', hint: 'Huge, very noticeable spot group' },
      { value: 'none', label: "I don't know / none", hint: 'Not sure or I don\'t see any spots' },
    ],
  },
  {
    value:   'solar_flare',
    label:   'Bright Flash',
    icon:    '🔥',
    lookFor: "A quick very bright flash — looks like a tiny sun explosion",
    color:   'text-rose-300', bg: 'bg-rose-500/15', border: 'border-rose-500/40',
    subLabels: [
      { value: 'x_class',  label: 'X-class (very large)', hint: 'Very, very bright flash' },
      { value: 'm_class',  label: 'M-class (large)', hint: 'A big bright flash' },
      { value: 'c_class',  label: 'C-class (medium)', hint: 'A normal bright burst' },
      { value: 'b_class',  label: 'B-class (small)', hint: 'A small bright spot' },
      { value: 'a_class',  label: 'A-class (tiny)', hint: 'A very faint brightening' },
      { value: 'none',     label: "No flash / none", hint: 'No bright flash seen' },
    ],
  },
  {
    value:   'magnetogram',
    label:   'Magnetic Map',
    icon:    '🧲',
    lookFor: "A black & white map that looks like stripes or patches",
    color:   'text-violet-300', bg: 'bg-violet-500/15', border: 'border-violet-500/40',
    subLabels: [
      { value: 'alpha', label: 'Alpha (simple)', hint: 'Just one simple patch' },
      { value: 'beta', label: 'Beta (two spots)', hint: 'Two nearby patches' },
      { value: 'gamma', label: 'Gamma (complex)', hint: 'Many small mixed patches' },
      { value: 'beta-gamma', label: 'Beta-Gamma (mixed)', hint: 'A tangled or messy area' },
      { value: 'delta', label: 'Delta (very messy)', hint: 'Very messy with lots of small bits' },
      { value: 'beta-delta', label: 'Beta-Delta', hint: 'A mix of two and messy bits' },
      { value: 'beta-gamma-delta', label: 'Beta-Gamma-Delta', hint: 'Very mixed and messy' },
      { value: 'gamma-delta', label: 'Gamma-Delta', hint: 'Mixed messy patches' },
      { value: 'none', label: "I don't know / none", hint: 'Not sure or not visible' },
    ],
  },
  {
    value:   'coronal_hole',
    label:   'Dark Region',
    icon:    '🕳️',
    lookFor: 'A big dark area on the sun, like a missing patch',
    color:   'text-cyan-300', bg: 'bg-cyan-500/15', border: 'border-cyan-500/40',
    subLabels: [
      { value: 'polar',        label: 'Top or bottom (near a pole)', hint: 'Dark area near the top or bottom of the sun'       },
      { value: 'equatorial',   label: 'In the middle band',          hint: 'Dark area near the middle of the sun' },
      { value: 'mid-latitude', label: 'Somewhere in between',        hint: 'Dark area between top and middle'           },
      { value: 'none',         label: "I don't see a dark region",   hint: 'I do not see a big dark patch'                         },
    ],
  },
  {
    value:   'prominence',
    label:   'Glowing Arch',
    icon:    '🌊',
    lookFor: 'A bright arch sticking out from the edge of the sun',
    color:   'text-sky-300', bg: 'bg-sky-500/15', border: 'border-sky-500/40',
    subLabels: [
      { value: 'eruptive',  label: 'Erupting outward into space', hint: 'The arch looks like it is breaking and flying away'      },
      { value: 'quiescent', label: 'Calm and stable',             hint: 'A calm arch that is not moving much'              },
      { value: 'active',    label: 'Moving and changing',         hint: 'The arch is wobbling or changing shape'        },
      { value: 'none',      label: "I don't see an arch",         hint: 'No arch at the sun edge'       },
    ],
  },
  {
    value:   'active_region',
    label:   'Active Region',
    icon:    '⚡',
    lookFor: 'A busy, bright area with lots going on',
    color:   'text-yellow-300', bg: 'bg-yellow-500/15', border: 'border-yellow-500/40',
    subLabels: [
      { value: 'alpha', label: 'Alpha (simple)', hint: 'A single simple bright area' },
      { value: 'beta', label: 'Beta (paired)', hint: 'Two bright spots close together' },
      { value: 'gamma', label: 'Gamma (complex)', hint: 'Many bright bits mixed together' },
      { value: 'beta-gamma', label: 'Beta-Gamma', hint: 'A mix of two and many bits' },
      { value: 'beta-gamma-delta', label: 'Beta-Gamma-Delta', hint: 'Very mixed and busy area' },
      { value: 'none', label: "I don't see an active region", hint: 'No busy area visible' },
    ],
  },
  {
    value:   'cme',
    label:   'Solar Storm',
    icon:    '💥',
    lookFor: 'A large cloud of gas erupting outward from the sun (often looks like a halo)',
    color:   'text-red-300', bg: 'bg-red-500/15', border: 'border-red-500/40',
    subLabels: [
      { value: 'full_halo',         label: 'Full ring all around the sun', hint: 'The eruption forms a complete ring / halo'         },
      { value: 'partial_halo', label: 'Partial ring / arc',           hint: 'An arc shape, not a full ring'                     },
      { value: 'narrow',       label: 'A thin stream or jet',         hint: 'A narrow stream of material in one direction'      },
      { value: 'none',         label: "I don't see anything erupting", hint: 'No visible cloud or eruption'                    },
    ],
  },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AnnotationPanelProps {
  taskType:     TaskType;
  taskId:       string;
  serialNumber: number;
  imageUrl:     string;
  externalImageId?: string; // if provided, use an external image element for overlays (prevents duplicate image)
  onSubmit:     (input: AnnotationInput) => void;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Sub-label card — shows the label and a one-line hint */
function SubLabelCard({
  sub, isSelected, onSelect, option,
}: { sub: SubLabel; isSelected: boolean; onSelect: (v: UserLabel) => void; option: TaskOption }) {
  return (
    <button
      onClick={() => onSelect(sub.value)}
      className={[
        'w-full text-left p-3 rounded-lg border transition-all duration-150',
        isSelected
          ? `${option.bg} ${option.color} ${option.border}`
          : 'bg-white/4 border-white/8 text-slate-400 hover:bg-white/7 hover:text-slate-200',
      ].join(' ')}
    >
      <div className="flex items-start gap-2">
        <div className={`mt-1 w-3.5 h-3.5 rounded-full border flex-shrink-0 flex items-center justify-center ${
          isSelected ? `${option.bg} ${option.border}` : 'border-white/20'
        }`}>
          {isSelected && (
            <div className={`w-1.5 h-1.5 rounded-full ${option.color.replace('text-', 'bg-')}`} />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium leading-tight flex items-center gap-2">
            <span className="font-mono text-[10px] text-slate-400">{sub.value}</span>
            <span>{sub.label}</span>
          </p>
          <p className={`text-xs mt-0.5 leading-snug ${isSelected ? 'opacity-60' : 'text-slate-600'}`}>
            {sub.hint}
          </p>
          {isSelected && (
            <p className="text-xs mt-1 italic text-slate-400">Scientific value: <code className="bg-white/6 px-1 py-0.5 rounded">{sub.value}</code></p>
          )}
        </div>
      </div>
    </button>
  );
}

function SuccessOverlay({ issueUrl, onDone }: { issueUrl?: string; onDone: () => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    timerRef.current = setTimeout(onDone, 4_000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
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
      <motion.div
        className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40
                   flex items-center justify-center text-3xl"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        🎉
      </motion.div>
      <div>
        <p className="text-lg font-bold text-emerald-300 mb-1">Thank you!</p>
        <p className="text-sm text-slate-300 leading-relaxed">
          Your observation has been recorded.<br />
          You're helping scientists study the sun!
        </p>
        {issueUrl && (
          <a
            href={issueUrl} target="_blank" rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-solar-400
                       hover:text-solar-300 underline underline-offset-2 transition-colors"
            onClick={e => e.stopPropagation()}
          >
            See your contribution on GitHub →
          </a>
        )}
        <p className="text-xs text-slate-500 mt-3">+1 point earned 🌟</p>
      </div>
      <button
        onClick={onDone}
        className="text-xs text-slate-600 hover:text-slate-400 transition-colors mt-1"
      >
        Classify another image
      </button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function AnnotationPanel({ taskType, taskId, serialNumber, imageUrl, externalImageId, onSubmit }: AnnotationPanelProps) {
  const [userLabel,   setUserLabel]   = useState<UserLabel  | null>(null);
  const [confidence,  setConfidence]  = useState(75);
  const [comments,    setComments]    = useState('');
  const [pixelCoords, setPixelCoords] = useState<Array<{ x: number; y: number; xPct?: number; yPct?: number }>>([]);
  // per-spot labels (parallel array to pixelCoords) — null means unlabeled
  const [pixelLabels, setPixelLabels] = useState<Array<UserLabel | null>>([]);
  const [pixelRadii, setPixelRadii] = useState<number[]>([]);
  const DEFAULT_RADIUS = 10;
  const [activeSpotIndex, setActiveSpotIndex] = useState<number | null>(null);
  const [regionRadius, setRegionRadius] = useState<number | undefined>(10);
  const [submitting,  setSubmitting]  = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [issueUrl,    setIssueUrl]    = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Dragging state for markers (pointer events)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  // When the user starts dragging a marker, make it the active spot so the
  // classification controls show for that marker.
  useEffect(() => {
    if (draggingIndex === null) return;
    setActiveSpotIndex(draggingIndex);
  }, [draggingIndex]);

  // Portal container when rendering overlays onto an external image element
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  // Pinch/multi-touch state — detect multi-finger gestures so we don't create markers
  const isPinchingRef = useRef(false);

  // Native touch handlers (usable by both addEventListener and React handlers)
  const onTouchStartNative = (ev: TouchEvent) => {
    if (ev.touches.length >= 2) {
      // mark that a multi-touch gesture is active; do NOT apply any scaling
      isPinchingRef.current = true;
    }
  };
  const onTouchMoveNative = (ev: TouchEvent) => {
    if (!isPinchingRef.current || ev.touches.length < 2) return;
    // Prevent default browser pinch-zoom, but intentionally do not change scale.
    try { ev.preventDefault(); } catch {}
  };
  const onTouchEndNative = (ev: TouchEvent) => {
    if (ev.touches.length < 2) {
      isPinchingRef.current = false;
    }
  };

  // React-friendly wrappers for JSX handlers
  const overlayTouchStart = (e: React.TouchEvent) => onTouchStartNative(e.nativeEvent as TouchEvent);
  const overlayTouchMove = (e: React.TouchEvent) => onTouchMoveNative(e.nativeEvent as TouchEvent);
  const overlayTouchEnd = (e: React.TouchEvent) => onTouchEndNative(e.nativeEvent as TouchEvent);

  const imageRef = useRef<HTMLImageElement | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);

  // Compute natural size on load
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget as HTMLImageElement;
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
  };

  // If an external image ID is provided, find its parent container and use it
  // as the overlay portal. Also attach the external image element to imageRef
  // so coordinate math remains identical to the internal image case.
  useEffect(() => {
    if (!externalImageId) return;
    const imgEl = document.getElementById(externalImageId) as HTMLImageElement | null;
    if (!imgEl) return;
    imageRef.current = imgEl;
    setPortalContainer(imgEl.parentElement);
    // disable default touch-action on the image so custom handlers work
    try { imgEl.style.touchAction = 'none'; } catch {}
    if (imgEl.naturalWidth && imgEl.naturalHeight) {
      setNaturalSize({ w: imgEl.naturalWidth, h: imgEl.naturalHeight });
    }
    const onLoad = () => setNaturalSize({ w: imgEl.naturalWidth, h: imgEl.naturalHeight });

    // Click / pointer handler so clicks on the external image add markers here
    const onPointerDown = (e: PointerEvent) => {
      // If pinch gesture active, ignore pointer-down to avoid adding markers
      if (isPinchingRef.current) return;
      // Only respond to primary button / touch
      if ((e as PointerEvent).button && (e as PointerEvent).button !== 0) return;
      const rect = imgEl.getBoundingClientRect();
      const xPct = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
      const yPct = Math.min(Math.max((e.clientY - rect.top) / rect.height, 0), 1);
      const x1024 = Math.round(xPct * 1024);
      const y1024 = Math.round(yPct * 1024);
      setPixelCoords(prev => {
        const next = [...prev, { x: x1024, y: y1024, xPct, yPct }];
        // keep pixelLabels and radii aligned
        setPixelLabels(pl => [...pl, null]);
        setPixelRadii(pr => [...pr, regionRadius ?? DEFAULT_RADIUS]);
        setActiveSpotIndex(next.length - 1);
        return next;
      });
    };

    // Use native handlers defined at component scope so JSX can call them too

    imgEl.addEventListener('load', onLoad);
    imgEl.addEventListener('pointerdown', onPointerDown);
    imgEl.addEventListener('touchstart', onTouchStartNative, { passive: true });
    imgEl.addEventListener('touchmove', onTouchMoveNative, { passive: false });
    imgEl.addEventListener('touchend', onTouchEndNative);
    imgEl.addEventListener('touchcancel', onTouchEndNative);

    return () => {
      imgEl.removeEventListener('load', onLoad);
      imgEl.removeEventListener('pointerdown', onPointerDown);
      imgEl.removeEventListener('touchstart', onTouchStartNative as EventListener);
      imgEl.removeEventListener('touchmove', onTouchMoveNative as EventListener);
      imgEl.removeEventListener('touchend', onTouchEndNative as EventListener);
      imgEl.removeEventListener('touchcancel', onTouchEndNative as EventListener);
    };
  }, [externalImageId]);

  // Click to add a selection — map to 1024x1024 canonical pixels and store percent for rendering
  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    // Prevent adding during pinch gesture
    if (isPinchingRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const dispX = e.clientX - rect.left;
    const dispY = e.clientY - rect.top;
    const xPct = dispX / rect.width;
    const yPct = dispY / rect.height;
    // Map to canonical 1024x1024 pixel grid regardless of source resolution
    const x1024 = Math.round(xPct * 1024);
    const y1024 = Math.round(yPct * 1024);
    setPixelCoords(prev => {
      const next = [...prev, { x: x1024, y: y1024, xPct, yPct }];
      setPixelLabels(pl => [...pl, null]);
      setPixelRadii(pr => [...pr, regionRadius ?? DEFAULT_RADIUS]);
      setActiveSpotIndex(next.length - 1);
      return next;
    });
  };

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegionRadius(Number(e.target.value));
  };

  // Keep pixelRadii array aligned with pixelCoords. If a new coord is added
  // ensure a default radius is appended; if coords are removed, trim radii.
  useEffect(() => {
    setPixelRadii(pr => {
      if (pr.length < pixelCoords.length) {
        return [...pr, ...Array(pixelCoords.length - pr.length).fill(regionRadius ?? DEFAULT_RADIUS)];
      }
      if (pr.length > pixelCoords.length) {
        return pr.slice(0, pixelCoords.length);
      }
      return pr;
    });
  }, [pixelCoords, regionRadius]);

  const handleSubmit = useCallback(async () => {
    if (!userLabel) return;
    setSubmitting(true);
    setSubmitError(null);

    const input: AnnotationInput = {
      task_id:       taskId,
      serial_number: serialNumber,
      image_url:     imageUrl,
      task_type:     taskType,
      user_label:    userLabel,
      confidence,
      comments:      comments.trim(),
      pixel_coords:  taskType === 'sunspot' || taskType === 'magnetogram' ? pixelCoords.map(p => ({ x: p.x, y: p.y })) : undefined,
      pixel_labels:  pixelLabels.length ? pixelLabels : undefined,
      pixel_radii:   pixelRadii.length ? pixelRadii : undefined,
      region_radius: taskType === 'magnetogram' ? regionRadius : undefined,
    };

    try {
      const result = await submitAnnotation(input);
      if (result.success) {
        setIssueUrl(result.issueUrl);
        setShowSuccess(true);
        onSubmit(input);
      } else if (result.error) {
        setSubmitError(result.error);
      }
    } catch {
      setSubmitError('Something went wrong. Your observation has been saved locally.');
    } finally {
      setSubmitting(false);
    }
  }, [taskType, userLabel, confidence, comments, taskId, serialNumber, imageUrl, onSubmit, pixelCoords, regionRadius, naturalSize]);

  const handleSuccessDone = useCallback(() => {
    setShowSuccess(false);
    setUserLabel(null);
    setConfidence(75);
    setComments('');
    setSubmitError(null);
    setIssueUrl(undefined);
    setPixelCoords([]);
    setPixelLabels([]);
    setPixelRadii([]);
    setActiveSpotIndex(null);
    setRegionRadius(10);
  }, []);


  const selectedOption = TASK_OPTIONS.find(o => o.value === taskType);
  if (!selectedOption) return null;
  const step           = !userLabel ? 1 : 2;
  const canSubmit      = Boolean(userLabel && !submitting);

  return (
    <div className="relative">
      <AnimatePresence>
        {showSuccess && <SuccessOverlay issueUrl={issueUrl} onDone={handleSuccessDone} />}
      </AnimatePresence>

      <motion.div variants={containerVariants} initial="hidden" animate="visible"
        className="flex flex-col gap-5">

        <motion.div variants={itemVariants}>
          <GuidePanel selectedOption={selectedOption} help={SCIENTIFIC_HELP[taskType]} />
        </motion.div>

        {/* ── Task-specific label question ────────────────────────────────── */}
        <motion.div
          variants={itemVariants}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col gap-2"
        >
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Question — Which best describes this {selectedOption.label.toLowerCase()} image?
          </p>
          <div className="flex flex-col gap-2 mt-1">
            {selectedOption.subLabels.map(sub => (
              <SubLabelCard
                key={sub.value}
                sub={sub}
                isSelected={userLabel === sub.value}
                onSelect={setUserLabel}
                option={selectedOption}
              />
            ))}
          </div>
          <p className="text-xs text-slate-600 italic mt-1">
            💡 Not 100% sure? That's fine — pick the closest one!
          </p>
          {/* Pixel/region selection UI for sunspot/magnetogram */}
          {(taskType === 'sunspot' || taskType === 'magnetogram') && (
            <div className="mt-3">
              <p className="text-xs text-slate-400 mb-1">Select spots on the image:</p>
              <div
                style={{ position: 'relative', display: 'inline-block', maxWidth: 320 }}
                onPointerMove={(e: React.PointerEvent) => {
                  if (draggingIndex === null) return;
                  const rect = imageRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  const xPct = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
                  const yPct = Math.min(Math.max((e.clientY - rect.top) / rect.height, 0), 1);
                  const x1024 = Math.round(xPct * 1024);
                  const y1024 = Math.round(yPct * 1024);
                  setPixelCoords(prev => prev.map((p, i) => i === draggingIndex ? { x: x1024, y: y1024, xPct, yPct } : p));
                }}
                onPointerUp={() => setDraggingIndex(null)}
              >
                {/* If an external image is provided, we render the image elsewhere and mount
                    the interactive SVG overlay onto its parent via a portal. This avoids
                    showing the image twice while keeping all coordinate math identical. */}
                {!externalImageId ? (
                  <>
                    <img
                      ref={imageRef}
                      src={imageUrl}
                      alt="Solar observation"
                      style={{ width: '100%', borderRadius: 8, border: '1px solid #333', cursor: 'crosshair', display: 'block', touchAction: 'none' }}
                      onClick={handleImageClick}
                      onLoad={handleImageLoad}
                    />
                    <svg
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      onPointerDown={(e: React.PointerEvent<SVGSVGElement>) => {
                        // If pinching, ignore adding markers
                        if (isPinchingRef.current) return;
                        // Add a marker when user clicks empty SVG background (not on an existing circle)
                        const target = e.target as Element;
                        if (target && target.tagName.toLowerCase() !== 'svg') return;
                        const rect = imageRef.current?.getBoundingClientRect();
                        if (!rect) return;
                        const xPct = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
                        const yPct = Math.min(Math.max((e.clientY - rect.top) / rect.height, 0), 1);
                        const x1024 = Math.round(xPct * 1024);
                        const y1024 = Math.round(yPct * 1024);
                        setPixelCoords(prev => {
                          const next = [...prev, { x: x1024, y: y1024, xPct, yPct }];
                          setPixelLabels(pl => [...pl, null]);
                          setPixelRadii(pr => [...pr, regionRadius ?? DEFAULT_RADIUS]);
                          setActiveSpotIndex(next.length - 1);
                          return next;
                        });
                      }}
                      onTouchStart={overlayTouchStart}
                      onTouchMove={overlayTouchMove}
                      onTouchEnd={overlayTouchEnd}
                      style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'auto', touchAction: 'none' }}
                    >
                      {pixelCoords.map((p, idx) => (
                        <g key={idx}>
                          <circle
                            onPointerDown={e => { e.stopPropagation(); setDraggingIndex(idx); setActiveSpotIndex(idx); }}
                            cx={`${(p.xPct ?? 0) * 100}`}
                            cy={`${(p.yPct ?? 0) * 100}`}
                            r={2.8}
                            style={{ cursor: 'grab' }}
                            fill={activeSpotIndex === idx ? 'rgba(59,130,246,0.95)' : 'rgba(34,197,94,0.95)'}
                            stroke="#fff"
                            strokeWidth={0.5}
                          />
                          <text
                            x={`${(p.xPct ?? 0) * 100 + 3}`}
                            y={`${(p.yPct ?? 0) * 100 + 3}`}
                            fontSize={3}
                            fill="#fff"
                            style={{ textAnchor: 'start' }}
                          >{idx + 1}</text>
                          <rect x={`${(p.xPct ?? 0) * 100 + 6}`} y={`${(p.yPct ?? 0) * 100 - 1}`} width={14} height={5} rx={1} fill="rgba(0,0,0,0.45)" />
                          <text
                            x={`${(p.xPct ?? 0) * 100 + 7}`}
                            y={`${(p.yPct ?? 0) * 100 + 2.5}`}
                            fontSize={2.5}
                            fill="#fff"
                            style={{ textAnchor: 'start' }}
                          >{(pixelLabels[idx] ?? '...').toString().slice(0,6)}</text>
                        </g>
                      ))}
                      {taskType === 'magnetogram' && regionRadius && pixelCoords.length > 0 && (
                        (() => {
                          const center = pixelCoords[0];
                          const radiusPct = ((regionRadius ?? 0) / 1024) * 100;
                          return (
                            <circle
                              onPointerDown={e => { e.stopPropagation(); setDraggingIndex(0); setActiveSpotIndex(0); }}
                              cx={`${(center.xPct ?? 0) * 100}`}
                              cy={`${(center.yPct ?? 0) * 100}`}
                              r={radiusPct}
                              style={{ cursor: 'grab' }}
                              fill="rgba(99,102,241,0.08)"
                              stroke="rgba(99,102,241,0.8)"
                              strokeWidth={0.6}
                            />
                          );
                        })()
                      )}
                    </svg>
                  </>
                ) : (
                  // external image mode: mount svg overlay into the external image's parent
                  portalContainer && createPortal(
                    <svg
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      onPointerDown={(e: React.PointerEvent<SVGSVGElement>) => {
                        // If pinching, ignore adding markers
                        if (isPinchingRef.current) return;
                        const target = e.target as Element;
                        if (target && target.tagName.toLowerCase() !== 'svg') return;
                        const rect = imageRef.current?.getBoundingClientRect();
                        if (!rect) return;
                        const xPct = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
                        const yPct = Math.min(Math.max((e.clientY - rect.top) / rect.height, 0), 1);
                        const x1024 = Math.round(xPct * 1024);
                        const y1024 = Math.round(yPct * 1024);
                        setPixelCoords(prev => {
                          const next = [...prev, { x: x1024, y: y1024, xPct, yPct }];
                          setPixelLabels(pl => [...pl, null]);
                          setPixelRadii(pr => [...pr, regionRadius ?? DEFAULT_RADIUS]);
                          setActiveSpotIndex(next.length - 1);
                          return next;
                        });
                      }}
                      onTouchStart={overlayTouchStart}
                      onTouchMove={overlayTouchMove}
                      onTouchEnd={overlayTouchEnd}
                      style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'auto', touchAction: 'none' }}
                    >
                      {pixelCoords.map((p, idx) => (
                        <g key={idx}>
                          <circle
                            onPointerDown={e => { e.stopPropagation(); setDraggingIndex(idx); setActiveSpotIndex(idx); }}
                            cx={`${(p.xPct ?? 0) * 100}`}
                            cy={`${(p.yPct ?? 0) * 100}`}
                            r={2.8}
                            style={{ cursor: 'grab' }}
                            fill={activeSpotIndex === idx ? 'rgba(59,130,246,0.95)' : 'rgba(34,197,94,0.95)'}
                            stroke="#fff"
                            strokeWidth={0.5}
                          />
                          <text
                            x={`${(p.xPct ?? 0) * 100 + 3}`}
                            y={`${(p.yPct ?? 0) * 100 + 3}`}
                            fontSize={3}
                            fill="#fff"
                            style={{ textAnchor: 'start' }}
                          >{idx + 1}</text>
                          <rect x={`${(p.xPct ?? 0) * 100 + 6}`} y={`${(p.yPct ?? 0) * 100 - 1}`} width={14} height={5} rx={1} fill="rgba(0,0,0,0.45)" />
                          <text
                            x={`${(p.xPct ?? 0) * 100 + 7}`}
                            y={`${(p.yPct ?? 0) * 100 + 2.5}`}
                            fontSize={2.5}
                            fill="#fff"
                            style={{ textAnchor: 'start' }}
                          >{(pixelLabels[idx] ?? '...').toString().slice(0,6)}</text>
                        </g>
                      ))}
                      {taskType === 'magnetogram' && regionRadius && pixelCoords.length > 0 && (
                        (() => {
                          const center = pixelCoords[0];
                          const radiusPct = ((regionRadius ?? 0) / 1024) * 100;
                          return (
                            <circle
                              onPointerDown={e => { e.stopPropagation(); setDraggingIndex(0); }}
                              cx={`${(center.xPct ?? 0) * 100}`}
                              cy={`${(center.yPct ?? 0) * 100}`}
                              r={radiusPct}
                              style={{ cursor: 'grab' }}
                              fill="rgba(99,102,241,0.08)"
                              stroke="rgba(99,102,241,0.8)"
                              strokeWidth={0.6}
                            />
                          );
                        })()
                      )}
                    </svg>,
                    portalContainer,
                  )
                )}
              </div>
              {/* Per-spot label chooser (appears when a spot is selected) */}
              {activeSpotIndex !== null && selectedOption && (
                <div className="mt-2">
                  <p className="text-xs text-slate-400 mb-1">Label for selected spot: #{activeSpotIndex + 1}</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedOption.subLabels.map(sub => (
                      <button
                        key={sub.value}
                        type="button"
                        onClick={() => setPixelLabels(pl => pl.map((v, i) => i === activeSpotIndex ? sub.value : v))}
                        className={`text-xs px-2 py-1 rounded ${pixelLabels[activeSpotIndex] === sub.value ? 'bg-solar-500 text-white' : 'bg-white/6 text-slate-200'}`}
                      >{sub.label}</button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPixelLabels(pl => pl.map((v, i) => i === activeSpotIndex ? null : v))}
                      className="text-xs px-2 py-1 rounded bg-red-600/10 text-red-300"
                    >Clear</button>
                  </div>
                </div>
              )}

              <div className="mt-2 text-xs text-slate-500">
                <div className="mb-1">Coordinates (preview):</div>
                {pixelCoords.length > 0 ? (
                  <div>
                    <div className="text-xs mb-2">Format: x,y[,radius] ; multiple entries separated by ` ; `</div>
                    <ul className="mt-1">
                      {activeSpotIndex !== null && (
                        <li className="text-xs text-slate-400 mb-1">Selected spot: #{activeSpotIndex + 1}</li>
                      )}
                      {pixelCoords.map((p, idx) => {
                        const r = pixelRadii[idx] ?? regionRadius ?? 0;
                        const coordStr = `${p.x},${p.y}${taskType === 'magnetogram' ? `,${r}` : ''}`;
                        const label = pixelLabels[idx] ?? null;
                        return (
                          <li key={idx} className="flex items-center gap-3">
                            <code className="bg-white/6 px-2 py-1 rounded text-xs">{coordStr}</code>
                            {label ? (
                              <span className="text-xs text-slate-300">{label}</span>
                            ) : (
                              <span className="text-xs text-slate-500 italic">(unlabeled)</span>
                            )}
                            <button
                              className="text-xs text-red-400 hover:text-red-600 underline"
                              onClick={e => { e.stopPropagation(); setPixelCoords(pc => {
                                const next = pc.filter((_, i) => i !== idx);
                                setPixelLabels(pl => pl.filter((_, i) => i !== idx));
                                setPixelRadii(pr => pr.filter((_, i) => i !== idx));
                                setActiveSpotIndex(prev => {
                                  if (prev === null) return null;
                                  if (idx < prev) return prev - 1;
                                  if (idx === prev) return next.length > 0 ? Math.max(0, prev - 1) : null;
                                  return prev;
                                });
                                return next;
                              }); }}
                            >Remove</button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : (
                  <div className="text-xs italic text-slate-600">No coordinates selected</div>
                )}
              </div>

              {/* Per-spot radius control (magnetograms): when a spot is selected allow setting its radius in px */}
              {taskType === 'magnetogram' && activeSpotIndex !== null && pixelRadii[activeSpotIndex] !== undefined && (
                <div className="mt-2">
                  <label className="text-xs text-slate-400">Radius for selected spot (px)</label>
                  <input type="range" min={1} max={1024}
                    value={pixelRadii[activeSpotIndex]}
                    onChange={e => {
                      const v = Number(e.target.value);
                      setPixelRadii(pr => pr.map((r, i) => i === activeSpotIndex ? v : r));
                    }}
                    className="ml-2" />
                  <span className="ml-2 text-xs text-slate-500">{pixelRadii[activeSpotIndex]} px</span>
                </div>
              )}

              {taskType === 'magnetogram' && (
                <div className="mt-2">
                  <label className="text-xs text-slate-400">Region radius (px, image scale 1024)</label>
                  <input type="range" min={1} max={1024} value={regionRadius || 10} onChange={handleRadiusChange} className="ml-2" />
                  <span className="ml-2 text-xs text-slate-500">{regionRadius || 10} px</span>

                  <div className="mt-2">
                    <button
                      className="text-xs text-solar-300 underline"
                      onClick={() => {
                        // Make the last placed marker the center (move to index 0)
                        setPixelCoords(prev => {
                          if (prev.length <= 1) return prev;
                          const next = [...prev];
                          const last = next.pop()!;
                          next.unshift(last);
                          return next;
                        });
                      }}
                    >Set center to last placed marker</button>
                    <p className="text-xs text-slate-500 mt-1">Tip: place the center marker last, then click this to use it as the region centre.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* ── Confidence slider ─────────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="glass rounded-xl p-4 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">How confident are you?</span>
            <motion.span key={confidence}
              className="text-xs font-semibold text-solar-300"
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}>
              {confidence < 40 ? 'Just guessing' : confidence < 70 ? 'Somewhat sure' : confidence < 90 ? 'Pretty sure' : 'Very certain'} · {confidence}%
            </motion.span>
          </div>
          <input
            type="range" min={0} max={100} step={5} value={confidence}
            onChange={e => setConfidence(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10 accent-solar-500"
            aria-label="How confident are you in your classification"
          />
          <div className="flex justify-between text-xs text-slate-700">
            <span>Just guessing</span><span>Absolutely certain</span>
          </div>
        </motion.div>

        {/* ── Notes ────────────────────────────────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <label htmlFor="comments" className="block text-xs text-slate-400 mb-2">
            Anything else you noticed? <span className="text-slate-600">(optional)</span>
          </label>
          <textarea
            id="comments" value={comments}
            onChange={e => setComments(e.target.value)}
            placeholder="e.g. 'There's a very bright spot in the upper right corner' or 'The arch looks like it's about to erupt'"
            rows={3}
            className="w-full bg-white/4 border border-white/8 rounded-xl px-4 py-3
                       text-sm text-slate-300 placeholder-slate-700
                       resize-none focus:outline-none focus:border-solar-500/60
                       focus:bg-white/6 transition-colors leading-relaxed"
          />
        </motion.div>

        {/* ── Error ────────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {submitError && (
            <motion.p
              className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20
                         rounded-lg px-3 py-2 leading-relaxed"
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            >
              ⚠️ {submitError}
            </motion.p>
          )}
        </AnimatePresence>

        {/* ── Submit ───────────────────────────────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <motion.button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={[
              'w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200',
              canSubmit
                ? 'btn-solar cursor-pointer'
                : 'bg-white/5 text-slate-600 border border-white/8 cursor-not-allowed',
            ].join(' ')}
            whileHover={canSubmit ? { scale: 1.02 } : {}}
            whileTap={canSubmit   ? { scale: 0.98 } : {}}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.7, ease: 'linear', repeat: Infinity }}
                />
                Submitting your observation…
              </span>
            ) : canSubmit ? (
              'Submit My Observation →'
            ) : (
              '↑ Pick the best matching label above'
            )}
          </motion.button>
        </motion.div>

      </motion.div>
    </div>
  );
}

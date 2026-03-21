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

export interface SubLabel { value: UserLabel; label: string; hint: string }
export interface TaskOption {
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
export const SCIENTIFIC_HELP: Record<TaskType, { scientific: string; plain: string; uncertainLabel: UserLabel }> = {
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

export const TASK_OPTIONS: TaskOption[] = [
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

export interface AnnotationPanelProps {
  taskType:     TaskType;
  taskId:       string;
  serialNumber: number;
  imageUrl:     string;
  externalImageId?: string; // if provided, use an external image element for overlays (prevents duplicate image)
  onSubmit:     (input: AnnotationInput) => void;
  showGuide?:    boolean; // when false, the parent is expected to render GuidePanel above the image
  userLabel?:   UserLabel;
  onUserLabelChange?: (label: UserLabel) => void;
  showLabels?:  boolean;
  isLocked?:    boolean;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Floating controls for a specific region */
function RegionControlsPopup({ 
  idx, label, radius, options, onChangeLabel, onChangeRadius, onRemove, isLocked
}: { 
  idx: number; 
  label: UserLabel; 
  radius: number; 
  options: TaskOption;
  onChangeLabel: (l: UserLabel) => void;
  onChangeRadius: (r: number) => void;
  onRemove: () => void;
  isLocked: boolean;
}) {
  if (isLocked) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="absolute z-[70] mt-2 glass-strong rounded-xl border border-white/20 shadow-2xl p-3 flex flex-col gap-3 min-w-[200px]"
      style={{ left: '50%', transform: 'translateX(-50%)' }}
    >
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-solar-400">Region #{idx + 1}</span>
        <button onClick={onRemove} className="text-rose-400 hover:text-rose-300 transition-colors">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] text-slate-500 uppercase font-bold">Scientific Label</label>
        <div className="grid grid-cols-2 gap-1">
          {options.subLabels.map(sub => (
            <button
              key={sub.value}
              onClick={() => onChangeLabel(sub.value)}
              className={`text-[10px] py-1.5 px-2 rounded-md transition-all border ${
                label === sub.value 
                  ? 'bg-solar-500 text-white border-solar-400 shadow-lg shadow-solar-500/20' 
                  : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
              }`}
            >
              {sub.label.split('(')[0].trim()}
            </button>
          ))}
          <button
            onClick={() => onChangeLabel('none')}
            className={`text-[10px] py-1.5 px-2 rounded-md transition-all border ${
              label === 'none' 
                ? 'bg-slate-600 text-white border-slate-500' 
                : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
            }`}
          >
            None
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <label className="text-[10px] text-slate-500 uppercase font-bold">Size (Radius)</label>
          <span className="text-[10px] font-mono text-solar-300">{radius}px</span>
        </div>
        <input 
          type="range" min={1} max={300} value={radius}
          onChange={e => onChangeRadius(Number(e.target.value))}
          className="w-full h-1 rounded-full appearance-none cursor-pointer bg-white/10 accent-solar-500" 
        />
      </div>
    </motion.div>
  );
}

/** Sub-label card — shows the label and a one-line hint */
export function SubLabelCard({
  sub, isSelected, onSelect, option,
}: { sub: SubLabel; isSelected: boolean; onSelect: (v: UserLabel) => void; option: TaskOption }) {
  return (
    <button
      onClick={() => onSelect(sub.value)}
      disabled={isSelected}
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

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function AnnotationPanel({
  taskType, taskId, serialNumber, imageUrl, externalImageId, onSubmit,
  showGuide = true, userLabel: externalUserLabel, onUserLabelChange, showLabels = true, isLocked = false
}: AnnotationPanelProps) {
  const [internalUserLabel, setInternalUserLabel] = useState<UserLabel>('none');
  const userLabel = externalUserLabel !== undefined ? externalUserLabel : internalUserLabel;
  const setUserLabel = onUserLabelChange || setInternalUserLabel;
  const [confidence,  setConfidence]  = useState(75);
  const [comments,    setComments]    = useState('');
  const [pixelCoords, setPixelCoords] = useState<Array<{ x: number; y: number; xPct?: number; yPct?: number }>>([]);
  // per-spot labels (parallel array to pixelCoords) — null means unlabeled
  const [pixelLabels, setPixelLabels] = useState<Array<UserLabel | null>>([]);
  const [pixelRadii, setPixelRadii] = useState<number[]>([]);
  const DEFAULT_RADIUS = 5;
  const [activeSpotIndex, setActiveSpotIndex] = useState<number | null>(null);
  const [isNone, setIsNone] = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
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
      // If locked or pinch gesture active, ignore pointer-down to avoid adding markers
      if (isLocked || isPinchingRef.current) return;
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
        setPixelRadii(pr => [...pr, DEFAULT_RADIUS]);
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
    // Prevent adding during pinch gesture or if locked
    if (isLocked || isPinchingRef.current) return;
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
      setPixelRadii(pr => [...pr, DEFAULT_RADIUS]);
      setActiveSpotIndex(next.length - 1);
      setIsNone(false); // Disable 'none' if user marks a region
      return next;
    });
  };

  const handleToggleNone = () => {
    const nextNone = !isNone;
    setIsNone(nextNone);
    if (nextNone) {
      // Clear all regions if user explicitly says "None visible"
      setPixelCoords([]);
      setPixelLabels([]);
      setPixelRadii([]);
      setActiveSpotIndex(null);
    }
  };

  const selectedOption = TASK_OPTIONS.find(o => o.value === taskType);

  // Derive user_label from the first labeled spot if it's not explicitly set
  const derivedUserLabel = isNone ? 'none' : (userLabel || pixelLabels.find(l => l !== null) || 'none');

  const handleSubmit = useCallback(async () => {
    if (!derivedUserLabel || isLocked) return;
    setSubmitting(true);
    setSubmitError(null);

    const input: AnnotationInput = {
      task_id:       taskId,
      serial_number: serialNumber,
      image_url:     imageUrl,
      task_type:     taskType,
      user_label:    derivedUserLabel,
      confidence,
      comments:      comments.trim(),
      pixel_coords:  isNone ? [] : pixelCoords.map(p => ({ x: p.x, y: p.y })),
      pixel_labels:  isNone ? [] : (pixelLabels.length ? pixelLabels : undefined),
      pixel_radii:   isNone ? [] : (pixelRadii.length ? pixelRadii : undefined),
    };

    try {
      const result = await submitAnnotation(input);
      if (result.success) {
        onSubmit(input);
        // Reset local state immediately
        setUserLabel('none');
        setConfidence(75);
        setComments('');
        setSubmitError(null);
        setPixelCoords([]);
        setPixelLabels([]);
        setPixelRadii([]);
        setActiveSpotIndex(null);
      } else if (result.error) {
        setSubmitError(result.error);
      }
    } catch {
      setSubmitError('Something went wrong. Your observation has been saved locally.');
    } finally {
      setSubmitting(false);
    }
  }, [taskType, derivedUserLabel, confidence, comments, taskId, serialNumber, imageUrl, onSubmit, pixelCoords, pixelRadii, pixelLabels, naturalSize, isLocked]);

  if (!selectedOption) return null;

  const hasAtLeastOneLabeledSpot = pixelLabels.length > 0 && pixelLabels.every(l => l !== null);
  const canSubmit = Boolean((hasAtLeastOneLabeledSpot || isNone) && !submitting);

  return (
    <div className="relative">

      <motion.div variants={containerVariants} initial="hidden" animate="visible"
        className="flex flex-col gap-5">

        <motion.div variants={itemVariants}>
          {showGuide && <GuidePanel selectedOption={selectedOption} help={SCIENTIFIC_HELP[taskType]} /> }
        </motion.div>

        {/* Pixel/region selection UI */}
        <motion.div variants={itemVariants} className="mt-3">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex flex-col gap-0.5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">1. Mark Areas</p>
              <p className="text-[10px] text-slate-500">Click image to add a region</p>
            </div>
            <button
              onClick={handleToggleNone}
              className={`text-[10px] px-3 py-1.5 rounded-full font-bold transition-all border ${
                isNone 
                  ? 'bg-solar-500 text-white border-solar-400 shadow-lg shadow-solar-500/20' 
                  : 'bg-white/5 text-slate-500 border-white/10 hover:text-slate-300'
              }`}
            >
              {isNone ? '✓ Everything looks clear' : `No ${selectedOption.label.toLowerCase()} visible?`}
            </button>
          </div>

          <div
            className="relative inline-block w-full max-w-[512px] group"
            onPointerMove={(e: React.PointerEvent) => {
              if (draggingIndex === null || isLocked) return;
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
            {/* Blocking Overlay - absolutely prevents interaction when locked */}
            {isLocked && (
              <div 
                className="absolute inset-0 z-[60] cursor-not-allowed bg-black/5" 
                onClick={e => e.stopPropagation()}
                onPointerDown={e => e.stopPropagation()}
              />
            )}

            {/* If an external image is provided, we render the image elsewhere and mount
                the interactive SVG overlay onto its parent via a portal. This avoids
                showing the image twice while keeping all coordinate math identical. */}
            {!externalImageId ? (
              <>
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt="Solar observation"
                  className="w-full rounded-2xl border border-white/10 shadow-inner"
                  style={{ cursor: isLocked ? 'default' : 'crosshair', display: 'block', touchAction: 'none' }}
                  onClick={handleImageClick}
                  onLoad={handleImageLoad}
                />
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  onPointerDown={(e: React.PointerEvent<SVGSVGElement>) => {
                    // If locked or pinching, ignore adding markers
                    if (isLocked || isPinchingRef.current) return;
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
                      setPixelRadii(pr => [...pr, DEFAULT_RADIUS]);
                      setActiveSpotIndex(next.length - 1);
                      setIsNone(false); // Disable 'none' if user marks a region
                      return next;
                    });
                  }}
                  onTouchStart={overlayTouchStart}
                  onTouchMove={overlayTouchMove}
                  onTouchEnd={overlayTouchEnd}
                  className="absolute inset-0 w-full h-full pointer-events-auto touch-none overflow-visible"
                >
                  {pixelCoords.map((p, idx) => {
                    const radiusPct = ((pixelRadii[idx] ?? DEFAULT_RADIUS) / 1024) * 100;
                    const isActive = activeSpotIndex === idx;
                    return (
                      <g key={idx}>
                        {/* Translucent draggable region */}
                        <circle
                          onPointerDown={e => {
                            if (isLocked) return;
                            e.stopPropagation();
                            setDraggingIndex(idx);
                            setActiveSpotIndex(idx);
                          }}
                          cx={`${(p.xPct ?? 0) * 100}`}
                          cy={`${(p.yPct ?? 0) * 100}`}
                          r={radiusPct}
                          style={{ cursor: isLocked ? 'default' : 'grab', pointerEvents: isLocked ? 'none' : 'auto' }}
                          fill={isActive ? 'rgba(59,130,246,0.2)' : 'rgba(34,197,94,0.2)'}
                          stroke={isActive ? 'rgba(59,130,246,0.8)' : 'rgba(34,197,94,0.8)'}
                          strokeWidth={isActive ? 0.6 : 0.4}
                        />
                        <text
                          x={`${(p.xPct ?? 0) * 100}`}
                          y={`${(p.yPct ?? 0) * 100}`}
                          fontSize={3}
                          fill="#fff"
                          className="select-none pointer-events-none font-bold"
                          style={{ textAnchor: 'middle', dominantBaseline: 'middle', filter: 'drop-shadow(0px 0px 2px black)' }}
                        >{idx + 1}</text>
                      </g>
                    );
                  })}
                </svg>
              </>
            ) : (
              // external image mode: mount svg overlay into the external image's parent
              portalContainer && createPortal(
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  onPointerDown={(e: React.PointerEvent<SVGSVGElement>) => {
                    // If locked or pinching, ignore adding markers
                    if (isLocked || isPinchingRef.current) return;
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
                      setPixelRadii(pr => [...pr, DEFAULT_RADIUS]);
                      setActiveSpotIndex(next.length - 1);
                      setIsNone(false);
                      return next;
                    });
                  }}
                  onTouchStart={overlayTouchStart}
                  onTouchMove={overlayTouchMove}
                  onTouchEnd={overlayTouchEnd}
                  style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: isLocked ? 'none' : 'auto', touchAction: 'none' }}
                >
                  {pixelCoords.map((p, idx) => {
                    const radiusPct = ((pixelRadii[idx] ?? DEFAULT_RADIUS) / 1024) * 100;
                    const isActive = activeSpotIndex === idx;
                    return (
                      <g key={idx}>
                        <circle
                          onPointerDown={e => {
                            if (isLocked) return;
                            e.stopPropagation();
                            setDraggingIndex(idx);
                            setActiveSpotIndex(idx);
                          }}
                          cx={`${(p.xPct ?? 0) * 100}`}
                          cy={`${(p.yPct ?? 0) * 100}`}
                          r={radiusPct}
                          style={{ cursor: isLocked ? 'default' : 'grab', pointerEvents: isLocked ? 'none' : 'auto' }}
                          fill={isActive ? 'rgba(59,130,246,0.2)' : 'rgba(34,197,94,0.2)'}
                          stroke={isActive ? 'rgba(59,130,246,0.8)' : 'rgba(34,197,94,0.8)'}
                          strokeWidth={isActive ? 0.6 : 0.4}
                        />
                        <text
                          x={`${(p.xPct ?? 0) * 100}`}
                          y={`${(p.yPct ?? 0) * 100}`}
                          fontSize={3}
                          fill="#fff"
                          className="select-none pointer-events-none font-bold"
                          style={{ textAnchor: 'middle', dominantBaseline: 'middle', filter: 'drop-shadow(0px 0px 2px black)' }}
                        >{idx + 1}</text>
                      </g>
                    );
                  })}
                </svg>,
                portalContainer,
              )
            )}

            {/* Region Controls Popup */}
            {activeSpotIndex !== null && (
              <RegionControlsPopup
                idx={activeSpotIndex}
                label={pixelLabels[activeSpotIndex]}
                radius={pixelRadii[activeSpotIndex] ?? DEFAULT_RADIUS}
                options={selectedOption}
                isLocked={isLocked}
                onChangeLabel={l => setPixelLabels(pl => pl.map((v, i) => i === activeSpotIndex ? l : v))}
                onChangeRadius={r => setPixelRadii(pr => pr.map((v, i) => i === activeSpotIndex ? r : v))}
                onRemove={() => {
                  setPixelCoords(pc => pc.filter((_, i) => i !== activeSpotIndex));
                  setPixelLabels(pl => pl.filter((_, i) => i !== activeSpotIndex));
                  setPixelRadii(pr => pr.filter((_, i) => i !== activeSpotIndex));
                  setActiveSpotIndex(null);
                }}
              />
            )}
          </div>

          <div className="mt-6">
            <div className="flex flex-col gap-0.5 mb-3 px-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">2. Finalize</p>
              <p className="text-[10px] text-slate-500">Confirm labels and confidence</p>
            </div>
            {pixelCoords.length > 0 ? (
              <div className="flex flex-col gap-2">
                <ul className="flex flex-col gap-1.5">
                  {pixelCoords.map((p, idx) => {
                    const r = pixelRadii[idx] ?? DEFAULT_RADIUS;
                    const coordStr = `${p.x}, ${p.y}, ${r}`;
                    const label = pixelLabels[idx] ?? null;
                    const isSelectedSpot = activeSpotIndex === idx;
                    return (
                      <li key={idx} 
                        onClick={() => setActiveSpotIndex(idx)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isSelectedSpot 
                            ? 'bg-solar-500/10 border-solar-500/40 ring-1 ring-solar-500/20' 
                            : 'bg-white/4 border-white/8 hover:bg-white/6'
                        }`}>
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-black ${
                            isSelectedSpot ? 'bg-solar-500 text-white' : 'bg-slate-700 text-slate-300'
                          }`}>{idx + 1}</span>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              {label ? (
                                <span className="text-[12px] font-bold text-slate-100 uppercase tracking-tight">{label}</span>
                              ) : (
                                <span className="text-[11px] text-rose-400 font-bold italic animate-pulse">Needs Label</span>
                              )}
                            </div>
                            <code className="text-[10px] text-slate-500 font-mono">pos: {coordStr}</code>
                          </div>
                        </div>
                        {!submitting && !isLocked && (
                          <button
                            className="p-2 text-slate-500 hover:text-rose-400 transition-colors rounded-lg hover:bg-rose-500/10"
                            onClick={e => { 
                              e.stopPropagation(); 
                              setPixelCoords(pc => pc.filter((_, i) => i !== idx));
                              setPixelLabels(pl => pl.filter((_, i) => i !== idx));
                              setPixelRadii(pr => pr.filter((_, i) => i !== idx));
                              setActiveSpotIndex(null);
                            }}
                          >
                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : !isNone && (
              <div className="p-6 rounded-2xl border-2 border-dashed border-white/5 bg-white/2 text-center">
                <span className="text-2xl mb-2 block">🎯</span>
                <p className="text-[11px] font-medium text-slate-500 leading-relaxed uppercase tracking-widest">
                  Tap the solar image above to mark areas of interest
                </p>
              </div>
            )}
          </div>
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
            placeholder="e.g. 'There's a very bright region in the upper right corner' or 'The arch looks like it's about to erupt'"
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
              isNone ? 'Submit My Observation →' : '↑ Mark & label at least one region on the image'
            )}
          </motion.button>
        </motion.div>

      </motion.div>
    </div>
  );
}

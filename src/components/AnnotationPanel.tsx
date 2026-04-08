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

const AURORA_ANNOTATE_YML_LABELS: Record<'sunspot' | 'magnetogram', UserLabel[]> = {
  sunspot: ['class_a', 'class_b', 'class_c', 'class_d', 'class_e', 'class_f', 'class_h', 'none'],
  magnetogram: ['alpha', 'beta', 'gamma', 'beta-gamma', 'delta', 'beta-delta', 'beta-gamma-delta', 'gamma-delta', 'none'],
};

const AURORA_LABEL_HINTS: Partial<Record<UserLabel, string>> = {
  class_a: 'Very tiny dot, like a tiny freckle',
  class_b: 'A small dark dot you can see clearly',
  class_c: 'A medium-sized group of dots',
  class_d: 'A large group of dark spots',
  class_e: 'Very big group covering lots of area',
  class_f: 'Many spots spread across the sun',
  class_h: 'Huge, very noticeable spot group',
  alpha: 'Just one simple patch',
  beta: 'Two nearby patches',
  gamma: 'Many small mixed patches',
  'beta-gamma': 'A tangled or messy area',
  delta: 'Very messy with lots of small bits',
  'beta-delta': 'A mix of two and messy bits',
  'beta-gamma-delta': 'Very mixed and messy',
  'gamma-delta': 'Mixed messy patches',
  none: 'Not sure or not visible',
};

function buildAuroraSubLabels(task: 'sunspot' | 'magnetogram', noneLabel: string): SubLabel[] {
  return AURORA_ANNOTATE_YML_LABELS[task].map(label => {
    if (label === 'none') {
      return { value: label, label: noneLabel, hint: AURORA_LABEL_HINTS.none || 'Not sure or not visible' };
    }
    const humanLabel = label
      .split('-')
      .map(part => part.replace('class_', 'class ').replace(/^./, ch => ch.toUpperCase()))
      .join('-');
    return {
      value: label,
      label: humanLabel,
      hint: AURORA_LABEL_HINTS[label] || 'Aurora scientific label',
    };
  });
}

export const TASK_OPTIONS: TaskOption[] = [
  {
    value:   'sunspot',
    label:   'Sun Spots',
    icon:    '🟤',
    lookFor: 'Dark dots on the bright sun (like freckles).',
    color:   'text-orange-300', bg: 'bg-orange-500/15', border: 'border-orange-500/40',
    subLabels: buildAuroraSubLabels('sunspot', "I don't know / none"),
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
    color:   'text-nebula-300', bg: 'bg-nebula-500/15', border: 'border-nebula-500/40',
    subLabels: buildAuroraSubLabels('magnetogram', "I don't know / none"),
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
  isLocked?:    boolean;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Stationary editor panel for the active region */
function RegionEditorPanel({ 
  idx, label, radius, options, onChangeLabel, onChangeRadius, onRemove, isLocked
}: { 
  idx: number; 
  label: UserLabel | null; 
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
      initial={{ opacity: 0, y: -10, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -10, height: 0 }}
      className="w-full mt-3 bg-slate-800/95 border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md"
    >
      <div className="p-4 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-blue-500/30">
              {idx + 1}
            </div>
            <span className="text-sm font-bold text-slate-200 tracking-wide">Edit Region</span>
          </div>
          <button 
            onClick={onRemove} 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors text-xs font-medium"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Remove
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Label Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Classification</label>
            <div className="relative">
              <select
                value={label || ''}
                onChange={(e) => onChangeLabel(e.target.value as UserLabel)}
                className="w-full appearance-none bg-slate-900/50 border border-white/10 text-slate-200 text-xs rounded-lg py-2.5 px-3 pr-8 focus:outline-none focus:border-solar-500 focus:ring-1 focus:ring-solar-500/50 transition-all"
              >
                <option value="" disabled>Select a label...</option>
                {options.subLabels.map((sub, idx) => (
                  <option key={sub.value} value={sub.value}>
                    {idx < 9 ? `[${idx + 1}] ` : ''}{sub.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Keyboard: press <strong>1-9</strong> to set the active region label quickly. Press <strong>0</strong> for none.
            </p>
          </div>

          {/* Size Control */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Region Size</label>
              <code className="text-xs bg-black/30 px-2 py-0.5 rounded text-solar-300 font-mono">{radius} px</code>
            </div>
            <div className="h-full flex items-center bg-slate-900/30 rounded-xl px-4 border border-white/5">
              <span className="text-[10px] text-slate-500 mr-3">Small</span>
              <input 
                type="range" min={5} max={300} step={5} value={radius}
                onChange={e => onChangeRadius(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-700 accent-solar-500 hover:accent-solar-400" 
              />
              <span className="text-[10px] text-slate-500 ml-3">Large</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
              Adjust the slider or drag up/down on the marker to cover the feature completely.
            </p>
          </div>
        </div>
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
  showGuide = true, userLabel: externalUserLabel, onUserLabelChange, isLocked = false
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
  const DEFAULT_RADIUS = 15;
  const MIN_RADIUS = 5;
  const MAX_RADIUS = 300;
  const LONG_PRESS_DELAY_MS = 450;
  const LONG_PRESS_MOVE_TOLERANCE_PX = 8;
  const MARKER_GESTURE_DECISION_PX = 6;
  const [activeSpotIndex, setActiveSpotIndex] = useState<number | null>(null);
  const [resizingIndex, setResizingIndex] = useState<number | null>(null);
  const [isNone, setIsNone] = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Dragging state for markers (pointer events)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const pendingCreationRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    clientX: number;
    clientY: number;
    timerId: number | null;
    fired: boolean;
    createdSpotIndex: number | null;
    resizeStartY: number | null;
    resizeStartRadius: number | null;
  } | null>(null);
  const resizeGestureRef = useRef<{
    pointerId: number;
    startY: number;
    startRadius: number;
    spotIndex: number;
    mode: 'pending' | 'move' | 'resize';
    startX: number;
  } | null>(null);
  // When the user starts dragging a marker, make it the active spot so the
  // classification controls show for that marker.
  useEffect(() => {
    if (draggingIndex === null) return;
    setActiveSpotIndex(draggingIndex);
  }, [draggingIndex]);

  // Keep parallel marker arrays aligned with `pixelCoords` even under dev
  // Strict Mode re-invocations.
  useEffect(() => {
    if (pixelLabels.length !== pixelCoords.length) {
      setPixelLabels(prev => {
        if (prev.length > pixelCoords.length) return prev.slice(0, pixelCoords.length);
        return [...prev, ...Array(pixelCoords.length - prev.length).fill(null)];
      });
    }
    if (pixelRadii.length !== pixelCoords.length) {
      setPixelRadii(prev => {
        if (prev.length > pixelCoords.length) return prev.slice(0, pixelCoords.length);
        return [...prev, ...Array(pixelCoords.length - prev.length).fill(DEFAULT_RADIUS)];
      });
    }
  }, [pixelCoords.length, pixelLabels.length, pixelRadii.length]);

  const clampRadius = (radius: number) => Math.min(Math.max(Math.round(radius), MIN_RADIUS), MAX_RADIUS);

  // Calculate actual rendered image bounds when using object-fit: contain
  // Returns the rect of the actual image content, accounting for letterboxing
  const getActualImageBounds = (): DOMRect | null => {
    const img = imageRef.current;
    if (!img || !naturalSize) return null;
    
    const rect = img.getBoundingClientRect();
    const { w: naturalWidth, h: naturalHeight } = naturalSize;
    
    // Calculate aspect ratios
    const elementRatio = rect.width / rect.height;
    const imageRatio = naturalWidth / naturalHeight;
    
    let renderedWidth: number, renderedHeight: number, offsetX: number, offsetY: number;
    
    if (imageRatio > elementRatio) {
      // Image is wider - letterbox top/bottom
      renderedWidth = rect.width;
      renderedHeight = rect.width / imageRatio;
      offsetX = 0;
      offsetY = (rect.height - renderedHeight) / 2;
    } else {
      // Image is taller or equal - letterbox left/right
      renderedHeight = rect.height;
      renderedWidth = rect.height * imageRatio;
      offsetX = (rect.width - renderedWidth) / 2;
      offsetY = 0;
    }
    
    return new DOMRect(
      rect.left + offsetX,
      rect.top + offsetY,
      renderedWidth,
      renderedHeight
    );
  };

  const addMarkerAt = (clientX: number, clientY: number): number | null => {
    if (isLocked || isPinchingRef.current) return null;
    
    // Get actual rendered image bounds (accounts for object-fit: contain letterboxing)
    const actualBounds = getActualImageBounds();
    if (!actualBounds) return null;
    
    // Calculate position relative to actual image content, not the element
    const xPct = Math.min(Math.max((clientX - actualBounds.left) / actualBounds.width, 0), 1);
    const yPct = Math.min(Math.max((clientY - actualBounds.top) / actualBounds.height, 0), 1);
    const x1024 = Math.round(xPct * 1024);
    const y1024 = Math.round(yPct * 1024);

    const createdIndex = pixelCoords.length;
    setPixelCoords(prev => [...prev, { x: x1024, y: y1024, xPct, yPct }]);
    setPixelLabels(pl => [...pl, null]);
    setPixelRadii(pr => [...pr, DEFAULT_RADIUS]);
    setActiveSpotIndex(createdIndex);
    setIsNone(false);

    return createdIndex;
  };

  const clearPendingCreation = () => {
    const pending = pendingCreationRef.current;
    if (!pending) return;
    if (pending.timerId !== null) {
      window.clearTimeout(pending.timerId);
    }
    pendingCreationRef.current = null;
  };

  const beginLongPressCreation = (event: React.PointerEvent<Element>) => {
    if (isLocked || isPinchingRef.current) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    const target = event.target as Element;
    if (target && target.tagName.toLowerCase() !== 'svg') return;

    clearPendingCreation();

    const pending: NonNullable<typeof pendingCreationRef.current> = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      clientX: event.clientX,
      clientY: event.clientY,
      timerId: null as number | null,
      fired: false,
      createdSpotIndex: null,
      resizeStartY: null,
      resizeStartRadius: null,
    };

    pending.timerId = window.setTimeout(() => {
      if (pendingCreationRef.current !== pending) return;
      pending.fired = true;
      const createdSpotIndex = addMarkerAt(pending.clientX, pending.clientY);
      if (createdSpotIndex !== null) {
        pending.createdSpotIndex = createdSpotIndex;
        pending.resizeStartY = pending.clientY;
        pending.resizeStartRadius = DEFAULT_RADIUS;
      }
    }, LONG_PRESS_DELAY_MS);

    pendingCreationRef.current = pending;

    try {
      (event.currentTarget as Element & { setPointerCapture?: (pointerId: number) => void }).setPointerCapture?.(event.pointerId);
    } catch {
      // ignore capture failures; the long press still works without it
    }
  };

  const updatePendingCreation = (event: React.PointerEvent<Element>) => {
    const pending = pendingCreationRef.current;
    if (!pending || pending.pointerId !== event.pointerId || pending.fired) return;

    pending.clientX = event.clientX;
    pending.clientY = event.clientY;

    const movedDistance = Math.hypot(event.clientX - pending.startX, event.clientY - pending.startY);
    if (movedDistance > LONG_PRESS_MOVE_TOLERANCE_PX) {
      clearPendingCreation();
    }
  };

  const updatePendingCreationAfterFire = (event: React.PointerEvent<Element>) => {
    const pending = pendingCreationRef.current;
    if (!pending || pending.pointerId !== event.pointerId || !pending.fired) return;
    if (pending.createdSpotIndex === null || pending.resizeStartY === null || pending.resizeStartRadius === null) return;

    const actualBounds = getActualImageBounds();
    if (!actualBounds) return;

    const deltaRadius = ((pending.resizeStartY - event.clientY) / actualBounds.height) * 1024;
    const nextRadius = clampRadius(pending.resizeStartRadius + deltaRadius);
    setPixelRadii(pr => pr.map((radius, i) => i === pending.createdSpotIndex ? nextRadius : radius));
  };

  const endPointerGesture = () => {
    clearPendingCreation();
    resizeGestureRef.current = null;
    setDraggingIndex(null);
    setResizingIndex(null);
  };

  const beginMoveGesture = (event: React.PointerEvent<SVGCircleElement>, idx: number) => {
    if (isLocked) return;
    event.stopPropagation();
    clearPendingCreation();
    setDraggingIndex(null);
    setResizingIndex(null);
    resizeGestureRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startRadius: pixelRadii[idx] ?? DEFAULT_RADIUS,
      spotIndex: idx,
      mode: 'pending',
      startX: event.clientX,
    };
    setActiveSpotIndex(idx);

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // ignore capture failures; moving still works with bubbling pointer events
    }
  };

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
    
    // Only disable touch-action when not in fullscreen to allow native pinch zoom
    const updateTouchAction = () => {
      const isFullscreen = document.fullscreenElement !== null;
      try { 
        imgEl.style.touchAction = isFullscreen ? 'auto' : 'none';
      } catch {}
    };
    
    updateTouchAction();
    document.addEventListener('fullscreenchange', updateTouchAction);
    
    if (imgEl.naturalWidth && imgEl.naturalHeight) {
      setNaturalSize({ w: imgEl.naturalWidth, h: imgEl.naturalHeight });
    }
    const onLoad = () => setNaturalSize({ w: imgEl.naturalWidth, h: imgEl.naturalHeight });

    imgEl.addEventListener('load', onLoad);

    return () => {
      imgEl.removeEventListener('load', onLoad);
      document.removeEventListener('fullscreenchange', updateTouchAction);
    };
  }, [externalImageId]);

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

  const removeSpotAtIndex = useCallback((idx: number) => {
    setPixelCoords(pc => pc.filter((_, i) => i !== idx));
    setPixelLabels(pl => pl.filter((_, i) => i !== idx));
    setPixelRadii(pr => pr.filter((_, i) => i !== idx));
    setActiveSpotIndex(current => {
      if (current === null) return null;
      if (current === idx) return null;
      return current > idx ? current - 1 : current;
    });
  }, []);

  useEffect(() => {
    if (!selectedOption || activeSpotIndex === null || isLocked) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;

      const target = event.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable) {
          return;
        }
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        removeSpotAtIndex(activeSpotIndex);
        return;
      }

      let shortcutIndex: number | null = null;
      if (event.key >= '1' && event.key <= '9') {
        shortcutIndex = Number(event.key) - 1;
      } else if (event.key === '0') {
        const noneIndex = selectedOption.subLabels.findIndex(sub => sub.value === 'none');
        if (noneIndex >= 0) shortcutIndex = noneIndex;
      }

      if (shortcutIndex === null) return;
      const selectedSubLabel = selectedOption.subLabels[shortcutIndex];
      if (!selectedSubLabel) return;

      event.preventDefault();
      setPixelLabels(prev => prev.map((value, index) => index === activeSpotIndex ? selectedSubLabel.value : value));
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedOption, activeSpotIndex, isLocked, removeSpotAtIndex]);

  // Derive `user_label` from the first explicitly labeled spot if the
  // global `userLabel` hasn't been explicitly chosen. Treat 'none' and
  // empty strings as not explicitly set.
  const firstExplicitLabel = pixelLabels.find(l => l != null && l !== 'none') ?? 'none';
  const derivedUserLabel = isNone
    ? 'none'
    : ((userLabel && userLabel !== 'none') ? userLabel : firstExplicitLabel);

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
      onSubmit(input);
      // Reset local state immediately so the next task can render without
      // waiting for the remote save path.
      setUserLabel('none');
      setConfidence(75);
      setComments('');
      setSubmitError(null);
      setPixelCoords([]);
      setPixelLabels([]);
      setPixelRadii([]);
      setActiveSpotIndex(null);

      const result = await submitAnnotation(input);
      if (result.error && !result.success) {
        setSubmitError(result.error);
      }
    } catch {
      setSubmitError('Something went wrong. Your observation has been saved locally.');
    } finally {
      setSubmitting(false);
    }
  }, [taskType, derivedUserLabel, confidence, comments, taskId, serialNumber, imageUrl, onSubmit, pixelCoords, pixelRadii, pixelLabels, naturalSize, isLocked]);

  if (!selectedOption) return null;

  // Enforce strict per-spot labeling: require at least one marker and that every
  // marker has an explicit, non-'none', non-empty label. Also ensure arrays
  // line up to avoid transient mismatch states (e.g., pixelCoords updated but
  // pixelLabels not yet). Treat only non-empty strings (not null/undefined)
  // and not 'none' as valid labels.
  const hasAllSpotsLabeled = pixelCoords.length > 0
    && pixelLabels.length === pixelCoords.length
    && pixelLabels.every(l => typeof l === 'string' && l.trim() !== '' && l !== 'none');
  const canSubmit = Boolean((hasAllSpotsLabeled || isNone) && !submitting);

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
              <p className="text-[10px] text-slate-500">Long-press to add. Drag up/down on marker to resize.</p>
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
              if (isLocked) return;

              const markerGesture = resizeGestureRef.current;
              if (markerGesture && markerGesture.pointerId === e.pointerId) {
                if (markerGesture.mode === 'pending') {
                  const dx = Math.abs(e.clientX - markerGesture.startX);
                  const dy = Math.abs(e.clientY - markerGesture.startY);
                  if (Math.max(dx, dy) < MARKER_GESTURE_DECISION_PX) return;

                  markerGesture.mode = dy > dx ? 'resize' : 'move';
                  if (markerGesture.mode === 'resize') {
                    setDraggingIndex(null);
                    setResizingIndex(markerGesture.spotIndex);
                  } else {
                    setResizingIndex(null);
                    setDraggingIndex(markerGesture.spotIndex);
                  }
                }

                if (markerGesture.mode === 'resize') {
                  const actualBounds = getActualImageBounds();
                  if (!actualBounds) return;
                  const deltaRadius = ((markerGesture.startY - e.clientY) / actualBounds.height) * 1024;
                  const nextRadius = clampRadius(markerGesture.startRadius + deltaRadius);
                  setPixelRadii(pr => pr.map((radius, i) => i === markerGesture.spotIndex ? nextRadius : radius));
                  return;
                }
              }

              if (resizingIndex !== null) {
                const resizeGesture = resizeGestureRef.current;
                const actualBounds = getActualImageBounds();
                if (!resizeGesture || resizeGesture.pointerId !== e.pointerId || !actualBounds) return;

                const deltaRadius = ((resizeGesture.startY - e.clientY) / actualBounds.height) * 1024;
                const nextRadius = clampRadius(resizeGesture.startRadius + deltaRadius);
                setPixelRadii(pr => pr.map((radius, i) => i === resizingIndex ? nextRadius : radius));
                return;
              }

              if (draggingIndex === null) {
                updatePendingCreationAfterFire(e);
                updatePendingCreation(e);
                return;
              }

              const actualBounds = getActualImageBounds();
              if (!actualBounds) return;
              const xPct = Math.min(Math.max((e.clientX - actualBounds.left) / actualBounds.width, 0), 1);
              const yPct = Math.min(Math.max((e.clientY - actualBounds.top) / actualBounds.height, 0), 1);
              const x1024 = Math.round(xPct * 1024);
              const y1024 = Math.round(yPct * 1024);
              setPixelCoords(prev => prev.map((p, i) => i === draggingIndex ? { x: x1024, y: y1024, xPct, yPct } : p));
            }}
            onPointerUp={endPointerGesture}
            onPointerCancel={endPointerGesture}
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
                  onLoad={handleImageLoad}
                />
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  onPointerDown={beginLongPressCreation}
                  onPointerMove={updatePendingCreation}
                  onPointerUp={endPointerGesture}
                  onPointerCancel={endPointerGesture}
                  onTouchStart={overlayTouchStart}
                  onTouchMove={overlayTouchMove}
                  onTouchEnd={overlayTouchEnd}
                  onContextMenu={e => e.preventDefault()}
                  className="absolute inset-0 w-full h-full pointer-events-auto touch-none overflow-visible"
                >
                  {pixelCoords.map((p, idx) => {
                    const radiusPct = ((pixelRadii[idx] ?? DEFAULT_RADIUS) / 1024) * 100;
                    const isActive = activeSpotIndex === idx;
                    const labelText = pixelLabels[idx] || 'unlabeled';
                    return (
                      <g key={idx}>
                        {/* Translucent draggable region */}
                        <circle
                          onPointerDown={e => beginMoveGesture(e, idx)}
                          cx={`${(p.xPct ?? 0) * 100}`}
                          cy={`${(p.yPct ?? 0) * 100}`}
                          r={radiusPct}
                          style={{ cursor: isLocked ? 'default' : 'grab', pointerEvents: isLocked ? 'none' : 'auto' }}
                          fill={isActive ? 'rgba(59,130,246,0.2)' : 'rgba(34,197,94,0.2)'}
                          stroke={isActive ? 'rgba(59,130,246,0.8)' : 'rgba(34,197,94,0.8)'}
                          strokeWidth={isActive ? 0.6 : 0.4}
                        />
                        <text
                          x={`${(p.xPct ?? 0) * 100 + radiusPct + 1.4}`}
                          y={`${(p.yPct ?? 0) * 100 - radiusPct - 0.8}`}
                          fontSize={2.4}
                          fill={isActive ? '#93c5fd' : '#f8fafc'}
                          className="select-none pointer-events-none font-semibold"
                          style={{ textAnchor: 'start', dominantBaseline: 'middle', filter: 'drop-shadow(0px 0px 2px black)' }}
                        >{`${idx + 1}: ${labelText}`}</text>
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
                  onPointerDown={beginLongPressCreation}
                  onPointerMove={updatePendingCreation}
                  onPointerUp={endPointerGesture}
                  onPointerCancel={endPointerGesture}
                  onTouchStart={overlayTouchStart}
                  onTouchMove={overlayTouchMove}
                  onTouchEnd={overlayTouchEnd}
                  onContextMenu={e => e.preventDefault()}
                  style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: isLocked ? 'none' : 'auto', touchAction: 'none' }}
                >
                  {pixelCoords.map((p, idx) => {
                    const radiusPct = ((pixelRadii[idx] ?? DEFAULT_RADIUS) / 1024) * 100;
                    const isActive = activeSpotIndex === idx;
                    const labelText = pixelLabels[idx] || 'unlabeled';
                    return (
                      <g key={idx}>
                        <circle
                          onPointerDown={e => beginMoveGesture(e, idx)}
                          cx={`${(p.xPct ?? 0) * 100}`}
                          cy={`${(p.yPct ?? 0) * 100}`}
                          r={radiusPct}
                          style={{ cursor: isLocked ? 'default' : 'grab', pointerEvents: isLocked ? 'none' : 'auto' }}
                          fill={isActive ? 'rgba(59,130,246,0.2)' : 'rgba(34,197,94,0.2)'}
                          stroke={isActive ? 'rgba(59,130,246,0.8)' : 'rgba(34,197,94,0.8)'}
                          strokeWidth={isActive ? 0.6 : 0.4}
                        />
                        <text
                          x={`${(p.xPct ?? 0) * 100 + radiusPct + 1.4}`}
                          y={`${(p.yPct ?? 0) * 100 - radiusPct - 0.8}`}
                          fontSize={2.4}
                          fill={isActive ? '#93c5fd' : '#f8fafc'}
                          className="select-none pointer-events-none font-semibold"
                          style={{ textAnchor: 'start', dominantBaseline: 'middle', filter: 'drop-shadow(0px 0px 2px black)' }}
                        >{`${idx + 1}: ${labelText}`}</text>
                      </g>
                    );
                  })}
                </svg>,
                portalContainer,
              )
            )}
          </div>

          {/* Region Editor Panel (Stationary, below image) */}
          <AnimatePresence>
            {activeSpotIndex !== null && selectedOption && (
              <RegionEditorPanel
                idx={activeSpotIndex}
                label={pixelLabels[activeSpotIndex]}
                radius={pixelRadii[activeSpotIndex] ?? DEFAULT_RADIUS}
                options={selectedOption}
                isLocked={isLocked}
                onChangeLabel={l => setPixelLabels(pl => pl.map((v, i) => i === activeSpotIndex ? l : v))}
                onChangeRadius={r => setPixelRadii(pr => pr.map((v, i) => i === activeSpotIndex ? r : v))}
                onRemove={() => removeSpotAtIndex(activeSpotIndex)}
              />
            )}
          </AnimatePresence>

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
                              removeSpotAtIndex(idx);
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
                  Long-press the solar image above to mark areas of interest
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

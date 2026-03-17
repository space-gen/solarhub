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
import { motion, AnimatePresence }   from 'framer-motion';
import { submitAnnotation }          from '@/services/annotationService';
import type { TaskType, UserLabel, AnnotationInput } from '@/services/annotationService';
import { containerVariants, itemVariants } from '@/animations/pageTransitions';

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

const TASK_OPTIONS: TaskOption[] = [
  {
    value:   'sunspot',
    label:   'Sun Spots',
    icon:    '🟤',
    lookFor: 'Dark circular patches on the bright surface of the sun',
    color:   'text-orange-300', bg: 'bg-orange-500/15', border: 'border-orange-500/40',
    subLabels: [
      { value: 'sunspot_group',  label: 'A cluster of dark spots',    hint: 'Several dark patches grouped closely together'    },
      { value: 'active_region',  label: 'Bright area around spots',   hint: 'Glowing patches surrounding or between the spots' },
      { value: 'quiet_sun',      label: 'Sun looks calm & normal',    hint: 'No unusual features — everything looks ordinary'  },
      { value: 'no_sunspot',     label: "I don't see any spots",      hint: 'The surface looks smooth with no dark patches'    },
    ],
  },
  {
    value:   'solar_flare',
    label:   'Bright Flash',
    icon:    '🔥',
    lookFor: "A sudden bright glow or explosion on the sun's surface",
    color:   'text-rose-300', bg: 'bg-rose-500/15', border: 'border-rose-500/40',
    subLabels: [
      { value: 'a_class',  label: 'Tiny flicker',          hint: 'Very faint brightening, barely noticeable' },
      { value: 'b_class',  label: 'Small flash',           hint: 'A small but visible bright spot'            },
      { value: 'c_class',  label: 'Medium burst',          hint: 'A clearly visible bright burst of energy'   },
      { value: 'm_class',  label: 'Large explosion',       hint: 'Very bright, large release of energy'       },
      { value: 'x_class',  label: 'Massive explosion ⚠️', hint: 'Extremely bright — the most powerful type'  },
      { value: 'no_flare', label: "I don't see a flash",   hint: 'No bright burst of light visible'           },
    ],
  },
  {
    value:   'magnetogram',
    label:   'Magnetic Map',
    icon:    '🧲',
    lookFor: "A black & white image showing invisible magnetic forces — like a zebra pattern",
    color:   'text-violet-300', bg: 'bg-violet-500/15', border: 'border-violet-500/40',
    subLabels: [
      { value: 'bipolar_active', label: 'Clear black & white pair', hint: 'Two distinct opposite-coloured areas side by side'       },
      { value: 'unipolar',       label: 'Mostly one colour',        hint: 'Mainly one dark or white region'                          },
      { value: 'complex',        label: 'Tangled / mixed pattern',  hint: 'Black and white areas mixed together in a complex way'    },
      { value: 'quiet',          label: 'Calm and mostly grey',     hint: 'No strong features — image looks smooth and unremarkable' },
    ],
  },
  {
    value:   'coronal_hole',
    label:   'Dark Region',
    icon:    '🕳️',
    lookFor: 'A large, clearly dark patch against an otherwise bright glowing image',
    color:   'text-cyan-300', bg: 'bg-cyan-500/15', border: 'border-cyan-500/40',
    subLabels: [
      { value: 'polar',        label: 'Top or bottom (near a pole)', hint: "Dark area near the sun's north or south pole"       },
      { value: 'equatorial',   label: 'In the middle band',          hint: "Dark area near the sun's equator (the middle belt)" },
      { value: 'mid_latitude', label: 'Somewhere in between',        hint: 'Dark area between the equator and a pole'           },
      { value: 'none',         label: "I don't see a dark region",   hint: 'No large dark area visible'                         },
    ],
  },
  {
    value:   'prominence',
    label:   'Glowing Arch',
    icon:    '🌊',
    lookFor: 'A bright arch or loop of plasma rising above the edge of the sun',
    color:   'text-sky-300', bg: 'bg-sky-500/15', border: 'border-sky-500/40',
    subLabels: [
      { value: 'eruptive',  label: 'Erupting outward into space', hint: 'The arch is bursting apart and shooting outward'      },
      { value: 'quiescent', label: 'Calm and stable',             hint: 'A steady, quiet arch just hanging there'              },
      { value: 'active',    label: 'Moving and changing',         hint: 'The arch looks dynamic, unstable, or shifting'        },
      { value: 'none',      label: "I don't see an arch",         hint: 'No visible loop or arch at the edge of the sun'       },
    ],
  },
  {
    value:   'active_region',
    label:   'Active Region',
    icon:    '⚡',
    lookFor: 'A bright, busy cluster of activity — often the source of flares and storms',
    color:   'text-yellow-300', bg: 'bg-yellow-500/15', border: 'border-yellow-500/40',
    subLabels: [
      { value: 'alpha',            label: 'Simple — one spot',            hint: 'A single, simple magnetic area'                        },
      { value: 'beta',             label: 'Two spots side by side',        hint: 'Two distinct magnetic areas close together'             },
      { value: 'beta_gamma',       label: 'Complex group',                 hint: 'Several areas in a complex, tangled arrangement'        },
      { value: 'beta_gamma_delta', label: 'Very chaotic / high energy ⚠️', hint: 'Highly mixed areas — this type has the highest flare risk' },
      { value: 'none',             label: "I don't see an active region",  hint: 'No significant active cluster visible'                  },
    ],
  },
  {
    value:   'cme',
    label:   'Solar Storm',
    icon:    '💥',
    lookFor: 'A large cloud of gas erupting outward from the sun (often looks like a halo)',
    color:   'text-red-300', bg: 'bg-red-500/15', border: 'border-red-500/40',
    subLabels: [
      { value: 'halo',         label: 'Full ring all around the sun', hint: 'The eruption forms a complete ring / halo'         },
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
          <p className="text-sm font-medium leading-tight">{sub.label}</p>
          <p className={`text-xs mt-0.5 leading-snug ${isSelected ? 'opacity-60' : 'text-slate-600'}`}>
            {sub.hint}
          </p>
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

export default function AnnotationPanel({ taskType, taskId, serialNumber, imageUrl, onSubmit }: AnnotationPanelProps) {
  const [userLabel,   setUserLabel]   = useState<UserLabel  | null>(null);
  const [confidence,  setConfidence]  = useState(75);
  const [comments,    setComments]    = useState('');
  const [pixelCoords, setPixelCoords] = useState<Array<{ x: number; y: number; xPct?: number; yPct?: number }>>([]);
  const [regionRadius, setRegionRadius] = useState<number | undefined>(10);
  const [submitting,  setSubmitting]  = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [issueUrl,    setIssueUrl]    = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const imageRef = useRef<HTMLImageElement | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);

  // Compute natural size on load
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget as HTMLImageElement;
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
  };

  // Click to add a selection — store both natural-pixel coords and percent (for rendering)
  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const dispX = e.clientX - rect.left;
    const dispY = e.clientY - rect.top;
    const natW = naturalSize?.w ?? (e.currentTarget.naturalWidth || rect.width);
    const natH = naturalSize?.h ?? (e.currentTarget.naturalHeight || rect.height);
    const xNat = Math.round(dispX * (natW / rect.width));
    const yNat = Math.round(dispY * (natH / rect.height));
    const xPct = dispX / rect.width;
    const yPct = dispY / rect.height;
    setPixelCoords(prev => [...prev, { x: xNat, y: yNat, xPct, yPct }]);
  };

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegionRadius(Number(e.target.value));
  };

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

        {/* ── Intro banner ──────────────────────────────────────────────── */}
        <motion.div variants={itemVariants}
          className="flex items-start gap-3 p-3.5 rounded-xl bg-solar-500/8 border border-solar-500/20">
          <span className="text-xl flex-shrink-0 mt-0.5">👈</span>
          <div>
            <p className="text-sm font-semibold text-solar-200">Look at the image and answer 2 questions</p>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              No expertise needed — just describe what you see. Every observation helps scientists
              predict solar storms and protect satellites.
            </p>
          </div>
        </motion.div>

        {/* ── Step indicator ────────────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="flex items-center gap-2">
          {[1].map(n => (
            <div key={n} className={`flex items-center gap-1.5 ${n < step ? 'opacity-40' : ''}`}>
              <div className={[
                'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border',
                step === n
                  ? 'bg-solar-500/30 text-solar-300 border-solar-500/50'
                  : step > n
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-white/5 text-slate-600 border-white/10',
              ].join(' ')}>
                {step > n ? '✓' : n}
              </div>
              <span className={`text-xs ${step === n ? 'text-slate-300 font-medium' : 'text-slate-600'}`}>
                What do you see?
              </span>
            </div>
          ))}
          {step > 1 && (
            <div className="ml-auto w-5 h-5 rounded-full bg-white/5 border border-white/10
                            flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            </div>
          )}
        </motion.div>

        {/* ── Task context ─────────────────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Task type for this image</p>
          <div className={`rounded-xl border p-3.5 ${selectedOption.bg} ${selectedOption.border}`}>
            <p className={`text-sm font-semibold ${selectedOption.color}`}>
              {selectedOption.icon} {selectedOption.label}
            </p>
            <p className="text-xs text-slate-400 mt-1">Look for: {selectedOption.lookFor}</p>
          </div>
          {/* Scientific command (placeholder) */}
          <p className="text-xs text-slate-500 mt-2">
            <strong>Scientific command:</strong> <code>annotate_{taskType}</code>
          </p>
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
              <div style={{ position: 'relative', display: 'inline-block', maxWidth: 320 }}>
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt="Solar observation"
                  style={{ width: '100%', borderRadius: 8, border: '1px solid #333', cursor: 'crosshair', display: 'block' }}
                  onClick={handleImageClick}
                  onLoad={handleImageLoad}
                />
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                >
                  {pixelCoords.map((p, idx) => (
                    <circle
                      key={idx}
                      cx={`${(p.xPct ?? 0) * 100}`}
                      cy={`${(p.yPct ?? 0) * 100}`}
                      r={2.5}
                      fill="rgba(34,197,94,0.95)"
                      stroke="#fff"
                      strokeWidth={0.5}
                    />
                  ))}
                  {taskType === 'magnetogram' && regionRadius && pixelCoords.length > 0 && (
                    (() => {
                      const center = pixelCoords[0];
                      const radiusPct = ((regionRadius ?? 0) / (naturalSize?.w ?? 1)) * 100;
                      return (
                        <circle
                          cx={`${(center.xPct ?? 0) * 100}`}
                          cy={`${(center.yPct ?? 0) * 100}`}
                          r={radiusPct}
                          fill="rgba(99,102,241,0.08)"
                          stroke="rgba(99,102,241,0.8)"
                          strokeWidth={0.6}
                        />
                      );
                    })()
                  )}
                </svg>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Selected spots:
                {pixelCoords.length > 0 ? (
                  <ul className="mt-1">
                    {pixelCoords.map((p, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span>({p.x},{p.y})</span>
                        <button
                          className="text-xs text-red-400 hover:text-red-600 underline"
                          onClick={e => { e.stopPropagation(); setPixelCoords(pixelCoords.filter((_, i) => i !== idx)); }}
                        >Remove</button>
                      </li>
                    ))}
                  </ul>
                ) : ' None'}
              </div>
              {taskType === 'magnetogram' && (
                <div className="mt-2">
                  <label className="text-xs text-slate-400">Region radius:</label>
                  <input type="range" min={1} max={100} value={regionRadius || 10} onChange={handleRadiusChange} className="ml-2" />
                  <span className="ml-2 text-xs text-slate-500">{regionRadius || 10} px</span>
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

/**
 * src/pages/Classify.tsx
 *
 * Citizen-science classification workflow — 3 views:
 *
 *  View 1 — Task-type picker
 *    A card grid of all 7 aurora task types. Cards with no data file yet
 *    show a "Coming soon" badge. Data availability is discovered at runtime by
 *    attempting to fetch each type's JSON from aurora's GitHub data directory.
 *
 *  View 2 — Image grid
 *    All images for the selected task type, loaded from aurora's data JSON.
 *    Each card shows the image, date, and a "Classify →" hover button.
 *    Already-classified images show a ✓ badge.
 *
 *  View 3 — Annotation view
 *    Full image on the left + AnnotationPanel on the right.
 *    On submit: award points, mark image as done, return to grid.
 *
 * No image URLs or task data are hardcoded here. Everything is fetched
 * dynamically from:
 *   https://raw.githubusercontent.com/space-gen/aurora/main/data/{taskType}.json
 */

import { useState, useEffect, useCallback }          from 'react';
import { useParams, useNavigate }                   from 'react-router-dom';
import { motion, AnimatePresence }                  from 'framer-motion';
import AnnotationPanel                              from '@/components/AnnotationPanel';
import PointsDisplay                                from '@/components/PointsDisplay';
import type { AnnotationInput, TaskType }           from '@/services/annotationService';
import { fetchAuroraTasksByType }                   from '@/services/auroraService';
import type { AuroraTask }                          from '@/services/auroraService';
import { classifyTaskType }                         from '@/utils/helpers';
import { getLocalAnnotations }                      from '@/services/annotationService';
import { pageVariants, itemVariants, containerVariants } from '@/animations/pageTransitions';

// ---------------------------------------------------------------------------
// Task type metadata (citizen-friendly labels + descriptions)
// ---------------------------------------------------------------------------

interface TaskTypeMeta {
  value:       TaskType;
  friendlyName: string;
  icon:         string;
  description:  string;
}

const TASK_TYPES: TaskTypeMeta[] = [
  { value: 'sunspot',       friendlyName: 'Sun Spots',      icon: '🟤', description: 'Dark patches on the bright solar surface' },
  { value: 'magnetogram',   friendlyName: 'Magnetic Map',   icon: '🧲', description: 'Black & white map of the Sun\'s magnetic field' },
  { value: 'solar_flare',   friendlyName: 'Bright Flash',   icon: '🔥', description: 'Sudden burst of energy from the Sun' },
  { value: 'coronal_hole',  friendlyName: 'Dark Region',    icon: '🕳️', description: 'Large dark area where solar wind escapes' },
  { value: 'prominence',    friendlyName: 'Glowing Arch',   icon: '🌊', description: 'Bright arch of plasma at the Sun\'s edge' },
  { value: 'active_region', friendlyName: 'Active Region',  icon: '⚡', description: 'Busy cluster of solar activity' },
  { value: 'cme',           friendlyName: 'Solar Storm',    icon: '💥', description: 'Cloud of gas erupting outward into space' },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ClassifyProps {
  points:         number;
  onPointsChange: (p: number) => void;
}

// ---------------------------------------------------------------------------
// Shared UI helpers
// ---------------------------------------------------------------------------

function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: -3 }}
      whileTap={{ scale: 0.97 }}
      className="flex items-center gap-1.5 text-sm text-slate-400
                 hover:text-slate-200 transition-colors"
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      {label}
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// View 1 — Task-type picker
// ---------------------------------------------------------------------------

interface TypePickerProps {
  onSelect:     (type: TaskType) => void;
  availability: Record<TaskType, boolean | null>; // null = still loading
}

function TypePicker({ onSelect, availability }: TypePickerProps) {
  const style = (tt: TaskType) => classifyTaskType(tt);

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" exit="exit"
      className="min-h-screen pt-24 pb-16 px-4 cosmic-bg">
      <div className="max-w-3xl mx-auto flex flex-col gap-8">

        {/* Header */}
        <motion.div variants={itemVariants} className="text-center flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-slate-100">
            What would you like to classify today?
          </h1>
          <p className="text-slate-500 text-sm">
            Choose a type of solar image to explore — no expertise needed!
          </p>
        </motion.div>

        {/* Cards */}
        <motion.div variants={containerVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TASK_TYPES.map(tt => {
            const avail = availability[tt.value];
            const s     = style(tt.value);
            const ready = avail === true;
            const loading = avail === null;

            return (
              <motion.button
                key={tt.value}
                variants={itemVariants}
                onClick={() => ready ? onSelect(tt.value) : undefined}
                whileHover={ready ? { scale: 1.03, y: -2 } : {}}
                whileTap={ready ? { scale: 0.97 } : {}}
                className={[
                  'relative flex flex-col items-start gap-3 p-5 rounded-2xl text-left',
                  'border transition-all duration-200 outline-none',
                  ready
                    ? `${s.bg} ${s.border} hover:border-opacity-70 cursor-pointer`
                    : 'bg-white/3 border-white/8 cursor-default opacity-60',
                ].join(' ')}
              >
                {/* Coming soon / loading badge */}
                {!ready && (
                  <span className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full
                                   bg-white/8 border border-white/15 text-slate-500">
                    {loading ? '…' : 'Coming soon'}
                  </span>
                )}

                <span className="text-3xl">{tt.icon}</span>
                <div>
                  <p className={`font-semibold text-sm ${ready ? s.text : 'text-slate-400'}`}>
                    {tt.friendlyName}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                    {tt.description}
                  </p>
                </div>

                {ready && (
                  <div className={`mt-auto text-xs font-medium ${s.text} flex items-center gap-1`}>
                    Classify images
                    <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M9 4l4 4-4 4" />
                    </svg>
                  </div>
                )}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Mission note */}
        <motion.p variants={itemVariants}
          className="text-center text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
          🛰️ Images are real solar observations from NASA's Solar Dynamics Observatory.
          Your classifications help scientists train AI models to predict solar storms.
        </motion.p>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// View 2 — Image grid
// ---------------------------------------------------------------------------

interface ImageGridProps {
  taskType:   TaskType;
  tasks:      AuroraTask[];
  doneIds:    Set<string>;
  onSelect:   (task: AuroraTask) => void;
  onBack:     () => void;
}

function ImageCard({
  task, isDone, onSelect,
}: { task: AuroraTask; isDone: boolean; onSelect: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const [error,  setError]  = useState(false);

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ duration: 0.18 }}
      className="group relative rounded-xl overflow-hidden bg-cosmic-900 border
                 border-white/8 hover:border-white/20 cursor-pointer"
      onClick={isDone ? undefined : onSelect}
    >
      {/* Image */}
      <div className="aspect-square relative">
        {!loaded && !error && (
          <div className="absolute inset-0 shimmer-skeleton" />
        )}
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center text-slate-700 text-xs">
            Unavailable
          </div>
        ) : (
          <img
            src={task.url}
            alt={`Solar observation ${task.date}`}
            loading="lazy"
            className={`w-full h-full object-cover transition-all duration-300
                        group-hover:brightness-110 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setLoaded(true)}
            onError={() => { setError(true); setLoaded(true); }}
          />
        )}

        {/* Done badge */}
        {isDone && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-emerald-500/30 border border-emerald-500/50
                            flex items-center justify-center text-emerald-300 text-lg">
              ✓
            </div>
          </div>
        )}

        {/* Hover classify overlay */}
        {!isDone && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40
                          transition-all duration-200 flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity
                             bg-white/15 backdrop-blur-sm border border-white/20
                             text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              Classify →
            </span>
          </div>
        )}
      </div>

      {/* Date label */}
      {task.date && (
        <div className="px-2 py-1.5 text-xs text-slate-500 truncate">
          {task.date}
        </div>
      )}
    </motion.div>
  );
}

function ImageGrid({ taskType, tasks, doneIds, onSelect, onBack }: ImageGridProps) {
  const s = classifyTaskType(taskType);
  const meta = TASK_TYPES.find(t => t.value === taskType)!;
  const doneCount = tasks.filter(t => doneIds.has(t.id)).length;

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" exit="exit"
      className="min-h-screen pt-20 pb-16 px-4 cosmic-bg">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">

        {/* Header bar */}
        <motion.div variants={itemVariants}
          className="flex items-center justify-between flex-wrap gap-3 pt-4">
          <BackButton label="All types" onClick={onBack} />
          <div className="flex items-center gap-2">
            <span className="text-xl">{meta.icon}</span>
            <span className={`font-bold text-base ${s.text}`}>{meta.friendlyName}</span>
          </div>
          <span className="text-xs text-slate-500">
            {doneCount > 0
              ? <><span className="text-emerald-400 font-semibold">{doneCount}</span> / {tasks.length} classified</>
              : <>{tasks.length} images to classify</>}
          </span>
        </motion.div>

        {/* Citizen tip */}
        <motion.div variants={itemVariants}
          className="flex items-center gap-3 px-4 py-3 rounded-xl
                     bg-solar-500/8 border border-solar-500/20">
          <span className="text-xl flex-shrink-0">👇</span>
          <p className="text-sm text-slate-300">
            <span className="font-semibold text-solar-200">Click any image to classify it.</span>
            {' '}Every observation you make helps scientists predict solar storms.
          </p>
        </motion.div>

        {/* Image grid */}
        <motion.div variants={containerVariants}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {tasks.map(task => (
            <motion.div key={task.id} variants={itemVariants}>
              <ImageCard
                task={task}
                isDone={doneIds.has(task.id)}
                onSelect={() => onSelect(task)}
              />
            </motion.div>
          ))}
        </motion.div>

        {doneCount === tasks.length && tasks.length > 0 && (
          <motion.div variants={itemVariants}
            className="text-center py-8 flex flex-col items-center gap-3">
            <span className="text-4xl">🎉</span>
            <p className="font-bold text-slate-200">You've classified every image in this set!</p>
            <p className="text-sm text-slate-500">Check back later for new observations.</p>
            <button onClick={onBack} className="btn-solar mt-2 text-sm px-6 py-2">
              Classify another type
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// View 3 — Annotation view (image + panel)
// ---------------------------------------------------------------------------

interface AnnotationViewProps {
  task:           AuroraTask;
  taskType:       TaskType;
  points:         number;
  onSubmit:       (input: AnnotationInput) => void;
  onBack:         () => void;
}

function AnnotationView({ task, taskType, points, onSubmit, onBack }: AnnotationViewProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError,  setImgError]  = useState(false);
  const s    = classifyTaskType(taskType);
  const meta = TASK_TYPES.find(t => t.value === taskType)!;

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" exit="exit"
      className="min-h-screen pt-20 pb-16 px-4 cosmic-bg">
      <div className="max-w-5xl mx-auto flex flex-col gap-5">

        {/* Header */}
        <motion.div variants={itemVariants}
          className="flex items-center gap-4 pt-4 flex-wrap">
          <BackButton label="Back to images" onClick={onBack} />
          <div className="flex items-center gap-2 ml-auto">
            <span>{meta.icon}</span>
            <span className={`text-sm font-semibold ${s.text}`}>{meta.friendlyName}</span>
            <span className="text-slate-600 text-xs">· {task.date}</span>
          </div>
        </motion.div>

        {/* Main layout: image left, panel right */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-5 items-start">

          {/* Image */}
          <motion.div variants={itemVariants} className="glass rounded-2xl overflow-hidden">
            <div className="relative aspect-square bg-cosmic-900">
              {!imgLoaded && !imgError && (
                <div className="absolute inset-0 shimmer-skeleton" />
              )}
              {imgError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center
                                text-slate-600 gap-2">
                  <span className="text-3xl">🌑</span>
                  <p className="text-sm">Image could not be loaded</p>
                  <p className="text-xs opacity-60 max-w-xs text-center px-4 break-all">{task.url}</p>
                </div>
              ) : (
                <img
                  src={task.url}
                  alt={`Solar observation – ${meta.friendlyName} – ${task.date}`}
                  className={`w-full h-full object-contain transition-opacity duration-500
                              ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setImgLoaded(true)}
                  onError={() => { setImgError(true); setImgLoaded(true); }}
                />
              )}
            </div>
            {/* Caption */}
            <div className="px-4 py-3 flex items-center justify-between text-xs text-slate-500
                            border-t border-white/5">
              <span>{task.source}</span>
              {task.date && <span>{task.date}</span>}
            </div>
          </motion.div>

          {/* Right column: points + annotation panel */}
          <motion.div variants={itemVariants} className="flex flex-col gap-4">
            <PointsDisplay points={points} />
            <div className="glass rounded-2xl p-5">
              <AnnotationPanel
                taskId={task.id}
                serialNumber={task.serialNumber}
                imageUrl={task.url}
                onSubmit={onSubmit}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Annotated IDs persistence helpers
// ---------------------------------------------------------------------------

const ANNOTATED_KEY = 'solarhub_annotated_ids';

function loadAnnotatedIds(): Set<string> {
  try {
    // Also pull from the full annotations store to stay in sync
    const fromAnnotations = getLocalAnnotations().map(a => a.task_id);
    const raw = localStorage.getItem(ANNOTATED_KEY);
    const fromKey: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set([...fromKey, ...fromAnnotations]);
  } catch {
    return new Set();
  }
}

function saveAnnotatedId(id: string): void {
  try {
    const existing = loadAnnotatedIds();
    existing.add(id);
    localStorage.setItem(ANNOTATED_KEY, JSON.stringify([...existing]));
  } catch { /* non-fatal */ }
}

// ---------------------------------------------------------------------------
// Main Classify component
// ---------------------------------------------------------------------------

export default function Classify({ points, onPointsChange }: ClassifyProps) {
  const { taskType: typeParam }           = useParams<{ taskType?: string }>();
  const navigate                          = useNavigate();

  const [selectedType, setSelectedType]   = useState<TaskType | null>(
    (typeParam as TaskType) ?? null,
  );
  const [selectedTask, setSelectedTask]   = useState<AuroraTask | null>(null);
  const [tasks, setTasks]                 = useState<AuroraTask[]>([]);
  const [gridLoading, setGridLoading]     = useState(false);
  const [doneIds, setDoneIds]             = useState<Set<string>>(loadAnnotatedIds);

  // availability: null = loading, true = has data, false = coming soon
  const [availability, setAvailability]   = useState<Record<TaskType, boolean | null>>(
    () => Object.fromEntries(TASK_TYPES.map(t => [t.value, null])) as Record<TaskType, boolean | null>,
  );

  // Probe availability for all 7 types on mount (parallel HEAD-ish fetches)
  useEffect(() => {
    TASK_TYPES.forEach(async ({ value }) => {
      const result = await fetchAuroraTasksByType(value);
      setAvailability(prev => ({ ...prev, [value]: result !== null && result.length > 0 }));
    });
  }, []);

  // Load image grid when a type is selected
  useEffect(() => {
    if (!selectedType) { setTasks([]); return; }
    setGridLoading(true);
    setSelectedTask(null);
    fetchAuroraTasksByType(selectedType).then(result => {
      setTasks(result ?? []);
      setGridLoading(false);
    });
  }, [selectedType]);

  // Keep URL in sync with selection
  const handleTypeSelect = useCallback((tt: TaskType) => {
    setSelectedType(tt);
    setSelectedTask(null);
    navigate(`/classify/${tt}`, { replace: true });
  }, [navigate]);

  const handleBackToTypes = useCallback(() => {
    setSelectedType(null);
    setSelectedTask(null);
    navigate('/classify', { replace: true });
  }, [navigate]);

  const handleBackToGrid = useCallback(() => {
    setSelectedTask(null);
  }, []);

  const handleAnnotationSubmit = useCallback((input: AnnotationInput) => {
    onPointsChange(points + 10);
    saveAnnotatedId(input.task_id);
    setDoneIds(prev => new Set([...prev, input.task_id]));
    // Return to grid after a short delay (AnnotationPanel shows its own success screen)
    setTimeout(() => setSelectedTask(null), 4_500);
  }, [points, onPointsChange]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AnimatePresence mode="wait">
      {/* View 3: annotation */}
      {selectedTask && selectedType && (
        <AnnotationView
          key="annotate"
          task={selectedTask}
          taskType={selectedType}
          points={points}
          onSubmit={handleAnnotationSubmit}
          onBack={handleBackToGrid}
        />
      )}

      {/* View 2: image grid */}
      {!selectedTask && selectedType && (
        <motion.div key="grid"
          variants={pageVariants} initial="hidden" animate="visible" exit="exit">
          {gridLoading ? (
            <div className="min-h-screen pt-24 flex items-center justify-center cosmic-bg">
              <div className="flex flex-col items-center gap-4 text-slate-500">
                <motion.div
                  className="w-10 h-10 border-2 border-solar-500/40 border-t-solar-400 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, ease: 'linear', repeat: Infinity }}
                />
                <p className="text-sm">Loading images…</p>
              </div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="min-h-screen pt-24 flex items-center justify-center cosmic-bg px-4">
              <div className="glass rounded-2xl p-8 max-w-md text-center flex flex-col gap-4">
                <span className="text-4xl">🔭</span>
                <h2 className="font-bold text-slate-200">No images available yet</h2>
                <p className="text-sm text-slate-500">
                  Images for this task type haven't been added to aurora yet. Check back soon!
                </p>
                <button onClick={handleBackToTypes} className="btn-solar mt-2">
                  Choose another type
                </button>
              </div>
            </div>
          ) : (
            <ImageGrid
              taskType={selectedType}
              tasks={tasks}
              doneIds={doneIds}
              onSelect={setSelectedTask}
              onBack={handleBackToTypes}
            />
          )}
        </motion.div>
      )}

      {/* View 1: type picker */}
      {!selectedTask && !selectedType && (
        <TypePicker
          key="picker"
          onSelect={handleTypeSelect}
          availability={availability}
        />
      )}
    </AnimatePresence>
  );
}


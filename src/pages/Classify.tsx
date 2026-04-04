/**
 * src/pages/Classify.tsx
 *
 * Daily one-by-one classification flow.
 *
 * - Users pick a task type.
 * - The app shows one uncompleted task at a time (for today).
 * - Completed IDs rotate daily (date-scoped) and are persisted in Puter KV.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AnnotationPanel, { TASK_OPTIONS, SCIENTIFIC_HELP } from '@/components/AnnotationPanel';
import PointsDisplay from '@/components/PointsDisplay';
import GuidePanel from '@/components/GuidePanel';
import StarField from '@/components/StarField';
import type { AnnotationInput, TaskType, UserLabel } from '@/services/annotationService';
import { fetchAuroraTasksByType } from '@/services/auroraService';
import type { AuroraTask } from '@/services/auroraService';

import { loadDailyProgress, markTaskCompletedForToday } from '@/services/dailyProgressService';
import { pageVariants, itemVariants } from '@/animations/pageTransitions';

interface TaskTypeMeta {
  value: TaskType;
  friendlyName: string;
  icon: string;
  description: string;
}

const TASK_TYPES: TaskTypeMeta[] = [
  { value: 'sunspot',       friendlyName: 'Sun Spots',      icon: '🟤', description: 'Dark patches on the bright solar surface' },
  { value: 'magnetogram',   friendlyName: 'Magnetic Map',   icon: '🧲', description: "Black & white map of the Sun's magnetic field" },
  { value: 'solar_flare',   friendlyName: 'Bright Flash',   icon: '🔥', description: 'Sudden burst of energy from the Sun' },
  { value: 'coronal_hole',  friendlyName: 'Dark Region',    icon: '🕳️', description: 'Large dark area where solar wind escapes' },
  { value: 'prominence',    friendlyName: 'Glowing Arch',   icon: '🌊', description: "Bright arch of plasma at the Sun's edge" },
  { value: 'active_region', friendlyName: 'Active Region',  icon: '⚡', description: 'Busy cluster of solar activity' },
  { value: 'cme',           friendlyName: 'Solar Storm',    icon: '💥', description: 'Cloud of gas erupting outward into space' },
];

interface ClassifyProps {
  points: number;
  onPointsChange: (p: number) => void;
}

function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: -3 }}
      whileTap={{ scale: 0.97 }}
      className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      {label}
    </motion.button>
  );
}

function SuccessPopup({ points }: { points: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div className="bg-cosmic-800 border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center gap-4 relative overflow-hidden">
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-solar-500/10 to-transparent opacity-50 pointer-events-none" />
        
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 10 }}
          className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-2"
        >
          <span className="text-4xl">🎉</span>
        </motion.div>
        
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Great Job!</h2>
          <p className="text-slate-300 mb-1">Your contribution helps science.</p>
          <div className="text-sm font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full inline-block mt-2">
            +1 Point · Total: {points}
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full mt-2">
          <div className="text-xs text-slate-500">Loading next image...</div>
          <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-solar-500"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, ease: "linear" }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AnnotationView({
  task,
  taskType,
  points,
  streak,
  completedToday,
  remainingToday,
  onSubmit,
  onBack,
  showSuccess
}: {
  task: AuroraTask;
  taskType: TaskType;
  points: number;
  streak: number;
  completedToday: number;
  remainingToday: number;
  onSubmit: (input: AnnotationInput) => void;
  onBack: () => void;
  showSuccess: boolean;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [userLabel, setUserLabel] = useState<UserLabel>('none');
  const imageShellRef = useRef<HTMLDivElement | null>(null);
  const imageViewportRef = useRef<HTMLDivElement | null>(null);
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);

  const clampZoom = useCallback((value: number) => Math.min(Math.max(Number(value.toFixed(2)), 1), 4), []);
  const zoomStep = 0.2;

  const toggleImageFullscreen = useCallback(() => {
    const shell = imageShellRef.current;
    if (!shell) return;

    if (document.fullscreenElement === shell) {
      void document.exitFullscreen().catch(() => {});
      return;
    }

    if (!document.fullscreenElement) {
      void shell.requestFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      const nextIsFullscreen = document.fullscreenElement === imageShellRef.current;
      setIsImageFullscreen(nextIsFullscreen);
      if (!nextIsFullscreen) {
        setImageZoom(1);
      }
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    onFullscreenChange();
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const changeImageZoom = useCallback((delta: number) => {
    setImageZoom(current => clampZoom(current + delta));
  }, [clampZoom]);

  const zoomIn = useCallback(() => changeImageZoom(zoomStep), [changeImageZoom]);
  const zoomOut = useCallback(() => changeImageZoom(-zoomStep), [changeImageZoom]);
  const resetZoom = useCallback(() => setImageZoom(1), []);

  const handleImageWheel = useCallback((event: React.WheelEvent) => {
    if (!isImageFullscreen) return;
    event.preventDefault();
    const direction = event.deltaY > 0 ? -1 : 1;
    changeImageZoom(direction * 0.12);
  }, [changeImageZoom, isImageFullscreen]);

  const meta = TASK_TYPES.find(t => t.value === taskType)!;
  const selectedOption = TASK_OPTIONS.find(o => o.value === taskType)!;

  return (
    <div className="relative">
      <StarField />
      <AnimatePresence>
        {showSuccess && <SuccessPopup points={points} />}
      </AnimatePresence>

      <motion.div variants={pageVariants} initial="hidden" animate="visible" exit="exit" className="min-h-screen pt-20 pb-16 px-4 lg:px-8 cosmic-bg">
        <div className="max-w-7xl mx-auto flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(380px,0.85fr)] lg:items-start lg:gap-8">
          <div className="flex flex-col gap-5 lg:sticky lg:top-24">
            <motion.div variants={itemVariants} className="flex items-center gap-4 pt-4 flex-wrap">
              <BackButton label="All types" onClick={onBack} />
              <div className="flex items-center gap-2 ml-auto">
                <span>{meta.icon}</span>
                <span className={`text-sm font-semibold text-solar-400`}>{meta.friendlyName}</span>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="glass rounded-xl p-3 flex flex-wrap gap-3 text-xs text-slate-400">
              <span>Done today: <strong className="text-emerald-300">{completedToday}</strong></span>
              <span>Remaining today: <strong className="text-solar-300">{remainingToday}</strong></span>
              <span>Streak: <strong className="text-nebula-300">{streak}</strong> day{streak === 1 ? '' : 's'}</span>
              <span>Total points: <strong className="text-solar-300">{points}</strong></span>
            </motion.div>

            <motion.div
              variants={itemVariants}
              ref={imageShellRef}
              className="glass rounded-2xl overflow-hidden transition-all duration-300"
              onWheel={handleImageWheel}
            >
              <div className="relative aspect-square bg-cosmic-900 overflow-hidden">
                {isImageFullscreen && (
                  <div className="absolute left-3 top-3 z-40 flex items-center gap-2 rounded-xl border border-white/15 bg-black/50 px-2 py-2 backdrop-blur-md shadow-2xl">
                    <button
                      type="button"
                      onClick={zoomOut}
                      className="h-8 w-8 rounded-lg bg-white/10 text-white text-lg leading-none hover:bg-white/20 transition-colors"
                      title="Zoom out"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={resetZoom}
                      className="min-w-16 rounded-lg bg-white/10 px-2.5 py-1.5 text-[11px] font-semibold text-slate-100 hover:bg-white/20 transition-colors"
                      title="Reset zoom"
                    >
                      {Math.round(imageZoom * 100)}%
                    </button>
                    <button
                      type="button"
                      onClick={zoomIn}
                      className="h-8 w-8 rounded-lg bg-white/10 text-white text-lg leading-none hover:bg-white/20 transition-colors"
                      title="Zoom in"
                    >
                      +
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={toggleImageFullscreen}
                  className="absolute top-3 right-3 z-30 rounded-lg border border-white/20 bg-black/45 px-2.5 py-1.5 text-[11px] font-semibold text-slate-100 hover:bg-black/65 transition-colors"
                  title={isImageFullscreen ? 'Exit fullscreen' : 'Open image fullscreen'}
                >
                  {isImageFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                </button>
                <div
                  ref={imageViewportRef}
                  className="absolute inset-0 origin-center transition-transform duration-150 ease-out"
                  style={{ transform: `scale(${isImageFullscreen ? imageZoom : 1})` }}
                >
                  {!imgLoaded && !imgError && <div className="absolute inset-0 shimmer-skeleton" />}
                  {imgError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 gap-2">
                      <span className="text-3xl">🌑</span>
                      <p className="text-sm">Image could not be loaded</p>
                    </div>
                  ) : (
                    <img
                      id={`aurora-img-${task.id}`}
                      src={task.url}
                      alt={`Solar observation – ${meta.friendlyName} – ${task.date}`}
                      className={`w-full h-full object-contain transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                      onLoad={() => setImgLoaded(true)}
                      onError={() => { setImgError(true); setImgLoaded(true); }}
                    />
                  )}
                </div>
              </div>
              <div className="px-4 py-3 flex flex-col gap-2 text-xs text-slate-500 border-t border-white/5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <span>{task.source}</span>
                  {task.date && <span>{task.date}</span>}
                </div>
                <div className="flex flex-col items-start lg:items-end gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Record ID:</span>
                    <code className="text-xs bg-white/6 px-2 py-0.5 rounded">{task.id}</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Source:</span>
                    <span className="text-xs">{task.source}</span>
                  </div>
                  {task.date && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Timestamp:</span>
                      <span className="text-xs">{task.date}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          <div className="flex flex-col gap-5 lg:sticky lg:top-24">
            <motion.div variants={itemVariants} className="glass rounded-2xl p-5 flex flex-col gap-6">
              <GuidePanel selectedOption={selectedOption} help={SCIENTIFIC_HELP[taskType]} />
              <div className="pt-4 border-t border-white/5">
                <p className="text-xs text-slate-400 italic">
                  Not 100% sure? That's fine - pick the closest label for each region you mark.
                </p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="glass rounded-2xl p-5 lg:p-6">
              <AnnotationPanel
                taskType={taskType}
                taskId={task.id}
                serialNumber={task.serialNumber}
                imageUrl={task.url}
                externalImageId={`aurora-img-${task.id}`}
                onSubmit={onSubmit}
                showGuide={false}
                userLabel={userLabel}
                onUserLabelChange={setUserLabel}
              />
            </motion.div>

            <motion.div variants={itemVariants} className="flex justify-end">
              <PointsDisplay points={points} />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function Classify({ points, onPointsChange }: ClassifyProps) {
  const { taskType: typeParam } = useParams<{ taskType?: string }>();
  const navigate = useNavigate();

  const [selectedType, setSelectedType] = useState<TaskType | null>((typeParam as TaskType) ?? null);
  const [tasks, setTasks] = useState<AuroraTask[]>([]);
  const [gridLoading, setGridLoading] = useState(false);
  const [progressLoading, setProgressLoading] = useState(true);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [streak, setStreak] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const [availability, setAvailability] = useState<Record<TaskType, boolean | null>>(
    () => Object.fromEntries(TASK_TYPES.map(t => [t.value, null])) as Record<TaskType, boolean | null>,
  );

  useEffect(() => {
    void loadDailyProgress().then(progress => {
      setDoneIds(progress.completedTaskIds);
      setStreak(progress.streak);
      onPointsChange(progress.points);
      setProgressLoading(false);
    }).catch(() => setProgressLoading(false));
  }, [onPointsChange]);

  useEffect(() => {
    TASK_TYPES.forEach(async ({ value }) => {
      const result = await fetchAuroraTasksByType(value);
      setAvailability(prev => ({ ...prev, [value]: result !== null && result.length > 0 }));
    });
  }, []);

  useEffect(() => {
    if (!selectedType) {
      setTasks([]);
      return;
    }

    setGridLoading(true);
    fetchAuroraTasksByType(selectedType).then(result => {
      setTasks(result ?? []);
      setGridLoading(false);
    });
  }, [selectedType]);

  const pendingTasks = useMemo(() => tasks.filter(t => !doneIds.has(t.id)), [tasks, doneIds]);
  const currentTask = pendingTasks[0] ?? null;

  const handleTypeSelect = useCallback((tt: TaskType) => {
    setSelectedType(tt);
    navigate(`/classify/${tt}`, { replace: true });
  }, [navigate]);

  const handleBackToTypes = useCallback(() => {
    setSelectedType(null);
    navigate('/classify', { replace: true });
  }, [navigate]);

  const handleAnnotationSubmit = useCallback((input: AnnotationInput) => {
    setShowSuccess(true);
    // Let SuccessPopup show for 2 seconds before advancing
    setTimeout(() => {
      void markTaskCompletedForToday(input.task_id).then(({ progress }) => {
        setDoneIds(new Set(progress.completedTaskIds));
        setStreak(progress.streak);
        onPointsChange(progress.points); // +1 point per successful annotation
        setShowSuccess(false);
      });
    }, 2_000);
  }, [onPointsChange]);

  return (
    <AnimatePresence mode="wait">
      {!selectedType ? (
        <motion.div key="picker" variants={pageVariants} initial="hidden" animate="visible" exit="exit" className="min-h-screen pt-24 pb-16 px-4 lg:px-8 cosmic-bg relative">
          <StarField />
          <div className="max-w-6xl mx-auto relative z-10">
            <GuidePanel 
              onSelect={handleTypeSelect} 
              availability={availability} 
              taskTypes={TASK_TYPES} 
            />
          </div>
        </motion.div>
      ) : (
        <motion.div key="selected" variants={pageVariants} initial="hidden" animate="visible" exit="exit">
          {progressLoading || gridLoading ? (
            <div className="min-h-screen pt-24 flex items-center justify-center cosmic-bg relative">
              <StarField />
              <div className="flex flex-col items-center gap-4 text-slate-500 relative z-10">
                <motion.div className="w-10 h-10 border-2 border-solar-500/40 border-t-solar-400 rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, ease: 'linear', repeat: Infinity }} />
                <p className="text-sm">Loading today's queue…</p>
              </div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="min-h-screen pt-24 flex items-center justify-center cosmic-bg px-4 relative">
              <StarField />
              <div className="glass rounded-2xl p-8 max-w-md text-center flex flex-col gap-4 relative z-10">
                <span className="text-4xl">🔭</span>
                <h2 className="font-bold text-slate-200">No images available yet</h2>
                <button onClick={handleBackToTypes} className="btn-solar mt-2">Choose another type</button>
              </div>
            </div>
          ) : !currentTask ? (
            <div className="min-h-screen pt-24 flex items-center justify-center cosmic-bg px-4 relative">
              <StarField />
              <div className="glass rounded-2xl p-8 max-w-md text-center flex flex-col gap-4 relative z-10">
                <span className="text-4xl">🎉</span>
                <h2 className="font-bold text-slate-200">All done for today in this category</h2>
                <p className="text-sm text-slate-500">Daily rotation resets tomorrow. Nothing will be shown twice today.</p>
                <button onClick={handleBackToTypes} className="btn-solar mt-2">Choose another type</button>
              </div>
            </div>
          ) : (
            <AnnotationView
              key={currentTask.id}
              task={currentTask}
              taskType={selectedType}
              points={points}
              streak={streak}
              completedToday={tasks.length - pendingTasks.length}
              remainingToday={pendingTasks.length}
              onSubmit={handleAnnotationSubmit}
              onBack={handleBackToTypes}
              showSuccess={showSuccess}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

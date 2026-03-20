/**
 * src/pages/Classify.tsx
 *
 * Daily one-by-one classification flow.
 *
 * - Users pick a task type.
 * - The app shows one uncompleted task at a time (for today).
 * - Completed IDs rotate daily (date-scoped) and are persisted in Puter KV.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AnnotationPanel from '@/components/AnnotationPanel';
import PointsDisplay from '@/components/PointsDisplay';
import GuidePanel from '@/components/GuidePanel';
import { TASK_OPTIONS, SCIENTIFIC_HELP } from '@/components/AnnotationPanel';
import type { AnnotationInput, TaskType } from '@/services/annotationService';
import { fetchAuroraTasksByType } from '@/services/auroraService';
import type { AuroraTask } from '@/services/auroraService';
import { classifyTaskType } from '@/utils/helpers';
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

function AnnotationView({
  task,
  taskType,
  points,
  streak,
  completedToday,
  remainingToday,
  onSubmit,
  onBack,
}: {
  task: AuroraTask;
  taskType: TaskType;
  points: number;
  streak: number;
  completedToday: number;
  remainingToday: number;
  onSubmit: (input: AnnotationInput) => void;
  onBack: () => void;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const s = classifyTaskType(taskType);
  const meta = TASK_TYPES.find(t => t.value === taskType)!;

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" exit="exit" className="min-h-screen pt-20 pb-16 px-4 cosmic-bg">
      <div className="max-w-5xl mx-auto flex flex-col gap-5">
        <motion.div variants={itemVariants} className="flex items-center gap-4 pt-4 flex-wrap">
          <BackButton label="All types" onClick={onBack} />
          <div className="flex items-center gap-2 ml-auto">
            <span>{meta.icon}</span>
            <span className={`text-sm font-semibold ${s.text}`}>{meta.friendlyName}</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass rounded-xl p-3 flex flex-wrap gap-3 text-xs text-slate-400">
          <span>Done today: <strong className="text-emerald-300">{completedToday}</strong></span>
          <span>Remaining today: <strong className="text-solar-300">{remainingToday}</strong></span>
          <span>Streak: <strong className="text-violet-300">{streak}</strong> day{streak === 1 ? '' : 's'}</span>
          <span>Total points: <strong className="text-solar-300">{points}</strong></span>
        </motion.div>

        {/* Guide above image, then image, then annotation controls */}
        <div className="flex flex-col gap-5">
          {/* Render the guide here so it sits above the image */}
          <motion.div variants={itemVariants} className="glass rounded-2xl p-5">
            {(() => {
              const selectedOption = TASK_OPTIONS.find(o => o.value === taskType)!;
              return <GuidePanel selectedOption={selectedOption} help={SCIENTIFIC_HELP[taskType]} />;
            })()}
          </motion.div>

          {/* Image */}
          <motion.div variants={itemVariants} className="glass rounded-2xl overflow-hidden">
            <div className="relative aspect-square bg-cosmic-900">
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
            <div className="px-4 py-3 flex items-center justify-between text-xs text-slate-500 border-t border-white/5">
              <div className="flex items-center gap-3">
                <span>{task.source}</span>
                {task.date && <span>{task.date}</span>}
              </div>
              <div className="flex flex-col items-end gap-1">
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

          {/* Annotation controls (render without the guide to avoid duplication) */}
          <motion.div variants={itemVariants} className="glass rounded-2xl p-5">
            <AnnotationPanel
              taskType={taskType}
              taskId={task.id}
              serialNumber={task.serialNumber}
              imageUrl={task.url}
              externalImageId={`aurora-img-${task.id}`}
              onSubmit={onSubmit}
              showGuide={false}
            />
          </motion.div>

          <motion.div variants={itemVariants} className="flex justify-end">
            <PointsDisplay points={points} />
          </motion.div>
        </div>
      </div>
    </motion.div>
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
    // Let AnnotationPanel show success first, then advance to next task.
    setTimeout(() => {
      void markTaskCompletedForToday(input.task_id).then(({ progress }) => {
        setDoneIds(new Set(progress.completedTaskIds));
        setStreak(progress.streak);
        onPointsChange(progress.points); // +1 point per successful annotation
      });
    }, 4_200);
  }, [onPointsChange]);

  return (
    <AnimatePresence mode="wait">
      {!selectedType ? (
        <motion.div key="picker" variants={pageVariants} initial="hidden" animate="visible" exit="exit" className="min-h-screen pt-24 pb-16 px-4 cosmic-bg">
          <div className="max-w-3xl mx-auto">
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
            <div className="min-h-screen pt-24 flex items-center justify-center cosmic-bg">
              <div className="flex flex-col items-center gap-4 text-slate-500">
                <motion.div className="w-10 h-10 border-2 border-solar-500/40 border-t-solar-400 rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, ease: 'linear', repeat: Infinity }} />
                <p className="text-sm">Loading today's queue…</p>
              </div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="min-h-screen pt-24 flex items-center justify-center cosmic-bg px-4">
              <div className="glass rounded-2xl p-8 max-w-md text-center flex flex-col gap-4">
                <span className="text-4xl">🔭</span>
                <h2 className="font-bold text-slate-200">No images available yet</h2>
                <button onClick={handleBackToTypes} className="btn-solar mt-2">Choose another type</button>
              </div>
            </div>
          ) : !currentTask ? (
            <div className="min-h-screen pt-24 flex items-center justify-center cosmic-bg px-4">
              <div className="glass rounded-2xl p-8 max-w-md text-center flex flex-col gap-4">
                <span className="text-4xl">🎉</span>
                <h2 className="font-bold text-slate-200">All done for today in this category</h2>
                <p className="text-sm text-slate-500">Daily rotation resets tomorrow. Nothing will be shown twice today.</p>
                <button onClick={handleBackToTypes} className="btn-solar mt-2">Choose another type</button>
              </div>
            </div>
          ) : (
            <AnnotationView
              task={currentTask}
              taskType={selectedType}
              points={points}
              streak={streak}
              completedToday={tasks.length - pendingTasks.length}
              remainingToday={pendingTasks.length}
              onSubmit={handleAnnotationSubmit}
              onBack={handleBackToTypes}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

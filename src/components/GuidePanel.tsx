import { motion } from 'framer-motion';
import { containerVariants, itemVariants } from '@/animations/pageTransitions';
import { classifyTaskType } from '@/utils/helpers';

interface SubLabel { value: string; label: string; hint: string }
interface TaskOption {
  value: string;
  label: string;
  icon: string;
  lookFor: string;
  color: string;
  bg: string;
  border: string;
  subLabels: SubLabel[];
}

interface HelpText { scientific: string; plain: string; uncertainLabel: string }

interface TaskTypeMeta {
  value: any; // TaskType
  friendlyName: string;
  icon: string;
  description: string;
  subtitle?: string;
}

interface GuidePanelProps {
  selectedOption?: TaskOption | null;
  help?: HelpText;
  // For selection mode
  onSelect?: (type: any) => void;
  availability?: Record<string, boolean | null>;
  taskTypes?: TaskTypeMeta[];
}

export default function GuidePanel({ 
  selectedOption, 
  help, 
  onSelect, 
  availability, 
  taskTypes 
}: GuidePanelProps) {
  
  // Selection Mode: If no option is selected, show the type picker grid
  if (!selectedOption && taskTypes && onSelect && availability) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        exit={{ opacity: 0, y: -10 }} 
        className="flex flex-col gap-8"
      >
        <div className="text-center flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-slate-100">What would you like to classify today?</h1>
          <p className="text-slate-500 text-sm">We now show tasks one-by-one and skip anything you've already completed today.</p>
        </div>

        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {taskTypes.map(tt => {
            const avail = availability[tt.value];
            const ready = avail === true;
            const loading = avail === null;
            const s = classifyTaskType(tt.value);

            return (
              <motion.button
                key={tt.value}
                variants={itemVariants}
                onClick={() => ready ? onSelect(tt.value) : undefined}
                whileHover={ready ? { scale: 1.03, y: -2 } : {}}
                whileTap={ready ? { scale: 0.97 } : {}}
                className={[
                  'relative flex flex-col items-start gap-3 p-5 rounded-2xl text-left border transition-all duration-200 outline-none',
                  ready ? `${s.bg} ${s.border} hover:border-opacity-70 cursor-pointer` : 'bg-white/3 border-white/8 cursor-default opacity-60',
                ].join(' ')}
              >
                {!ready && (
                  <span className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full bg-white/8 border border-white/15 text-slate-500">
                    {loading ? '…' : 'Coming soon'}
                  </span>
                )}
                <span className="text-3xl">{tt.icon}</span>
                <div>
                  <p className={`font-semibold text-sm ${ready ? s.text : 'text-slate-400'}`}>{tt.friendlyName}</p>
                  {tt.subtitle && (
                    <p className="text-[10px] text-slate-500 mt-0.5">{tt.subtitle}</p>
                  )}
                  <p className="text-xs text-slate-600 mt-0.5 leading-snug">{tt.description}</p>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </motion.div>
    );
  }

  // Guidance Mode: Show the help text for the selected task (existing logic)
  if (!selectedOption || !help) return null;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col gap-5">

      {/* Intro banner */}
      <motion.div className="flex items-start gap-3 p-3.5 rounded-xl bg-solar-500/8 border border-solar-500/20">
        <span className="text-xl flex-shrink-0 mt-0.5">👈</span>
        <div>
          <p className="text-sm font-semibold text-solar-200">Look at the image and follow the short guide below</p>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">No expertise needed — the guide will walk you through where to look and what to mark.</p>
        </div>
      </motion.div>

      {/* Task context */}
      <motion.div className="flex items-center gap-2">
        <div className={`rounded-xl border p-3.5 ${selectedOption.bg} ${selectedOption.border}`}>
          <p className={`text-sm font-semibold ${selectedOption.color}`}>{selectedOption.icon} {selectedOption.label}</p>
          <p className="text-xs text-slate-400 mt-1">Look for: {selectedOption.lookFor}</p>
        </div>
      </motion.div>

      {/* Scientific phrasing + plain-English helper */}
      <motion.div className="mt-2 text-xs text-slate-400">
        <p><strong>Scientific phrasing:</strong> {help.scientific}</p>
        <p className="mt-1"><strong>Plain English:</strong> {help.plain}</p>
        <div className="mt-2">
          <button type="button" className="text-xs text-amber-300 underline hover:text-amber-400">Can't classify? Mark as 'no / quiet' for scientists</button>
        </div>

        <details className="mt-3 bg-white/3 p-3 rounded-lg">
          <summary className="cursor-pointer text-slate-200 text-sm font-semibold">More info & examples</summary>
          <div className="mt-2 text-xs text-slate-400">
            <p className="mb-2"><strong>How to mark regions</strong>: Long-press the image to add numbered markers. Drag a marker to reposition it. Drag mostly up/down on a marker (or use the slider) to adjust region size.</p>
            <p className="mb-2"><strong>Sunspots</strong>: Mark dark circular regions on the disk. Try to place markers on the center; for groups place 1–3 markers on the most prominent areas.</p>
            <p className="mb-2"><strong>Magnetograms</strong>: Place a marker on the centre of the region. Use the "Region radius" slider to cover the area.</p>
            <p className="mb-2"><strong>Flares</strong>: Click the brightest point of the flash.</p>
            <p className="mb-2"><strong>Coronal holes & prominences</strong>: Use 1–2 markers to describe extent or place center and increase region radius.</p>
            <p className="mb-2">If unsure, pick the "None / I don't know" option — scientists will review ambiguous cases.</p>
          </div>
        </details>
      </motion.div>

    </motion.div>
  );
}

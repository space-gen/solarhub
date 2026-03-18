import { motion } from 'framer-motion';

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

export default function GuidePanel({ selectedOption, help }: { selectedOption: TaskOption; help: HelpText }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col gap-5">

      {/* Intro banner (changed text: follow the guide) */}
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
            <p className="mb-2"><strong>How to mark spots</strong>: Click the image to add numbered markers. Drag a marker to reposition it. For groups, place markers on the main visible centers.</p>
            <p className="mb-2"><strong>Sunspots</strong>: Mark dark circular spots on the disk. Try to place markers on spot centres; for groups place 1–3 markers on the most prominent spots.</p>
            <p className="mb-2"><strong>Magnetograms</strong>: Place a marker on the centre of the region. Use the "Region radius" slider to cover the area. If the region is offset from your first click, place the center marker last and use the "Set center" control below.</p>
            <p className="mb-2"><strong>Flares</strong>: Click the brightest point of the flash.</p>
            <p className="mb-2"><strong>Coronal holes & prominences</strong>: Use 1–2 markers to describe extent or place center and increase region radius.</p>
            <p className="mb-2">If unsure, pick the "I don't know / none" option — scientists will review ambiguous cases.</p>
          </div>
        </details>
      </motion.div>

    </motion.div>
  );
}

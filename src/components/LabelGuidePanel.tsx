import { motion } from 'framer-motion';
import type { TaskOption } from '@/components/AnnotationPanel';

interface LabelGuidePanelProps {
  selectedOption: TaskOption;
}

export default function LabelGuidePanel({ selectedOption }: LabelGuidePanelProps) {
  if (!selectedOption) return null;

  // Thumbnails and reference images for sunspot classifications (served from public/)
  const base = (import.meta as any)?.env?.BASE_URL || '/';
  const thumbMap: Record<string, string | undefined> = {
    class_a: `${base}images/classifications/sunspot/class_a.svg`,
    class_b: `${base}images/classifications/sunspot/class_b.svg`,
    class_c: `${base}images/classifications/sunspot/class_c.svg`,
    class_d: `${base}images/classifications/sunspot/class_d.svg`,
    class_e: `${base}images/classifications/sunspot/class_e.svg`,
    class_f: `${base}images/classifications/sunspot/class_f.svg`,
    class_h: `${base}images/classifications/sunspot/class_h.svg`,
  };

  const classificationImage = selectedOption.value === 'sunspot'
    ? `${base}images/classifications/sunspot/The-Modified-Zurich-Sunspot-Classification-System-developed-by-Patrick-McIntosh.png`
    : undefined;

  const renderThumb = (val: string) => {
    if (selectedOption.value !== 'sunspot') return null;
    switch (val) {
      case 'class_a':
        return (
          <svg width="40" height="40" viewBox="0 0 80 80" className="rounded">
            <defs>
              <radialGradient id="gA" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#0b0b0b" />
                <stop offset="55%" stopColor="#1a1a1a" />
                <stop offset="100%" stopColor="#000" stopOpacity={0} />
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="none" />
            <circle cx="40" cy="40" r="5" fill="url(#gA)" />
          </svg>
        );
      case 'class_b':
        return (
          <svg width="40" height="40" viewBox="0 0 80 80" className="rounded">
            <defs>
              <radialGradient id="gB" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="#070707" />
                <stop offset="50%" stopColor="#111111" />
                <stop offset="100%" stopColor="#000" stopOpacity={0} />
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="none" />
            <circle cx="40" cy="40" r="8" fill="url(#gB)" />
            <circle cx="40" cy="40" r="4" fill="#000" />
          </svg>
        );
      case 'class_c':
        return (
          <svg width="40" height="40" viewBox="0 0 80 80" className="rounded">
            <defs>
              <radialGradient id="gC" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="#030303" />
                <stop offset="60%" stopColor="#1a1a1a" />
                <stop offset="100%" stopColor="#000" stopOpacity={0} />
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="none" />
            <g>
              <circle cx="34" cy="36" r="7" fill="url(#gC)" />
              <circle cx="46" cy="44" r="6" fill="url(#gC)" />
              <circle cx="40" cy="52" r="4" fill="#000" />
            </g>
          </svg>
        );
      case 'class_d':
        return (
          <svg width="40" height="40" viewBox="0 0 80 80" className="rounded">
            <defs>
              <radialGradient id="gD1" cx="45%" cy="45%" r="60%">
                <stop offset="0%" stopColor="#000" />
                <stop offset="55%" stopColor="#1b1b1b" />
                <stop offset="100%" stopColor="#000" stopOpacity={0} />
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="none" />
            <g>
              <ellipse cx="30" cy="40" rx="12" ry="10" fill="url(#gD1)" />
              <circle cx="44" cy="40" r="7" fill="#080808" />
              <ellipse cx="30" cy="40" rx="18" ry="14" fill="#000" fillOpacity={0.12} />
            </g>
          </svg>
        );
      case 'class_e':
        return (
          <svg width="40" height="40" viewBox="0 0 80 80" className="rounded">
            <defs>
              <radialGradient id="gE" cx="50%" cy="45%" r="65%">
                <stop offset="0%" stopColor="#000" />
                <stop offset="60%" stopColor="#1e1e1e" />
                <stop offset="100%" stopColor="#000" stopOpacity={0} />
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="none" />
            <g>
              <ellipse cx="40" cy="36" rx="14" ry="12" fill="url(#gE)" />
              <ellipse cx="52" cy="46" rx="11" ry="9" fill="#070707" />
              <ellipse cx="40" cy="36" rx="22" ry="18" fill="#000" fillOpacity={0.12} />
            </g>
          </svg>
        );
      case 'class_f':
        return (
          <svg width="40" height="40" viewBox="0 0 80 80" className="rounded">
            <defs>
              <radialGradient id="gF" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="#000" />
                <stop offset="50%" stopColor="#111" />
                <stop offset="100%" stopColor="#000" stopOpacity={0} />
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="none" />
            <g>
              <circle cx="28" cy="36" r="7" fill="url(#gF)" />
              <circle cx="36" cy="44" r="8" fill="#070707" />
              <circle cx="46" cy="36" r="7" fill="url(#gF)" />
              <circle cx="56" cy="46" r="6" fill="#111" />
              <circle cx="40" cy="52" r="5" fill="#000" />
              <ellipse cx="40" cy="44" rx="28" ry="16" fill="#000" fillOpacity={0.08} />
            </g>
          </svg>
        );
      case 'class_h':
        return (
          <svg width="40" height="40" viewBox="0 0 80 80" className="rounded">
            <defs>
              <radialGradient id="gH" cx="50%" cy="50%" r="70%">
                <stop offset="0%" stopColor="#000" />
                <stop offset="50%" stopColor="#111" />
                <stop offset="100%" stopColor="#000" stopOpacity={0} />
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="none" />
            <circle cx="40" cy="40" r="16" fill="#000" />
            <circle cx="40" cy="40" r="10" fill="#000" />
            <ellipse cx="40" cy="40" rx="28" ry="22" fill="url(#gH)" fillOpacity={0.2} />
          </svg>
        );
      /* Magnetogram thumbnails */
      case 'alpha':
        return (
          <svg width="40" height="40" viewBox="0 0 80 80" className="rounded">
            <rect width="100%" height="100%" fill="none" />
            <circle cx="40" cy="40" r="8" fill="#fff" stroke="#000" strokeWidth="1" />
          </svg>
        );
      case 'beta':
        return (
          <svg width="40" height="40" viewBox="0 0 80 80" className="rounded">
            <rect width="100%" height="100%" fill="none" />
            <circle cx="30" cy="40" r="7" fill="#fff" stroke="#000" strokeWidth="1" />
            <circle cx="50" cy="40" r="7" fill="#000" />
          </svg>
        );
      case 'gamma':
        return (
          <svg width="40" height="40" viewBox="0 0 80 80" className="rounded">
            <rect width="100%" height="100%" fill="none" />
            <circle cx="28" cy="34" r="5" fill="#fff" stroke="#000" strokeWidth="0.8" />
            <circle cx="36" cy="42" r="5" fill="#000" />
            <circle cx="46" cy="36" r="4" fill="#fff" stroke="#000" strokeWidth="0.8" />
            <circle cx="54" cy="44" r="4" fill="#000" />
          </svg>
        );
      case 'beta-gamma':
        return (
          <svg width="40" height="40" viewBox="0 0 80 80" className="rounded">
            <rect width="100%" height="100%" fill="none" />
            <circle cx="28" cy="36" r="6" fill="#fff" stroke="#000" strokeWidth="1" />
            <circle cx="44" cy="40" r="6" fill="#000" />
            <circle cx="52" cy="48" r="3" fill="#fff" stroke="#000" strokeWidth="0.6" />
          </svg>
        );
      case 'delta':
        return (
          <svg width="40" height="40" viewBox="0 0 80 80" className="rounded">
            <rect width="100%" height="100%" fill="none" />
            <circle cx="36" cy="40" r="8" fill="#fff" stroke="#000" strokeWidth="1" />
            <circle cx="44" cy="40" r="6" fill="#000" />
          </svg>
        );
      case 'beta-delta':
        return (
          <svg width="40" height="40" viewBox="0 0 80 80" className="rounded">
            <rect width="100%" height="100%" fill="none" />
            <circle cx="28" cy="36" r="6" fill="#fff" stroke="#000" strokeWidth="1" />
            <circle cx="44" cy="40" r="8" fill="#fff" stroke="#000" strokeWidth="0.8" />
            <circle cx="52" cy="44" r="5" fill="#000" />
          </svg>
        );
      case 'beta-gamma-delta':
        return (
          <svg width="40" height="40" viewBox="0 0 80 80" className="rounded">
            <rect width="100%" height="100%" fill="none" />
            <circle cx="26" cy="36" r="5" fill="#fff" stroke="#000" strokeWidth="0.8" />
            <circle cx="36" cy="44" r="7" fill="#000" />
            <circle cx="48" cy="38" r="6" fill="#fff" stroke="#000" strokeWidth="0.8" />
            <circle cx="56" cy="46" r="4" fill="#000" />
          </svg>
        );
      case 'gamma-delta':
        return (
          <svg width="40" height="40" viewBox="0 0 80 80" className="rounded">
            <rect width="100%" height="100%" fill="none" />
            <circle cx="32" cy="36" r="6" fill="#fff" stroke="#000" strokeWidth="0.8" />
            <circle cx="44" cy="44" r="6" fill="#000" />
            <circle cx="52" cy="36" r="3" fill="#fff" stroke="#000" strokeWidth="0.6" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div className="mt-2 p-3 rounded-lg bg-amber-900/80 border border-amber-400/20">
      <p className="text-sm font-semibold text-amber-300">Label quick guide</p>
      <p className="text-xs text-slate-400 mt-1">Use the numbered shortcuts to pick a label quickly (keys 1–9). Press 0 or choose the "None" option if you don't see a matching feature.</p>



      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {selectedOption.subLabels.map((sub, idx) => (
          <div key={sub.value} className="p-2 bg-white/3 rounded-lg border border-white/8 text-xs">
            <div className="flex items-baseline justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-slate-300">{idx < 9 ? `[${idx + 1}]` : (idx === 9 ? `[0]` : '')}</span>
                {renderThumb(sub.value) ? (
                  <div className="w-10 h-10 flex items-center justify-center">{renderThumb(sub.value)}</div>
                ) : null}
                <span className="font-semibold text-slate-100">{sub.label}</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">{sub.value}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{sub.hint}</p>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-slate-500 mt-3">If unsure about a label's scientific meaning, choose the closest plain-English option and scientists will review it. This panel uses the same labels submitted to the research backend.</p>
    </motion.div>
  );
}

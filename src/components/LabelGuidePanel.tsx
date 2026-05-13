import { motion } from 'framer-motion';
import type { TaskOption } from '@/components/AnnotationPanel';

interface LabelGuidePanelProps {
  selectedOption: TaskOption;
}

export default function LabelGuidePanel({ selectedOption }: LabelGuidePanelProps) {
  if (!selectedOption) return null;



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
      /* Magnetogram thumbnails - showing magnetic field polarities and structures */
      case 'alpha':
        return (
          <svg width="40" height="40" viewBox="0 0 80 80" className="rounded">
            <defs>
              <linearGradient id="magField" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4a90e2" />
                <stop offset="100%" stopColor="#1a3a52" />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="none" />
            {/* Simple unipolar region - single magnetic polarity */}
            <ellipse cx="40" cy="40" rx="14" ry="16" fill="url(#magField)" fillOpacity="0.8" />
            <path d="M 35 25 Q 40 20 45 25" stroke="#6ba3d0" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M 35 40 Q 40 45 45 40" stroke="#6ba3d0" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M 35 55 Q 40 60 45 55" stroke="#6ba3d0" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>
        );
      case 'beta':
        return (
          <svg width="40" height="40" viewBox="0 0 80 80" className="rounded">
            <defs>
              <linearGradient id="magPos" x1="0%" y1="50%" x2="50%" y2="50%">
                <stop offset="0%" stopColor="#e24a4a" />
                <stop offset="100%" stopColor="#8a2020" />
              </linearGradient>
              <linearGradient id="magNeg" x1="50%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#4a90e2" />
                <stop offset="100%" stopColor="#1a3a52" />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="none" />
            {/* Bipolar region - two opposite polarities */}
            <ellipse cx="28" cy="40" rx="12" ry="14" fill="url(#magPos)" fillOpacity="0.8" />
            <ellipse cx="52" cy="40" rx="12" ry="14" fill="url(#magNeg)" fillOpacity="0.8" />
            {/* Neutral line between polarities */}
            <line x1="40" y1="25" x2="40" y2="55" stroke="#ffd700" strokeWidth="1" />
            {/* Field lines */}
            <path d="M 28 30 Q 40 25 52 30" stroke="#ffed99" strokeWidth="1" fill="none" opacity="0.7" />
            <path d="M 28 50 Q 40 55 52 50" stroke="#ffed99" strokeWidth="1" fill="none" opacity="0.7" />
          </svg>
        );
      case 'gamma':
        return (
          <svg width="40" height="40" viewBox="0 0 80 80" className="rounded">
            <rect width="100%" height="100%" fill="none" />
            {/* Complex magnetic configuration with multiple polarity changes */}
            <ellipse cx="22" cy="30" rx="8" ry="10" fill="#e24a4a" fillOpacity="0.7" />
            <ellipse cx="40" cy="28" rx="7" ry="9" fill="#4a90e2" fillOpacity="0.7" />
            <ellipse cx="58" cy="32" rx="6" ry="8" fill="#e24a4a" fillOpacity="0.7" />
            <ellipse cx="30" cy="50" rx="7" ry="8" fill="#4a90e2" fillOpacity="0.7" />
            <ellipse cx="50" cy="50" rx="8" ry="9" fill="#e24a4a" fillOpacity="0.7" />
            {/* Sheared field lines indicating strong gradients */}
            <path d="M 20 20 Q 30 35 40 45" stroke="#ffd700" strokeWidth="1" fill="none" opacity="0.6" />
            <path d="M 60 25 Q 50 35 45 50" stroke="#ffd700" strokeWidth="1" fill="none" opacity="0.6" />
          </svg>
        );
      case 'beta-gamma':
        return (
          <svg width="40" height="40" viewBox="0 0 80 80" className="rounded">
            <defs>
              <linearGradient id="posGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e24a4a" />
                <stop offset="100%" stopColor="#8a2020" />
              </linearGradient>
              <linearGradient id="negGrad" x1="100%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#4a90e2" />
                <stop offset="100%" stopColor="#1a3a52" />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="none" />
            {/* Main bipolar pair with complex structure */}
            <ellipse cx="25" cy="40" rx="11" ry="13" fill="url(#posGrad)" fillOpacity="0.8" />
            <ellipse cx="55" cy="40" rx="11" ry="13" fill="url(#negGrad)" fillOpacity="0.8" />
            {/* Additional smaller regions showing complexity */}
            <ellipse cx="40" cy="28" rx="5" ry="6" fill="#4a90e2" fillOpacity="0.6" />
            <ellipse cx="40" cy="52" rx="5" ry="6" fill="#e24a4a" fillOpacity="0.6" />
            {/* Neutral S-shaped boundary */}
            <path d="M 40 20 Q 38 35 40 50" stroke="#ffd700" strokeWidth="1.5" fill="none" />
          </svg>
        );
      case 'delta':
        return (
          <svg width="40" height="40" viewBox="0 0 80 80" className="rounded">
            <rect width="100%" height="100%" fill="none" />
            {/* Highly sheared bipolar regions with strong shear - delta configuration */}
            <ellipse cx="30" cy="35" rx="10" ry="12" fill="#e24a4a" fillOpacity="0.8" />
            <ellipse cx="50" cy="45" rx="10" ry="12" fill="#4a90e2" fillOpacity="0.8" />
            {/* Strong shear indicated by diagonal offset */}
            <path d="M 25 30 L 55 50" stroke="#ffd700" strokeWidth="2" opacity="0.8" />
            {/* Multiple field lines showing strong gradient */}
            <path d="M 28 24 Q 42 32 52 42" stroke="#ffed99" strokeWidth="1" fill="none" opacity="0.7" />
            <path d="M 28 46 Q 40 45 52 48" stroke="#ffed99" strokeWidth="1" fill="none" opacity="0.7" />
            {/* Vortex indicator in shear region */}
            <circle cx="40" cy="40" r="3" fill="none" stroke="#ffd700" strokeWidth="1" opacity="0.6" />
          </svg>
        );
      case 'beta-delta':
        return (
          <svg width="40" height="40" viewBox="0 0 80 80" className="rounded">
            <defs>
              <linearGradient id="bdPos" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#e24a4a" />
                <stop offset="100%" stopColor="#8a2020" />
              </linearGradient>
              <linearGradient id="bdNeg" x1="100%" y1="0%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#4a90e2" />
                <stop offset="100%" stopColor="#1a3a52" />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="none" />
            {/* Beta-Delta: Major bipolar with strong internal shear */}
            <ellipse cx="26" cy="40" rx="10" ry="14" fill="url(#bdPos)" fillOpacity="0.8" />
            <ellipse cx="54" cy="40" rx="10" ry="14" fill="url(#bdNeg)" fillOpacity="0.8" />
            {/* Internal structure showing shear */}
            <ellipse cx="32" cy="30" rx="4" ry="5" fill="#4a90e2" fillOpacity="0.6" />
            <ellipse cx="48" cy="50" rx="4" ry="5" fill="#e24a4a" fillOpacity="0.6" />
            {/* Complex neutral line with shear */}
            <path d="M 40 20 Q 38 40 42 60" stroke="#ffd700" strokeWidth="1.5" fill="none" />
            <path d="M 35 32 Q 40 40 45 48" stroke="#ffed99" strokeWidth="0.8" fill="none" opacity="0.7" />
          </svg>
        );
      case 'beta-gamma-delta':
        return (
          <svg width="40" height="40" viewBox="0 0 80 80" className="rounded">
            <rect width="100%" height="100%" fill="none" />
            {/* Most complex: Multiple polarities with strong shear */}
            <ellipse cx="22" cy="36" rx="8" ry="10" fill="#e24a4a" fillOpacity="0.8" />
            <ellipse cx="40" cy="26" rx="6" ry="8" fill="#4a90e2" fillOpacity="0.8" />
            <ellipse cx="58" cy="38" rx="8" ry="10" fill="#e24a4a" fillOpacity="0.8" />
            <ellipse cx="35" cy="52" rx="7" ry="8" fill="#4a90e2" fillOpacity="0.8" />
            <ellipse cx="55" cy="50" rx="6" ry="7" fill="#e24a4a" fillOpacity="0.7" />
            {/* Complex tangled field lines */}
            <path d="M 20 30 Q 30 38 40 35" stroke="#ffd700" strokeWidth="1" fill="none" opacity="0.6" />
            <path d="M 40 32 Q 48 40 60 45" stroke="#ffd700" strokeWidth="1" fill="none" opacity="0.6" />
            <path d="M 25 50 Q 35 48 50 52" stroke="#ffed99" strokeWidth="1" fill="none" opacity="0.5" />
            {/* Shear indicators */}
            <line x1="30" y1="20" x2="50" y2="60" stroke="#ff6b6b" strokeWidth="0.8" opacity="0.5" strokeDasharray="2,2" />
          </svg>
        );
      case 'gamma-delta':
        return (
          <svg width="40" height="40" viewBox="0 0 80 80" className="rounded">
            <rect width="100%" height="100%" fill="none" />
            {/* Gamma-Delta: Multiple polarity regions with shear */}
            <ellipse cx="24" cy="35" rx="7" ry="9" fill="#e24a4a" fillOpacity="0.8" />
            <ellipse cx="38" cy="28" rx="6" ry="8" fill="#4a90e2" fillOpacity="0.8" />
            <ellipse cx="52" cy="36" rx="7" ry="9" fill="#e24a4a" fillOpacity="0.8" />
            <ellipse cx="40" cy="50" rx="6" ry="7" fill="#4a90e2" fillOpacity="0.8" />
            {/* Sheared neutral lines */}
            <path d="M 30 24 Q 38 32 45 45" stroke="#ffd700" strokeWidth="1.2" fill="none" opacity="0.7" />
            <path d="M 20 50 Q 35 48 60 52" stroke="#ffd700" strokeWidth="1" fill="none" opacity="0.6" />
            {/* Field line curvature showing shear */}
            <path d="M 28 22 Q 35 35 48 52" stroke="#ffed99" strokeWidth="0.8" fill="none" opacity="0.6" />
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

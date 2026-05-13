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
              <radialGradient id="gA_umbra" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#030303" />
                <stop offset="70%" stopColor="#0a0a0a" />
                <stop offset="100%" stopColor="#000" stopOpacity={0} />
              </radialGradient>
              <radialGradient id="gA_penumbra" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="#1a1a1a" />
                <stop offset="100%" stopColor="#000" stopOpacity={0} />
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="none" />
            <circle cx="40" cy="40" r="7" fill="url(#gA_penumbra)" />
            <circle cx="40" cy="40" r="3" fill="url(#gA_umbra)" />
          </svg>
        );
      case 'class_b':
        return (
          <svg width="40" height="40" viewBox="0 0 80 80" className="rounded">
            <defs>
              <radialGradient id="gB_umbra" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#000" />
                <stop offset="60%" stopColor="#080808" />
                <stop offset="100%" stopColor="#000" stopOpacity={0} />
              </radialGradient>
              <radialGradient id="gB_penumbra" cx="50%" cy="50%" r="65%">
                <stop offset="0%" stopColor="#141414" />
                <stop offset="100%" stopColor="#000" stopOpacity={0} />
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="none" />
            <circle cx="40" cy="40" r="11" fill="url(#gB_penumbra)" />
            <circle cx="40" cy="40" r="6" fill="url(#gB_umbra)" />
          </svg>
        );
      case 'class_c':
        return (
          <svg width="40" height="40" viewBox="0 0 80 80" className="rounded">
            <defs>
              <radialGradient id="gC_umbra1" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#000" />
                <stop offset="70%" stopColor="#0a0a0a" />
                <stop offset="100%" stopColor="#000" stopOpacity={0} />
              </radialGradient>
              <radialGradient id="gC_penumbra1" cx="50%" cy="50%" r="65%">
                <stop offset="0%" stopColor="#131313" />
                <stop offset="100%" stopColor="#000" stopOpacity={0} />
              </radialGradient>
              <radialGradient id="gC_umbra2" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#010101" />
                <stop offset="60%" stopColor="#0c0c0c" />
                <stop offset="100%" stopColor="#000" stopOpacity={0} />
              </radialGradient>
              <radialGradient id="gC_penumbra2" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="#161616" />
                <stop offset="100%" stopColor="#000" stopOpacity={0} />
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="none" />
            <g>
              <circle cx="32" cy="36" r="10" fill="url(#gC_penumbra1)" />
              <circle cx="32" cy="36" r="5" fill="url(#gC_umbra1)" />
              <circle cx="48" cy="44" r="9" fill="url(#gC_penumbra2)" />
              <circle cx="48" cy="44" r="4" fill="url(#gC_umbra2)" />
              <path d="M37 40 Q42.5 42 48 44" stroke="#0a0a0a" strokeWidth="0.8" fill="none" />
            </g>
          </svg>
        );
      case 'class_d':
        return (
          <svg width="40" height="40" viewBox="0 0 80 80" className="rounded">
            <defs>
              <radialGradient id="gD_umbra1" cx="45%" cy="45%" r="55%">
                <stop offset="0%" stopColor="#000" />
                <stop offset="65%" stopColor="#0b0b0b" />
                <stop offset="100%" stopColor="#000" stopOpacity={0} />
              </radialGradient>
              <radialGradient id="gD_penumbra1" cx="45%" cy="45%" r="70%">
                <stop offset="0%" stopColor="#161616" />
                <stop offset="100%" stopColor="#000" stopOpacity={0} />
              </radialGradient>
              <radialGradient id="gD_umbra2" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#010101" />
                <stop offset="60%" stopColor="#0d0d0d" />
                <stop offset="100%" stopColor="#000" stopOpacity={0} />
              </radialGradient>
              <radialGradient id="gD_penumbra2" cx="50%" cy="50%" r="65%">
                <stop offset="0%" stopColor="#191919" />
                <stop offset="100%" stopColor="#000" stopOpacity={0} />
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="none" />
            <g>
              <ellipse cx="28" cy="40" rx="14" ry="12" fill="url(#gD_penumbra1)" />
              <ellipse cx="28" cy="40" rx="8" ry="7" fill="url(#gD_umbra1)" />
              <circle cx="46" cy="40" r="10" fill="url(#gD_penumbra2)" />
              <circle cx="46" cy="40" r="5" fill="url(#gD_umbra2)" />
              <path d="M36 38 Q41 39 46 40" stroke="#0a0a0a" strokeWidth="0.8" fill="none" />
            </g>
          </svg>
        );
      case 'class_e':
        return (
          <svg width="40" height="40" viewBox="0 0 80 80" className="rounded">
            <defs>
              <radialGradient id="gE_umbra1" cx="50%" cy="45%" r="55%">
                <stop offset="0%" stopColor="#000" />
                <stop offset="65%" stopColor="#0a0a0a" />
                <stop offset="100%" stopColor="#000" stopOpacity={0} />
              </radialGradient>
              <radialGradient id="gE_penumbra1" cx="50%" cy="45%" r="70%">
                <stop offset="0%" stopColor="#1a1a1a" />
                <stop offset="100%" stopColor="#000" stopOpacity={0} />
              </radialGradient>
              <radialGradient id="gE_umbra2" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#010101" />
                <stop offset="60%" stopColor="#0d0d0d" />
                <stop offset="100%" stopColor="#000" stopOpacity={0} />
              </radialGradient>
              <radialGradient id="gE_penumbra2" cx="50%" cy="50%" r="65%">
                <stop offset="0%" stopColor="#1c1c1c" />
                <stop offset="100%" stopColor="#000" stopOpacity={0} />
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="none" />
            <g>
              <ellipse cx="38" cy="35" rx="15" ry="13" fill="url(#gE_penumbra1)" />
              <ellipse cx="38" cy="35" rx="9" ry="8" fill="url(#gE_umbra1)" />
              <ellipse cx="54" cy="48" rx="12" ry="10" fill="url(#gE_penumbra2)" />
              <ellipse cx="54" cy="48" rx="6" ry="5" fill="url(#gE_umbra2)" />
              <path d="M45 40 Q48.5 44 54 48" stroke="#0c0c0c" strokeWidth="0.8" fill="none" />
            </g>
          </svg>
        );
      case 'class_f':
        return (
          <svg width="40" height="40" viewBox="0 0 80 80" className="rounded">
            <defs>
              <radialGradient id="gF_umbra" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#000" />
                <stop offset="60%" stopColor="#0b0b0b" />
                <stop offset="100%" stopColor="#000" stopOpacity={0} />
              </radialGradient>
              <radialGradient id="gF_penumbra" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="#141414" />
                <stop offset="100%" stopColor="#000" stopOpacity={0} />
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="none" />
            <g>
              <circle cx="26" cy="34" r="9" fill="url(#gF_penumbra)" />
              <circle cx="26" cy="34" r="4" fill="url(#gF_umbra)" />
              <circle cx="36" cy="46" r="8" fill="url(#gF_penumbra)" />
              <circle cx="36" cy="46" r="4" fill="url(#gF_umbra)" />
              <circle cx="48" cy="36" r="8" fill="url(#gF_penumbra)" />
              <circle cx="48" cy="36" r="4" fill="url(#gF_umbra)" />
              <circle cx="56" cy="48" r="7" fill="url(#gF_penumbra)" />
              <circle cx="56" cy="48" r="3" fill="url(#gF_umbra)" />
              <circle cx="40" cy="54" r="6" fill="url(#gF_penumbra)" />
              <circle cx="40" cy="54" r="3" fill="url(#gF_umbra)" />
              <path d="M30 40 L40 42 M42 40 L50 42 M42 50 L40 54" stroke="#0a0a0a" strokeWidth="0.6" fill="none" />
            </g>
          </svg>
        );
      case 'class_h':
        return (
          <svg width="40" height="40" viewBox="0 0 80 80" className="rounded">
            <defs>
              <radialGradient id="gH_umbra_large" cx="50%" cy="50%" r="55%">
                <stop offset="0%" stopColor="#000" />
                <stop offset="65%" stopColor="#0a0a0a" />
                <stop offset="100%" stopColor="#000" stopOpacity={0} />
              </radialGradient>
              <radialGradient id="gH_penumbra_large" cx="50%" cy="50%" r="75%">
                <stop offset="0%" stopColor="#141414" />
                <stop offset="100%" stopColor="#000" stopOpacity={0} />
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="none" />
            <g>
              <circle cx="40" cy="40" r="19" fill="url(#gH_penumbra_large)" />
              <circle cx="40" cy="40" r="12" fill="url(#gH_umbra_large)" />
              <circle cx="35" cy="36" r="3" fill="#000" />
              <circle cx="45" cy="38" r="3" fill="#000" />
              <circle cx="40" cy="48" r="2" fill="#000" />
            </g>
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

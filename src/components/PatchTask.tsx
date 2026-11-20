import { useEffect, useState } from 'react';
import type { AuroraTask } from '@/services/auroraService';
import { saveAnnotation } from '@/services/submissionQueue';
import { IMAGE_SIZE } from '@/utils/annotationLogic';
import { outlineFromMask, type Point } from '@/utils/outline';

/**
 * Dark patch job: one catalogued or detected dark patch at a time, one question, no drawing.
 * Research basis: binary or multiple-choice screens are reliable for volunteers; free drawing on a suggested
 * outline is costly, noisy and anchored to the suggestion. Coronal hole versus filament channel is the
 * distinction automatic detectors still get wrong.
 */
export const PATCH_ANSWERS = [
  { label: 'coronal_hole', text: 'Coronal hole', hint: 'Dark here, but not in red', image: '/images/aia-examples/0193-coronal_hole.jpg' },
  { label: 'filament_channel', text: 'Filament channel', hint: 'A dark lane that is also dark in red', image: '/images/aia-examples/0193-filament.jpg' },
  { label: 'none', text: 'Something else', hint: 'Not darker than its surroundings, or not a feature' },
  { label: 'unclear', text: "Can't tell", hint: 'An honest answer: it helps us find hard cases' },
] as const;

interface Patch { x: number; y: number; r: number; outline?: Point[]; catalogue?: string }

export function Crop({ src, patch, size, label }: { src: string; patch: Patch; size: number; label: string }) {
  const span = IMAGE_SIZE - size;
  const left = span > 0 ? Math.max(0, Math.min(span, patch.x - size / 2)) : 0;
  const top = span > 0 ? Math.max(0, Math.min(span, patch.y - size / 2)) : 0;
  const shape = patch.outline ? <polygon points={patch.outline.join(' ')} /> : <circle cx={patch.x} cy={patch.y} r={patch.r} />;
  return (
    <figure>
      <div
        role="img"
        aria-label={label}
        className="relative aspect-square w-full overflow-hidden rounded-md bg-black bg-no-repeat"
        style={{
          backgroundImage: `url("${src}")`,
          backgroundSize: `${(IMAGE_SIZE / size) * 100}%`,
          backgroundPosition: span > 0 ? `${(left / span) * 100}% ${(top / span) * 100}%` : '0 0',
        }}
      >
        <svg viewBox={`${left} ${top} ${size} ${size}`} aria-hidden="true" className="absolute inset-0 h-full w-full" fill="none">
          <g stroke="#140e22" strokeWidth={5} vectorEffect="non-scaling-stroke">{shape}</g>
          <g stroke="#56e6d4" strokeWidth={2.5} strokeDasharray="6 5" vectorEffect="non-scaling-stroke">{shape}</g>
        </svg>
      </div>
      <figcaption className="mt-1 text-center text-xs text-haze">{label}</figcaption>
    </figure>
  );
}

function patchesOf(task: AuroraTask): Patch[] {
  return (task.candidates ?? []).map(({ x, y, r, mask, outline, catalogue }) => {
    const shape = outline ?? (mask ? outlineFromMask(mask) : undefined);
    return { x, y, r, ...(shape ? { outline: shape } : {}), ...(catalogue ? { catalogue } : {}) };
  });
}

interface PatchTaskProps { task: AuroraTask; src: string; compareSrc?: string; onDone: () => void; onSkip: () => void; onHelp?: () => void }

export default function PatchTask({ task, src, compareSrc, onDone, onSkip, onHelp }: PatchTaskProps) {
  const [patches] = useState(() => patchesOf(task));
  const [answers, setAnswers] = useState<string[]>([]);
  const index = answers.length;
  const patch = patches[index];
  useEffect(() => { window.scrollTo(0, 0); }, [index]);

  const save = (labels: string[]) => {
    const rings = patches.map((item, i) => ({
      action: labels[i] === 'none' ? 'rejected' : 'confirmed',
      label: labels[i],
      finder: [item.x, item.y, item.r],
      ring: [item.x, item.y, item.r],
      ...(item.outline ? { outline: item.outline.map(([px, py]) => [Math.round(px), Math.round(py)]) } : {}),
      ...(item.catalogue ? { catalogue: item.catalogue } : {}),
    }));
    const named = labels.find(label => label !== 'none' && label !== 'unclear');
    saveAnnotation({
      review: { v: 1, part: 1, parts: 1, rings } as never,
      task_id: task.id,
      serial_number: task.serialNumber,
      image_url: task.url,
      task_type: task.taskType,
      user_label: (named ?? 'none') as never,
      confidence: 80,
      comments: '',
      pixel_coords: patches.map(item => ({ x: Math.round(item.x), y: Math.round(item.y) })),
      pixel_labels: labels as never,
      pixel_radii: patches.map(item => Math.round(item.r)),
    });
    onDone();
  };

  const answer = (label: string) => {
    const next = [...answers, label];
    if (next.length === patches.length) save(next);
    else setAnswers(next);
  };

  if (!patch) return null;
  const size = Math.min(IMAGE_SIZE, Math.max(200, Math.ceil(patch.r * 2.6)));
  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_23rem] md:items-start">
      <div className={`mx-auto grid w-full gap-2 md:max-w-[min(100%,calc((100svh-15rem)*1.5))] ${compareSrc ? 'grid-cols-3' : 'grid-cols-2'}`}>
        <Crop src={src} patch={patch} size={size} label="Up close" />
        {compareSrc && <Crop src={compareSrc} patch={patch} size={size} label="Same place in red (304 Å)" />}
        <Crop src={src} patch={patch} size={IMAGE_SIZE} label="Whole Sun" />
      </div>
      <div className="flex flex-col gap-3">
        {patches.length > 1 && <p className="text-haze">Patch {index + 1} of {patches.length}</p>}
        <h1 className="text-3xl font-bold" tabIndex={-1}>What is the dark patch inside the dashed line?</h1>
        {PATCH_ANSWERS.map(choice => (
          <button key={choice.label} type="button" className="choice" onClick={() => answer(choice.label)}>
            {'image' in choice && <img src={choice.image} alt="" className="h-14 w-14 shrink-0 rounded object-cover" />}
            <span className="flex flex-col">
              <span>{choice.text}</span>
              <span className="text-sm font-normal text-haze">{choice.hint}</span>
            </span>
          </button>
        ))}
        <div className="flex gap-2">
          {index > 0 && <button type="button" className="btn flex-1" onClick={() => setAnswers(answers.slice(0, -1))}>Back</button>}
          {onHelp && <button type="button" className="btn flex-1" onClick={onHelp}>Show guide</button>}
        </div>
        <button type="button" className="btn" onClick={onSkip}>Skip picture</button>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { IMAGE_SIZE, type Mark } from '@/utils/annotationLogic';

// Solar radius in browse pixels, as in the finder: its edge-flame search starts just outside it.
const LIMB = 395;

export interface FeatureChoice { label: string; text: string; hint: string }

/** One clear question per step. In 193 and 211 the same spot in 304 tells filaments (dark in both) from coronal holes. */
export function choicesFor(kind: string, mark: Pick<Mark, 'x' | 'y'>, compare: boolean): FeatureChoice[] {
  if (kind === 'aia_304') {
    const atEdge = Math.hypot(mark.x - IMAGE_SIZE / 2, mark.y - IMAGE_SIZE / 2) > LIMB;
    return atEdge
      ? [{ label: 'prominence', text: 'Glowing gas rising off the edge', hint: 'A prominence' }, { label: 'none', text: 'Nothing rises there', hint: 'Wrong outline' }]
      : [{ label: 'filament', text: 'A dark thread on the Sun', hint: 'A filament' }, { label: 'none', text: 'Nothing dark there', hint: 'Wrong outline' }];
  }
  return compare
    ? [
        { label: 'coronal_hole', text: 'Dark here, but not in red', hint: 'A coronal hole: hot gas is missing' },
        { label: 'filament', text: 'Dark here and dark in red', hint: 'A filament: a cool cloud of gas' },
        { label: 'none', text: 'Not darker than around it', hint: 'Wrong outline' },
      ]
    : [
        { label: 'coronal_hole', text: 'A wide dark area', hint: 'A coronal hole' },
        { label: 'filament', text: 'A thin dark thread', hint: 'A filament' },
        { label: 'none', text: 'Not darker than around it', hint: 'Wrong outline' },
      ];
}

function Crop({ src, mark, size, label }: { src: string; mark: Mark; size: number; label: string }) {
  const span = IMAGE_SIZE - size;
  const left = span > 0 ? Math.max(0, Math.min(span, mark.x - size / 2)) : 0;
  const top = span > 0 ? Math.max(0, Math.min(span, mark.y - size / 2)) : 0;
  const shape = mark.outline
    ? <polygon points={mark.outline.join(' ')} />
    : <circle cx={mark.x} cy={mark.y} r={mark.r} />;
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
        <svg viewBox={`${left} ${top} ${size} ${size}`} aria-hidden="true" className="absolute inset-0 h-full w-full" fill="none" vectorEffect="non-scaling-stroke">
          <g stroke="#140e22" strokeWidth={5} vectorEffect="non-scaling-stroke">{shape}</g>
          <g stroke="#56e6d4" strokeWidth={2.5} vectorEffect="non-scaling-stroke">{shape}</g>
        </svg>
      </div>
      <figcaption className="mt-1 text-center text-xs text-haze">{label}</figcaption>
    </figure>
  );
}

interface FeatureCheckProps {
  kind: string;
  src: string;
  compareSrc?: string;
  mark: Mark;
  position: number;
  total: number;
  onAnswer: (label: string) => void;
  onReshape: (whole: boolean, label: string) => void;
  onBack?: () => void;
  onHelp?: () => void;
  onSkip: () => void;
  onFinish?: () => void;
}

export default function FeatureCheck({ kind, src, compareSrc, mark, position, total, onAnswer, onReshape, onBack, onHelp, onSkip, onFinish }: FeatureCheckProps) {
  const [chosen, setChosen] = useState<FeatureChoice | null>(null);
  // Each outline is a new question, so start with its pictures in view.
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const size = Math.min(IMAGE_SIZE, Math.max(200, Math.ceil(mark.r * 2.6)));
  const choices = choicesFor(kind, mark, Boolean(compareSrc));
  // People drew their own shapes, so only suggestions are asked whether the outline fits.
  const askFit = (choice: FeatureChoice) => (choice.label !== 'none' && !mark.added ? setChosen(choice) : onAnswer(choice.label));

  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_23rem] md:items-start">
      <div className={`mx-auto grid w-full gap-2 md:max-w-[min(100%,calc((100svh-15rem)*1.5))] ${compareSrc ? 'grid-cols-3' : 'grid-cols-2'}`}>
        <Crop src={src} mark={mark} size={size} label="Up close" />
        {compareSrc && <Crop src={compareSrc} mark={mark} size={size} label="Same place in red (304 Å)" />}
        <Crop src={src} mark={mark} size={IMAGE_SIZE} label="Whole Sun" />
      </div>

      <div className="flex flex-col gap-3">
        {total > 1 && <p className="text-haze">Outline {position} of {total}</p>}
        {!chosen ? (
          <>
            <h2 className="text-2xl font-bold" tabIndex={-1}>{compareSrc ? 'Compare the two close-ups. What is inside the outline?' : 'What is inside the outline?'}</h2>
            {choices.map(choice => (
              <button key={choice.label} type="button" className="choice flex-col !items-start !gap-0" onClick={() => askFit(choice)}>
                <span>{choice.text}</span>
                <span className="text-sm font-normal text-haze">{choice.hint}</span>
              </button>
            ))}
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold" tabIndex={-1}>Does the outline fit the whole {chosen.hint.split(':')[0].replace(/^An? /, '').toLowerCase()}?</h2>
            <button type="button" className="choice" onClick={() => onAnswer(chosen.label)}>Yes, it fits</button>
            <button type="button" className="choice" onClick={() => onReshape(true, chosen.label)}>No, it covers only part of it</button>
            <button type="button" className="choice" onClick={() => onReshape(false, chosen.label)}>No, the edge is in the wrong place</button>
          </>
        )}
        <div className="flex gap-2">
          {(chosen || onBack) && <button type="button" className="btn flex-1" onClick={() => (chosen ? setChosen(null) : onBack?.())}>Back</button>}
          {onHelp && <button type="button" className="btn flex-1" onClick={onHelp}>Show guide</button>}
        </div>
        {onFinish
          ? <button type="button" className="btn" onClick={onFinish}>Finish picture</button>
          : <button type="button" className="btn" onClick={onSkip}>Skip picture</button>}
      </div>
    </div>
  );
}

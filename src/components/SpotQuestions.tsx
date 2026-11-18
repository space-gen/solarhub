import { useState } from 'react';
import type { AnswerPicture as PictureName, SolarView } from '@/data/solarViews';
import {
  IMAGE_SIZE,
  MIN_RADIUS,
  sunspotLabel,
  type Mark,
  type SpotCount,
  type SpotEdge,
} from '@/utils/annotationLogic';

type SunspotPicture = 'one' | 'many' | 'plain' | 'halo' | 'plain-group' | 'side' | 'both';

function AnswerPicture({ type, accent }: { type: SunspotPicture | PictureName; accent: string }) {
  const umbra = '#21101a';
  const penumbra = '#c8611f';
  const sunspotView = ['one', 'many', 'plain', 'halo', 'plain-group', 'side', 'both'].includes(type);
  const magnetic = ['single', 'pair', 'mixed'].includes(type);
  return (
    <svg viewBox="0 0 96 64" aria-hidden="true" className="h-14 w-20 shrink-0 rounded">
      <rect width="96" height="64" fill={magnetic ? '#777' : sunspotView ? '#ffc45e' : accent} opacity={sunspotView || magnetic ? 1 : 0.42} />
      {(type === 'one' || type === 'plain') && <circle cx="48" cy="32" r="10" fill={umbra} />}
      {type === 'many' && <><circle cx="30" cy="30" r="8" fill={umbra} /><circle cx="51" cy="36" r="5" fill={umbra} /><circle cx="68" cy="27" r="7" fill={umbra} /></>}
      {type === 'halo' && <><circle cx="48" cy="32" r="20" fill={penumbra} /><circle cx="48" cy="32" r="9" fill={umbra} /></>}
      {type === 'plain-group' && <><circle cx="32" cy="32" r="7" fill={umbra} /><circle cx="64" cy="32" r="7" fill={umbra} /></>}
      {type === 'side' && <><circle cx="30" cy="32" r="16" fill={penumbra} /><circle cx="30" cy="32" r="7" fill={umbra} /><circle cx="68" cy="32" r="7" fill={umbra} /></>}
      {type === 'both' && <><circle cx="28" cy="32" r="16" fill={penumbra} /><circle cx="68" cy="32" r="16" fill={penumbra} /><circle cx="28" cy="32" r="7" fill={umbra} /><circle cx="68" cy="32" r="7" fill={umbra} /></>}
      {type === 'single' && <ellipse cx="48" cy="32" rx="20" ry="15" fill="#000" />}
      {type === 'pair' && <><ellipse cx="30" cy="32" rx="16" ry="14" fill="#000" /><ellipse cx="66" cy="32" rx="16" ry="14" fill="#fff" /></>}
      {type === 'mixed' && <><circle cx="29" cy="24" r="9" fill="#000" /><circle cx="48" cy="26" r="10" fill="#fff" /><circle cx="67" cy="23" r="8" fill="#000" /><circle cx="34" cy="44" r="9" fill="#fff" /><circle cx="56" cy="44" r="10" fill="#000" /></>}
      {type === 'patch' && <ellipse cx="48" cy="32" rx="24" ry="16" fill="#fff" opacity="0.9" />}
      {type === 'loops' && <g fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><path d="M24 52C24 14 72 14 72 52" /><path d="M34 52C34 27 62 27 62 52" /><path d="M43 52C43 40 53 40 53 52" /></g>}
      {type === 'hole' && <path d="M26 10C42 2 55 13 53 25C51 38 74 42 67 54C56 64 34 58 37 42C39 30 15 22 26 10Z" fill="#090511" />}
      {type === 'thread' && <path d="M14 42C28 16 39 50 53 29S73 17 84 25" fill="none" stroke="#090511" strokeWidth="5" strokeLinecap="round" />}
      {type === 'flame' && <><circle cx="48" cy="84" r="46" fill="#090511" opacity="0.7" /><path d="M31 41C25 16 45 5 49 21C55 2 75 24 64 41" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" /></>}
      {type === 'web' && <g fill="none" stroke="#fff" strokeWidth="3"><path d="M18 22L35 13L52 24L70 15L82 30L69 47L50 40L32 52L16 40Z" /><path d="M35 13L32 31L52 24L50 40M32 31L16 40M32 31L32 52M69 47L70 15" /></g>}
      {type === 'flash' && <path d="M50 4L39 28L52 28L42 60L70 22L55 22L65 4Z" fill="#fff" />}
      {type === 'spot' && <circle cx="48" cy="32" r="9" fill="#090511" />}
    </svg>
  );
}

function Choice({ picture, accent, label, onClick }: { picture: SunspotPicture | PictureName; accent: string; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="choice">
      <AnswerPicture type={picture} accent={accent} />
      <span>{label}</span>
    </button>
  );
}

interface SpotQuestionsProps {
  view: SolarView;
  src: string;
  mark: Mark;
  position: number;
  total: number;
  onResize: (radius: number) => void;
  onAnswer: (label: string) => void;
  onBack: () => void;
}

export default function SpotQuestions({ view, src, mark, position, total, onResize, onAnswer, onBack }: SpotQuestionsProps) {
  const [count, setCount] = useState<SpotCount | null>(null);
  const sunspot = view.kind === 'sunspot';
  const windowSize = view.closeup;
  const maxRadius = windowSize / 2 - 6;
  const left = Math.max(0, Math.min(IMAGE_SIZE - windowSize, mark.x - windowSize / 2));
  const top = Math.max(0, Math.min(IMAGE_SIZE - windowSize, mark.y - windowSize / 2));
  const span = IMAGE_SIZE - windowSize;
  const finishSpot = (edge: SpotEdge) => onAnswer(sunspotLabel(count!, edge, mark));
  const question = !sunspot
    ? 'What is inside the ring?'
    : !count ? 'How many dark dots are in the ring?'
    : count === 'one' ? 'Is there a fuzzy orange edge around it?' : 'Where is the fuzzy orange edge?';

  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_23rem] md:items-start">
      <div>
        <div
          role="img"
          aria-label={`Close-up of area ${position}, with an adjustable ring around it`}
          className="relative mx-auto aspect-square w-full max-w-[26svh] overflow-hidden rounded-lg bg-black bg-no-repeat md:max-w-[min(100%,calc(100svh-15rem))]"
          style={{
            backgroundImage: `url("${src}")`,
            backgroundSize: `${(IMAGE_SIZE / windowSize) * 100}%`,
            backgroundPosition: `${(left / span) * 100}% ${(top / span) * 100}%`,
          }}
        >
          <svg viewBox={`${left} ${top} ${windowSize} ${windowSize}`} aria-hidden="true" className="absolute inset-0 h-full w-full">
            <circle cx={mark.x} cy={mark.y} r={mark.r} fill="none" stroke="#140e22" strokeWidth={5} vectorEffect="non-scaling-stroke" />
            <circle cx={mark.x} cy={mark.y} r={mark.r} fill="none" stroke="#56e6d4" strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
        {(!sunspot || !count) && (
          <div className="mx-auto mt-3 flex max-w-md items-center gap-2">
            <button type="button" className="btn flex-1" disabled={mark.r <= MIN_RADIUS} onClick={() => onResize(Math.max(MIN_RADIUS, mark.r - 5))}>Smaller ring</button>
            <button type="button" className="btn flex-1" disabled={mark.r >= maxRadius} onClick={() => onResize(Math.min(maxRadius, mark.r + 5))}>Bigger ring</button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {total > 1 && <p className="text-haze">Spot {position} of {total}</p>}
        <h2 className="text-2xl font-bold" tabIndex={-1}>{question}</h2>
        <div className="flex flex-col gap-2">
          {!sunspot && view.answers.map(answer => (
            <Choice key={answer.label} picture={answer.picture} accent={view.accent} label={answer.text} onClick={() => onAnswer(answer.label)} />
          ))}
          {sunspot && !count && (
            <>
              <Choice picture="one" accent={view.accent} label="One" onClick={() => setCount('one')} />
              <Choice picture="many" accent={view.accent} label="Two or more" onClick={() => setCount('many')} />
            </>
          )}
          {sunspot && count === 'one' && (
            <>
              <Choice picture="plain" accent={view.accent} label="No edge" onClick={() => finishSpot('none')} />
              <Choice picture="halo" accent={view.accent} label="Yes, an edge" onClick={() => finishSpot('around')} />
            </>
          )}
          {sunspot && count === 'many' && (
            <>
              <Choice picture="plain-group" accent={view.accent} label="No edge" onClick={() => finishSpot('none')} />
              <Choice picture="side" accent={view.accent} label="On one side" onClick={() => finishSpot('one-side')} />
              <Choice picture="both" accent={view.accent} label="On both sides" onClick={() => finishSpot('both-sides')} />
            </>
          )}
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn flex-1" onClick={() => (count ? setCount(null) : onBack())}>Back</button>
          <button type="button" className="btn flex-1" onClick={() => onAnswer('none')}>Not sure</button>
        </div>
      </div>
    </div>
  );
}

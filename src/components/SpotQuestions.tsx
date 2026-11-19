import { useRef, useState } from 'react';
import type { AnswerPicture as PictureName, SolarView, ViewAnswer } from '@/data/solarViews';
import {
  adjustedMark,
  IMAGE_SIZE,
  MIN_RADIUS,
  SECTION_COUNT,
  sunspotLabel,
  type Mark,
  type Section,
  type SpotCount,
  type SpotEdge,
} from '@/utils/annotationLogic';

const RING_STEP = 8;

type SunspotPicture = 'one' | 'many' | 'plain' | 'halo' | 'plain-group' | 'side' | 'both';

function AnswerChoice({ answer, accent, onClick }: { answer: ViewAnswer; accent: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="choice">
      {answer.image
        ? <img src={answer.image} alt="" className="h-16 w-16 shrink-0 rounded object-cover" />
        : <AnswerPicture type={answer.picture!} accent={accent} />}
      <span>{answer.text}</span>
    </button>
  );
}

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

interface SunCropProps {
  src: string;
  mark: Mark;
  center: Pick<Mark, 'x' | 'y'>;
  size: number;
  label: string;
  className?: string;
  area?: Section;
  onDrag?: (dx: number, dy: number) => void;
}

function SunCrop({ src, mark, center, size, label, className = '', area, onDrag }: SunCropProps) {
  const span = IMAGE_SIZE - size;
  const left = span > 0 ? Math.max(0, Math.min(span, center.x - size / 2)) : 0;
  const top = span > 0 ? Math.max(0, Math.min(span, center.y - size / 2)) : 0;
  const dragFrom = useRef<{ x: number; y: number } | null>(null);
  return (
    <figure className={className}>
      <div
        role="img"
        aria-label={`${label} of the marked area`}
        className={`relative aspect-square w-full overflow-hidden rounded-md bg-black bg-no-repeat ${onDrag ? 'cursor-move touch-none' : ''}`}
        onPointerDown={onDrag && (event => {
          event.currentTarget.setPointerCapture(event.pointerId);
          dragFrom.current = { x: event.clientX, y: event.clientY };
        })}
        onPointerMove={onDrag && (event => {
          if (!dragFrom.current) return;
          const scale = size / event.currentTarget.getBoundingClientRect().width;
          onDrag((event.clientX - dragFrom.current.x) * scale, (event.clientY - dragFrom.current.y) * scale);
          dragFrom.current = { x: event.clientX, y: event.clientY };
        })}
        onPointerUp={() => { dragFrom.current = null; }}
        onPointerCancel={() => { dragFrom.current = null; }}
        style={{
          backgroundImage: `url("${src}")`,
          backgroundSize: `${(IMAGE_SIZE / size) * 100}%`,
          backgroundPosition: span > 0 ? `${(left / span) * 100}% ${(top / span) * 100}%` : '0 0',
        }}
      >
        <svg viewBox={`${left} ${top} ${size} ${size}`} aria-hidden="true" className="absolute inset-0 h-full w-full">
          {area && <rect x={area.x} y={area.y} width={area.size} height={area.size} fill="none" stroke="#ffc45e" strokeWidth={2} strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />}
          {mark.outline ? (
            <>
              <polygon points={mark.outline.join(' ')} fill="none" stroke="#140e22" strokeWidth={5} vectorEffect="non-scaling-stroke" />
              <polygon points={mark.outline.join(' ')} fill="none" stroke="#56e6d4" strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
            </>
          ) : (
            <>
              <circle cx={mark.x} cy={mark.y} r={mark.r} fill="none" stroke="#140e22" strokeWidth={5} vectorEffect="non-scaling-stroke" />
              <circle cx={mark.x} cy={mark.y} r={mark.r} fill="none" stroke="#56e6d4" strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
            </>
          )}
        </svg>
      </div>
      <figcaption className="mt-1 text-center text-xs text-haze">{label}</figcaption>
    </figure>
  );
}

interface SpotQuestionsProps {
  view: SolarView;
  src: string;
  mark: Mark;
  position: number;
  total: number;
  onResize: (radius: number) => void;
  onEdit?: (next: Mark) => void;
  onDelete?: () => void;
  onRedraw?: () => void;
  onAnswer: (label: string) => void;
  onBack?: () => void;
  checking?: boolean;
  section?: Section;
  onHelp?: () => void;
  onSkip?: () => void;
  onFinish?: () => void;
}

export default function SpotQuestions({ view, src, mark, position, total, onResize, onEdit, onDelete, onRedraw, onAnswer, onBack, checking, section, onHelp, onSkip, onFinish }: SpotQuestionsProps) {
  const [count, setCount] = useState<SpotCount | null>(null);
  const [fixing, setFixing] = useState(false);
  const [origin] = useState({ x: mark.x, y: mark.y });
  const sunspot = view.kind === 'sunspot';
  const shapeName = mark.outline ? 'outline' : 'ring';
  const [windowSize] = useState(() => Math.min(480, Math.max(checking ? 180 : view.closeup, Math.ceil(mark.r * (checking ? 2.5 : 3)))));
  const maxRadius = windowSize / 2 - 6;
  const left = Math.max(0, Math.min(IMAGE_SIZE - windowSize, origin.x - windowSize / 2));
  const top = Math.max(0, Math.min(IMAGE_SIZE - windowSize, origin.y - windowSize / 2));
  const span = IMAGE_SIZE - windowSize;
  const edit = (change: Partial<Pick<Mark, 'x' | 'y' | 'r'>>) => onEdit?.(adjustedMark(mark, change, { x: left, y: top, size: windowSize }));
  const nudges: Array<[string, number, number]> = [['Left', -RING_STEP, 0], ['Up', 0, -RING_STEP], ['Down', 0, RING_STEP], ['Right', RING_STEP, 0]];
  const finishSpot = (edge: SpotEdge) => onAnswer(sunspotLabel(count!, edge, mark));
  const question = !sunspot
    ? `What is inside the ${shapeName}?`
    : !count ? 'How many dark dots are in the ring?'
    : count === 'one' ? 'Is there a fuzzy orange edge around it?' : 'Where is the fuzzy orange edge?';

  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_23rem] md:items-start">
      {checking ? (
        <div className="mx-auto w-full md:max-w-[min(100%,calc((100svh-15rem)*1.5))]">
          <div className={`grid gap-2 ${fixing ? 'grid-cols-2' : 'grid-cols-3'}`}>
            <SunCrop
              src={src}
              mark={mark}
              center={origin}
              size={windowSize}
              label="Up close"
              className={fixing ? 'col-span-2 md:row-span-2' : 'md:col-span-2 md:row-span-2'}
              onDrag={fixing ? (dx, dy) => edit({ x: mark.x + dx, y: mark.y + dy }) : undefined}
            />
            {section
              ? <SunCrop src={src} mark={mark} center={{ x: section.x + section.size / 2, y: section.y + section.size / 2 }} size={section.size} label={`Your part (${section.index + 1} of ${SECTION_COUNT})`} />
              : <SunCrop src={src} mark={mark} center={origin} size={Math.min(IMAGE_SIZE, windowSize * 2)} label="Around it" />}
            <SunCrop src={src} mark={mark} center={origin} size={IMAGE_SIZE} label="Whole Sun" area={section} />
          </div>
          {onEdit && (
            <div className="mt-2">
              <button type="button" className="btn w-full" aria-expanded={fixing} onClick={() => setFixing(!fixing)}>
                {fixing ? `Done fixing the ${shapeName}` : `Fix the ${shapeName}`}
              </button>
              {fixing && (
                <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {onRedraw && <button type="button" className="btn col-span-3 sm:col-span-6" onClick={onRedraw}>Redraw the edge</button>}
                  {nudges.map(([name, dx, dy]) => (
                    <button key={name} type="button" className="btn" aria-label={`Move ${shapeName} ${name.toLowerCase()}`} onClick={() => edit({ x: mark.x + dx, y: mark.y + dy })}>{name}</button>
                  ))}
                  <button type="button" className="btn" disabled={mark.r <= MIN_RADIUS} onClick={() => edit({ r: mark.r - RING_STEP })}>Smaller</button>
                  <button type="button" className="btn" disabled={mark.r >= maxRadius} onClick={() => edit({ r: mark.r + RING_STEP })}>Bigger</button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : <div>
        <div
          role="img"
          aria-label={`Close-up of area ${position}, with an adjustable ring around it`}
          className="relative mx-auto aspect-square w-full max-w-[24svh] overflow-hidden rounded-lg bg-black bg-no-repeat md:max-w-[min(100%,calc(100svh-15rem))]"
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
      </div>}

      <div className="flex flex-col gap-3">
        {total > 1 && <p className="text-haze">{checking ? 'Feature' : 'Spot'} {position} of {total}</p>}
        <h2 className="text-2xl font-bold" tabIndex={-1}>{question}</h2>
        <div className="flex flex-col gap-2">
          {!sunspot && view.answers.map(answer => (
            <AnswerChoice key={answer.label} answer={answer} accent={view.accent} onClick={() => onAnswer(answer.label)} />
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
          {(count || onBack) && <button type="button" className="btn flex-1" onClick={() => (count ? setCount(null) : onBack?.())}>Back</button>}
          <button type="button" className="btn flex-1" onClick={() => onAnswer('none')}>{checking ? 'None of these' : 'Not sure'}</button>
        </div>
        {onDelete && <button type="button" className="btn" onClick={onDelete}>Delete wrong {shapeName}</button>}
        {(onHelp || onSkip || onFinish) && (
          <div className="flex gap-2">
            {onHelp && <button type="button" className="btn flex-1" onClick={onHelp}>Show guide</button>}
            {onFinish
              ? <button type="button" className="btn flex-1" onClick={onFinish}>Finish picture</button>
              : onSkip && <button type="button" className="btn flex-1" onClick={onSkip}>Skip picture</button>}
          </div>
        )}
      </div>
    </div>
  );
}

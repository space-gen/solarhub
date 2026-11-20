import { useEffect, useRef, useState } from 'react';
import type { AuroraTask } from '@/services/auroraService';
import { saveAnnotation } from '@/services/submissionQueue';
import { IMAGE_SIZE } from '@/utils/annotationLogic';

/**
 * Eruption job, after Solar Jet Hunter: a 3-hour 304 movie of one quarter of the Sun, a yes/no screen first,
 * and only after "yes" a second step for where and when it started. No detector chooses what is shown, so
 * the answers also give the "nothing erupted" cases that catalogues never record.
 */
const QUARTER = IMAGE_SIZE / 2;
const QUARTERS = [
  { name: 'top left', x: 0, y: 0 },
  { name: 'top right', x: QUARTER, y: 0 },
  { name: 'bottom left', x: 0, y: QUARTER },
  { name: 'bottom right', x: QUARTER, y: QUARTER },
];
const FRAME_MS = 300;
const MARK_RADIUS = 40;

const clock = (url: string) => {
  const stamp = url.split('/').pop()!.slice(9, 15);
  return `${stamp.slice(0, 2)}:${stamp.slice(2, 4)} UT`;
};

export const onsetOf = (url: string) => {
  const name = url.split('/').pop()!;
  return `${name.slice(0, 4)}-${name.slice(4, 6)}-${name.slice(6, 8)}T${name.slice(9, 11)}:${name.slice(11, 13)}:${name.slice(13, 15)}Z`;
};

interface Answer { label: 'eruption' | 'no_eruption' | 'unclear'; x: number; y: number; r: number; onset?: string }

interface EruptionTaskProps { task: AuroraTask; frames: string[]; onDone: () => void; onSkip: () => void; onHelp?: () => void }

export default function EruptionTask({ task, frames, onDone, onSkip, onHelp }: EruptionTaskProps) {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [marking, setMarking] = useState(false);
  const [spot, setSpot] = useState<{ x: number; y: number } | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const quarter = QUARTERS[answers.length];

  useEffect(() => {
    if (!playing || frames.length < 2) return;
    const timer = window.setInterval(() => setFrame(value => (value + 1) % frames.length), FRAME_MS);
    return () => window.clearInterval(timer);
  }, [playing, frames.length]);

  useEffect(() => { window.scrollTo(0, 0); }, [answers.length]);

  const record = (answer: Answer) => {
    const next = [...answers, answer];
    setMarking(false);
    setSpot(null);
    setPlaying(true);
    setFrame(0);
    if (next.length < QUARTERS.length) {
      setAnswers(next);
      return;
    }
    const rings = next.map(item => ({ action: 'added', label: item.label, finder: null, ring: [item.x, item.y, item.r], ...(item.onset ? { onset: item.onset } : {}) }));
    saveAnnotation({
      review: { v: 1, part: 1, parts: 1, rings } as never,
      task_id: task.id,
      serial_number: task.serialNumber,
      image_url: task.url,
      task_type: task.taskType,
      user_label: (next.some(item => item.label === 'eruption') ? 'eruption' : 'no_eruption') as never,
      confidence: 80,
      comments: '',
      pixel_coords: next.map(item => ({ x: item.x, y: item.y })),
      pixel_labels: next.map(item => item.label) as never,
      pixel_radii: next.map(item => item.r),
    });
    onDone();
  };

  if (!quarter) return null;
  const whole = { x: quarter.x + QUARTER / 2, y: quarter.y + QUARTER / 2, r: QUARTER / 2 };

  const tap = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!marking) return;
    const rect = stage.current!.getBoundingClientRect();
    setSpot({
      x: Math.round(quarter.x + ((event.clientX - rect.left) / rect.width) * QUARTER),
      y: Math.round(quarter.y + ((event.clientY - rect.top) / rect.height) * QUARTER),
    });
  };

  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_23rem] md:items-start">
      <figure className="mx-auto w-full max-w-[min(100%,calc(100svh-15rem))]">
        <div
          ref={stage}
          role="img"
          aria-label={`Movie of the ${quarter.name} quarter of the Sun in 304 Å, frame ${frame + 1} of ${frames.length}, ${clock(frames[frame])}`}
          onPointerDown={tap}
          className={`relative aspect-square w-full overflow-hidden rounded-lg bg-black bg-no-repeat ${marking ? 'cursor-crosshair' : ''}`}
          style={{ backgroundImage: `url("${frames[frame]}")`, backgroundSize: '200%', backgroundPosition: `${quarter.x ? 100 : 0}% ${quarter.y ? 100 : 0}%` }}
        >
          {spot && (
            <svg viewBox={`${quarter.x} ${quarter.y} ${QUARTER} ${QUARTER}`} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full">
              <circle cx={spot.x} cy={spot.y} r={MARK_RADIUS / 2} fill="none" stroke="#ffc45e" strokeWidth={3} vectorEffect="non-scaling-stroke" />
            </svg>
          )}
          <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-1 text-sm font-semibold">{clock(frames[frame])}</span>
        </div>
        {/* Loads every frame early, so the movie plays smoothly. */}
        {frames.map(url => <img key={url} src={url} alt="" hidden />)}
        <figcaption className="mt-2 flex items-center gap-2">
          <button type="button" className="btn" aria-pressed={!playing} onClick={() => setPlaying(!playing)}>{playing ? 'Pause' : 'Play'}</button>
          <label className="flex flex-1 items-center gap-2">
            <span className="sr-only">Frame</span>
            <input type="range" min={0} max={frames.length - 1} value={frame} className="w-full accent-sun" onChange={event => { setPlaying(false); setFrame(Number(event.target.value)); }} />
          </label>
        </figcaption>
      </figure>

      <div className="flex flex-col gap-3">
        <p className="text-haze">Quarter {answers.length + 1} of 4 · {frames.length} frames over 3 hours</p>
        {!marking ? (
          <>
            <h1 className="text-3xl font-bold" tabIndex={-1}>Does any material lift off and leave the Sun?</h1>
            <p className="text-lg text-haze">Watch the whole movie. Look for a glowing arch or a dark thread that rises and does not fall back.</p>
            <button type="button" className="choice" onClick={() => { setMarking(true); setPlaying(false); }}>Yes, something lifts off</button>
            <button type="button" className="choice" onClick={() => record({ label: 'no_eruption', ...whole })}>No, nothing leaves</button>
            <button type="button" className="choice" onClick={() => record({ label: 'unclear', ...whole })}>Can't tell</button>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold" tabIndex={-1}>Where and when did it start?</h1>
            <p className="text-lg text-haze">Move the slider to the first frame where it starts to rise, then tap where it was.</p>
            <button
              type="button"
              className="btn btn-primary big"
              disabled={!spot}
              onClick={() => spot && record({ label: 'eruption', x: spot.x, y: spot.y, r: MARK_RADIUS, onset: onsetOf(frames[frame]) })}
            >
              Save this eruption
            </button>
            <button type="button" className="btn" onClick={() => { setMarking(false); setSpot(null); setPlaying(true); }}>Back</button>
          </>
        )}
        <div className="flex gap-2">
          {onHelp && <button type="button" className="btn flex-1" onClick={onHelp}>Show guide</button>}
          <button type="button" className="btn flex-1" onClick={onSkip}>Skip movie</button>
        </div>
      </div>
    </div>
  );
}

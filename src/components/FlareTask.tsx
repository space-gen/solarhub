import { useEffect, useState } from 'react';
import type { AuroraTask } from '@/services/auroraService';
import { saveAnnotation } from '@/services/submissionQueue';
import { IMAGE_SIZE } from '@/utils/annotationLogic';

const BLINK_MS = 700;
const MARK_RADIUS = 30;

interface FlareTaskProps {
  task: AuroraTask;
  onDone: () => void;
  onSkip: () => void;
}

function peakText(task: AuroraTask) {
  const flare = task.flare;
  if (!flare) return '';
  const peak = new Date(flare.peak);
  return `${flare.goes_class} flare, peak ${peak.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })} UTC`;
}

export default function FlareTask({ task, onDone, onSkip }: FlareTaskProps) {
  const [showBefore, setShowBefore] = useState(false);
  const [blinking, setBlinking] = useState(false);
  const [marking, setMarking] = useState(false);
  const regions = task.candidates ?? [];

  useEffect(() => {
    if (!blinking) return;
    const timer = window.setInterval(() => setShowBefore(value => !value), BLINK_MS);
    return () => window.clearInterval(timer);
  }, [blinking]);

  const save = (label: string, x = 0, y = 0, r = 0) => {
    saveAnnotation({
      task_id: task.id,
      serial_number: task.serialNumber,
      image_url: task.url,
      task_type: 'flare_source',
      user_label: label as never,
      confidence: 80,
      comments: '',
      pixel_coords: [{ x: Math.round(x), y: Math.round(y) }],
      pixel_labels: [label as never],
      pixel_radii: [r],
    });
    onDone();
  };

  const markAt = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!marking) return;
    const rect = event.currentTarget.getBoundingClientRect();
    save('unnumbered_region', ((event.clientX - rect.left) / rect.width) * IMAGE_SIZE, ((event.clientY - rect.top) / rect.height) * IMAGE_SIZE, MARK_RADIUS);
  };

  const source = showBefore && task.beforeUrl ? task.beforeUrl : task.url;
  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_23rem] md:items-start">
      <figure className="mx-auto w-full max-w-[min(100%,calc(100svh-15rem))]">
        <div
          role={marking ? 'button' : 'img'}
          tabIndex={marking ? 0 : undefined}
          aria-label={marking ? 'Tap where the flare is' : `The Sun ${showBefore ? 'before' : 'at the peak of'} the flare, with numbered regions`}
          onClick={markAt}
          className={`relative aspect-square w-full overflow-hidden rounded-lg bg-black ${marking ? 'cursor-crosshair' : ''}`}
        >
          <img src={source} alt="" className="h-full w-full" />
          <svg viewBox={`0 0 ${IMAGE_SIZE} ${IMAGE_SIZE}`} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full">
            {regions.map(region => (
              <g key={region.noaa}>
                <circle cx={region.x} cy={region.y} r={region.r} fill="none" stroke="#140e22" strokeWidth={6} />
                <circle cx={region.x} cy={region.y} r={region.r} fill="none" stroke="#ffc45e" strokeWidth={3} />
                <text x={region.x + region.r * 0.75} y={region.y - region.r * 0.85} fill="#ffc45e" stroke="#140e22" strokeWidth={4} paintOrder="stroke" fontSize={30} fontWeight={700}>{region.noaa}</text>
              </g>
            ))}
          </svg>
          <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-1 text-sm font-semibold">{showBefore ? 'Before' : 'Flare peak'}</span>
        </div>
        <figcaption className="mt-2 flex gap-2">
          <button type="button" className="btn flex-1" aria-pressed={showBefore} disabled={blinking} onClick={() => setShowBefore(!showBefore)}>
            {showBefore ? 'Show flare peak' : 'Show before'}
          </button>
          <button type="button" className="btn flex-1" aria-pressed={blinking} onClick={() => { setBlinking(!blinking); setShowBefore(false); }}>
            {blinking ? 'Stop flipping' : 'Flip between them'}
          </button>
        </figcaption>
      </figure>

      <div className="flex flex-col gap-3">
        <p className="text-haze">{peakText(task)}</p>
        <h1 className="text-3xl font-bold" tabIndex={-1}>{marking ? 'Tap where the flare is' : 'Which region made this flare?'}</h1>
        <p className="text-lg text-haze">
          {marking
            ? 'Tap the spot that got brighter at the peak.'
            : 'A flare is a sudden flash. Compare the two pictures and choose the region that got much brighter.'}
        </p>
        {marking ? (
          <button type="button" className="btn" onClick={() => setMarking(false)}>Back</button>
        ) : (
          <>
            {regions.map(region => (
              <button key={region.noaa} type="button" className="choice" onClick={() => save(`noaa_${region.noaa}`, region.x, region.y, region.r)}>
                <span aria-hidden="true" className="grid h-12 w-12 shrink-0 place-items-center rounded-full border-[3px] border-[#ffc45e] text-xs font-bold">{String(region.noaa).slice(-3)}</span>
                <span>Region {region.noaa}</span>
              </button>
            ))}
            <button type="button" className="btn" onClick={() => setMarking(true)}>Somewhere without a number</button>
            <button type="button" className="btn" onClick={() => save('behind_limb')}>Just behind the edge of the Sun</button>
            <button type="button" className="btn" onClick={() => save('no_flare_visible')}>I can't see a flare</button>
            <button type="button" className="btn" onClick={onSkip}>Skip this flare</button>
          </>
        )}
      </div>
    </div>
  );
}

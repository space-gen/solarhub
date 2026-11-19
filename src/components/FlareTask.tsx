import { useEffect, useState } from 'react';
import type { AuroraTask } from '@/services/auroraService';
import { saveAnnotation } from '@/services/submissionQueue';
import { IMAGE_SIZE } from '@/utils/annotationLogic';

const BLINK_MS = 700;
const FLASH_RING = 22;
const NEAR_LIMB = 360;

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

function Crop({ src, box, label, children }: { src: string; box: { x: number; y: number; size: number }; label: string; children?: React.ReactNode }) {
  const span = IMAGE_SIZE - box.size;
  return (
    <div
      role="img"
      aria-label={label}
      className="relative aspect-square w-full overflow-hidden rounded-lg bg-black bg-no-repeat"
      style={{
        backgroundImage: `url("${src}")`,
        backgroundSize: `${(IMAGE_SIZE / box.size) * 100}%`,
        backgroundPosition: span > 0 ? `${(box.x / span) * 100}% ${(box.y / span) * 100}%` : '0 0',
      }}
    >
      <svg viewBox={`${box.x} ${box.y} ${box.size} ${box.size}`} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full">{children}</svg>
    </div>
  );
}

export default function FlareTask({ task, onDone, onSkip }: FlareTaskProps) {
  const [showBefore, setShowBefore] = useState(false);
  const [blinking, setBlinking] = useState(false);
  const view = task.view ?? { x: 0, y: 0, size: IMAGE_SIZE };
  const flash = task.flash;
  const margin = 20;
  const nearby = (task.candidates ?? []).filter(region => region.x > view.x - margin && region.x < view.x + view.size + margin && region.y > view.y - margin && region.y < view.y + view.size + margin);
  const atLimb = flash ? Math.hypot(flash.x - IMAGE_SIZE / 2, flash.y - IMAGE_SIZE / 2) > NEAR_LIMB : false;

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

  const source = showBefore && task.beforeUrl ? task.beforeUrl : task.url;
  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_23rem] md:items-start">
      <figure className="mx-auto w-full max-w-[min(100%,calc(100svh-15rem))]">
        <div className="relative">
          <Crop src={source} box={view} label={`Close-up ${showBefore ? 'before' : 'at the peak of'} the flare. The white ring marks what brightened.`}>
            {nearby.map(region => (
              <g key={region.noaa}>
                <circle cx={region.x} cy={region.y} r={region.r} fill="none" stroke="#140e22" strokeWidth={5} vectorEffect="non-scaling-stroke" />
                <circle cx={region.x} cy={region.y} r={region.r} fill="none" stroke="#ffc45e" strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
                <text x={region.x + region.r * 0.7} y={region.y - region.r * 0.8} fill="#ffc45e" stroke="#140e22" strokeWidth={3} paintOrder="stroke" fontSize={view.size / 30} fontWeight={700}>{region.noaa}</text>
              </g>
            ))}
            {flash && <circle cx={flash.x} cy={flash.y} r={FLASH_RING} fill="none" stroke="#ffffff" strokeWidth={2} strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />}
          </Crop>
          <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-1 text-sm font-semibold">{showBefore ? 'Before' : 'Flare peak'}</span>
          {/* Loads the other frame early, so flipping does not show a black square. */}
          {task.beforeUrl && <img src={task.beforeUrl} alt="" hidden />}
          <div className="absolute bottom-2 right-2 w-1/4 overflow-hidden rounded border border-white/40" aria-hidden="true">
            <Crop src={task.url} box={{ x: 0, y: 0, size: IMAGE_SIZE }} label="">
              <rect x={view.x} y={view.y} width={view.size} height={view.size} fill="none" stroke="#ffc45e" strokeWidth={2} vectorEffect="non-scaling-stroke" />
            </Crop>
          </div>
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
        <h1 className="text-3xl font-bold" tabIndex={-1}>Which region is the flash in?</h1>
        <p className="text-lg text-haze">The dashed white ring marks the spot that got brighter. Flip between the pictures, then choose the numbered region it belongs to.</p>
        {nearby.map(region => (
          <button key={region.noaa} type="button" className="choice" onClick={() => save(`noaa_${region.noaa}`, flash?.x ?? region.x, flash?.y ?? region.y, region.r)}>
            <span aria-hidden="true" className="grid h-12 w-12 shrink-0 place-items-center rounded-full border-[3px] border-[#ffc45e] text-xs font-bold">{String(region.noaa).slice(-3)}</span>
            <span>Region {region.noaa}</span>
          </button>
        ))}
        <button type="button" className="btn" onClick={() => save('unnumbered_region', flash?.x, flash?.y, FLASH_RING)}>It is outside every numbered region</button>
        {atLimb && <button type="button" className="btn" onClick={() => save('behind_limb')}>It comes from just behind the edge</button>}
        <button type="button" className="btn" onClick={() => save('no_flare_visible')}>Nothing flashed in the ring</button>
        <button type="button" className="btn" onClick={onSkip}>Skip this flare</button>
      </div>
    </div>
  );
}

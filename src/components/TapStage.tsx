import { useEffect, useRef, useState } from 'react';
import { IMAGE_SIZE, type Mark } from '@/utils/annotationLogic';

const LOUPE_SIZE = 132;
const LOUPE_ZOOM = 5;

interface Probe {
  x: number;
  y: number;
  pressed: boolean;
}

interface TapStageProps {
  src: string;
  alt: string;
  instruction: string;
  marks: Mark[];
  onTap: (x: number, y: number) => void;
  onError: () => void;
}

export default function TapStage({ src, alt, instruction, marks, onTap, onError }: TapStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const keyboardPoint = useRef({ x: IMAGE_SIZE / 2, y: IMAGE_SIZE / 2 });
  // A ref, because a fast tap can end before React renders the press.
  const pressedRef = useRef(false);
  const [width, setWidth] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [probe, setProbe] = useState<Probe | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  const pointFrom = (event: React.PointerEvent) => {
    const rect = stageRef.current!.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * IMAGE_SIZE;
    const y = ((event.clientY - rect.top) / rect.height) * IMAGE_SIZE;
    return x >= 0 && y >= 0 && x <= IMAGE_SIZE && y <= IMAGE_SIZE ? { x, y } : null;
  };

  const handleKey = (event: React.KeyboardEvent) => {
    const step = event.shiftKey ? 40 : 8;
    const moves: Record<string, [number, number]> = {
      ArrowUp: [0, -step], ArrowDown: [0, step], ArrowLeft: [-step, 0], ArrowRight: [step, 0],
    };
    const point = keyboardPoint.current;
    if (moves[event.key]) {
      event.preventDefault();
      point.x = Math.min(IMAGE_SIZE, Math.max(0, point.x + moves[event.key][0]));
      point.y = Math.min(IMAGE_SIZE, Math.max(0, point.y + moves[event.key][1]));
      setProbe({ ...point, pressed: false });
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setProbe({ ...point, pressed: false });
      onTap(point.x, point.y);
    }
  };

  const scale = width ? IMAGE_SIZE / width : 1;
  const probeX = probe ? (probe.x / IMAGE_SIZE) * width : 0;
  const probeY = probe ? (probe.y / IMAGE_SIZE) * width : 0;
  const loupeAbove = probeY > LOUPE_SIZE + 44;

  return (
    <div
      ref={stageRef}
      role="application"
      tabIndex={0}
      aria-label={`${instruction}. Use the arrow keys to move the magnifier and Enter to mark or unmark.`}
      onKeyDown={handleKey}
      onFocus={event => {
        if (event.currentTarget.matches(':focus-visible')) setProbe({ ...keyboardPoint.current, pressed: false });
      }}
      onBlur={() => setProbe(null)}
      onPointerDown={event => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        const point = pointFrom(event);
        if (!point) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        pressedRef.current = true;
        setProbe({ ...point, pressed: true });
      }}
      onPointerMove={event => {
        if (event.pointerType !== 'mouse' && !pressedRef.current) return;
        const point = pointFrom(event);
        setProbe(point ? { ...point, pressed: pressedRef.current } : null);
      }}
      onPointerUp={event => {
        const point = pointFrom(event);
        if (pressedRef.current && point) onTap(point.x, point.y);
        pressedRef.current = false;
        setProbe(event.pointerType === 'mouse' && point ? { ...point, pressed: false } : null);
      }}
      onPointerCancel={() => {
        pressedRef.current = false;
        setProbe(null);
      }}
      onPointerLeave={event => {
        if (event.pointerType === 'mouse' && !pressedRef.current) setProbe(null);
      }}
      onContextMenu={event => event.preventDefault()}
      className="relative aspect-square w-full cursor-crosshair touch-none select-none overflow-hidden rounded-lg bg-black"
    >
      {!loaded && <p className="absolute inset-0 grid place-items-center text-haze">Loading the Sun…</p>}
      <img
        src={src}
        alt={alt}
        draggable={false}
        onLoad={() => setLoaded(true)}
        onError={onError}
        className={`h-full w-full ${loaded ? '' : 'opacity-0'}`}
      />

      <svg viewBox={`0 0 ${IMAGE_SIZE} ${IMAGE_SIZE}`} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full">
        {marks.map((mark, index) => {
          const radius = Math.max(mark.r, 13 * scale);
          return (
            <g key={`${mark.x}-${mark.y}`}>
              <circle cx={mark.x} cy={mark.y} r={radius} fill="none" stroke="#140e22" strokeWidth={5} vectorEffect="non-scaling-stroke" />
              <circle cx={mark.x} cy={mark.y} r={radius} fill="none" stroke="#56e6d4" strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
              <circle cx={mark.x + radius * 0.72} cy={mark.y - radius * 0.72} r={10 * scale} fill="#56e6d4" stroke="#140e22" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
              <text x={mark.x + radius * 0.72} y={mark.y - radius * 0.72} fontSize={13 * scale} fontWeight={700} fill="#140e22" textAnchor="middle" dominantBaseline="central">
                {index + 1}
              </text>
            </g>
          );
        })}
      </svg>

      {probe && loaded && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-full border-4 border-limb shadow-[0_0_0_2px_#140e22]"
          style={{
            width: LOUPE_SIZE,
            height: LOUPE_SIZE,
            left: Math.min(width - LOUPE_SIZE, Math.max(0, probeX - LOUPE_SIZE / 2)),
            top: loupeAbove ? probeY - LOUPE_SIZE - 36 : probeY + 36,
            backgroundImage: `url("${src}")`,
            backgroundSize: `${width * LOUPE_ZOOM}px`,
            backgroundPosition: `${LOUPE_SIZE / 2 - probeX * LOUPE_ZOOM}px ${LOUPE_SIZE / 2 - probeY * LOUPE_ZOOM}px`,
          }}
        >
          <span className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-corona shadow-[0_0_0_1px_#140e22]" />
        </div>
      )}
    </div>
  );
}

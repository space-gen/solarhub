import { useRef, useState } from 'react';
import { IMAGE_SIZE, type Mark, type Section } from '@/utils/annotationLogic';
import type { Point } from '@/utils/outline';

const TAP_DISTANCE = 16;
const KEY_STEP = 8;

interface SectionEditorProps {
  src: string;
  section: Section;
  marks: Mark[];
  label: string;
  onDraw: (points: Point[]) => void;
  onTap: (x: number, y: number) => void;
  active?: number;
}

const asPath = (points: Point[]) => points.map(([x, y]) => `${x},${y}`).join(' ');

export default function SectionEditor({ src, section, marks, label, onDraw, onTap, active }: SectionEditorProps) {
  const stage = useRef<HTMLDivElement>(null);
  const drawing = useRef(false);
  const [stroke, setStroke] = useState<Point[]>([]);
  const [cursor, setCursor] = useState<Point | null>(null);
  const span = IMAGE_SIZE - section.size;

  const pointFrom = (event: React.PointerEvent): Point => {
    const rect = stage.current!.getBoundingClientRect();
    const clamp = (value: number) => Math.max(0, Math.min(1, value));
    return [
      section.x + clamp((event.clientX - rect.left) / rect.width) * section.size,
      section.y + clamp((event.clientY - rect.top) / rect.height) * section.size,
    ];
  };

  const finish = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const length = stroke.slice(1).reduce((sum, point, index) => sum + Math.hypot(point[0] - stroke[index][0], point[1] - stroke[index][1]), 0);
    if (stroke.length && length < TAP_DISTANCE) onTap(stroke[0][0], stroke[0][1]);
    else if (stroke.length >= 3) onDraw(stroke);
    setStroke([]);
  };

  const handleKey = (event: React.KeyboardEvent) => {
    const moves: Record<string, Point> = { ArrowUp: [0, -KEY_STEP], ArrowDown: [0, KEY_STEP], ArrowLeft: [-KEY_STEP, 0], ArrowRight: [KEY_STEP, 0] };
    const here: Point = cursor ?? [section.x + section.size / 2, section.y + section.size / 2];
    if (moves[event.key]) {
      event.preventDefault();
      setCursor([
        Math.max(section.x, Math.min(section.x + section.size, here[0] + moves[event.key][0])),
        Math.max(section.y, Math.min(section.y + section.size, here[1] + moves[event.key][1])),
      ]);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setCursor(here);
      onTap(here[0], here[1]);
    }
  };

  return (
    <div
      ref={stage}
      role="application"
      tabIndex={0}
      aria-label={`${label} Draw around a feature, or use the arrow keys and Enter to mark it.`}
      onKeyDown={handleKey}
      onBlur={() => setCursor(null)}
      onPointerDown={event => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        drawing.current = true;
        setStroke([pointFrom(event)]);
      }}
      onPointerMove={event => {
        if (drawing.current) {
          const point = pointFrom(event);
          setStroke(current => [...current, point]);
        }
      }}
      onPointerUp={finish}
      onPointerCancel={() => { drawing.current = false; setStroke([]); }}
      className="relative aspect-square w-full cursor-crosshair touch-none select-none overflow-hidden rounded-lg bg-black bg-no-repeat"
      style={{
        backgroundImage: `url("${src}")`,
        backgroundSize: `${(IMAGE_SIZE / section.size) * 100}%`,
        backgroundPosition: span > 0 ? `${(section.x / span) * 100}% ${(section.y / span) * 100}%` : '0 0',
      }}
    >
      <svg viewBox={`${section.x} ${section.y} ${section.size} ${section.size}`} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full">
        {marks.map((mark, index) => {
          // Rejected suggestions are gone as far as the person is concerned.
          if (mark.deleted || mark.merged || mark.label === 'none') return null;
          const shape = { fill: 'none', vectorEffect: 'non-scaling-stroke' as const };
          const colour = mark.added || index === active ? '#ffc45e' : '#56e6d4';
          return (
            <g key={index}>
              {mark.outline
                ? <><polygon points={asPath(mark.outline)} {...shape} stroke="#140e22" strokeWidth={5} /><polygon points={asPath(mark.outline)} {...shape} stroke={colour} strokeWidth={2.5} /></>
                : <><circle cx={mark.x} cy={mark.y} r={mark.r} {...shape} stroke="#140e22" strokeWidth={5} /><circle cx={mark.x} cy={mark.y} r={mark.r} {...shape} stroke={colour} strokeWidth={2.5} /></>}
            </g>
          );
        })}
        {stroke.length > 1 && <polyline points={asPath(stroke)} fill="none" stroke="#ffc45e" strokeWidth={2.5} strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />}
        {cursor && <circle cx={cursor[0]} cy={cursor[1]} r={10} fill="none" stroke="#ffc45e" strokeWidth={2.5} vectorEffect="non-scaling-stroke" />}
      </svg>
    </div>
  );
}

const RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

export function SunLogo() {
  return (
    <span className="relative flex h-8 w-8 shrink-0 items-center justify-center" aria-hidden="true">
      <svg viewBox="0 0 40 40" className="brand-rays absolute inset-0 h-full w-full">
        {RAY_ANGLES.map(angle => (
          <line key={angle} x1="20" y1="4" x2="20" y2="8" stroke="#f97316" strokeWidth="2" strokeLinecap="round" transform={`rotate(${angle} 20 20)`} opacity="0.8" />
        ))}
      </svg>
      <span className="brand-core z-10 h-5 w-5 rounded-full" />
    </span>
  );
}

export function SpaceGenMark({ className = 'h-4 w-4' }: { className?: string }) {
  return <img src="/spacegen.svg" alt="" className={`inline-block ${className}`} />;
}

import { lazy, Suspense, type ComponentType } from 'react';

interface SceneProps {
  paused?: boolean;
  onFrontChange?: (index: number) => void;
  onUnavailable?: () => void;
}

// Three.js loads only on pages that show the carousel.
const SolarScene = lazy<ComponentType<SceneProps>>(() =>
  import('@/components/SolarScene').catch(() => ({ default: () => null })),
);

export default function LazySolarScene(props: SceneProps) {
  return (
    <Suspense fallback={null}>
      <SolarScene {...props} />
    </Suspense>
  );
}

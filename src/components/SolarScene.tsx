import { useEffect, useRef } from 'react';
import {
  Group,
  LinearFilter,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  TextureLoader,
  WebGLRenderer,
  type Texture,
} from 'three';
import { liveImage, SOLAR_VIEWS } from '@/data/solarViews';

interface SolarSceneProps {
  paused?: boolean;
  onFrontChange?: (index: number) => void;
  onUnavailable?: () => void;
}

const VERTEX = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
// The circular mask removes NASA's corner captions and square image edges.
const FRAGMENT = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float radius = length(vUv - 0.5);
    float mask = 1.0 - smoothstep(0.445, 0.475, radius);
    vec4 color = texture2D(uMap, vUv);
    // Keep the solar disk solid, but let black sky show the other Suns behind it.
    float disk = 1.0 - smoothstep(0.37, 0.385, radius);
    float glow = smoothstep(0.025, 0.16, max(color.r, max(color.g, color.b)));
    gl_FragColor = vec4(color.rgb, mask * max(disk, glow) * uOpacity);
  }
`;

export default function SolarScene({ paused = false, onFrontChange, onUnavailable }: SolarSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);
  const syncLoopRef = useRef<() => void>(() => {});
  const callbacks = useRef({ onFrontChange, onUnavailable });
  callbacks.current = { onFrontChange, onUnavailable };

  useEffect(() => {
    pausedRef.current = paused;
    syncLoopRef.current();
  }, [paused]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // Each mount gets its own canvas, so renderers never share WebGL state.
    const canvas = document.createElement('canvas');
    canvas.className = 'h-full w-full';
    host.appendChild(canvas);
    let disposed = false;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch {
      canvas.remove();
      callbacks.current.onUnavailable?.();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));

    const scene = new Scene();
    const camera = new PerspectiveCamera(32, 1, 0.1, 30);
    camera.position.z = 7.5;
    const rig = new Group();
    scene.add(rig);

    const geometry = new PlaneGeometry(1, 1);
    const loader = new TextureLoader();
    const textures: Texture[] = [];
    const materials: ShaderMaterial[] = [];
    let angle = 0;
    let frontIndex = -1;
    let failures = 0;

    const render = () => {
      let bestDepth = -2;
      let nextFront = 0;
      rig.children.forEach((child, index) => {
        const mesh = child as Mesh<PlaneGeometry, ShaderMaterial>;
        const a = angle + (index / SOLAR_VIEWS.length) * Math.PI * 2;
        const depth = Math.cos(a);
        const nearness = (depth + 1) / 2;
        mesh.position.set(Math.sin(a) * 1.62, -depth * 0.5 + 0.08, depth * 1.35);
        mesh.scale.setScalar(0.82 + nearness * nearness * 1.28);
        mesh.material.uniforms.uOpacity.value = mesh.userData.loaded ? 0.5 + nearness * 0.5 : 0;
        if (depth > bestDepth) {
          bestDepth = depth;
          nextFront = index;
        }
      });
      if (nextFront !== frontIndex) {
        frontIndex = nextFront;
        callbacks.current.onFrontChange?.(nextFront);
      }
      renderer.render(scene, camera);
    };

    SOLAR_VIEWS.forEach(view => {
      const material = new ShaderMaterial({
        uniforms: { uMap: { value: null }, uOpacity: { value: 0 } },
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        transparent: true,
        depthWrite: false,
      });
      materials.push(material);
      const mesh = new Mesh(geometry, material);
      rig.add(mesh);
      loader.load(
        liveImage(view.code),
        texture => {
          if (disposed) {
            texture.dispose();
            return;
          }
          // Left untagged so the shader passes NASA's sRGB pixels straight to the canvas.
          texture.generateMipmaps = false;
          texture.minFilter = LinearFilter;
          textures.push(texture);
          material.uniforms.uMap.value = texture;
          mesh.userData.loaded = true;
          render();
        },
        undefined,
        () => {
          failures += 1;
          if (!disposed && failures === SOLAR_VIEWS.length) callbacks.current.onUnavailable?.();
        },
      );
    });

    const resize = () => {
      const { clientWidth: width, clientHeight: height } = canvas;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      rig.scale.setScalar(Math.min(1, camera.aspect));
      render();
    };

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let last = 0;
    let visible = true;

    const tick = (time: number) => {
      angle -= Math.min((time - last) / 1000, 0.05) * 0.16;
      last = time;
      render();
      frame = requestAnimationFrame(tick);
    };
    const syncLoop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      if (visible && !document.hidden && !pausedRef.current && !reducedMotion.matches) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };
    syncLoopRef.current = syncLoop;

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncLoop();
    });
    observer.observe(canvas);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    document.addEventListener('visibilitychange', syncLoop);
    reducedMotion.addEventListener('change', syncLoop);
    resize();
    syncLoop();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', syncLoop);
      reducedMotion.removeEventListener('change', syncLoop);
      syncLoopRef.current = () => {};
      geometry.dispose();
      materials.forEach(material => material.dispose());
      textures.forEach(texture => texture.dispose());
      renderer.dispose();
      canvas.remove();
    };
  }, []);

  return <div ref={hostRef} aria-hidden="true" className="absolute inset-0" />;
}

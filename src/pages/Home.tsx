import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { SpaceGenMark } from '@/components/BrandLogo';
import LazySolarScene from '@/components/LazySolarScene';
import { liveImage, SOLAR_VIEWS } from '@/data/solarViews';

const STEPS = [
  ['Pick a Sun', 'Each color shows a different layer of the Sun.'],
  ['Tap what you find', 'A magnifier helps you land on small features.'],
  ['Answer with pictures', 'Choose what looks closest. We handle the science label.'],
];

export default function Home() {
  const [paused, setPaused] = useState(false);
  const [front, setFront] = useState(0);
  const [sceneMissing, setSceneMissing] = useState(false);
  const stepsRef = useRef<HTMLHeadingElement>(null);
  const view = SOLAR_VIEWS[front];

  return (
    <>
      <section className="overflow-hidden">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] gap-5 px-4 py-8 sm:px-6 md:min-h-[calc(100svh-4.5rem)] md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:grid-rows-[1fr_1fr]">
          <div className="md:self-end">
            <h1 className="flex flex-col">
              <span className="gradient-text text-[clamp(4rem,8.2vw,7.25rem)] font-bold leading-none tracking-tight">SolarHub</span>
              <span className="mt-3 inline-flex flex-wrap items-center gap-x-2 text-xs font-semibold uppercase tracking-[0.16em] text-haze sm:text-sm">
                A community project by <span className="inline-flex items-center gap-1"><SpaceGenMark className="h-5 w-5" /> SpaceGen</span>
              </span>
            </h1>
          </div>

          <div className="md:col-start-2 md:row-span-2 md:row-start-1 md:self-center">
            <div className="relative mx-auto aspect-square w-full max-w-[min(100%,calc(100svh-11rem))]">
              {sceneMissing ? (
                <img src={liveImage(view.code)} alt="Latest image of the Sun from NASA's Solar Dynamics Observatory" className="absolute inset-[8%] h-[84%] w-[84%] rounded-full object-cover" />
              ) : (
                <LazySolarScene paused={paused} onFrontChange={setFront} onUnavailable={() => setSceneMissing(true)} />
              )}
            </div>
            <div className="mx-auto mt-2 flex max-w-xl flex-wrap items-center justify-center gap-3">
              <Link to={`/classify/${view.kind}`} className="btn">
                <span className="h-3 w-3 rounded-full" style={{ background: view.accent }} aria-hidden="true" />
                Classify {view.name}: {view.detail}
              </Link>
              <button type="button" className="btn motion-reduce:hidden" onClick={() => setPaused(value => !value)}>
                {paused ? 'Play' : 'Pause'} the Suns
              </button>
            </div>
          </div>

          <div className="flex flex-col items-start gap-5 md:self-start">
            <p className="measure text-xl">
              A citizen-science initiative founded by <strong>Soumyadip Karforma</strong>. Help classify real solar observations
              from NASA’s SDO to build open-source ML datasets.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/classify" className="btn btn-primary big">Start classifying</Link>
              <Link to="/funding" className="btn big">Fund or donate</Link>
              <button type="button" className="btn big" onClick={() => { stepsRef.current?.scrollIntoView(); stepsRef.current?.focus(); }}>
                How it works
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-hairline">
        <div className="page">
          <h2 ref={stepsRef} tabIndex={-1} className="scroll-mt-20 text-4xl font-bold md:text-5xl">Three steps. No science degree.</h2>
          <ol className="mt-8 grid gap-8 md:grid-cols-3">
            {STEPS.map(([title, text], index) => (
              <li key={title} className="border-t-2 border-sun pt-4">
                <span className="text-4xl font-bold text-sun">{index + 1}</span>
                <h3 className="mt-2 text-xl font-bold">{title}</h3>
                <p className="mt-1 text-haze">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-hairline bg-panel">
        <div className="page grid items-center gap-8 md:grid-cols-[16rem_1fr]">
          <img src="/images/soumyadipkarforma.png" alt="Soumyadip Karforma" className="aspect-square w-48 rounded-lg object-cover md:w-64" />
          <div className="flex flex-col items-start gap-4">
            <h2 className="text-4xl font-bold">Meet <span className="gradient-text">Soumyadip Karforma</span></h2>
            <p className="measure text-lg text-haze">
              Founder of SpaceGen, building open tools and machine-learning datasets for space science.
            </p>
            <div className="flex flex-wrap gap-3">
              <a className="btn" href="https://space-gen.github.io" target="_blank" rel="noopener noreferrer">Organization website</a>
              <a className="btn" href="https://huggingface.co/SpaceGen" target="_blank" rel="noopener noreferrer">Hugging Face</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

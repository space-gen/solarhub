import { liveImage, type SolarView } from '@/data/solarViews';

export default function ChannelGuide({ view, onDone }: { view: SolarView; onDone: () => void }) {
  return (
    <section aria-labelledby="channel-guide" className="mx-auto max-w-4xl py-2">
      <div className="flex items-center gap-4">
        <img src={liveImage(view.code)} alt="" className="h-20 w-20 rounded-full object-cover" />
        <div>
          <h1 id="channel-guide" tabIndex={-1} className="text-3xl font-bold">How to read {view.name}</h1>
          <p className="text-haze">{view.detail}</p>
        </div>
      </div>
      <p className="measure mt-4 text-lg">{view.learn}</p>
      <p className="mt-2 text-haze">We circle one thing at a time. Check the close-up, wider view and whole Sun, then pick the closest real example.</p>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {view.answers.map(answer => (
          <li key={answer.label} className="overflow-hidden rounded-md border border-hairline bg-panel">
            <img src={answer.image} alt={`Real solar example: ${answer.text.toLowerCase()}`} loading="lazy" className="aspect-square w-full object-cover" />
            <div className="p-3">
              <h2 className="font-bold">{answer.text}</h2>
              <p className="mt-1 text-sm text-haze">{answer.look}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-haze">Example images: NASA/SDO and the AIA science team.</p>
      <button type="button" className="btn btn-primary big mt-4 w-full sm:w-auto" onClick={onDone}>Start {view.name}</button>
    </section>
  );
}

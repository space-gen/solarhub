import { useState } from 'react';
import { Link } from 'react-router-dom';

const EMAIL = 'soumyadipkarforma02@gmail.com';

const PRODUCTS = [
  {
    id: 'dark-patches',
    title: 'Coronal hole or filament channel',
    image: '/images/aia-examples/0193-coronal_hole.jpg',
    source: 'SDO/AIA 193 Å and 211 Å, with 304 Å for comparison; one picture a day',
    what: 'For each dark patch catalogued by SPoCA or AAFDCC, or found by our detector, several people say whether it is a coronal hole, a filament channel, something else, or unclear. Automatic detectors still confuse the two.',
    uses: ['Clean coronal hole samples for solar wind forecasting', 'Labels for coronal hole and filament channel classifiers', 'A check on catalogue detections, patch by patch'],
  },
  {
    id: 'eruptions',
    title: 'Prominence and filament eruptions',
    image: '/images/aia-examples/0304-prominence.jpg',
    source: 'SDO/AIA 304 Å, 3-hour movies of each quarter of the Sun, every frame',
    what: 'Whether material lifts off and leaves the Sun, where and when it started, and the many movies where nothing erupted. The main expert catalogue of AIA filament eruptions ends in 2014; this covers 2016 to 2026.',
    uses: ['Eruption rates and early warning of coronal mass ejections', 'Eruptions and non-eruptions for training models', 'Matching against coronal mass ejection catalogues'],
  },
  {
    id: 'flares',
    title: 'Which region produced a flare',
    image: '/images/aia-examples/0131-bright_region.jpg',
    source: 'GOES flares with SDO/AIA 131 and 94 Å',
    what: 'For C, M and X flares that NOAA left without an active region, the region volunteers saw brighten. Hidden check flares with a known region measure how often volunteers are right.',
    uses: ['Fill gaps in flare catalogues', 'Region-level labels for flare forecasting', 'Compare with SolarSoft Latest Events'],
  },
];

const FIELDS = [
  ['Votes, not just answers', 'Every answer count, the share who agreed, and items still unclear after many answers, so you can choose your own threshold.'],
  ['Shape and position', 'Catalogue outlines as pixel masks readable with pycocotools, with helioprojective and Stonyhurst coordinates.'],
  ['Time and geometry', 'Observation time, plate scale, solar radius, B0 angle and Carrington longitude for every image.'],
  ['Measured accuracy', 'Hidden check items with known answers, reported in each dataset card.'],
  ['Contributors', 'Stable anonymous IDs in the data. The people behind them are credited separately.'],
  ['Splits', 'Train, validation and test sets by year, so long-lived coronal holes never appear in two sets.'],
];

const DATASETS = ['Coronal hole or filament channel (193 Å)', 'Coronal hole or filament channel (211 Å)', 'Eruptions (304 Å)', 'Flare source regions'];

function requestEmail(form: { name: string; institution: string; huggingface: string; datasets: string[]; use: string }) {
  const body = [
    `Name: ${form.name}`,
    `Institution: ${form.institution}`,
    `Hugging Face username: ${form.huggingface}`,
    `Datasets: ${form.datasets.join(', ') || 'Not sure yet'}`,
    '',
    'What I would like to use the data for:',
    form.use,
  ].join('\n');
  return `mailto:${EMAIL}?subject=${encodeURIComponent('SolarHub data request')}&body=${encodeURIComponent(body)}`;
}

export default function Data() {
  const [form, setForm] = useState({ name: '', institution: '', huggingface: '', datasets: [] as string[], use: '' });
  const ready = form.name.trim() && form.use.trim();
  const toggle = (dataset: string) =>
    setForm(current => ({ ...current, datasets: current.datasets.includes(dataset) ? current.datasets.filter(item => item !== dataset) : [...current.datasets, dataset] }));

  return (
    <div className="page">
      <h1 className="max-w-4xl text-5xl font-bold md:text-7xl">Data for <span className="gradient-text">solar research</span></h1>
      <p className="measure mt-4 text-lg text-haze">
        Volunteers answer short, focused questions about NASA Solar Dynamics Observatory images from October 2016 to November 2026.
        Each item is seen by several people, and every answer is checked before it is kept.
      </p>

      <h2 className="mt-14 text-3xl font-bold">What the data can produce</h2>
      <ul className="mt-6 grid gap-6 md:grid-cols-2">
        {PRODUCTS.map(product => (
          <li key={product.id} className="flex gap-4 border-t border-edge pt-4">
            <img src={product.image} alt="" className="h-24 w-24 shrink-0 rounded-md object-cover" />
            <div>
              <h3 className="text-xl font-bold">{product.title}</h3>
              <p className="text-sm text-haze">{product.source}</p>
              <p className="mt-2">{product.what}</p>
              <ul className="mt-2 list-disc pl-5 text-haze">
                {product.uses.map(use => <li key={use}>{use}</li>)}
              </ul>
            </div>
          </li>
        ))}
      </ul>

      <h2 className="mt-14 text-3xl font-bold">What each record contains</h2>
      <dl className="mt-6 grid gap-6 md:grid-cols-2">
        {FIELDS.map(([title, text]) => (
          <div key={title} className="border-t border-edge pt-4">
            <dt className="font-bold">{title}</dt>
            <dd className="mt-1 text-haze">{text}</dd>
          </div>
        ))}
      </dl>
      <p className="measure mt-6 text-haze">
        Files are JSON Lines, grouped by month of observation, with a dataset card describing every column. The full schema is in the{' '}
        <a className="link" href="https://github.com/space-gen/aurora/blob/main/docs/docs/hf_dataset_schema.md" target="_blank" rel="noopener noreferrer">Aurora documentation</a>.
      </p>

      <h2 className="mt-14 text-3xl font-bold">Where it stands</h2>
      <p className="measure mt-4 text-haze">
        The project is young. The datasets are private while they grow and while we check their quality, and many features so far have
        only one annotator. Each request gets an honest summary of how much data exists for what you need.
      </p>

      <section aria-labelledby="request" className="mt-14 max-w-2xl">
        <h2 id="request" className="text-3xl font-bold">Request access</h2>
        <p className="mt-4 text-haze">
          Tell us who you are and what you need. We grant read access on Hugging Face. If the data you need is
          not collected yet, say so: we shape the tasks around what researchers will use.
        </p>
        <form
          className="mt-6 grid gap-4"
          onSubmit={event => {
            event.preventDefault();
            if (ready) window.location.href = requestEmail(form);
          }}
        >
          <label>
            <span className="mb-1 block font-semibold">Your name</span>
            <input className="field" required autoComplete="name" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} />
          </label>
          <label>
            <span className="mb-1 block font-semibold">Institution or project</span>
            <input className="field" autoComplete="organization" value={form.institution} onChange={event => setForm({ ...form, institution: event.target.value })} />
          </label>
          <label>
            <span className="mb-1 block font-semibold">Hugging Face username</span>
            <span className="mb-1 block text-sm text-haze">Access is given to this account.</span>
            <input className="field" autoComplete="off" value={form.huggingface} onChange={event => setForm({ ...form, huggingface: event.target.value })} />
          </label>
          <fieldset>
            <legend className="mb-1 font-semibold">Datasets</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {DATASETS.map(dataset => (
                <label key={dataset} className="flex min-h-11 items-center gap-3">
                  <input type="checkbox" className="h-5 w-5 accent-sun" checked={form.datasets.includes(dataset)} onChange={() => toggle(dataset)} />
                  {dataset}
                </label>
              ))}
            </div>
          </fieldset>
          <label>
            <span className="mb-1 block font-semibold">What you will use it for</span>
            <textarea className="field min-h-32" required value={form.use} onChange={event => setForm({ ...form, use: event.target.value })} />
          </label>
          <div>
            <button className="btn btn-primary big" disabled={!ready}>Write the request email</button>
            <p className="mt-2 text-sm text-haze">
              This opens your email app with the request filled in; nothing is sent until you send it. Or write to{' '}
              <a className="link" href={`mailto:${EMAIL}`}>{EMAIL}</a>.
            </p>
          </div>
        </form>
      </section>

      <h2 className="mt-14 text-3xl font-bold">Using the data</h2>
      <p className="measure mt-4 text-haze">
        The datasets are released under CC BY 4.0. Please cite SolarHub and the SpaceGen volunteers. Want to add to it instead?{' '}
        <Link className="link" to="/classify">Start marking</Link>.
      </p>
    </div>
  );
}

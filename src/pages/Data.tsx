import { useState } from 'react';
import { Link } from 'react-router-dom';

const EMAIL = 'soumyadipkarforma02@gmail.com';

const PRODUCTS = [
  {
    id: 'coronal-holes',
    title: 'Coronal hole boundaries',
    image: '/images/aia-examples/0193-coronal_hole.jpg',
    source: 'SDO/AIA 193 Å and 211 Å',
    what: 'The outline of each coronal hole as a pixel mask, with its area, position in solar coordinates and Carrington rotation.',
    uses: ['Train and test coronal hole segmentation models', 'Inputs for solar wind and high-speed stream forecasts', 'Check automatic detectors against human boundaries'],
  },
  {
    id: 'filaments',
    title: 'Filaments in EUV',
    image: '/images/aia-examples/0193-filament.jpg',
    source: 'SDO/AIA 193, 211 and 304 Å',
    what: 'Hand-drawn outlines of dark filaments on the disk. NASA’s event catalogue (HEK) has no filament records since 2023.',
    uses: ['Track filaments before they erupt', 'Study eruptions that lead to coronal mass ejections', 'Labels for filament detectors in EUV, not only H-alpha'],
  },
  {
    id: 'prominences',
    title: 'Prominences at the limb',
    image: '/images/aia-examples/0304-prominence.jpg',
    source: 'SDO/AIA 304 Å',
    what: 'Outlines of prominences above the solar edge, drawn on the original images rather than on enhanced colour maps.',
    uses: ['Prominence size and height over time', 'Link prominences seen at the limb to filaments seen on the disk'],
  },
  {
    id: 'flares',
    title: 'Which region produced a flare',
    image: '/images/aia-examples/0131-bright_region.jpg',
    source: 'GOES flares with SDO/AIA 131 and 94 Å',
    what: 'For C, M and X flares that NOAA left without an active region, the region volunteers saw brighten, with the flash position and how well people agreed.',
    uses: ['Fill gaps in flare catalogues', 'Region-level labels for flare forecasting', 'Compare with SolarSoft Latest Events'],
  },
];

const FIELDS = [
  ['Shape', 'Pixel mask in COCO run-length encoding, readable with pycocotools, plus bounding box and centroid.'],
  ['Position', 'Helioprojective and Stonyhurst coordinates, distance from disk centre, area in millionths of a hemisphere.'],
  ['Time and geometry', 'Observation time, plate scale, solar radius, B0 angle and Carrington longitude for every image.'],
  ['Agreement', 'How many people answered, the share who agreed on the class, and how closely their shapes overlap.'],
  ['Credit', 'GitHub usernames of the people behind each feature, so their work can be acknowledged.'],
  ['Splits', 'Train, validation and test sets by Carrington rotation, so nearby days never leak between sets.'],
];

const DATASETS = ['Coronal holes and filaments (193 Å)', 'Coronal holes and filaments (211 Å)', 'Filaments and prominences (304 Å)', 'Flare source regions'];

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
        Volunteers outline features on NASA Solar Dynamics Observatory images from October 2016 to November 2026, every frame, so each
        feature can be followed as it changes. Every answer is checked before it is kept.
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
        Please cite SolarHub and the SpaceGen volunteers, and keep the licence stated on each dataset card. Want to add to it instead?{' '}
        <Link className="link" to="/classify">Start marking</Link>.
      </p>
    </div>
  );
}

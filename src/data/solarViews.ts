import type { MarkKind } from '@/utils/annotationLogic';

export interface ViewAnswer {
  label: string;
  text: string;
  look: string;
  image: string;
}

export interface SolarView {
  kind: MarkKind;
  code: string;
  name: string;
  detail: string;
  /** What the view shows, for the guide. */
  learn?: string;
  /** What the person does, in one sentence, for the guide. */
  howTo?: string;
  accent: string;
  /** Field guide examples. */
  answers: ViewAnswer[];
}

const EXAMPLES = '/images/aia-examples';

function patchView(wavelength: 193 | 211, name: string, detail: string, heat: string, accent: string): SolarView {
  const code = `0${wavelength}`;
  return {
    kind: `aia_${wavelength}`, code, name, detail, accent,
    learn: `${name} shows gas near ${heat}. Coronal holes look dark because this hot gas is missing. Filament channels look dark because a cool cloud of gas lies along them. Computers still mix the two up.`,
    howTo: 'You see one dark patch at a time, with the same spot in red beside it, and say what it is. Filament channels stay dark in red; coronal holes mostly do not.',
    answers: [
      { label: 'coronal_hole', text: 'Coronal hole', look: 'A wide dark area that is not dark in red.', image: `${EXAMPLES}/${code}-coronal_hole.jpg` },
      { label: 'filament_channel', text: 'Filament channel', look: 'A dark lane, often long and thin, that is also dark in red.', image: `${EXAMPLES}/${code}-filament.jpg` },
    ],
  };
}

export const SOLAR_VIEWS: SolarView[] = [
  patchView(193, 'Bronze', 'AIA 193 Å, corona', '1 million °C', '#c98b52'),
  patchView(211, 'Purple', 'AIA 211 Å, active corona', '2 million °C', '#c47bb5'),
  {
    kind: 'aia_304', code: '0304', name: 'Red', detail: 'AIA 304 Å, eruptions', accent: '#f0523d',
    learn: 'Red shows cooler gas near 50,000 °C. Prominences are clouds of this gas held above the Sun by magnetic fields. Sometimes one lifts off and leaves, often launching a cloud of gas into space.',
    howTo: 'You watch a 3-hour movie of one quarter of the Sun and say whether any material lifts off and leaves. If it does, you mark where and when it started.',
    answers: [
      { label: 'eruption', text: 'Lifts off', look: 'Glowing or dark material rises and does not fall back.', image: `${EXAMPLES}/0304-prominence.jpg` },
      { label: 'no_eruption', text: 'Stays put', look: 'Prominences sway and drain but stay attached to the Sun.', image: `${EXAMPLES}/0304-filament.jpg` },
    ],
  },
  { kind: 'flare_source', code: '0131', name: 'Flares', detail: 'Which region flared?', accent: '#ff6b3d', answers: [] },
];

export const liveImage = (code: string) => `/api/sdo/latest/${code}.jpg`;

export function viewFor(kind: string | undefined) {
  return SOLAR_VIEWS.find(view => view.kind === kind);
}

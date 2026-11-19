import type { MarkKind } from '@/utils/annotationLogic';

export type AnswerPicture = 'single' | 'pair' | 'mixed';

export interface ViewAnswer {
  label: string;
  text: string;
  look?: string;
  picture?: AnswerPicture;
  image?: string;
}

export interface SolarView {
  kind: MarkKind;
  code: string;
  name: string;
  detail: string;
  learn?: string;
  prompt: string;
  none: string;
  thing: string;
  radius: number;
  closeup: number;
  accent: string;
  answers: ViewAnswer[];
}

const FEATURES: Record<string, Pick<ViewAnswer, 'text' | 'look'>> = {
  bright_region: { text: 'A bright glowing patch', look: 'A soft, bright cloud with no clear curved lines.' },
  coronal_loops: { text: 'Bright curved loops', look: 'Thin arches you could trace with your finger.' },
  coronal_hole: { text: 'A big dark area', look: 'A wide black region with few bright details inside.' },
  filament: { text: 'A thin dark line', look: 'A narrow dark thread, like a crack across the Sun.' },
  prominence: { text: 'A flame at the edge', look: 'A bright shape rising from the edge into black space.' },
  plage: { text: 'A bright patchy web', look: 'A cluster of pale, net-like patches.' },
  flare_ribbon: { text: 'A very bright flash', look: 'Small white streaks much brighter than everything nearby.' },
  sunspot: { text: 'A small dark spot', look: 'A compact dark dot beside the bright web.' },
  part_of_larger: { text: 'Only part of something bigger', look: 'The mark covers only a piece. You will trace the whole thing next.' },
};

function aia(
  wavelength: number,
  name: string,
  detail: string,
  learn: string,
  accent: string,
  prompt: string,
  none: string,
  thing: string,
  labels: string[],
  radius = 60,
  closeup = 320,
): SolarView {
  const code = String(wavelength).padStart(4, '0');
  return {
    kind: `aia_${wavelength}` as MarkKind,
    code, name, detail, learn, accent, prompt, none, thing, radius, closeup,
    answers: [...labels, 'part_of_larger'].map(label => ({ label, ...FEATURES[label], image: `/images/aia-examples/${code}-${label}.jpg` })),
  };
}

const HOT = ['bright_region', 'coronal_loops'];
const DARK = ['coronal_hole', 'filament'];
const glowPrompt = 'Tap each bright glowing patch';
const noGlow = 'I see no bright patches';
const darkPrompt = 'Tap each very dark area';
const noDark = 'I see no dark areas';
const webPrompt = 'Tap each bright patchy web';
const noWeb = 'I see no bright webs';

export const SOLAR_VIEWS: SolarView[] = [
  {
    kind: 'sunspot', code: 'HMIIC', name: 'Sun spots', detail: 'Visible surface', accent: '#ff9f2e',
    prompt: 'Tap each dark spot', none: 'I see no spots', thing: 'dark spot', radius: 24, closeup: 200, answers: [],
  },
  {
    kind: 'magnetogram', code: 'HMIB', name: 'Magnets', detail: 'Magnetic field', accent: '#c9c9c9',
    prompt: 'Tap each big black or white patch', none: 'I see no big patches', thing: 'big patch', radius: 60, closeup: 320,
    answers: [
      { label: 'alpha', text: 'Only one colour', picture: 'single' },
      { label: 'beta', text: 'Black on one side, white on the other', picture: 'pair' },
      { label: 'beta-gamma', text: 'Black and white all mixed up', picture: 'mixed' },
    ],
  },
  aia(171, 'Gold', 'AIA 171 Å, quiet corona', 'Gold shows gas near 600,000 °C. It is the best view for seeing magnetic loops.', '#e8b02e', 'Tap each bright area with loops', 'I see no bright loops', 'bright area', HOT),
  aia(193, 'Bronze', 'AIA 193 Å, corona', 'Bronze shows gas near 1 million °C. Very dark regions often mean this hot gas is missing.', '#c98b52', darkPrompt, noDark, 'dark area', DARK, 90, 480),
  aia(211, 'Purple', 'AIA 211 Å, active corona', 'Purple shows gas near 2 million °C. Look past the soft swirls for the darkest shapes.', '#c47bb5', darkPrompt, noDark, 'dark area', DARK, 90, 480),
  aia(304, 'Red', 'AIA 304 Å, lower atmosphere', 'Red shows cooler gas near 50,000 °C, close to the Sun’s surface.', '#f0523d', 'Tap each dark thread or flame on the edge', 'I see no threads or flames', 'thread or flame', ['filament', 'prominence', 'bright_region']),
  aia(94, 'Green', 'AIA 94 Å, flare heat', 'Green highlights very hot gas near 6 million °C.', '#6fd13f', glowPrompt, noGlow, 'bright patch', HOT),
  aia(131, 'Teal', 'AIA 131 Å, flare heat', 'Teal can reveal the hottest flare gas, near 10 million °C.', '#2fc7c7', glowPrompt, noGlow, 'bright patch', HOT),
  aia(335, 'Blue', 'AIA 335 Å, active regions', 'Blue shows active regions near 2.5 million °C.', '#5f9df0', glowPrompt, noGlow, 'bright patch', HOT),
  aia(1600, 'Olive', 'AIA 1600 Å, upper surface', 'Olive shows the layer just above the surface. The whole Sun looks grainy, so focus on what is inside the ring.', '#c4c25a', webPrompt, noWeb, 'bright web', ['plage', 'flare_ribbon', 'sunspot']),
  aia(1700, 'Rose', 'AIA 1700 Å, surface glow', 'Rose shows the Sun’s lower atmosphere. Bright webs often surround dark sunspots.', '#d99a9a', webPrompt, noWeb, 'bright web', ['plage', 'sunspot']),
  {
    kind: 'flare_source', code: '0131', name: 'Flares', detail: 'Which region flared?', accent: '#ff6b3d',
    prompt: 'Find the region that flared', none: "I can't see a flare", thing: 'flare', radius: 40, closeup: 320, answers: [],
  },
];

export const liveImage = (code: string) => `/api/sdo/latest/${code}.jpg`;

export function viewFor(kind: string | undefined) {
  return SOLAR_VIEWS.find(view => view.kind === kind);
}

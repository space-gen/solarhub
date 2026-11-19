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
  /** What to draw in the final step, when people add what the finder missed. */
  missed?: string;
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

const DARK = ['coronal_hole', 'filament'];
const darkPrompt = 'Tap each very dark area';
const noDark = 'I see no dark areas';

export const SOLAR_VIEWS: SolarView[] = [
  {
    ...aia(193, 'Bronze', 'AIA 193 Å, corona', 'Bronze shows gas near 1 million °C. Coronal holes are wide dark areas where this hot gas is missing. Filaments are thin dark threads.', '#c98b52', darkPrompt, noDark, 'dark area', DARK, 90, 480),
    missed: 'Draw around any filament or coronal hole we missed',
  },
  {
    ...aia(211, 'Purple', 'AIA 211 Å, active corona', 'Purple shows gas near 2 million °C. Look past the soft swirls for wide dark holes and thin dark threads.', '#c47bb5', darkPrompt, noDark, 'dark area', DARK, 90, 480),
    missed: 'Draw around any filament or coronal hole we missed',
  },
  {
    ...aia(304, 'Red', 'AIA 304 Å, lower atmosphere', 'Red shows cooler gas near 50,000 °C. Filaments are thin dark threads on the Sun. Prominences are flames rising above its edge.', '#f0523d', 'Tap each dark thread or flame on the edge', 'I see no threads or flames', 'thread or flame', ['filament', 'prominence']),
    missed: 'Draw around any dark thread or edge flame we missed',
  },
  {
    kind: 'flare_source', code: '0131', name: 'Flares', detail: 'Which region flared?', accent: '#ff6b3d',
    prompt: 'Find the region that flared', none: "I can't see a flare", thing: 'flare', radius: 40, closeup: 320, answers: [],
  },
];

export const liveImage = (code: string) => `/api/sdo/latest/${code}.jpg`;

export function viewFor(kind: string | undefined) {
  return SOLAR_VIEWS.find(view => view.kind === kind);
}

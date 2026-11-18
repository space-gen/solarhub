import type { MarkKind } from '@/utils/annotationLogic';

export type AnswerPicture =
  | 'single' | 'pair' | 'mixed' | 'patch' | 'loops' | 'hole' | 'thread' | 'flame' | 'web' | 'flash' | 'spot';

export interface ViewAnswer {
  label: string;
  text: string;
  picture: AnswerPicture;
}

export interface SolarView {
  kind: MarkKind;
  code: string;
  name: string;
  detail: string;
  prompt: string;
  none: string;
  thing: string;
  radius: number;
  closeup: number;
  accent: string;
  answers: ViewAnswer[];
}

const hotAnswers: ViewAnswer[] = [
  { label: 'bright_region', text: 'A bright glowing patch', picture: 'patch' },
  { label: 'coronal_loops', text: 'Bright curved loops', picture: 'loops' },
];
const darkAnswers: ViewAnswer[] = [
  { label: 'coronal_hole', text: 'A big dark area', picture: 'hole' },
  { label: 'filament', text: 'A thin dark line', picture: 'thread' },
];
const webAnswers: ViewAnswer[] = [
  { label: 'plage', text: 'A bright patchy web', picture: 'web' },
  { label: 'flare_ribbon', text: 'A very bright flash', picture: 'flash' },
  { label: 'sunspot', text: 'A small dark spot', picture: 'spot' },
];

function aia(
  wavelength: number,
  name: string,
  detail: string,
  accent: string,
  prompt: string,
  none: string,
  thing: string,
  answers: ViewAnswer[],
  radius = 60,
  closeup = 320,
): SolarView {
  return {
    kind: `aia_${wavelength}` as MarkKind,
    code: String(wavelength).padStart(4, '0'),
    name, detail, accent, prompt, none, thing, answers, radius, closeup,
  };
}

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
  aia(171, 'Gold', 'AIA 171 Å, quiet corona', '#e8b02e', 'Tap each bright area with loops', 'I see no bright loops', 'bright area', hotAnswers),
  aia(193, 'Bronze', 'AIA 193 Å, corona', '#c98b52', darkPrompt, noDark, 'dark area', darkAnswers, 90, 480),
  aia(211, 'Purple', 'AIA 211 Å, active corona', '#c47bb5', darkPrompt, noDark, 'dark area', darkAnswers, 90, 480),
  aia(304, 'Red', 'AIA 304 Å, lower atmosphere', '#f0523d', 'Tap each dark thread or flame on the edge', 'I see no threads or flames', 'thread or flame', [
    { label: 'filament', text: 'A dark thread', picture: 'thread' },
    { label: 'prominence', text: 'A flame at the edge', picture: 'flame' },
    { label: 'bright_region', text: 'A bright patch', picture: 'patch' },
  ]),
  aia(94, 'Green', 'AIA 94 Å, flare heat', '#6fd13f', glowPrompt, noGlow, 'bright patch', hotAnswers),
  aia(131, 'Teal', 'AIA 131 Å, flare heat', '#2fc7c7', glowPrompt, noGlow, 'bright patch', hotAnswers),
  aia(335, 'Blue', 'AIA 335 Å, active regions', '#5f9df0', glowPrompt, noGlow, 'bright patch', hotAnswers),
  aia(1600, 'Olive', 'AIA 1600 Å, upper surface', '#c4c25a', webPrompt, noWeb, 'bright web', webAnswers),
  aia(1700, 'Rose', 'AIA 1700 Å, surface glow', '#d99a9a', webPrompt, noWeb, 'bright web', webAnswers),
];

export const liveImage = (code: string) => `/api/sdo/latest/${code}.jpg`;

export function viewFor(kind: string | undefined) {
  return SOLAR_VIEWS.find(view => view.kind === kind);
}

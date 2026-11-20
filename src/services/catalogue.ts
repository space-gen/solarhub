/**
 * Suggestions from NASA's Heliophysics Events Knowledgebase: coronal holes found by SPoCA, and filaments.
 * On random archive days only 46% of the pixel finder's proposals matched a catalogued feature, and it missed
 * 30% of SPoCA's coronal holes, so the catalogue is used for 193 and 211 whenever it answers.
 */
import { circleAround, simplifyOutline, type Point } from '../utils/outline.ts';

// SDO browse images: 1024 pixels, 2.4 arcseconds each, disk centre at the image centre.
const ARCSEC_PER_PIXEL = 2.4;
const CENTRE = 511.5;
const MIN_AREA = 300;

export interface CatalogueEvent { type: 'CH' | 'FI'; catalogue: string; start: string; polygon: string }
export interface CatalogueCandidate { x: number; y: number; r: number; outline: Point[]; catalogue: string; expected: 'coronal_hole' | 'filament' }

export function polygonPixels(text: string): Point[] | null {
  const pairs = [...text.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)];
  if (pairs.length < 3) return null;
  return pairs.map(([, x, y]) => [CENTRE + Number(x) / ARCSEC_PER_PIXEL, CENTRE - Number(y) / ARCSEC_PER_PIXEL]);
}

const area = (points: Point[]) => Math.abs(points.reduce((sum, [x, y], i) => {
  const [nx, ny] = points[(i + 1) % points.length];
  return sum + x * ny - nx * y;
}, 0)) / 2;

/** SPoCA reports every hole again every few hours, so only the run nearest the picture is kept. */
// shortcut: no differential rotation between the catalogue run and the picture (under 2 hours, about 10 pixels at disk centre); rotate if runs get sparser.
export function catalogueCandidates(events: CatalogueEvent[], moment: Date): CatalogueCandidate[] | null {
  const runs = [...new Set(events.filter(event => event.type === 'CH').map(event => event.start))];
  // SPoCA reports holes in every run; no run at all means the catalogue has not reached this hour yet.
  if (!runs.length) return null;
  const distance = (start: string) => Math.abs(Date.parse(`${start}Z`) - moment.getTime());
  const nearest = runs.sort((a, b) => distance(a) - distance(b))[0];
  const found: CatalogueCandidate[] = [];
  for (const event of events) {
    if (event.type === 'CH' && event.start !== nearest) continue;
    const points = polygonPixels(event.polygon);
    if (!points || area(points) < MIN_AREA) continue;
    const outline = simplifyOutline(points);
    found.push({ ...circleAround(outline), outline, catalogue: event.catalogue, expected: event.type === 'CH' ? 'coronal_hole' : 'filament' });
  }
  return found;
}

/** Catalogued dark features near the picture's time, or null when the catalogue cannot be reached. */
export async function fetchCatalogue(moment: Date): Promise<CatalogueCandidate[] | null> {
  try {
    const response = await fetch(`/api/hek/dark/${moment.toISOString().slice(0, 13)}.json`);
    if (!response.ok) return null;
    const events: unknown = await response.json();
    return Array.isArray(events) ? catalogueCandidates(events as CatalogueEvent[], moment) : null;
  } catch {
    return null;
  }
}

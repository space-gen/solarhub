import assert from 'node:assert/strict';
import { test } from 'node:test';
import { catalogueCandidates, polygonPixels, type CatalogueEvent } from '../src/services/catalogue.ts';

const square = (x: number, y: number, half: number) =>
  `POLYGON((${x - half} ${y - half},${x + half} ${y - half},${x + half} ${y + half},${x - half} ${y + half},${x - half} ${y - half}))`;

test('arcseconds become browse pixels, north up', () => {
  assert.deepEqual(polygonPixels('POLYGON((0 0,240 0,0 240))'), [[511.5, 511.5], [611.5, 511.5], [511.5, 411.5]]);
  assert.equal(polygonPixels('POLYGON((1 2))'), null);
});

test('only the SPoCA run nearest the picture is kept, filaments always, tiny shapes dropped', () => {
  const events: CatalogueEvent[] = [
    { type: 'CH', catalogue: 'SPoCA', start: '2021-03-06T09:37:05', polygon: square(0, 0, 100) },
    { type: 'CH', catalogue: 'SPoCA', start: '2021-03-06T13:37:05', polygon: square(200, 0, 100) },
    { type: 'FI', catalogue: 'AAFDCC', start: '2021-03-06T08:00:00', polygon: square(-300, 0, 60) },
    { type: 'CH', catalogue: 'SPoCA', start: '2021-03-06T13:37:05', polygon: square(-200, -200, 10) },
  ];
  const found = catalogueCandidates(events, new Date('2021-03-06T12:30:00Z'));
  assert.deepEqual(found.map(item => [item.expected, item.catalogue, Math.round(item.x)]), [['coronal_hole', 'SPoCA', 595], ['filament', 'AAFDCC', 387]]);
});

test('an hour the catalogue has not reached yet gives nothing to ask about', () => {
  assert.deepEqual(catalogueCandidates([], new Date('2026-11-19T19:00:00Z')), []);
});

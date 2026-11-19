import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addOutline, circleAround, circlePolygon, outlineFromMask, overlapShare, reshapeMark, simplifyOutline, snapOutline, type Point } from '../src/utils/outline.ts';
import { buildReview, SECTIONS, type Mark } from '../src/utils/annotationLogic.ts';

const SIZE = 200;

function imageWith(inside: (x: number, y: number) => boolean, value = 230, background = 40) {
  const data = new Uint8Array(SIZE * SIZE);
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) data[y * SIZE + x] = inside(x, y) ? value : background;
  return { x: 100, y: 100, width: SIZE, height: SIZE, data };
}

const lopsided = (x: number, y: number) => (x - 90) ** 2 / 1600 + (y - 100) ** 2 / 400 <= 1;

test('a rough drawing snaps to an uneven bright feature', () => {
  const snapped = snapOutline(circlePolygon(190, 200, 34), imageWith(lopsided));
  const xs = snapped.map(point => point[0]);
  assert.ok(Math.min(...xs) <= 155 && Math.max(...xs) >= 225, 'reaches both ends');
  const ys = snapped.map(point => point[1]);
  assert.ok(Math.max(...ys) - Math.min(...ys) < 56, 'does not stay round');
  assert.ok(snapped.length <= 48);
});

test('a rough drawing also snaps to a dark feature', () => {
  const snapped = snapOutline(circlePolygon(190, 200, 34), imageWith(lopsided, 10, 180));
  assert.ok(Math.max(...snapped.map(point => point[0])) >= 225);
});

test('a drawing on empty sky stays as drawn', () => {
  const rough = circlePolygon(190, 200, 30);
  assert.equal(overlapShare(snapOutline(rough, imageWith(() => false)), rough) > 0.9, true);
});

test('grainy quiet Sun keeps the drawing instead of a jagged trace', () => {
  const image = imageWith(() => false);
  const grainy = Uint8Array.from(image.data, (_, index) => 90 + ((index * 7919) % 41));
  const rough = circlePolygon(190, 200, 30);
  assert.deepEqual(snapOutline(rough, { ...image, data: grainy }), simplifyOutline(rough));
});

test('a new drawing is added, and an overlapping one joins the existing ring', () => {
  const marks: Mark[] = [{ x: 200, y: 200, r: 40, label: 'plage', finder: { x: 200, y: 200, r: 40 } }];
  const away = addOutline(marks, circlePolygon(400, 400, 30));
  assert.equal(away.joined, null);
  assert.equal(away.marks.length, 2);
  assert.equal(away.marks[1].added, true);

  const over = addOutline(marks, circlePolygon(210, 200, 30));
  assert.equal(over.joined, 0);
  assert.equal(over.marks.length, 1);
  assert.equal(over.marks[0].edited, true);
  const again = addOutline(over.marks, circlePolygon(240, 200, 30));
  assert.ok(circleAround(again.marks[0].outline as Point[]).r > circleAround(over.marks[0].outline as Point[]).r, 'second drawing grows the shape');
  const tighter = addOutline(again.marks, circlePolygon(220, 200, 12));
  assert.ok(circleAround(tighter.marks[0].outline as Point[]).r < 20, 'a drawing inside the shape replaces it');
});

test('a finder mask becomes an uneven outline', () => {
  const mask = 'XVT3l1Tn0000000000000000000000000000000000000000000000000000000000X1hN0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000`hQj0';
  const outline = outlineFromMask(mask) as Point[];
  const shape: Point[] = [[100, 200], [130, 200], [130, 240], [190, 240], [190, 260], [100, 260]];
  assert.ok(outline.length <= 48);
  assert.ok(overlapShare(outline, shape) > 0.9);
  assert.ok(overlapShare(outline, [[150, 200], [190, 200], [190, 235], [150, 235]]) < 0.05, 'the empty corner stays empty');
});

test('tracing the bigger feature grows the mark and absorbs pieces inside it', () => {
  const marks: Mark[] = [
    { x: 200, y: 200, r: 20, label: null, finder: { x: 200, y: 200, r: 20 } },
    { x: 250, y: 200, r: 15, label: null, finder: { x: 250, y: 200, r: 15 } },
    { x: 500, y: 500, r: 15, label: null, finder: { x: 500, y: 500, r: 15 } },
  ];
  const next = reshapeMark(marks, 0, circlePolygon(230, 200, 60), true) as Mark[];
  assert.equal(next[0].partOfLarger, true);
  assert.equal(next[0].label, null);
  assert.ok(next[0].r >= 55);
  assert.equal(next[1].merged, true);
  assert.equal(next[2].merged, undefined);
  assert.equal(reshapeMark(marks, 0, circlePolygon(700, 700, 30), true), null);
  const review = buildReview(next.map(mark => (mark.label ? mark : { ...mark, label: 'plage' })), SECTIONS[0]);
  assert.deepEqual(review.rings.map(ring => ring.action), ['outlined', 'merged', 'confirmed']);
  assert.equal(review.rings[0].part_of_larger, true);
});

test('the review separates each human decision', () => {
  const finder = { x: 200, y: 200, r: 30 };
  const marks: Mark[] = [
    { ...finder, label: 'plage', finder },
    { ...finder, x: 210, label: 'plage', edited: true, finder },
    { ...finder, label: 'none', finder },
    { ...finder, label: 'none', deleted: true, finder },
    { ...finder, label: 'plage', edited: true, drawn: true, outline: circlePolygon(200, 200, 30), finder },
    { ...finder, label: 'plage', outline: circlePolygon(200, 200, 30), finder },
    { x: 300, y: 300, r: 20, label: 'sunspot', added: true, outline: circlePolygon(300, 300, 20) },
  ];
  const review = buildReview(marks, SECTIONS[0]);
  assert.deepEqual(review.rings.map(ring => ring.action), ['confirmed', 'moved', 'rejected', 'deleted', 'outlined', 'confirmed', 'added']);
  assert.equal(review.rings[3].label, null);
  assert.equal('outline' in review.rings[5], false, 'an untouched finder shape is not resent');
  assert.equal(review.rings[6].finder, null);
});

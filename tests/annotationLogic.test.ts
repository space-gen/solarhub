import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  adjustedMark,
  confidenceFor,
  findMarkAt,
  groupLengthDegrees,
  isInsideSection,
  isOnSun,
  magnetLabel,
  pickForContributor,
  pickSection,
  remainingAfter,
  SECTION_COUNT,
  SECTIONS,
  spreadOrder,
  sunspotLabel,
} from '../src/utils/annotationLogic.ts';

const centre = { x: 511.5, y: 511.5 };

test('simple answers map to Zurich sunspot classes', () => {
  const mark = { ...centre, r: 10 };
  assert.equal(sunspotLabel('one', 'none', mark), 'class_a');
  assert.equal(sunspotLabel('one', 'around', mark), 'class_h');
  assert.equal(sunspotLabel('many', 'none', mark), 'class_b');
  assert.equal(sunspotLabel('many', 'one-side', mark), 'class_c');
});

test('group length separates classes D, E and F', () => {
  assert.equal(sunspotLabel('many', 'both-sides', { ...centre, r: 30 }), 'class_d');
  assert.equal(sunspotLabel('many', 'both-sides', { ...centre, r: 50 }), 'class_e');
  assert.equal(sunspotLabel('many', 'both-sides', { ...centre, r: 80 }), 'class_f');
  assert.ok(groupLengthDegrees(860, 511.5, 30) > groupLengthDegrees(511.5, 511.5, 30), 'near the edge counts as longer');
});

test('magnet patterns map to Mount Wilson labels', () => {
  assert.equal(magnetLabel('single'), 'alpha');
  assert.equal(magnetLabel('side-by-side'), 'beta');
  assert.equal(magnetLabel('mixed'), 'beta-gamma');
});

test('taps must land on the Sun and can find an existing mark', () => {
  assert.equal(isOnSun(511, 511), true);
  assert.equal(isOnSun(10, 10), false);
  assert.equal(findMarkAt([{ x: 100, y: 100, r: 10, label: null }], 120, 120), 0);
  assert.equal(findMarkAt([{ x: 100, y: 100, r: 10, label: null }], 200, 200), -1);
});

test('unsure answers lower confidence', () => {
  assert.equal(confidenceFor([{ x: 1, y: 1, r: 8, label: 'class_a' }]), 80);
  assert.equal(confidenceFor([{ x: 1, y: 1, r: 8, label: 'none' }]), 40);
});

test('contributors get a small repeatable share of features', () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const first = pickForContributor(items, 'alice', 'aia171-1');
  assert.equal(first.length, 4);
  assert.deepEqual(pickForContributor(items, 'alice', 'aia171-1'), first);
  assert.equal(new Set(first).size, 4);
  const seen = new Set(['alice', 'bob', 'cara', 'dev', 'eli', 'fay', 'gus', 'hana'].flatMap(name => pickForContributor(items, name, 'aia171-1')));
  assert.ok(seen.size > 6);
});

test('overlapping parts keep a feature whole when it crosses a part edge', () => {
  assert.equal(SECTIONS.length, SECTION_COUNT);
  const onEdge = { x: 512, y: 300, r: 60 };
  assert.equal(isInsideSection(SECTIONS[0], onEdge.x, onEdge.y, onEdge.r), false);
  assert.ok(SECTIONS.some(section => isInsideSection(section, onEdge.x, onEdge.y, onEdge.r)));
});

test('each person gets rings from one repeatable part', () => {
  const rings = [{ x: 200, y: 200, r: 30 }, { x: 800, y: 800, r: 30 }, { x: 512, y: 512, r: 190 }];
  const first = pickSection(rings, 'alice', 'aia171-1');
  assert.deepEqual(pickSection(rings, 'alice', 'aia171-1'), first);
  assert.ok(first.items.length > 0);
  const ranked = Array.from({ length: 8 }, (_, index) => ({ x: 250 + index, y: 250, r: 20 }));
  assert.deepEqual(pickSection(ranked, 'alice', 'aia171-1').items.slice(0, 3), ranked.slice(0, 3));
  const huge = pickSection([rings[2]], 'alice', 'aia171-1');
  assert.deepEqual(huge.items, [rings[2]]);
});

test('fixing a ring keeps it inside the close-up', () => {
  const box = { x: 100, y: 100, size: 200 };
  const moved = adjustedMark({ x: 150, y: 150, r: 40, label: null }, { x: 900, r: 500 }, box);
  assert.deepEqual([moved.x, moved.y, moved.r], [300, 150, 94]);
});

test('spread order keeps every image and separates neighbours', () => {
  const tasks = Array.from({ length: 32 }, (_, i) => ({ id: `t${i}` }));
  const ordered = spreadOrder(tasks);
  assert.equal(new Set(ordered.map(task => task.id)).size, 32);
  assert.deepEqual(ordered.slice(0, 3).map(task => task.id), ['t0', 't16', 't8']);
  assert.deepEqual(remainingAfter(ordered, 't16', new Set(['t8'])).slice(0, 1).map(task => task.id), ['t24']);
});

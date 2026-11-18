import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  confidenceFor,
  findMarkAt,
  groupLengthDegrees,
  isOnSun,
  magnetLabel,
  pickForContributor,
  remainingAfter,
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

test('spread order keeps every image and separates neighbours', () => {
  const tasks = Array.from({ length: 32 }, (_, i) => ({ id: `t${i}` }));
  const ordered = spreadOrder(tasks);
  assert.equal(new Set(ordered.map(task => task.id)).size, 32);
  assert.deepEqual(ordered.slice(0, 3).map(task => task.id), ['t0', 't16', 't8']);
  assert.deepEqual(remainingAfter(ordered, 't16', new Set(['t8'])).slice(0, 1).map(task => task.id), ['t24']);
});

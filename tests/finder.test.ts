import assert from 'node:assert/strict';
import { test } from 'node:test';
import { decodeMask, encodeMask, findCandidates, SIZE } from '../src/utils/finder.ts';

test('mask text round-trips', () => {
  const pixels: Array<[number, number]> = [[10, 10], [10, 11], [11, 10], [500, 900]];
  const mask = decodeMask(encodeMask(pixels));
  assert.equal(mask.reduce((a, b) => a + b, 0), 4);
  assert.equal(mask[11 * SIZE + 10], 1);
  assert.equal(mask[900 * SIZE + 500], 1);
});

test('a dark patch on a bright disk is proposed with its shape', () => {
  const gray = new Float32Array(SIZE * SIZE);
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const disk = Math.hypot(x - 511.5, y - 511.5) < 395;
    const hole = Math.hypot(x - 600, y - 450) < 40;
    gray[y * SIZE + x] = disk ? (hole ? 30 : 150) : 0;
  }
  const marks = findCandidates(gray, 'aia_193');
  assert.equal(marks.length, 1);
  assert.ok(Math.hypot(marks[0].x - 600, marks[0].y - 450) < 5);
  assert.ok(marks[0].mask);
  assert.deepEqual(findCandidates(gray, 'flare_source'), []);
});

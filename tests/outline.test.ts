import assert from 'node:assert/strict';
import { test } from 'node:test';
import { circleAround, outlineFromMask, simplifyOutline, type Point } from '../src/utils/outline.ts';

test('a finder mask becomes an uneven outline that keeps its empty corner empty', () => {
  // An L shape: x 100-190, y 200-260, with the corner x 130-190, y 200-240 empty.
  const mask = 'XVT3l1Tn0000000000000000000000000000000000000000000000000000000000X1hN0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000`hQj0';
  const outline = outlineFromMask(mask) as Point[];
  assert.ok(outline.length >= 4 && outline.length <= 48);
  const xs = outline.map(point => point[0]);
  const ys = outline.map(point => point[1]);
  assert.ok(Math.min(...xs) <= 102 && Math.max(...xs) >= 188 && Math.min(...ys) <= 202 && Math.max(...ys) >= 258);
  assert.ok(!outline.some(([x, y]) => x > 140 && x < 180 && y > 205 && y < 230), 'no edge runs through the empty corner');
});

test('long catalogue outlines are simplified and get an enclosing circle', () => {
  const ring: Point[] = Array.from({ length: 200 }, (_, i) => [500 + 100 * Math.cos(i / 100 * Math.PI), 400 + 100 * Math.sin(i / 100 * Math.PI)]);
  const simple = simplifyOutline(ring);
  assert.ok(simple.length <= 48);
  const circle = circleAround(simple);
  assert.ok(Math.abs(circle.x - 500) <= 2 && Math.abs(circle.y - 400) <= 2 && Math.abs(circle.r - 100) <= 3);
});

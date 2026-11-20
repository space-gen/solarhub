import assert from 'node:assert/strict';
import { test } from 'node:test';
import { remainingAfter, spreadOrder } from '../src/utils/annotationLogic.ts';

test('spread order keeps every image and separates neighbours', () => {
  const tasks = Array.from({ length: 32 }, (_, i) => ({ id: `t${i}` }));
  const ordered = spreadOrder(tasks);
  assert.equal(new Set(ordered.map(task => task.id)).size, 32);
  assert.deepEqual(ordered.slice(0, 3).map(task => task.id), ['t0', 't16', 't8']);
  assert.deepEqual(remainingAfter(ordered, 't16', new Set(['t8'])).slice(0, 1).map(task => task.id), ['t24']);
});

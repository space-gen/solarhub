import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ARCHIVE_END, archiveId, nextArchiveTasks, urlFromId, type DayLister } from '../src/services/archiveTasks.ts';

// Frames every two hours: 000000, 020000, 040000 ...
const frames = (date: string, count: number) =>
  Array.from({ length: count }, (_, i) => `${date.replaceAll('-', '')}_${String(i * 2).padStart(2, '0')}0000_1024_0193.jpg`);

test('ids and urls round-trip', () => {
  const id = archiveId('0193', '20261117_110805_1024_0193.jpg')!;
  assert.equal(id, 'aia193-20261117110805');
  assert.equal(urlFromId(id), 'https://sdo.gsfc.nasa.gov/assets/img/browse/2026/11/17/20261117_110805_1024_0193.jpg');
  assert.equal(archiveId('0211', '20261117_110805_1024_0193.jpg'), null);
});

test('walks back from the start date, newest first, every frame', async () => {
  const asked: string[] = [];
  const list: DayLister = async date => { asked.push(date); return frames(date, 2); };
  const { tasks } = await nextArchiveTasks('aia_193', null, () => false, 3, list);
  assert.deepEqual(asked.slice(0, 2), ['2026-11-20', '2026-11-19']);
  assert.deepEqual(tasks.map(t => t.id), ['aia193-20261120020000', 'aia193-20261120000000', 'aia193-20261119020000']);
});

test('resumes strictly before the saved picture and skips full or done ones', async () => {
  const list: DayLister = async date => frames(date, 3);
  const after = 'aia193-20261119020000';
  const { tasks } = await nextArchiveTasks('aia_193', after, id => id === 'aia193-20261119000000', 2, list);
  assert.deepEqual(tasks.map(t => t.id), ['aia193-20261118040000', 'aia193-20261118020000']);
});

test('a saved place from another channel is ignored', async () => {
  const list: DayLister = async date => frames(date, 1);
  const { tasks } = await nextArchiveTasks('aia_193', 'aia211-20200101000000', () => false, 1, list);
  assert.equal(tasks[0].id, 'aia193-20261120000000');
});

test('stops at the archive end', async () => {
  const list: DayLister = async date => frames(date, 1);
  const { tasks, finished } = await nextArchiveTasks('aia_193', 'aia193-20161002000000', () => false, 5, list);
  assert.deepEqual(tasks.map(t => t.date), ['2016-10-01']);
  assert.equal(finished, true);
  assert.equal(ARCHIVE_END, '2016-10-01');
});

test('a batch of empty days still moves the saved place back', async () => {
  const list: DayLister = async () => [];
  const { tasks, cursor } = await nextArchiveTasks('aia_193', null, () => false, 5, list);
  assert.equal(tasks.length, 0);
  assert.ok(cursor && cursor < 'aia193-20261001000000', cursor ?? '');
});
